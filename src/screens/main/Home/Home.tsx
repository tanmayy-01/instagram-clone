import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './Home.styles';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS } from '@/constants';
import { showToast } from '@/components/toast';
import { auth, db } from '@/config/firebaseConfig';
import { doc, getDoc } from '@react-native-firebase/firestore';
import {
  getStoredUser,
  saveKnownUser,
  syncUserProfile,
  withTimeout,
  UserData,
} from '@/services/userService';
import { Story, getActiveStories } from '@/services/storyService';
import { Post, getFeedPosts } from '@/services/postService';
import { StoryTray } from './components/StoryTray';
import { PostCard } from './components/PostCard';
import { StoryViewerModal } from './components/StoryViewerModal';
import { CreateMediaModal } from './components/CreateMediaModal';

const Home: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [otherStories, setOtherStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Story Viewer Modal State
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Create Media (Post/Story) Modal State
  const [createMediaVisible, setCreateMediaVisible] = useState(false);

  // 1. Fetch User Data
  const fetchUserData = useCallback(async () => {
    try {
      const currentUid = auth.currentUser?.uid;
      const cached = await getStoredUser();
      const targetUid = currentUid || cached?.uid;

      if (cached) {
        setUserData(cached);
      }

      if (!targetUid) return;

      const fallbackUsername = auth.currentUser?.email
        ? auth.currentUser.email.split('@')[0]
        : cached?.username || 'user';
      const fallbackEmail = auth.currentUser?.email || cached?.email || '';

      const userDocRef = doc(db, 'users', targetUid);
      const docSnap = await withTimeout(getDoc(userDocRef), 3000);

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData(data);
        if (data.username && data.email) {
          saveKnownUser({
            username: data.username,
            email: data.email,
            uid: targetUid,
          });
        }
      } else if (fallbackEmail) {
        const profile = await syncUserProfile(
          targetUid,
          fallbackUsername,
          fallbackEmail,
        );
        setUserData(profile);
      }
    } catch (error) {
      console.warn('Home fetchUserData warning:', error);
    }
  }, []);

  // 2. Fetch Active Stories (Strict 24h filter)
  const fetchStories = useCallback(async () => {
    const currentUid = auth.currentUser?.uid || userData?.uid;
    const { userStories: userActive, otherStories: otherActive } =
      await getActiveStories(currentUid);
    setUserStories(userActive);
    setOtherStories(otherActive);
  }, [userData?.uid]);

  // 3. Fetch Feed Posts
  const fetchPosts = useCallback(async () => {
    const feed = await getFeedPosts();
    setPosts(feed);
  }, []);

  // Initial load
  const loadInitialData = useCallback(async () => {
    await Promise.all([fetchUserData(), fetchStories(), fetchPosts()]);
    setInitialLoading(false);
  }, [fetchUserData, fetchStories, fetchPosts]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Re-fetch stories when screen is focused (e.g. after follow/unfollow in Search or Profile)
  useFocusEffect(
    useCallback(() => {
      fetchStories();
    }, [fetchStories]),
  );

  // Pull to refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStories(), fetchPosts()]);
    setRefreshing(false);
  };

  // Open story viewer: each user's story modal is strictly independent!
  const handleOpenStory = (story: Story) => {
    const isMine = userStories.some((s) => s.id === story.id);
    let targetUserStories: Story[] = [];

    if (isMine) {
      // ONLY the current user's stories in "Your story" modal!
      targetUserStories = userStories;
    } else {
      // ONLY this specific friend's stories in their modal!
      targetUserStories = otherStories.filter(
        (s) =>
          (story.userId && s.userId === story.userId) ||
          (story.username && s.username === story.username),
      );
      if (targetUserStories.length === 0) {
        targetUserStories = [story];
      }
    }

    const startIndex = targetUserStories.findIndex((s) => s.id === story.id);
    setSelectedStories(targetUserStories);
    setActiveStoryIndex(startIndex >= 0 ? startIndex : 0);
    setStoryViewerVisible(true);
  };

  return (
    <View style={styles.container}>
    

      {/* Top Header matching Instagram */}
      <View style={styles.header}>
        {/* Left: (+) Create Button */}
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.7}
          onPress={() => setCreateMediaVisible(true)}
        >
          <Icon
            name={ICON_NAMES.PLUS}
            size={28}
            color={LIGHT_COLORS.black}
          />
        </TouchableOpacity>

        {/* Center: Instagram ⌵ logo */}
        <TouchableOpacity
          style={styles.headerCenter}
          activeOpacity={0.8}
          onPress={() => showToast('Following · Favorites')}
        >
          <Text style={styles.instagramLogoText}>Instagram</Text>
          <View style={styles.headerChevron}>
            <Icon
              name={ICON_NAMES.CHEVRON_DOWN}
              size={15}
              color={LIGHT_COLORS.black}
            />
          </View>
        </TouchableOpacity>

        {/* Right: (♡) Notifications Heart */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={() => showToast('Notifications')}
          >
            <Icon
              name={ICON_NAMES.HEART_OUTLINE}
              size={26}
              color={LIGHT_COLORS.black}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed FlatList */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        style={styles.feedList}
        contentContainerStyle={styles.feedListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[LIGHT_COLORS.brandBlue]}
            tintColor={LIGHT_COLORS.brandBlue}
          />
        }
        // Header component: Horizontal Stories Tray
        ListHeaderComponent={
          <StoryTray
            userStories={userStories}
            otherStories={otherStories}
            userAvatar={userData?.profilePicUrl}
            username="Your story"
            onOpenStory={handleOpenStory}
            onAddStory={() => setCreateMediaVisible(true)}
          />
        }
        // Feed Post Card
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={userData?.uid}
            onFollowChange={fetchStories}
            onPostDeleted={(deletedId) => {
              setPosts((prev) => prev.filter((p) => p.id !== deletedId));
            }}
          />
        )}
        ListEmptyComponent={
          initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={LIGHT_COLORS.brandBlue} />
              <Text style={styles.loadingText}>Loading feed...</Text>
            </View>
          ) : (
            <View style={styles.emptyFeedContainer}>
              <View style={styles.emptyFeedIconCircle}>
                <Icon
                  name={ICON_NAMES.CAMERA_OUTLINE}
                  size={36}
                  color={LIGHT_COLORS.textSecondary}
                />
              </View>
              <Text style={styles.emptyFeedTitle}>Welcome to Instagram</Text>
              <Text style={styles.emptyFeedSubtitle}>
                When people you follow share photos and videos, they'll show up here.
              </Text>
              <TouchableOpacity
                style={styles.emptyFeedButton}
                activeOpacity={0.7}
                onPress={() => setCreateMediaVisible(true)}
              >
                <Text style={styles.emptyFeedButtonText}>Share a photo</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Full-Screen 24h Story Viewer Modal */}
      <StoryViewerModal
        visible={storyViewerVisible}
        stories={selectedStories}
        initialIndex={activeStoryIndex}
        currentUserId={userData?.uid}
        onClose={() => setStoryViewerVisible(false)}
        onUnfollow={fetchStories}
        onAddNewStory={() => setCreateMediaVisible(true)}
        onStoryDeleted={() => {
          fetchStories();
        }}
      />

      {/* Create Media (Post / 24h Story) Modal */}
      <CreateMediaModal
        visible={createMediaVisible}
        user={userData}
        onClose={() => setCreateMediaVisible(false)}
        onPostCreated={() => {
          fetchPosts();
        }}
        onStoryCreated={() => {
          fetchStories();
        }}
      />
    </View>
  );
};

export default Home;
