import { db } from '@/config/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withTimeout } from './userService';
import { getFollowingList } from './followService';
import { Story } from '@/types';



const STORIES_STORAGE_KEY = 'cached_stories_tray';
export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000; // Exactly 24 Hours in milliseconds

/**
 * Creates a new 24-hour expiring Story document in Cloud Firestore & local cache
 */
export const createStory = async ({
  userId,
  username,
  userAvatar,
  mediaUri,
  caption,
}: {
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUri: string;
  caption?: string;
}): Promise<Story | null> => {
  try {
    const now = Date.now();
    const storyId = `story_${userId}_${now}`;
    const expiresAt = now + STORY_LIFETIME_MS; // Exactly 24 hours from now

    const newStory: Story = {
      id: storyId,
      userId,
      username,
      userAvatar: userAvatar || '',
      mediaUri,
      caption: caption || '',
      createdAt: now,
      expiresAt,
      viewers: [],
    };

    // 1. Save to Cloud Firestore
    try {
      const storyDocRef = doc(db, 'stories', storyId);
      await withTimeout(setDoc(storyDocRef, newStory), 4000);
    } catch (firestoreErr) {
      console.warn('createStory Firestore warning:', firestoreErr);
    }

    // 2. Cache in local storage for instant offline access
    try {
      const existing = await getStoredStories();
      const updated = [newStory, ...existing.filter((s) => s.id !== storyId)];
      await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updated));
    } catch (storageErr) {
      console.warn('createStory storage warning:', storageErr);
    }

    return newStory;
  } catch (error) {
    console.error('createStory error:', error);
    return null;
  }
};

/**
 * Retrieves all active stories that have NOT expired (expiresAt > Date.now())
 */
export const getActiveStories = async (
  currentUserId?: string,
): Promise<{ userStories: Story[]; otherStories: Story[] }> => {
  const now = Date.now();
  let allStories: Story[] = [];

  // 1. Try fetching from Cloud Firestore
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, where('expiresAt', '>', now));
    const snapshot = await withTimeout(getDocs(q), 3500);

    if (snapshot && !snapshot.empty) {
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as Story;
        // Strict client-side check: must not exceed 24 hours
        if (item.expiresAt > now) {
          allStories.push(item);
        }
      });
    }
  } catch (err) {
    console.warn('getActiveStories firestore warning:', err);
  }

  // 2. Merge with locally cached stories
  try {
    const cached = await getStoredStories();
    for (const c of cached) {
      if (
        c.expiresAt > now &&
        !c.id.startsWith('demo_story_') &&
        !allStories.some((s) => s.id === c.id)
      ) {
        allStories.push(c);
      }
    }
  } catch (cacheErr) {
    console.warn('getActiveStories cache warning:', cacheErr);
  }

  // Filter out any legacy demo stories
  allStories = allStories.filter((s) => !s.id.startsWith('demo_story_'));

  // Separate user's own stories from other users' stories
  const userStories = allStories.filter(
    (s) => s.userId === currentUserId && s.expiresAt > now,
  );

  // Stories Tray Rule: ONLY show stories of the users we follow!
  const followedList = await getFollowingList(currentUserId);
  const followedSet = new Set(followedList.map((x) => x.toLowerCase()));

  const otherStories = allStories.filter((s) => {
    // Cannot be user's own story in otherStories
    if (s.userId === currentUserId) return false;

    // Check 24-hour validity
    if (s.expiresAt <= now) return false;

    // Strict follow check: Must match followed UID or username
    const isFollowed =
      followedSet.has(s.userId.toLowerCase()) ||
      followedSet.has(s.username.toLowerCase());

    return isFollowed;
  });

  return { userStories, otherStories };
};

/**
 * Checks if a specific user has an active (unexpired) story within 24h
 */
export const hasUserActiveStory = async (
  userId: string,
): Promise<Story | null> => {
  const now = Date.now();
  try {
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('userId', '==', userId),
      where('expiresAt', '>', now),
    );
    const snap = await withTimeout(getDocs(q), 3000);
    if (snap && !snap.empty) {
      const active = snap.docs[0].data() as Story;
      if (active.expiresAt > now) return active;
    }
  } catch {
    // Check local cache
  }

  const cached = await getStoredStories();
  const found = cached.find((s) => s.userId === userId && s.expiresAt > now);
  return found || null;
};

/**
 * Marks a story as viewed by the user
 */
export const markStoryViewed = async (
  storyId: string,
  userId: string,
): Promise<void> => {
  try {
    const viewedKey = `viewed_story_${storyId}_${userId}`;
    await AsyncStorage.setItem(viewedKey, 'true');
  } catch (err) {
    console.warn('markStoryViewed warning:', err);
  }
};

/**
 * Checks if user viewed a story
 */
export const isStoryViewed = async (
  storyId: string,
  userId: string,
): Promise<boolean> => {
  try {
    const viewedKey = `viewed_story_${storyId}_${userId}`;
    const val = await AsyncStorage.getItem(viewedKey);
    return val === 'true';
  } catch {
    return false;
  }
};

/**
 * Retrieves cached stories from AsyncStorage
 */
export const getStoredStories = async (): Promise<Story[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Removes an expired or deleted story with strict ownership verification.
 * Prevents users from deleting other users' stories.
 */
export const deleteStory = async (
  storyId: string,
  currentUserId?: string,
): Promise<boolean> => {
  try {
    const storyDocRef = doc(db, 'stories', storyId);

    // Strict ownership verification: one user must not delete another user's story
    if (currentUserId) {
      const cached = await getStoredStories();
      const targetStory = cached.find((s) => s.id === storyId);
      if (
        targetStory &&
        targetStory.userId &&
        targetStory.userId !== currentUserId
      ) {
        console.warn(
          'Unauthorized deleteStory attempt: user does not own this story',
        );
        return false;
      }

      try {
        const docSnap = await withTimeout(getDoc(storyDocRef), 2500);
        if (docSnap && docSnap.exists()) {
          const data = docSnap.data() as Story;
          if (data.userId && data.userId !== currentUserId) {
            console.warn(
              'Unauthorized deleteStory Firestore check: user does not own this story',
            );
            return false;
          }
        }
      } catch {
        // offline or timeout, continue with cached validation
      }
    }

    await withTimeout(deleteDoc(storyDocRef), 3000);

    const cached = await getStoredStories();
    const updated = cached.filter((s) => s.id !== storyId);
    await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('deleteStory error:', err);
    return false;
  }
};
