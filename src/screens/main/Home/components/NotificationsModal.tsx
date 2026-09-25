import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SectionList,
  Modal,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS, FONT_SIZES, FONT_STYLES } from '@/constants';
import { formatTimeAgo } from '@/utils';
import { showToast } from '@/components/toast';
import {
  subscribeToUserNotifications,
  getStoredNotifications,
  markNotificationsAsRead,
  deleteNotification,
} from '@/services/notificationService';
import {
  followUser,
  unfollowUser,
  getFollowingList,
} from '@/services/followService';
import { AppNotification, NotificationsModalProps } from '@/types';
import { scale } from '@/lib/scale';


export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  currentUserId,
  onClose,
  onOpenChat,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch user's following list to show Follow vs Following state
  const refreshFollowingState = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const list = await getFollowingList(currentUserId);
      setFollowingSet(new Set(list.map((id) => id.toLowerCase())));
    } catch {}
  }, [currentUserId]);

  // 2. Load cached notifications and subscribe to real-time updates
  useEffect(() => {
    if (!visible || !currentUserId) {
      return;
    }

    setLoading(true);
    let isMounted = true;

    // Load cached
    getStoredNotifications(currentUserId).then((cached) => {
      if (isMounted && cached.length > 0) {
        setNotifications(cached);
        setLoading(false);
      }
    });

    refreshFollowingState();

    // Subscribe to Firestore updates
    const unsubscribe = subscribeToUserNotifications(currentUserId, (updated) => {
      if (isMounted) {
        setNotifications(updated);
        setLoading(false);
      }
    });

    // Mark notifications as read when opening
    markNotificationsAsRead(currentUserId);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [visible, currentUserId, refreshFollowingState]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshFollowingState(),
      markNotificationsAsRead(currentUserId),
    ]);
    setRefreshing(false);
  };

  // Toggle follow/unfollow for a user from follow notification
  const handleToggleFollow = async (senderId: string, senderName: string) => {
    const isCurrentlyFollowing = followingSet.has(senderId.toLowerCase());
    if (isCurrentlyFollowing) {
      const updated = await unfollowUser(currentUserId, senderId, senderName);
      setFollowingSet(new Set(updated.map((id) => id.toLowerCase())));
      showToast(`Unfollowed @${senderName}`);
    } else {
      const updated = await followUser(currentUserId, senderId, senderName);
      setFollowingSet(new Set(updated.map((id) => id.toLowerCase())));
      showToast(`Following @${senderName}`);
    }
  };

  // Handle tapping a notification row
  const handlePressItem = (item: AppNotification) => {
    if (item.type === 'chat_message') {
      onClose();
      if (onOpenChat) {
        onOpenChat({
          uid: item.senderId,
          username: item.senderName,
          fullName: item.senderName,
          avatar: item.senderAvatar || '',
        });
      }
    } else if (item.type === 'follow') {
      showToast(`@${item.senderName} is following you`);
    } else if (item.type === 'like') {
      showToast(`@${item.senderName} liked your post`);
    }
  };

  // Group notifications into sections: Today, This Week, Earlier
  const groupedNotifications = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    const today: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    notifications.forEach((item) => {
      const diff = now - (item.createdAt || 0);
      if (diff < oneDay) {
        today.push(item);
      } else if (diff < oneWeek) {
        thisWeek.push(item);
      } else {
        earlier.push(item);
      }
    });

    const sections: { title: string; data: AppNotification[] }[] = [];
    if (today.length > 0) sections.push({ title: 'Today', data: today });
    if (thisWeek.length > 0) sections.push({ title: 'This week', data: thisWeek });
    if (earlier.length > 0) sections.push({ title: 'Earlier', data: earlier });

    return sections;
  }, [notifications]);

  // Render type-specific badge on bottom-right of avatar
  const renderTypeIcon = (type: AppNotification['type']) => {
    if (type === 'like') {
      return (
        <View style={[styles.typeBadge, styles.typeBadgeLike]}>
          <Icon name={ICON_NAMES.HEART} size={11} color={LIGHT_COLORS.white} />
        </View>
      );
    }
    if (type === 'follow') {
      return (
        <View style={[styles.typeBadge, styles.typeBadgeFollow]}>
          <Icon name={ICON_NAMES.PERSON} size={11} color={LIGHT_COLORS.white} />
        </View>
      );
    }
    // chat_message
    return (
      <View style={[styles.typeBadge, styles.typeBadgeMessage]}>
        <Icon name={ICON_NAMES.CHATBUBBLE} size={10} color={LIGHT_COLORS.white} />
      </View>
    );
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const isFollowing = followingSet.has(item.senderId.toLowerCase());

    return (
      <TouchableOpacity
        style={[styles.itemRow, !item.read && styles.itemRowUnread]}
        activeOpacity={0.7}
        onPress={() => handlePressItem(item)}
      >
        {/* Left: Avatar with type icon */}
        <View style={styles.avatarWrap}>
          {item.senderAvatar ? (
            <Image source={{ uri: item.senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {item.senderName ? item.senderName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          {renderTypeIcon(item.type)}
        </View>

        {/* Center: Message content */}
        <View style={styles.itemContent}>
          <Text style={styles.itemText} numberOfLines={3}>
            <Text style={styles.itemSenderName}>{item.senderName} </Text>
            {item.body}{' '}
            <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt)}</Text>
          </Text>
        </View>

        {/* Right: Action or thumbnail */}
        <View style={styles.itemAction}>
          {item.type === 'follow' ? (
            <TouchableOpacity
              style={isFollowing ? styles.followingBtn : styles.followBtn}
              activeOpacity={0.7}
              onPress={() => handleToggleFollow(item.senderId, item.senderName)}
            >
              <Text
                style={
                  isFollowing ? styles.followingBtnText : styles.followBtnText
                }
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          ) : item.type === 'chat_message' ? (
            <TouchableOpacity
              style={styles.replyBtn}
              activeOpacity={0.7}
              onPress={() => handlePressItem(item)}
            >
              <Text style={styles.replyBtnText}>Reply</Text>
            </TouchableOpacity>
          ) : item.postMedia ? (
            <Image
              source={{ uri: item.postMedia }}
              style={styles.postThumbnail}
            />
          ) : (
            <View style={styles.likeIconBox}>
              <Icon
                name={ICON_NAMES.HEART}
                size={18}
                color={LIGHT_COLORS.error}
              />
            </View>
          )}

          {/* Delete action button */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteNotification(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={ICON_NAMES.CLOSE}
              size={14}
              color={LIGHT_COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Icon name={ICON_NAMES.BACK} size={24} color={LIGHT_COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

          {notifications.some((n) => !n.read) ? (
            <TouchableOpacity
              style={styles.markReadBtn}
              onPress={() => markNotificationsAsRead(currentUserId)}
              activeOpacity={0.7}
            >
              <Text style={styles.markReadBtnText}>Mark read</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRightPlaceholder} />
          )}
        </View>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={LIGHT_COLORS.brandBlue} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon
                name={ICON_NAMES.HEART_OUTLINE}
                size={40}
                color={LIGHT_COLORS.black}
              />
            </View>
            <Text style={styles.emptyTitle}>Activity On Your Posts</Text>
            <Text style={styles.emptySubtitle}>
              When someone likes your posts, follows you, or sends you a
              message, you'll see it here.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={groupedNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationItem}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
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
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.avatar_bg,
    backgroundColor: LIGHT_COLORS.white,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markReadBtnText: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.brandBlue,
    fontFamily: FONT_STYLES.bold,
  },
  headerRightPlaceholder: {
    width: 32,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: LIGHT_COLORS.white,
  },
  itemRowUnread: {
    backgroundColor: LIGHT_COLORS.bg_5,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LIGHT_COLORS.avatar_placeholder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.textSecondary,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: LIGHT_COLORS.white,
  },
  sectionHeaderText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LIGHT_COLORS.white,
  },
  typeBadgeLike: {
    backgroundColor: LIGHT_COLORS.badge_like,
  },
  typeBadgeFollow: {
    backgroundColor: LIGHT_COLORS.unread_dot,
  },
  typeBadgeMessage: {
    backgroundColor: LIGHT_COLORS.badge,
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemText: {
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.black,
    lineHeight: 18,
    fontFamily: FONT_STYLES.regular,
  },
  itemSenderName: {
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  itemTime: {
    color: LIGHT_COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  itemAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtn: {
    backgroundColor: LIGHT_COLORS.unread_dot,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  followBtnText: {
    color: LIGHT_COLORS.white,
    fontSize: scale.ms(13),
    fontFamily: FONT_STYLES.bold,
  },
  followingBtn: {
    backgroundColor: LIGHT_COLORS.action_btn,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  followingBtnText: {
    color: LIGHT_COLORS.black,
    fontSize: scale.ms(13),
    fontFamily: FONT_STYLES.bold,
  },
  replyBtn: {
    backgroundColor: LIGHT_COLORS.action_btn,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  replyBtnText: {
    color: LIGHT_COLORS.black,
    fontSize: scale.ms(13),
    fontFamily: FONT_STYLES.bold,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  likeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT_COLORS.bg_6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: LIGHT_COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: scale.ms(13.5),
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
