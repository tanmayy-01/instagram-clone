import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './Chat.styles';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS, SCREEN_NAMES } from '@/constants';
import { showToast } from '@/components/toast';
import { auth, db } from '@/config/firebaseConfig';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { getStoredUser, withTimeout, UserData } from '@/services/userService';
import { getFollowingUsers, FollowableUser } from '@/services/followService';
import { getActiveStories } from '@/services/storyService';
import {
  ChatConversation,
  subscribeToUserChats,
  getStoredUserChats,
} from '@/services/chatService';
import { formatTimeAgo } from '@/utils';
import { ChatRoomModal } from './components/ChatRoomModal';
import { NewChatModal } from './components/NewChatModal';

interface UnifiedChatItem {
  user: FollowableUser;
  conversation?: ChatConversation;
  hasActiveStory: boolean;
}

const Chat: React.FC = () => {
  const navigation = useNavigation<any>();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [followingUsers, setFollowingUsers] = useState<FollowableUser[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeStoryUsers, setActiveStoryUsers] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedChatUser, setSelectedChatUser] =
    useState<FollowableUser | null>(null);
  const [chatRoomVisible, setChatRoomVisible] = useState(false);
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);

  // 1. Fetch current user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const cached = await getStoredUser();
      if (cached) setUserData(cached);

      const uid = auth.currentUser?.uid || cached?.uid;
      if (!uid) return;

      const userDocRef = doc(db, 'users', uid);
      const docSnap = await withTimeout(getDoc(userDocRef), 3000);
      if (docSnap && docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      }
    } catch (err) {
      console.warn('Chat fetchUserProfile error:', err);
    }
  }, []);

  // 2. Fetch followed users and their active stories
  const fetchFollowedUsers = useCallback(async () => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (!uid) return;

    try {
      const [following, storiesResult] = await Promise.all([
        getFollowingUsers(uid),
        getActiveStories(uid),
      ]);

      setFollowingUsers(following);

      // Check which followed users have active 24h stories
      const storyAuthors = new Set<string>();
      for (const s of storiesResult.otherStories) {
        if (s.userId) storyAuthors.add(s.userId.toLowerCase());
        if (s.username) storyAuthors.add(s.username.toLowerCase());
      }
      setActiveStoryUsers(storyAuthors);
    } catch (err) {
      console.warn('Chat fetchFollowedUsers error:', err);
    }
  }, [userData?.uid]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      await fetchUserProfile();
      const currentUid = auth.currentUser?.uid;
      if (currentUid && isMounted) {
        const cachedChats = await getStoredUserChats(currentUid);
        if (cachedChats.length > 0 && isMounted) {
          setConversations(cachedChats);
        }
      }
      await fetchFollowedUsers();
      if (isMounted) setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchUserProfile, fetchFollowedUsers]);

  // Subscribe to real-time conversations from Firestore
  useEffect(() => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (!uid) return;

    const unsubscribe = subscribeToUserChats(uid, (updatedChats) => {
      setConversations(updatedChats);
    });

    return () => {
      unsubscribe();
    };
  }, [userData?.uid]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchFollowedUsers();
    }, [fetchFollowedUsers]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchFollowedUsers()]);
    setRefreshing(false);
  };

  // Combine followed users with conversations
  const unifiedChatList: UnifiedChatItem[] = useMemo(() => {
    const uid = auth.currentUser?.uid || userData?.uid || '';
    const conversationMap = new Map<string, ChatConversation>();

    for (const conv of conversations) {
      // Find other participant's UID
      const otherUid = conv.participants.find((p) => p !== uid);
      if (otherUid) {
        conversationMap.set(otherUid.toLowerCase(), conv);
      }
    }

    const items: UnifiedChatItem[] = [];
    const processedUids = new Set<string>();

    // 1. Add all followed users (with their conversation if one exists)
    for (const fUser of followingUsers) {
      const cleanUid = fUser.uid.toLowerCase();
      if (processedUids.has(cleanUid)) continue;
      processedUids.add(cleanUid);

      const conv = conversationMap.get(cleanUid);
      const hasStory =
        activeStoryUsers.has(cleanUid) ||
        activeStoryUsers.has(fUser.username.toLowerCase());

      items.push({
        user: fUser,
        conversation: conv,
        hasActiveStory: hasStory,
      });
    }

    // 2. Add any active conversations with users not in followingUsers
    for (const conv of conversations) {
      const otherUid = conv.participants.find((p) => p !== uid);
      if (!otherUid || processedUids.has(otherUid.toLowerCase())) continue;
      processedUids.add(otherUid.toLowerCase());

      const details = conv.participantDetails?.[otherUid];
      const participantUser: FollowableUser = {
        uid: otherUid,
        username: details?.username || 'user',
        fullName: details?.fullName || details?.username || 'User',
        avatar: details?.avatar || '',
      };

      const hasStory =
        activeStoryUsers.has(otherUid.toLowerCase()) ||
        activeStoryUsers.has(participantUser.username.toLowerCase());

      items.push({
        user: participantUser,
        conversation: conv,
        hasActiveStory: hasStory,
      });
    }

    // 3. Sort: Items with recent conversation first, then remaining followed users
    return items.sort((a, b) => {
      const timeA = a.conversation?.lastMessageTime || 0;
      const timeB = b.conversation?.lastMessageTime || 0;
      return timeB - timeA;
    });
  }, [conversations, followingUsers, activeStoryUsers, userData?.uid]);

  // Filter items by search bar query
  const filteredChatList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return unifiedChatList;

    return unifiedChatList.filter((item) => {
      const matchName =
        item.user.fullName && item.user.fullName.toLowerCase().includes(q);
      const matchUsername = item.user.username.toLowerCase().includes(q);
      const matchLastMsg =
        item.conversation?.lastMessage &&
        item.conversation.lastMessage.toLowerCase().includes(q);
      return matchName || matchUsername || matchLastMsg;
    });
  }, [unifiedChatList, searchQuery]);

  const handleOpenChat = (user: FollowableUser) => {
    setSelectedChatUser(user);
    setChatRoomVisible(true);
  };

  const usernameDisplay = userData?.username || 'messages';
  const currentUid = auth.currentUser?.uid || userData?.uid || '';

  const renderChatItem = ({ item }: { item: UnifiedChatItem }) => {
    const { user, conversation, hasActiveStory } = item;
    const isUnread =
      Boolean(conversation?.unreadCount?.[currentUid]) &&
      conversation!.unreadCount![currentUid] > 0;

    // Subtitle formatting
    let subtitle = 'Followed user · Tap to chat';
    if (conversation && conversation.lastMessage) {
      const isMine = conversation.lastSenderId === currentUid;
      const prefix = isMine ? 'You: ' : '';
      const timeText = conversation.lastMessageTime
        ? ` · ${formatTimeAgo(conversation.lastMessageTime)}`
        : '';
      subtitle = `${prefix}${conversation.lastMessage}${timeText}`;
    }

    return (
      <TouchableOpacity
        style={styles.chatItemRow}
        activeOpacity={0.7}
        onPress={() => handleOpenChat(user)}
      >
        {/* Left: Avatar with optional Instagram gradient ring */}
        <View style={styles.avatarWrap}>
          <View style={hasActiveStory ? styles.avatarRing : undefined}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Center: Name & Subtitle */}
        <View style={styles.chatItemContent}>
          <Text style={styles.chatItemName} numberOfLines={1}>
            {user.fullName || user.username}
          </Text>

          <View style={styles.chatItemSubtitleRow}>
            <Text
              style={[
                styles.chatItemSubtitle,
                isUnread && styles.chatItemSubtitleUnread,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Unread Dot or Camera Icon */}
        {isUnread ? (
          <View style={styles.unreadDot} />
        ) : (
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => showToast(`Send photo to @${user.username}`)}
            activeOpacity={0.7}
          >
            <Icon
              name={ICON_NAMES.CAMERA_OUTLINE}
              size={22}
              color={LIGHT_COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} >

      {/* 1. Header matching Instagram screenshot */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />

        {/* Center: username with chevron dropdown */}
        <TouchableOpacity
          style={styles.headerCenter}
          activeOpacity={0.7}
          onPress={() => showToast(`Signed in as @${usernameDisplay}`)}
        >
          <Text style={styles.headerUsername}>{usernameDisplay}</Text>
          <View style={styles.headerChevron}>
            <Icon
              name={ICON_NAMES.CHEVRON_DOWN}
              size={15}
              color={LIGHT_COLORS.black}
            />
          </View>
        </TouchableOpacity>

        {/* Right: Edit/Compose button */}
        <TouchableOpacity
          style={styles.composeBtn}
          activeOpacity={0.7}
          onPress={() => setNewChatModalVisible(true)}
        >
          <Icon
            name={ICON_NAMES.CREATE_OUTLINE}
            size={24}
            color={LIGHT_COLORS.black}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Tabs: "Messages" (left) | "Requests" (right) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabMessagesText,
              activeTab !== 'messages' && { color: LIGHT_COLORS.textSecondary },
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('requests');
            showToast('0 Message requests');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.tabRequestsText}>Requests</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchIcon}>
          <Icon
            name={ICON_NAMES.SEARCH_OUTLINE}
            size={18}
            color={LIGHT_COLORS.textSecondary}
          />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={LIGHT_COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={() => setSearchQuery('')}
          >
            <Icon
              name={ICON_NAMES.CLOSE}
              size={16}
              color={LIGHT_COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Chat List */}
      {activeTab === 'requests' ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon
              name={ICON_NAMES.CHATBUBBLE_OUTLINE}
              size={36}
              color={LIGHT_COLORS.black}
            />
          </View>
          <Text style={styles.emptyTitle}>No message requests</Text>
          <Text style={styles.emptySubtitle}>
            When users you don't follow send you messages, they'll appear here.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            activeOpacity={0.8}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={styles.emptyActionBtnText}>Back to messages</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredChatList}
          keyExtractor={(item) => item.user.uid}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[LIGHT_COLORS.brandBlue]}
              tintColor={LIGHT_COLORS.brandBlue}
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={LIGHT_COLORS.brandBlue}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Icon
                    name={ICON_NAMES.SEND_OUTLINE}
                    size={36}
                    color={LIGHT_COLORS.black}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No chats found' : 'Your messages'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No followed users match "${searchQuery}"`
                    : 'Send private photos and messages to a friend or group.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (followingUsers.length > 0) {
                      setNewChatModalVisible(true);
                    } else {
                      navigation.navigate(SCREEN_NAMES.SEARCH);
                    }
                  }}
                >
                  <Text style={styles.emptyActionBtnText}>
                    {followingUsers.length > 0
                      ? 'Send message'
                      : 'Find people to follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      )}

      {/* 5. Real-time Full-Screen Chat Room Modal */}
      <ChatRoomModal
        visible={chatRoomVisible}
        currentUserId={currentUid}
        currentUserName={userData?.username || 'You'}
        currentUserAvatar={userData?.profilePicUrl}
        targetUser={selectedChatUser}
        onClose={() => {
          setChatRoomVisible(false);
          setSelectedChatUser(null);
        }}
      />

      {/* 6. Compose / New Message Modal */}
      <NewChatModal
        visible={newChatModalVisible}
        users={followingUsers}
        onClose={() => setNewChatModalVisible(false)}
        onSelectUser={(user) => {
          setSelectedChatUser(user);
          setChatRoomVisible(true);
        }}
      />
    </View>
  );
};

export default Chat;