import { db } from '@/config/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withTimeout, getStoredUser } from './userService';
import { createNotification } from './notificationService';

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUri: string;
  caption?: string;
  location?: string;
  audioTrack?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedBy: string[];
  bookmarkedBy: string[];
  createdAt: number;
  isVerified?: boolean;
}

const POSTS_STORAGE_KEY = 'cached_feed_posts';

/**
 * Creates and publishes a new Post to Cloud Firestore and local cache
 */
export const createPost = async ({
  userId,
  username,
  userAvatar,
  mediaUri,
  caption,
  location,
  audioTrack,
}: {
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUri: string;
  caption?: string;
  location?: string;
  audioTrack?: string;
}): Promise<Post | null> => {
  try {
    const now = Date.now();
    const postId = `post_${userId}_${now}`;

    const newPost: Post = {
      id: postId,
      userId,
      username,
      userAvatar: userAvatar || '',
      mediaUri,
      caption: caption || '',
      location: location || '',
      audioTrack: audioTrack || '',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedBy: [],
      bookmarkedBy: [],
      createdAt: now,
      isVerified: false,
    };

    // 1. Save to Cloud Firestore
    try {
      const postDocRef = doc(db, 'posts', postId);
      await withTimeout(setDoc(postDocRef, newPost), 4000);
    } catch (firestoreErr) {
      console.warn('createPost Firestore warning:', firestoreErr);
    }

    // 2. Cache in local storage for instant offline availability
    try {
      const existing = await getStoredPosts();
      const updated = [newPost, ...existing.filter((p) => p.id !== postId)];
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (storageErr) {
      console.warn('createPost storage warning:', storageErr);
    }

    return newPost;
  } catch (error) {
    console.error('createPost error:', error);
    return null;
  }
};

/**
 * Retrieves the Home feed posts, merging Firestore items with local cache
 */
export const getFeedPosts = async (): Promise<Post[]> => {
  let allPosts: Post[] = [];

  // 1. Fetch from Firestore
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await withTimeout(getDocs(q), 3500);

    if (snapshot && !snapshot.empty) {
      snapshot.forEach((docSnap) => {
        allPosts.push(docSnap.data() as Post);
      });
    }
  } catch (err) {
    console.warn('getFeedPosts firestore warning:', err);
  }

  // 2. Fetch locally cached posts
  try {
    const cached = await getStoredPosts();
    for (const c of cached) {
      if (!c.id.startsWith('demo_post_') && !allPosts.some((p) => p.id === c.id)) {
        allPosts.push(c);
      }
    }
  } catch (cacheErr) {
    console.warn('getFeedPosts cache warning:', cacheErr);
  }

  // Filter out any legacy demo posts
  allPosts = allPosts.filter((p) => !p.id.startsWith('demo_post_'));

  // Sort by newest first
  return allPosts.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Toggles like on a post and updates likesCount
 */
export const toggleLikePost = async (
  postId: string,
  userId: string,
): Promise<{ isLiked: boolean; newCount: number }> => {
  try {
    const posts = await getFeedPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) return { isLiked: false, newCount: 0 };

    const alreadyLiked = post.likedBy.includes(userId);
    const updatedLikedBy = alreadyLiked
      ? post.likedBy.filter((id) => id !== userId)
      : [...post.likedBy, userId];

    const newCount = alreadyLiked
      ? Math.max(0, post.likesCount - 1)
      : post.likesCount + 1;

    // Update in Firestore
    try {
      const postRef = doc(db, 'posts', postId);
      await withTimeout(
        updateDoc(postRef, {
          likedBy: updatedLikedBy,
          likesCount: newCount,
        }),
        2500,
      );
    } catch {
      // offline/timeout
    }

    // Update local cache
    const updatedPosts = posts.map((p) =>
      p.id === postId
        ? { ...p, likedBy: updatedLikedBy, likesCount: newCount }
        : p,
    );
    await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));

    // Create like notification for post author (if not self-like)
    if (!alreadyLiked && post.userId && post.userId !== userId) {
      try {
        const stored = await getStoredUser();
        const myUsername = stored?.username || 'user';
        const myAvatar = stored?.profilePicUrl || '';
        createNotification({
          recipientId: post.userId,
          senderId: userId,
          senderName: myUsername,
          senderAvatar: myAvatar,
          title: myUsername,
          body: 'liked your post.',
          type: 'like',
          postId: post.id,
          postMedia: post.mediaUri,
          createdAt: Date.now(),
          read: false,
        }).catch(() => {});
      } catch {}
    }

    return { isLiked: !alreadyLiked, newCount };
  } catch (error) {
    console.warn('toggleLikePost error:', error);
    return { isLiked: false, newCount: 0 };
  }
};

/**
 * Toggles bookmark on a post
 */
export const toggleBookmarkPost = async (
  postId: string,
  userId: string,
): Promise<boolean> => {
  try {
    const posts = await getFeedPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) return false;

    const alreadyBookmarked = post.bookmarkedBy.includes(userId);
    const updatedBookmarkedBy = alreadyBookmarked
      ? post.bookmarkedBy.filter((id) => id !== userId)
      : [...post.bookmarkedBy, userId];

    // Update Firestore
    try {
      const postRef = doc(db, 'posts', postId);
      await withTimeout(
        updateDoc(postRef, {
          bookmarkedBy: updatedBookmarkedBy,
        }),
        2500,
      );
    } catch {
      // offline
    }

    // Update local cache
    const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, bookmarkedBy: updatedBookmarkedBy } : p,
    );
    await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));

    return !alreadyBookmarked;
  } catch (error) {
    console.warn('toggleBookmarkPost error:', error);
    return false;
  }
};

/**
 * Retrieves cached posts from AsyncStorage
 */
export const getStoredPosts = async (): Promise<Post[]> => {
  try {
    const raw = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Retrieves all posts created by a specific user
 */
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const all = await getFeedPosts();
  return all.filter((p) => p.userId === userId);
};

/**
 * Deletes a post from Firestore and local cache with strict ownership verification.
 * Prevents users from deleting other users' posts.
 */
export const deletePost = async (
  postId: string,
  currentUserId?: string,
): Promise<boolean> => {
  try {
    const postDocRef = doc(db, 'posts', postId);

    // Strict ownership verification: one user must not delete another user's post
    if (currentUserId) {
      const cached = await getStoredPosts();
      const targetPost = cached.find((p) => p.id === postId);
      if (
        targetPost &&
        targetPost.userId &&
        targetPost.userId !== currentUserId
      ) {
        console.warn(
          'Unauthorized deletePost attempt: user does not own this post',
        );
        return false;
      }

      try {
        const docSnap = await withTimeout(getDoc(postDocRef), 2500);
        if (docSnap && docSnap.exists()) {
          const data = docSnap.data() as Post;
          if (data.userId && data.userId !== currentUserId) {
            console.warn(
              'Unauthorized deletePost Firestore check: user does not own this post',
            );
            return false;
          }
        }
      } catch {
        // offline or timeout, continue with cached validation
      }
    }

    await withTimeout(deleteDoc(postDocRef), 3000);

    const cached = await getStoredPosts();
    const updated = cached.filter((p) => p.id !== postId);
    await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('deletePost error:', err);
    return false;
  }
};

