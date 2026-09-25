import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS } from '@/constants';
import {
  getUsersFromCollection,
  getFollowingList,
  followUser,
  unfollowUser,
} from '@/services/followService';
import { getStoredUser } from '@/services/userService';
import { auth } from '@/config/firebaseConfig';
import { showToast } from '@/components/toast';
import { FollowListModal } from '@/components/FollowListModal';
import { styles } from './Search.styles';
import { FollowableUser } from '@/types';

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
              </View>
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


export default Search;