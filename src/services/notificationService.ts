import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
  onNotificationOpenedApp,
  getInitialNotification,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import {
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '@/config/firebaseConfig';
import { withTimeout } from './userService';
import { showToast } from '@/components/toast';
import { navigationRef } from '@/utils';
import { SCREEN_NAMES } from '@/constants';
import { AppNotification } from '@/types';

export const messaging = getMessaging();

const FCM_TOKEN_STORAGE_KEY = 'user_fcm_token';

// Active chat ID that the user is currently viewing (to suppress notifications inside the active room)
let activeChatId: string | null = null;

export const setActiveChatId = (chatId: string | null) => {
  activeChatId = chatId;
};

export const getActiveChatId = () => activeChatId;

/**
 * 1. Background Message Handler
 * MUST be registered early in index.js outside React lifecycle.
 */
export const registerBackgroundMessageHandler = () => {
  try {
    setBackgroundMessageHandler(messaging, async (remoteMessage: RemoteMessage) => {
      console.log('[FCM Background] Remote message received:', remoteMessage?.notification || remoteMessage?.data);
      // Background message received - system notification tray handles display when payload has 'notification'
      return Promise.resolve();
    });
  } catch (error) {
    console.warn('[FCM Background] Error registering background handler:', error);
  }
};

/**
 * Request notification permissions (Android 13+ POST_NOTIFICATIONS & iOS)
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Instagram Clone Notifications',
            message: 'Enable notifications to receive alerts when friends message you.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[FCM] Android POST_NOTIFICATIONS permission denied');
          return false;
        }
      }
      return true;
    }
    return false;

  
  } catch (error) {
    console.warn('[FCM] Permission request error:', error);
    return false;
  }
};

/**
 * Retrieves the device FCM token and registers it in Firestore for the given user.
 */
export const getAndSaveFCMToken = async (userId?: string): Promise<string | null> => {
  try {
    const currentUid = userId || auth.currentUser?.uid;
    const token = await getToken(messaging);

    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);

      if (currentUid) {
        const userDocRef = doc(db, 'users', currentUid);
        await withTimeout(
          setDoc(
            userDocRef,
            {
              fcmToken: token,
              lastTokenUpdate: Date.now(),
            },
            { merge: true },
          ),
          3000,
        );
      }
    }

    return token;
  } catch (error) {
    console.warn('[FCM] Error getting/saving FCM token:', error);
    return null;
  }
};

/**
 * 2. Foreground Message Handler and In-App Notification Service
 */
export const initForegroundNotificationService = (
  onNavigateToChat?: (chatId: string, senderId: string) => void,
): (() => void) => {
  // Listen for foreground push messages from FCM
  const unsubscribeForegroundFCM = onMessage(messaging, async (remoteMessage: RemoteMessage) => {
    console.log('[FCM Foreground] Received message:', remoteMessage);

    const title = remoteMessage.notification?.title || remoteMessage.data?.senderName || 'New Message';
    const body = remoteMessage.notification?.body || (remoteMessage.data?.text as string) || '';
    const incomingChatId = remoteMessage.data?.chatId as string;

    // If user is currently looking at this active chat, don't show toast
    if (incomingChatId && incomingChatId === activeChatId) {
      return;
    }

    // Show in-app banner toast notification
    if (body) {
      showToast(`${title}: ${body}`);
    }
  });

  // When app is opened from a background notification
  const unsubscribeNotificationOpened = onNotificationOpenedApp(messaging, (remoteMessage: RemoteMessage) => {
    console.log('[FCM Opened] App opened from notification:', remoteMessage);
    const incomingChatId = remoteMessage.data?.chatId as string;
    const senderId = remoteMessage.data?.senderId as string;

    if (incomingChatId && senderId && onNavigateToChat) {
      onNavigateToChat(incomingChatId, senderId);
    } else if (navigationRef.isReady()) {
      navigationRef.navigate(SCREEN_NAMES.CHAT as never);
    }
  });

  // Check if app was opened from quit state by tapping a notification
  getInitialNotification(messaging)
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[FCM Initial] App opened from quit state via notification:', remoteMessage);
        const incomingChatId = remoteMessage.data?.chatId as string;
        const senderId = remoteMessage.data?.senderId as string;

        setTimeout(() => {
          if (incomingChatId && senderId && onNavigateToChat) {
            onNavigateToChat(incomingChatId, senderId);
          } else if (navigationRef.isReady()) {
            navigationRef.navigate(SCREEN_NAMES.CHAT as never);
          }
        }, 800);
      }
    })
    .catch((err) => console.warn('[FCM Initial] Error checking initial notification:', err));

  // Listen for FCM token refresh
  const unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken: string) => {
    console.log('[FCM] Token refreshed:', newToken);
    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, newToken);
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      try {
        const userDocRef = doc(db, 'users', currentUid);
        await setDoc(userDocRef, { fcmToken: newToken, lastTokenUpdate: Date.now() }, { merge: true });
      } catch (e) {
        console.warn('[FCM] Error saving refreshed token to firestore:', e);
      }
    }
  });

  return () => {
    unsubscribeForegroundFCM();
    unsubscribeNotificationOpened();
    unsubscribeTokenRefresh();
  };
};

/**
 * 3. Real-Time Firestore Incoming Message Listener
 * Listens to active chats for the current user and triggers an in-app alert when a message is received
 * while the app is in the foreground (even if FCM push notification is delayed or on device emulator).
 */
export const subscribeToIncomingMessages = (
  currentUserId: string,
  onNewMessage?: (chatId: string, senderName: string, text: string) => void,
): (() => void) => {
  if (!currentUserId) return () => {};

  try {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUserId));

    let isInitialLoad = true;
    const lastSeenMessageTimes: { [chatId: string]: number } = {};

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot) return;

        snapshot.docChanges().forEach((change) => {
          const chatData = change.doc.data();
          const chatId = change.doc.id;
          const lastMsgTime = chatData.lastMessageTime || 0;
          const lastSenderId = chatData.lastSenderId;
          const lastMessage = chatData.lastMessage || '';

          // If initial snapshot load, just record latest times without triggering alerts
          if (isInitialLoad) {
            lastSeenMessageTimes[chatId] = lastMsgTime;
            return;
          }

          // If message was just sent by another user and user isn't in that chat
          const prevTime = lastSeenMessageTimes[chatId] || 0;
          if (
            lastSenderId &&
            lastSenderId !== currentUserId &&
            lastMsgTime > prevTime &&
            chatId !== activeChatId
          ) {
            lastSeenMessageTimes[chatId] = lastMsgTime;
            const senderDetails = chatData.participantDetails?.[lastSenderId];
            const senderName = senderDetails?.fullName || senderDetails?.username || 'New message';

            // Show in-app notification toast
            showToast(`${senderName}: ${lastMessage}`);

            onNewMessage?.(chatId, senderName, lastMessage);
          } else {
            lastSeenMessageTimes[chatId] = lastMsgTime;
          }
        });

        isInitialLoad = false;
      },
      (error) => {
        console.warn('[Notifications] Firestore subscribeToIncomingMessages error:', error);
      },
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[Notifications] Error in subscribeToIncomingMessages:', err);
    return () => {};
  }
};


const NOTIFICATIONS_STORAGE_PREFIX = 'cached_notifications_';

/**
 * Creates a notification document in Firestore for a user
 */
export const createNotification = async (
  notification: Omit<AppNotification, 'id'>,
): Promise<string | null> => {
  try {
    const notifRef = doc(collection(db, 'notifications'));
    const notifData: AppNotification = {
      ...notification,
      id: notifRef.id,
      createdAt: notification.createdAt || Date.now(),
      read: false,
    };
    await withTimeout(setDoc(notifRef, notifData), 3500);
    return notifRef.id;
  } catch (error) {
    console.warn('[Notification] createNotification error:', error);
    return null;
  }
};

/**
 * Real-time subscription to notifications received by the user
 */
export const subscribeToUserNotifications = (
  userId: string,
  onUpdate: (notifications: AppNotification[]) => void,
): (() => void) => {
  if (!userId) return () => {};

  try {
    const notifCol = collection(db, 'notifications');
    const q = query(notifCol, where('recipientId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: AppNotification[] = [];
        if (snapshot) {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AppNotification;
            notifs.push({
              ...data,
              id: docSnap.id,
            });
          });
        }

        // Sort descending by createdAt
        notifs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Cache locally
        AsyncStorage.setItem(
          `${NOTIFICATIONS_STORAGE_PREFIX}${userId}`,
          JSON.stringify(notifs),
        ).catch(() => {});

        onUpdate(notifs);
      },
      (error) => {
        console.warn('[Notifications] subscribeToUserNotifications error:', error);
      },
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[Notifications] subscribeToUserNotifications setup error:', err);
    return () => {};
  }
};

/**
 * Gets cached notifications for immediate offline display
 */
export const getStoredNotifications = async (
  userId: string,
): Promise<AppNotification[]> => {
  try {
    const raw = await AsyncStorage.getItem(`${NOTIFICATIONS_STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Marks all unread notifications for a user as read
 */
export const markNotificationsAsRead = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    const notifCol = collection(db, 'notifications');
    const q = query(notifCol, where('recipientId', '==', userId));
    const snap = await withTimeout(getDocs(q), 3500);
    if (snap && !snap.empty) {
      const updates = snap.docs
        .filter((docSnap) => !(docSnap.data() as AppNotification).read)
        .map((docSnap) =>
          setDoc(docSnap.ref, { read: true }, { merge: true }),
        );
      await Promise.all(updates);
    }
  } catch (err) {
    console.warn('[Notifications] markNotificationsAsRead error:', err);
  }
};

/**
 * Deletes a notification from Firestore
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await withTimeout(deleteDoc(notifRef), 3000);
    return true;
  } catch (err) {
    console.warn('[Notifications] deleteNotification error:', err);
    return false;
  }
};

/**
 * Subscribes to unread notification count for the user
 */
export const subscribeToUnreadNotificationCount = (
  userId: string,
  onUpdate: (count: number) => void,
): (() => void) => {
  return subscribeToUserNotifications(userId, (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    onUpdate(unreadCount);
  });
};
