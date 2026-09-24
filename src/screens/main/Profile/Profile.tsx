import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Share,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './Profile.styles';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS, SCREEN_NAMES } from '@/constants';
import * as Navigation from '@/utils';
import { showToast } from '@/components/toast';
import { auth, db } from '@/config/firebaseConfig';
import { doc, getDoc } from '@react-native-firebase/firestore';
import {
  getStoredUser,
  logoutUser,
  updateUserProfile,
  withTimeout,
  UserData,
} from '@/services/userService';
import { getFollowingList, getFollowersList } from '@/services/followService';
import { Post, getUserPosts } from '@/services/postService';
import { Story, getActiveStories } from '@/services/storyService';
import { CreateMediaModal } from '@/screens/main/Home/components/CreateMediaModal';
import { StoryViewerModal } from '@/screens/main/Home/components/StoryViewerModal';
import { PostCard } from '@/screens/main/Home/components/PostCard';
import { FollowListModal } from '@/components/FollowListModal';
import { ActiveTab } from '@/types';


const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('grid');

  // Media Creation Modal State
  const [isCreateMediaOpen, setIsCreateMediaOpen] = useState(false);

  // Menu Modal State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit Profile Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Profile Photo Upload State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Fetch current user details
  const fetchUserProfile = useCallback(async () => {
    try {
      const cached = await getStoredUser();
      if (cached) {
        setUserData(cached);
      }

      const uid = auth.currentUser?.uid || cached?.uid;
      if (!uid) return;

      const userDocRef = doc(db, 'users', uid);
      const docSnap = await withTimeout(getDoc(userDocRef), 3500);

      if (docSnap && docSnap.exists()) {
        const firestoreData = docSnap.data() as UserData;
        setUserData(firestoreData);
      }
    } catch (error) {
      console.warn('Profile fetch warning:', error);
    }
  }, []);

  const [followingCountState, setFollowingCountState] = useState<number | null>(
    null,
  );
  const [followersCountState, setFollowersCountState] = useState<number | null>(
    null,
  );

  // FollowListModal state
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');

  // User 24h Stories State
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);

  const fetchFollowing = useCallback(async () => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (uid) {
      const list = await getFollowingList(uid);
      setFollowingCountState(list.length);
    }
  }, [userData?.uid]);

  const fetchFollowers = useCallback(async () => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (uid) {
      const list = await getFollowersList(uid);
      setFollowersCountState(list.length);
    }
  }, [userData?.uid]);

  const fetchUserPosts = useCallback(async () => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (uid) {
      const posts = await getUserPosts(uid);
      setUserPosts(posts);
    }
  }, [userData?.uid]);

  const fetchUserStories = useCallback(async () => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (uid) {
      const { userStories: active } = await getActiveStories(uid);
      setUserStories(active);
    }
  }, [userData?.uid]);

  useEffect(() => {
    fetchUserProfile();
    fetchFollowing();
    fetchFollowers();
    fetchUserPosts();
    fetchUserStories();
  }, [fetchUserProfile, fetchFollowing, fetchFollowers, fetchUserPosts, fetchUserStories]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchFollowing();
      fetchFollowers();
      fetchUserPosts();
      fetchUserStories();
    }, [fetchUserProfile, fetchFollowing, fetchFollowers, fetchUserPosts, fetchUserStories]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserProfile(),
      fetchFollowing(),
      fetchFollowers(),
      fetchUserPosts(),
      fetchUserStories(),
    ]);
    setRefreshing(false);
  };

  // Upload or update profile photo in Firestore and local storage
  const uploadProfilePhoto = async (image: any) => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (!uid) {
      showToast('User not authenticated');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Prefer base64 data URI so the photo persists in Firestore without requiring external storage buckets
      const photoUri = image.data
        ? `data:${image.mime || 'image/jpeg'};base64,${image.data}`
        : image.path;

      const updated = await updateUserProfile(uid, {
        profilePicUrl: photoUri,
      });

      if (updated) {
        setUserData(updated);
        showToast('Profile photo updated');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      showToast('Failed to update photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Pick photo from gallery with circular cropping
  const handlePickFromGallery = async () => {
    setIsPhotoModalOpen(false);
    try {
      const image = await ImagePicker.openPicker({
        width: 500,
        height: 500,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
        includeBase64: true,
        compressImageQuality: 0.7,
      });

      if (image) {
        await uploadProfilePhoto(image);
      }
    } catch (err: any) {
      if (
        err?.code !== 'E_PICKER_CANCELLED' &&
        !String(err?.message || '').includes('cancelled')
      ) {
        console.warn('Gallery picker error:', err);
        showToast('Failed to select photo');
      }
    }
  };

  // Take photo with camera with circular cropping
  const handleTakePhoto = async () => {
    setIsPhotoModalOpen(false);
    try {
      const image = await ImagePicker.openCamera({
        width: 500,
        height: 500,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
        includeBase64: true,
        compressImageQuality: 0.7,
      });

      if (image) {
        await uploadProfilePhoto(image);
      }
    } catch (err: any) {
      if (
        err?.code !== 'E_PICKER_CANCELLED' &&
        !String(err?.message || '').includes('cancelled')
      ) {
        console.warn('Camera picker error:', err);
        showToast('Failed to capture photo');
      }
    }
  };

  // Remove current profile photo
  const handleRemovePhoto = async () => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (!uid) return;

    setIsPhotoModalOpen(false);
    setIsUploadingPhoto(true);
    try {
      const updated = await updateUserProfile(uid, {
        profilePicUrl: '',
      });

      if (updated) {
        setUserData(updated);
        showToast('Profile photo removed');
      }
    } catch (error) {
      console.error('Photo remove error:', error);
      showToast('Failed to remove photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Open Edit Profile modal with prefilled data
  const handleOpenEdit = () => {
    setEditName(userData?.fullName || userData?.username || '');
    setEditUsername(userData?.username || '');
    setEditBio(userData?.bio || '');
    setIsEditOpen(true);
  };

  // Save changes from Edit Profile modal
  const handleSaveEdit = async () => {
    const uid = auth.currentUser?.uid || userData?.uid;
    if (!uid) {
      setIsEditOpen(false);
      return;
    }

    setIsSavingProfile(true);
    const updated = await updateUserProfile(uid, {
      fullName: editName.trim(),
      username: editUsername.trim().toLowerCase(),
      bio: editBio.trim(),
    });

    if (updated) {
      setUserData(updated);
      setIsEditOpen(false);
    }
    setIsSavingProfile(false);
  };

  // Share Profile via system share
  const handleShareProfile = async () => {
    const handle = userData?.username || 'user';
    try {
      await Share.share({
        message: `Check out @${handle}'s profile on Instagram: https://instagram.com/${handle}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // Logout handler from Hamburger menu
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    setIsLoggingOut(false);
    setIsMenuOpen(false);
    Navigation.resetAndNavigate(SCREEN_NAMES.LOGIN);
  };

  const usernameDisplay = userData?.username || 'username';
  const fullNameDisplay =
    userData?.fullName || userData?.username || 'Ethan Smith';
  const bioDisplay = userData?.bio || 'Web Designer';
  const postsCount = userPosts.length;
  const followersCount = followersCountState ?? userData?.followersCount ?? 0;
  const followingCount = followingCountState ?? userData?.followingCount ?? 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.7}
          onPress={() => showToast(`Signed in as @${usernameDisplay}`)}
        >
          <Text style={styles.headerUsername}>{usernameDisplay}</Text>
          <View style={styles.headerChevron}>
            <Icon
              name={ICON_NAMES.CHEVRON_DOWN}
              size={16}
              color={LIGHT_COLORS.black}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Create (+) Icon */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setIsCreateMediaOpen(true)}
          >
            <Icon
              name={ICON_NAMES.PLUS}
              size={26}
              color={LIGHT_COLORS.black}
            />
          </TouchableOpacity>

          {/* Threads Icon */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => showToast('Threads')}
          >
            <Text style={styles.thereads}>@</Text>
          </TouchableOpacity>

          {/* Menu (≡) Icon */}
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setIsMenuOpen(true)}
          >
            <Icon name={ICON_NAMES.MENU} size={27} color={LIGHT_COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[LIGHT_COLORS.brandBlue]}
            tintColor={LIGHT_COLORS.brandBlue}
          />
        }
      >
        {/* Profile Info Row: Avatar + Stats */}
        <View style={styles.profileInfoRow}>
          {/* Profile Avatar with Story Ring */}
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.8}
            onPress={() => {
              if (userStories.length > 0) {
                setStoryViewerVisible(true);
              } else {
                setIsPhotoModalOpen(true);
              }
            }}
            onLongPress={() => setIsPhotoModalOpen(true)}
          >
            {/* Outer Story Ring */}
            <View
              key={`profile_ring_${userStories.length > 0 ? 'active' : 'inactive'}`}
              style={[
                styles.profileStoryRing,
                userStories.length > 0 && styles.profileStoryRingActive,
              ]}
            >
              <View style={styles.profileAvatarInnerGap}>
                {userData?.profilePicUrl ? (
                  <Image
                    source={{ uri: userData.profilePicUrl }}
                    style={
                      userStories.length > 0
                        ? styles.profileAvatarWithRing
                        : styles.avatar
                    }
                  />
                ) : (
                  <View
                    style={
                      userStories.length > 0
                        ? [styles.avatarPlaceholder, styles.profileAvatarWithRing]
                        : styles.avatarPlaceholder
                    }
                  >
                    <Text style={styles.avatarInitial}>
                      {usernameDisplay.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Uploading loading overlay */}
            {isUploadingPhoto && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color={LIGHT_COLORS.white} />
              </View>
            )}

            {/* Blue '+' Badge on Avatar: tapping '+' always creates story / post */}
            <TouchableOpacity
              style={[
                styles.addStoryBadge,
                userStories.length > 0 && styles.activeAddStoryBadge,
              ]}
              activeOpacity={0.8}
              onPress={() => setIsCreateMediaOpen(true)}
            >
              <Icon
                name={ICON_NAMES.PLUS}
                size={userStories.length > 0 ? 12 : 15}
                color={LIGHT_COLORS.white}
              />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.profileDetailsCol}>
            <View>
              <Text style={styles.fullName}>{fullNameDisplay}</Text>
            </View>

            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statColumn}
                activeOpacity={0.7}
                onPress={() => showToast(`${postsCount} posts`)}
              >
                <Text style={styles.statNumber}>{postsCount}</Text>
                <Text style={styles.statLabel}>posts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statColumn}
                activeOpacity={0.7}
                onPress={() => {
                  setFollowModalTab('followers');
                  setIsFollowModalOpen(true);
                }}
              >
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statColumn}
                activeOpacity={0.7}
                onPress={() => {
                  setFollowModalTab('following');
                  setIsFollowModalOpen(true);
                }}
              >
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>following</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* User Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.bioCategory}>{bioDisplay}</Text>
          {userData?.email ? (
            <Text style={styles.bioText}>{userData.email}</Text>
          ) : null}
        </View>

        {/* Action Buttons: Edit profile, Share profile, Discover people icon */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={handleOpenEdit}
          >
            <Text style={styles.actionButtonText}>Edit profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonMiddle]}
            activeOpacity={0.7}
            onPress={handleShareProfile}
          >
            <Text style={styles.actionButtonText}>Share profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconButton}
            activeOpacity={0.7}
            onPress={() => showToast('Discover people')}
          >
            <Icon
              name={ICON_NAMES.PERSON_ADD}
              size={18}
              color={LIGHT_COLORS.black}
            />
          </TouchableOpacity>
        </View>

        {/* Story Highlights: "New" Circle */}
        <View style={styles.highlightsSection}>
          <TouchableOpacity
            style={styles.highlightItem}
            activeOpacity={0.7}
            onPress={() => showToast('New Story Highlight')}
          >
            <View style={styles.newHighlightCircle}>
              <Icon
                name={ICON_NAMES.PLUS}
                size={26}
                color={LIGHT_COLORS.black}
              />
            </View>
            <Text style={styles.highlightLabel}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Media Tabs Bar */}
        <View style={styles.tabsBar}>
          {/* Grid Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('grid')}
            activeOpacity={0.8}
          >
            <Icon
              name={ICON_NAMES.GRID}
              size={23}
              color={
                activeTab === 'grid'
                  ? LIGHT_COLORS.black
                  : LIGHT_COLORS.textSecondary
              }
            />
            {activeTab === 'grid' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          {/* Reels Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('reels')}
            activeOpacity={0.8}
          >
            <Icon
              name={ICON_NAMES.REELS}
              size={24}
              color={
                activeTab === 'reels'
                  ? LIGHT_COLORS.black
                  : LIGHT_COLORS.textSecondary
              }
            />
            {activeTab === 'reels' && (
              <View style={styles.activeTabIndicator} />
            )}
          </TouchableOpacity>

          {/* Tagged Photos Tab */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('tagged')}
            activeOpacity={0.8}
          >
            <Icon
              name={ICON_NAMES.TAGGED}
              size={23}
              color={
                activeTab === 'tagged'
                  ? LIGHT_COLORS.black
                  : LIGHT_COLORS.textSecondary
              }
            />
            {activeTab === 'tagged' && (
              <View style={styles.activeTabIndicator} />
            )}
          </TouchableOpacity>
        </View>

        {/* Posts Grid or Zero Posts Bottom Section */}
        {activeTab === 'grid' && (
          userPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              {userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPost(post)}
                >
                  <Image
                    source={{ uri: post.mediaUri }}
                    style={styles.gridImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPostsContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon
                  name={ICON_NAMES.CAMERA_OUTLINE}
                  size={42}
                  color={LIGHT_COLORS.black}
                />
              </View>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                When you share photos and videos, they will appear on your
                profile.
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsCreateMediaOpen(true)}
              >
                <Text style={styles.emptyActionText}>Share your first photo</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {activeTab === 'reels' && (
          <View style={styles.emptyPostsContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon
                name={ICON_NAMES.REELS}
                size={42}
                color={LIGHT_COLORS.black}
              />
            </View>
            <Text style={styles.emptyTitle}>No reels yet</Text>
            <Text style={styles.emptySubtitle}>
              Capture and share your first video reel with your followers.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => showToast('Record your first reel')}
            >
              <Text style={styles.emptyActionText}>Record a reel</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'tagged' && (
          <View style={styles.emptyPostsContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon
                name={ICON_NAMES.TAGGED}
                size={42}
                color={LIGHT_COLORS.black}
              />
            </View>
            <Text style={styles.emptyTitle}>Photos and videos of you</Text>
            <Text style={styles.emptySubtitle}>
              When people tag you in photos and videos, they'll appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Photo Picker Options Modal */}
      <Modal
        visible={isPhotoModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsPhotoModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Change profile photo</Text>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.IMAGE_OUTLINE}
                    size={22}
                    color={LIGHT_COLORS.black}
                  />
                  <Text style={styles.modalOptionText}>
                    Choose from library
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.CAMERA_OUTLINE}
                    size={22}
                    color={LIGHT_COLORS.black}
                  />
                  <Text style={styles.modalOptionText}>Take photo</Text>
                </TouchableOpacity>

                {Boolean(userData?.profilePicUrl) && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={ICON_NAMES.TRASH}
                      size={22}
                      color={LIGHT_COLORS.error}
                    />
                    <Text style={styles.modalLogoutText}>
                      Remove current photo
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsPhotoModalOpen(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Hamburger Menu Bottom Sheet Modal */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Settings and activity</Text>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setIsMenuOpen(false);
                    showToast('Settings & privacy');
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.SETTINGS}
                    size={22}
                    color={LIGHT_COLORS.black}
                  />
                  <Text style={styles.modalOptionText}>
                    Settings and privacy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setIsMenuOpen(false);
                    showToast('Your activity');
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.SEARCH_OUTLINE}
                    size={22}
                    color={LIGHT_COLORS.black}
                  />
                  <Text style={styles.modalOptionText}>Your activity</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setIsMenuOpen(false);
                    handleShareProfile();
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.THREADS}
                    size={22}
                    color={LIGHT_COLORS.black}
                  />
                  <Text style={styles.modalOptionText}>QR code</Text>
                </TouchableOpacity>

                {/* Log out option */}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.LOGOUT}
                    size={22}
                    color={LIGHT_COLORS.error}
                  />
                  {isLoggingOut ? (
                    <ActivityIndicator
                      size="small"
                      color={LIGHT_COLORS.error}
                      style={styles.logoutIndicator}
                    />
                  ) : (
                    <Text style={styles.modalLogoutText}>Log out</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditOpen(false)}
      >
        <SafeAreaView style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity
              onPress={() => setIsEditOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.editModalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.editModalTitle}>Edit profile</Text>

            <TouchableOpacity
              onPress={handleSaveEdit}
              disabled={isSavingProfile}
              activeOpacity={0.7}
            >
              {isSavingProfile ? (
                <ActivityIndicator
                  size="small"
                  color={LIGHT_COLORS.brandBlue}
                />
              ) : (
                <Text style={styles.editModalDoneText}>Done</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
            <View style={styles.editAvatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                activeOpacity={0.8}
                onPress={() => setIsPhotoModalOpen(true)}
              >
                {userData?.profilePicUrl ? (
                  <Image
                    source={{ uri: userData.profilePicUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {editUsername.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}

                {isUploadingPhoto && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator
                      size="small"
                      color={LIGHT_COLORS.white}
                    />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => setIsPhotoModalOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.editAvatarButtonText}>
                  Change profile photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name Field */}
            <View style={styles.editFieldContainer}>
              <Text style={styles.editFieldLabel}>Name</Text>
              <TextInput
                style={styles.editFieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                placeholderTextColor={LIGHT_COLORS.placeholder}
              />
            </View>

            {/* Username Field */}
            <View style={styles.editFieldContainer}>
              <Text style={styles.editFieldLabel}>Username</Text>
              <TextInput
                style={styles.editFieldInput}
                value={editUsername}
                onChangeText={setEditUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Username"
                placeholderTextColor={LIGHT_COLORS.placeholder}
              />
            </View>

            {/* Bio Field */}
            <View style={styles.editFieldContainer}>
              <Text style={styles.editFieldLabel}>Bio</Text>
              <TextInput
                style={styles.editFieldInput}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Add a bio to your profile"
                placeholderTextColor={LIGHT_COLORS.placeholder}
                multiline
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create Media (Post/Story) Modal */}
      <CreateMediaModal
        visible={isCreateMediaOpen}
        user={userData}
        onClose={() => setIsCreateMediaOpen(false)}
        onPostCreated={() => {
          fetchUserPosts();
          fetchUserProfile();
        }}
        onStoryCreated={() => {
          fetchUserStories();
          showToast('Added to your story (visible for 24h)');
        }}
      />

      {/* Full-Screen 24h Story Viewer Modal */}
      <StoryViewerModal
        visible={storyViewerVisible}
        stories={userStories}
        initialIndex={0}
        currentUserId={userData?.uid}
        onClose={() => setStoryViewerVisible(false)}
        onUnfollow={() => {
          fetchUserStories();
        }}
        onStoryDeleted={() => {
          fetchUserStories();
        }}
        onAddNewStory={() => {
          setStoryViewerVisible(false);
          setIsCreateMediaOpen(true);
        }}
      />

      {/* Post Detail Modal */}
      <Modal
        visible={Boolean(selectedPost)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView
          style={styles.postDetailModalContainer}
          edges={['top', 'bottom']}
        >
          {/* Post Detail Header */}
          <View style={styles.postDetailHeader}>
            <TouchableOpacity
              style={styles.postDetailHeaderBack}
              onPress={() => setSelectedPost(null)}
              activeOpacity={0.7}
            >
              <Icon
                name={ICON_NAMES.BACK}
                size={24}
                color={LIGHT_COLORS.black}
              />
            </TouchableOpacity>

            <View style={styles.postDetailHeaderCenter}>
              <Text style={styles.postDetailHeaderSubtitle}>
                {usernameDisplay}
              </Text>
              <Text style={styles.postDetailHeaderTitle}>Posts</Text>
            </View>

            <View style={styles.postDetailHeaderSpacer} />
          </View>

          {/* Post Content */}
          <ScrollView
            style={styles.postDetailScroll}
            showsVerticalScrollIndicator={false}
          >
            {selectedPost && (
              <PostCard
                post={selectedPost}
                currentUserId={userData?.uid || auth.currentUser?.uid}
                onPostDeleted={(deletedId) => {
                  setUserPosts((prev) =>
                    prev.filter((p) => p.id !== deletedId),
                  );
                  setSelectedPost(null);
                  fetchUserProfile();
                }}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Followers and Following List Modal */}
      <FollowListModal
        visible={isFollowModalOpen}
        initialTab={followModalTab}
        currentUserId={userData?.uid || auth.currentUser?.uid || ''}
        currentUsername={usernameDisplay}
        onClose={() => {
          setIsFollowModalOpen(false);
          fetchFollowing();
          fetchFollowers();
        }}
        onCountsChanged={(followers, following) => {
          setFollowersCountState(followers);
          setFollowingCountState(following);
        }}
      />
    </View>
  );
};

export default Profile;
