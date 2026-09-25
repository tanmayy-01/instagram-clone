import { db } from '@/config/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withTimeout } from './userService';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  text: string;
  createdAt: number;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
    senderId: string;
  };
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      username: string;
      fullName: string;
      avatar: string;
    };
  };
  lastMessage: string;
  lastMessageTime: number;
  lastSenderId: string;
  unreadCount?: {
    [uid: string]: number;
  };
  createdAt: number;
  updatedAt: number;
}

const CHATS_CACHE_KEY_PREFIX = 'cached_chats_for_user_';

/**
 * Returns deterministic chat ID for two users so both users point to the identical conversation document
 */
export const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

/**
 * Sends a message in real-time, storing it in Firestore under chats/{chatId}/messages/{messageId}
 * and updating the conversation header document
 */
export const sendMessage = async ({
  senderId,
  senderName,
  senderAvatar,
  receiverId,
  receiverName,
  receiverAvatar,
  text,
  replyTo,
}: {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  text: string;
  replyTo?: ChatMessage['replyTo'];
}): Promise<ChatMessage | null> => {
  try {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const chatId = getChatId(senderId, receiverId);
    const now = Date.now();
    const messageId = `msg_${senderId}_${now}`;

    const newMsg: ChatMessage = {
      id: messageId,
      chatId,
      senderId,
      senderName,
      senderAvatar: senderAvatar || '',
      receiverId,
      text: trimmed,
      createdAt: now,
      status: 'sent',
    };

    if (replyTo) {
      newMsg.replyTo = replyTo;
    }

    // 1. Add message document to Firestore subcollection
    const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);
    await withTimeout(setDoc(msgDocRef, newMsg), 4000);

    // 2. Fetch existing conversation doc to preserve unreadCount
    let currentReceiverUnread = 1;
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await withTimeout(getDoc(chatDocRef), 2000);
      if (chatSnap && chatSnap.exists()) {
        const existingData = chatSnap.data() as ChatConversation;
        const prevUnread = existingData?.unreadCount?.[receiverId] || 0;
        currentReceiverUnread = prevUnread + 1;
      }
    } catch {
      // fallback
    }

    // 3. Update/Create parent conversation doc
    const conversationUpdate: ChatConversation = {
      id: chatId,
      participants: [senderId, receiverId],
      participantDetails: {
        [senderId]: {
          username: senderName,
          fullName: senderName,
          avatar: senderAvatar || '',
        },
        [receiverId]: {
          username: receiverName,
          fullName: receiverName,
          avatar: receiverAvatar || '',
        },
      },
      lastMessage: trimmed,
      lastMessageTime: now,
      lastSenderId: senderId,
      unreadCount: {
        [senderId]: 0,
        [receiverId]: currentReceiverUnread,
      },
      createdAt: now,
      updatedAt: now,
    };

    try {
      const chatDocRef = doc(db, 'chats', chatId);
      await withTimeout(
        setDoc(chatDocRef, conversationUpdate, { merge: true }),
        4000,
      );
    } catch (chatDocErr) {
      console.warn('Update conversation doc error:', chatDocErr);
    }

    return newMsg;
  } catch (error) {
    console.error('sendMessage error:', error);
    return null;
  }
};

/**
 * Deletes a message from Firestore subcollection.
 * Strict ownership check: One user cannot delete another person's message!
 */
export const deleteMessage = async ({
  chatId,
  messageId,
  currentUserId,
}: {
  chatId: string;
  messageId: string;
  currentUserId: string;
}): Promise<boolean> => {
  try {
    const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);

    // Verify ownership
    const snap = await withTimeout(getDoc(msgDocRef), 2500);
    if (snap && snap.exists()) {
      const data = snap.data() as ChatMessage;
      if (data.senderId !== currentUserId) {
        console.warn('Unauthorized deleteMessage attempt: user is not author');
        return false;
      }
    }

    await withTimeout(deleteDoc(msgDocRef), 3000);

    // Update conversation last message if needed
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'));
      const remainingSnap = await withTimeout(getDocs(q), 2500);

      const chatDocRef = doc(db, 'chats', chatId);
      if (remainingSnap && !remainingSnap.empty) {
        const newest = remainingSnap.docs[0].data() as ChatMessage;
        await setDoc(
          chatDocRef,
          {
            lastMessage: newest.text,
            lastMessageTime: newest.createdAt,
            lastSenderId: newest.senderId,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
      } else {
        await setDoc(
          chatDocRef,
          {
            lastMessage: 'Message deleted',
            updatedAt: Date.now(),
          },
          { merge: true },
        );
      }
    } catch {
      // ignore
    }

    return true;
  } catch (error) {
    console.error('deleteMessage error:', error);
    return false;
  }
};

/**
 * Real-time listener for messages in a chat conversation
 */
export const subscribeToMessages = (
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: any) => void,
): (() => void) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        if (snapshot) {
          snapshot.forEach((docSnap) => {
            msgs.push(docSnap.data() as ChatMessage);
          });
        }
        onUpdate(msgs);
      },
      (error) => {
        console.warn('subscribeToMessages snapshot error:', error);
        onError?.(error);
      },
    );

    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToMessages setup error:', err);
    return () => {};
  }
};

/**
 * Real-time listener for user's active conversations.
 * Does not combine array-contains with orderBy to avoid any composite index requirements in Firestore.
 */
export const subscribeToUserChats = (
  currentUserId: string,
  onUpdate: (chats: ChatConversation[]) => void,
  onError?: (error: any) => void,
): (() => void) => {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUserId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chats: ChatConversation[] = [];
        if (snapshot) {
          snapshot.forEach((docSnap) => {
            chats.push(docSnap.data() as ChatConversation);
          });
        }
        // Client-side sort by newest updatedAt
        chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        // Cache for offline quick loading
        AsyncStorage.setItem(
          `${CHATS_CACHE_KEY_PREFIX}${currentUserId}`,
          JSON.stringify(chats),
        ).catch(() => {});

        onUpdate(chats);
      },
      (error) => {
        console.warn('subscribeToUserChats snapshot error:', error);
        onError?.(error);
      },
    );

    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToUserChats setup error:', err);
    return () => {};
  }
};

/**
 * Clears unread count for current user in a conversation
 */
export const markChatAsRead = async (
  chatId: string,
  currentUserId: string,
): Promise<void> => {
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await setDoc(
      chatDocRef,
      {
        unreadCount: {
          [currentUserId]: 0,
        },
      },
      { merge: true },
    );
  } catch {
    // ignore
  }
};

/**
 * Returns cached conversations for immediate offline display
 */
export const getStoredUserChats = async (
  currentUserId: string,
): Promise<ChatConversation[]> => {
  try {
    const raw = await AsyncStorage.getItem(
      `${CHATS_CACHE_KEY_PREFIX}${currentUserId}`,
    );
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
