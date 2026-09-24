import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS } from '@/constants';
import {
  FollowableUser,
  getUsersFromCollection,
  getFollowingList,
  followUser,
  unfollowUser,
} from '@/services/followService';
import { getStoredUser } from '@/services/userService';
import { auth } from '@/config/firebaseConfig';
import { showToast } from '@/components/toast';
import { FollowListModal } from '@/components/FollowListModal';

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<FollowableUser[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // FollowListModal state
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('following');

  // Load registered users from collection and current user following status
  const loadData = useCallback(async () => {
    try {
      const stored = await getStoredUser();
      const currentUid = auth.currentUser?.uid || stored?.uid || '';
      const cUsername = stored?.username || auth.currentUser?.displayName || 'you';
      setCurrentUserId(currentUid);
      setCurrentUsername(cUsername);

      const [users, followingList] = await Promise.all([
        getUsersFromCollection(currentUid),
        currentUid ? getFollowingList(currentUid) : Promise.resolve([]),
      ]);

      setUsersList(users);
      setFollowingSet(new Set(followingList.map((x) => x.toLowerCase())));
    } catch (err) {
      console.warn('Search loadData error:', err);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleFollow = async (user: FollowableUser) => {
    if (!currentUserId) {
      showToast('Please sign in to follow users');
      return;
    }

    const isFollowing =
      followingSet.has(user.uid.toLowerCase()) ||
      followingSet.has(user.username.toLowerCase());

    const nextSet = new Set(followingSet);

    if (isFollowing) {
      // Unfollow
      nextSet.delete(user.uid.toLowerCase());
      nextSet.delete(user.username.toLowerCase());
      setFollowingSet(nextSet);
      await unfollowUser(currentUserId, user.uid, user.username);
      showToast(`Unfollowed @${user.username}`);
    } else {
      // Follow
      nextSet.add(user.uid.toLowerCase());
      setFollowingSet(nextSet);
      await followUser(currentUserId, user.uid);
      showToast(`Following @${user.username}`);
    }
  };

  // Filter users based on search text
  const filteredUsers = usersList.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return (
      u.username.toLowerCase().includes(query) ||
      u.fullName.toLowerCase().includes(query) ||
      (u.bio && u.bio.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Search Bar & Following/Follower List Shortcut */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Icon
            name={ICON_NAMES.SEARCH}
            size={18}
            color={LIGHT_COLORS.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
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
              style={styles.clearButton}
            >
              <Icon
                name={ICON_NAMES.CLOSE}
                size={16}
                color={LIGHT_COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* View Followers / Following quick button */}
        <TouchableOpacity
          style={styles.headerFollowListBtn}
          activeOpacity={0.7}
          onPress={() => {
            setFollowModalTab('following');
            setIsFollowModalOpen(true);
          }}
        >
          <Icon
            name={ICON_NAMES.PERSON_OUTLINE}
            size={22}
            color={LIGHT_COLORS.black}
          />
        </TouchableOpacity>
      </View>

      {/* Users List from Firestore */}
      {isLoading && !refreshing && usersList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LIGHT_COLORS.brandBlue} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uid || item.username}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[LIGHT_COLORS.brandBlue]}
            />
          }
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {searchQuery.trim()
                    ? `Results (${filteredUsers.length})`
                    : 'Discover People'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFollowModalTab('following');
                    setIsFollowModalOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewFollowingLink}>My Following</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionSubtitle}>
                {searchQuery.trim()
                  ? 'Follow accounts to see their posts and 24h stories in your feed'
                  : 'Users registered on Instagram. Follow them to see their posts & stories.'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name={ICON_NAMES.SEARCH_OUTLINE}
                size={40}
                color={LIGHT_COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>
                We couldn't find anyone matching "{searchQuery}".
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isFollowing =
              followingSet.has(item.uid.toLowerCase()) ||
              followingSet.has(item.username.toLowerCase());

            return (
              <View style={styles.userCard}>
                {/* User Avatar */}
                <View style={styles.userLeft}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.placeholderAvatar}>
                      <Text style={styles.placeholderText}>
                        {item.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Username & Full Name */}
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
                    {Boolean(item.bio) && (
                      <Text style={styles.bioText} numberOfLines={1}>
                        {item.bio}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Follow / Following Button */}
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleToggleFollow(item)}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Following and Followers list modal */}
      <FollowListModal
        visible={isFollowModalOpen}
        initialTab={followModalTab}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
        onClose={() => {
          setIsFollowModalOpen(false);
          loadData();
        }}
        onCountsChanged={() => {
          loadData();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: LIGHT_COLORS.black,
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  headerFollowListBtn: {
    marginLeft: 12,
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  viewFollowingLink: {
    fontSize: 13,
    fontWeight: '600',
    color: LIGHT_COLORS.brandBlue,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F8F9FA',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F4F6',
  },
  placeholderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  fullNameText: {
    fontSize: 13,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
  },
  bioText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: LIGHT_COLORS.brandBlue,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#EFEFEF',
    borderWidth: 0.5,
    borderColor: '#DBDBDB',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.white,
  },
  followingButtonText: {
    color: LIGHT_COLORS.black,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default Search;