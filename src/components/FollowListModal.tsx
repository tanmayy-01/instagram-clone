import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS, FONT_SIZES, FONT_STYLES, FONT_WEIGHTS } from '@/constants';
import {
  FollowableUser,
  getFollowersUsers,
  getFollowingUsers,
  followUser,
  unfollowUser,
  removeFollower,
} from '@/services/followService';
import { showToast } from '@/components/toast';
import { FollowListModalProps } from '@/types';
import { scale } from '@/lib/scale';


export const FollowListModal: React.FC<FollowListModalProps> = ({
  visible,
  initialTab = 'followers',
  currentUserId,
  currentUsername,
  onClose,
  onCountsChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<FollowableUser[]>([]);
  const [following, setFollowing] = useState<FollowableUser[]>([]);
  const [followingUidsSet, setFollowingUidsSet] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sync initial tab when opened
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [visible, initialTab]);

  // Load followers and following
  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const [fetchedFollowers, fetchedFollowing] = await Promise.all([
        getFollowersUsers(currentUserId),
        getFollowingUsers(currentUserId),
      ]);

      setFollowers(fetchedFollowers);
      setFollowing(fetchedFollowing);

      const fSet = new Set<string>();
      fetchedFollowing.forEach((u) => {
        fSet.add(u.uid.toLowerCase());
      });
      setFollowingUidsSet(fSet);

      onCountsChanged?.(fetchedFollowers.length, fetchedFollowing.length);
    } catch (err) {
      console.warn('loadData in FollowListModal error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, onCountsChanged]);

  useEffect(() => {
    if (visible && currentUserId) {
      loadData();
    }
  }, [visible, currentUserId, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Toggle follow/unfollow for a user
  const handleToggleFollow = async (user: FollowableUser) => {
    if (!currentUserId) return;

    const isFollowing = followingUidsSet.has(user.uid.toLowerCase());

    const nextSet = new Set(followingUidsSet);

    if (isFollowing) {
      // Unfollow
      nextSet.delete(user.uid.toLowerCase());
      setFollowingUidsSet(nextSet);

      const nextFollowing = following.filter(
        (u) => u.uid.toLowerCase() !== user.uid.toLowerCase(),
      );
      setFollowing(nextFollowing);
      onCountsChanged?.(followers.length, nextFollowing.length);

      await unfollowUser(currentUserId, user.uid, user.username);
      showToast(`Unfollowed @${user.username}`);
    } else {
      // Follow
      nextSet.add(user.uid.toLowerCase());
      setFollowingUidsSet(nextSet);

      const nextFollowing = [...following, user];
      setFollowing(nextFollowing);
      onCountsChanged?.(followers.length, nextFollowing.length);

      await followUser(currentUserId, user.uid);
      showToast(`Following @${user.username}`);
    }
  };

  // Remove follower from current user's followers
  const handleRemoveFollower = async (user: FollowableUser) => {
    if (!currentUserId) return;

    const nextFollowers = followers.filter(
      (u) =>
        u.uid.toLowerCase() !== user.uid.toLowerCase() &&
        u.username.toLowerCase() !== user.username.toLowerCase(),
    );
    setFollowers(nextFollowers);
    onCountsChanged?.(nextFollowers.length, following.length);

    await removeFollower(currentUserId, user.uid);
    showToast(`Removed @${user.username} from followers`);
  };

  // Filter current tab list
  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon
              name={ICON_NAMES.BACK}
              size={24}
              color={LIGHT_COLORS.black}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentUsername || 'Profile'}
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'followers' && styles.activeTabButton,
            ]}
            onPress={() => {
              setActiveTab('followers');
              setSearchQuery('');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'followers' && styles.activeTabText,
              ]}
            >
              {followers.length} Followers
            </Text>
            {activeTab === 'followers' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'following' && styles.activeTabButton,
            ]}
            onPress={() => {
              setActiveTab('following');
              setSearchQuery('');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'following' && styles.activeTabText,
              ]}
            >
              {following.length} Following
            </Text>
            {activeTab === 'following' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Icon
              name={ICON_NAMES.SEARCH}
              size={18}
              color={LIGHT_COLORS.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab}...`}
              placeholderTextColor={LIGHT_COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
                style={styles.clearSearch}
              >
                <Icon
                  name={ICON_NAMES.CLOSE}
                  size={16}
                  color={LIGHT_COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={LIGHT_COLORS.brandBlue} />
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item) => `${activeTab}_${item.uid}_${item.username}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[LIGHT_COLORS.brandBlue]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Icon
                    name={
                      activeTab === 'followers'
                        ? ICON_NAMES.PERSON_OUTLINE
                        : ICON_NAMES.PERSON_ADD
                    }
                    size={38}
                    color={LIGHT_COLORS.textSecondary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery.trim()
                    ? 'No results found'
                    : activeTab === 'followers'
                    ? 'No followers yet'
                    : 'Not following anyone yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? `No users matching "${searchQuery}"`
                    : activeTab === 'followers'
                    ? 'When someone follows this account, you will see them here.'
                    : 'Discover people in the Search section and follow them to see their posts and stories.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isFollowing =
                followingUidsSet.has(item.uid.toLowerCase()) ||
                followingUidsSet.has(item.username.toLowerCase());

              return (
                <View style={styles.userRow}>
                  {/* Left: Avatar & Info */}
                  <View style={styles.userLeft}>
                    {item.avatar ? (
                      <Image
                        source={{ uri: item.avatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.placeholderAvatar}>
                        <Text style={styles.placeholderText}>
                          {item.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.userInfo}>
                      <View style={styles.usernameRow}>
                        <Text style={styles.usernameText} numberOfLines={1}>
                          {item.username}
                        </Text>
                        {item.isVerified && (
                          <View style={styles.verifiedBadge}>
                            <Icon
                              name={ICON_NAMES.CHECKMARK_CIRCLE}
                              size={13}
                              color={LIGHT_COLORS.brandBlue}
                            />
                          </View>
                        )}
                      </View>
                      <Text style={styles.fullNameText} numberOfLines={1}>
                        {item.fullName || item.username}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Actions */}
                  <View style={styles.actionsRight}>
                    {activeTab === 'following' ? (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          isFollowing ? styles.followingBtn : styles.followBtn,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleToggleFollow(item)}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            isFollowing
                              ? styles.followingBtnText
                              : styles.followBtnText,
                          ]}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.followerActions}>
                        {/* Remove Follower Button */}
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.removeBtn]}
                          activeOpacity={0.7}
                          onPress={() => handleRemoveFollower(item)}
                        >
                          <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>

                        {/* Optional Follow Back Toggle */}
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            styles.smallFollowBtn,
                            isFollowing
                              ? styles.followingBtn
                              : styles.followBtn,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleToggleFollow(item)}
                        >
                          <Text
                            style={[
                              styles.actionBtnText,
                              isFollowing
                                ? styles.followingBtnText
                                : styles.followBtnText,
                            ]}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
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
    borderBottomColor: LIGHT_COLORS.action_btn,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
  },
  headerRightPlaceholder: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.action_btn,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  activeTabButton: {},
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.textSecondary,
  },
  activeTabText: {
    color: LIGHT_COLORS.black,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: LIGHT_COLORS.black,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.action_btn,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.black,
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearSearch: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  placeholderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LIGHT_COLORS.avatar_placeholder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.textSecondary,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  fullNameText: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallFollowBtn: {
    marginLeft: 6,
    minWidth: 76,
    paddingHorizontal: 12,
  },
  followBtn: {
    backgroundColor: LIGHT_COLORS.brandBlue,
  },
  followingBtn: {
    backgroundColor: LIGHT_COLORS.action_btn,
    borderWidth: 0.5,
    borderColor: LIGHT_COLORS.border_1,
  },
  removeBtn: {
    backgroundColor: LIGHT_COLORS.action_btn,
    borderWidth: 0.5,
    borderColor: LIGHT_COLORS.border_1,
  },
  actionBtnText: {
    fontSize: scale.ms(13),
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.white,
  },
  followBtnText: {
    color: LIGHT_COLORS.white,
  },
  followingBtnText: {
    color: LIGHT_COLORS.black,
  },
  removeBtnText: {
    fontSize: scale.ms(13),
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.black,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LIGHT_COLORS.bg_2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.action_btn,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
