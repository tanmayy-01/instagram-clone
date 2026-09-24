import { db } from '@/config/firebaseConfig';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withTimeout, getStoredUser } from './userService';

export interface FollowableUser {
  uid: string;
  username: string;
  fullName: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
}

// Set of legacy demo mock accounts to remove completely
export const MOCK_USER_IDENTIFIERS = new Set([
  'user_chaitali',
  'chaitali._.9',
  'user_reshu',
  '_r_e_s_h_u__09',
  'user_shrav',
  'hey_shrav_',
  'instant_bollywood_official',
  'instantbollywood',
  'user_rohit',
  'rohit_sharma45',
  'user_anushka',
  'anushkasharma',
  'user_traveler',
  'japan_explorer',
  'user_foodie',
  'delhi_streetfood',
]);

const FOLLOWING_STORAGE_KEY_PREFIX = 'user_following_list_';
const FOLLOWERS_STORAGE_KEY_PREFIX = 'user_followers_list_';
const ALL_USERS_STORAGE_KEY = 'cached_all_search_users';

/**
 * Normalizes an array of identifiers to unique UIDs only.
 * If legacy records stored both a UID and a username for the same user,
 * this maps the username to the matching UID and deduplicates,
 * ensuring each followed user counts exactly ONCE.
 */
export const normalizeToUids = async (identifiers: string[]): Promise<string[]> => {
  if (!identifiers || identifiers.length === 0) return [];

  // Filter out any mock users
  const rawList = identifiers.filter(
    (id) => Boolean(id) && !MOCK_USER_IDENTIFIERS.has(id.toLowerCase()),
  );

  if (rawList.length === 0) return [];

  try {
    const usersRef = collection(db, 'users');
    const snap = await withTimeout(getDocs(usersRef), 3500);

    const usernameToUid = new Map<string, string>();
    const knownUids = new Set<string>();

    if (snap && !snap.empty) {
      snap.forEach((docSnap) => {
        const uData = docSnap.data();
        const uid = docSnap.id || uData.uid;
        if (uid) {
          knownUids.add(uid);
          if (uData.username) {
            usernameToUid.set(uData.username.toLowerCase(), uid);
          }
        }
      });
    }

    const uniqueUids = new Set<string>();
    for (const item of rawList) {
      const lower = item.toLowerCase();
      // If the item matches a known username, resolve to their UID
      if (usernameToUid.has(lower)) {
        uniqueUids.add(usernameToUid.get(lower)!);
      } else {
        uniqueUids.add(item);
      }
    }

    return Array.from(uniqueUids);
  } catch (err) {
    console.warn('normalizeToUids error:', err);
    return Array.from(new Set(rawList));
  }
};

/**
 * Returns the array of user UIDs followed by the user.
 * Strictly returns 1 entry per followed person (UID only, no duplicate usernames).
 */
export const getFollowingList = async (currentUserId?: string): Promise<string[]> => {
  try {
    let targetUid = currentUserId;
    if (!targetUid) {
      const stored = await getStoredUser();
      targetUid = stored?.uid;
    }

    if (!targetUid) {
      return [];
    }

    const key = FOLLOWING_STORAGE_KEY_PREFIX + targetUid;
    let list: string[] = [];

    // Always fetch freshest data from Firestore to sync with DB
    try {
      const userDocRef = doc(db, 'users', targetUid);
      const docSnap = await withTimeout(getDoc(userDocRef), 3000);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data?.following)) {
          list = data.following;
        }
      }
    } catch (err) {
      console.warn('getFollowingList firestore read warning:', err);
    }

    // Fallback to local storage if Firestore returned empty or failed
    if (list.length === 0) {
      const local = await AsyncStorage.getItem(key);
      if (local !== null) {
        list = JSON.parse(local);
      }
    }

    // Normalize to unique UIDs only (resolves legacy username + uid duplicates)
    const normalizedUids = await normalizeToUids(list);

    // If normalized list differs from raw list, persist the fix to Firestore & local storage
    if (
      normalizedUids.length !== list.length ||
      list.some((item) => !normalizedUids.includes(item))
    ) {
      await AsyncStorage.setItem(key, JSON.stringify(normalizedUids));
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await withTimeout(
          setDoc(
            userDocRef,
            {
              following: normalizedUids,
              followingCount: normalizedUids.length,
            },
            { merge: true },
          ),
          2500,
        );
      } catch (e) {
        console.warn('getFollowingList persist cleaned following warning:', e);
      }
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(normalizedUids));
    }

    return normalizedUids;
  } catch (error) {
    console.error('getFollowingList error:', error);
    return [];
  }
};

/**
 * Returns the array of follower user UIDs for the user.
 * Strictly returns 1 entry per follower (UID only).
 */
export const getFollowersList = async (currentUserId?: string): Promise<string[]> => {
  try {
    let targetUid = currentUserId;
    if (!targetUid) {
      const stored = await getStoredUser();
      targetUid = stored?.uid;
    }

    if (!targetUid) {
      return [];
    }

    const key = FOLLOWERS_STORAGE_KEY_PREFIX + targetUid;
    let list: string[] = [];

    try {
      const userDocRef = doc(db, 'users', targetUid);
      const docSnap = await withTimeout(getDoc(userDocRef), 3000);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data?.followers)) {
          list = data.followers;
        }
      }
    } catch (err) {
      console.warn('getFollowersList firestore read warning:', err);
    }

    if (list.length === 0) {
      const local = await AsyncStorage.getItem(key);
      if (local !== null) {
        list = JSON.parse(local);
      }
    }

    const normalizedUids = await normalizeToUids(list);

    if (
      normalizedUids.length !== list.length ||
      list.some((item) => !normalizedUids.includes(item))
    ) {
      await AsyncStorage.setItem(key, JSON.stringify(normalizedUids));
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await withTimeout(
          setDoc(
            userDocRef,
            {
              followers: normalizedUids,
              followersCount: normalizedUids.length,
            },
            { merge: true },
          ),
          2500,
        );
      } catch (e) {
        console.warn('getFollowersList persist cleaned followers warning:', e);
      }
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(normalizedUids));
    }

    return normalizedUids;
  } catch (error) {
    console.error('getFollowersList error:', error);
    return [];
  }
};

/**
 * Fetches all registered users from the Firestore 'users' collection,
 * excluding the currently logged-in user and any legacy demo accounts.
 */
export const getUsersFromCollection = async (
  currentUserId?: string,
): Promise<FollowableUser[]> => {
  try {
    let targetUid = currentUserId;
    if (!targetUid) {
      const stored = await getStoredUser();
      targetUid = stored?.uid;
    }

    const firestoreUsers: FollowableUser[] = [];

    // Query ONLY 'users' collection in Firestore
    try {
      const usersRef = collection(db, 'users');
      const snap = await withTimeout(getDocs(usersRef), 4000);

      if (snap && !snap.empty) {
        snap.forEach((docItem) => {
          const data = docItem.data();
          const uid = docItem.id || data.uid;

          // Exclude currently logged-in user
          if (targetUid && (uid === targetUid || data.email === targetUid)) return;

          const username = data.username || docItem.id;

          // Exclude any legacy mock user accounts
          if (
            MOCK_USER_IDENTIFIERS.has(uid.toLowerCase()) ||
            MOCK_USER_IDENTIFIERS.has(username.toLowerCase())
          ) {
            return;
          }

          firestoreUsers.push({
            uid,
            username,
            fullName: data.fullName || username,
            avatar: data.profilePicUrl || '',
            bio: data.bio || '',
            isVerified: Boolean(data.isVerified),
            followers: (data.followers || []).filter(
              (id: string) => !MOCK_USER_IDENTIFIERS.has(id.toLowerCase()),
            ),
            following: (data.following || []).filter(
              (id: string) => !MOCK_USER_IDENTIFIERS.has(id.toLowerCase()),
            ),
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
          });
        });
      }
    } catch (firestoreErr) {
      console.warn('getUsersFromCollection Firestore query warning:', firestoreErr);
    }

    // Update local cache
    try {
      await AsyncStorage.setItem(
        ALL_USERS_STORAGE_KEY,
        JSON.stringify(firestoreUsers),
      );
    } catch {}

    return firestoreUsers;
  } catch (error) {
    console.error('getUsersFromCollection error:', error);
    return [];
  }
};

/**
 * Checks if the current user is following a target user (by UID or username)
 */
export const isFollowingUser = async (
  currentUserId: string,
  targetIdentifier: string,
  targetUsername?: string,
): Promise<boolean> => {
  if (!targetIdentifier && !targetUsername) return false;
  const list = await getFollowingList(currentUserId);
  const cleanId = (targetIdentifier || '').trim().toLowerCase();
  const cleanUsername = (targetUsername || '').trim().toLowerCase();

  return list.some((item) => {
    const lower = item.toLowerCase();
    return (cleanId && lower === cleanId) || (cleanUsername && lower === cleanUsername);
  });
};

/**
 * Follows an actual user.
 * IMPORTANT: Stores ONLY the target user's UID in the following array (never both UID and username).
 */
export const followUser = async (
  currentUserId: string,
  targetUserId: string,
  _targetUsername?: string,
): Promise<string[]> => {
  try {
    if (!currentUserId || !targetUserId) return [];

    const list = await getFollowingList(currentUserId);

    // ONLY store the UID in following array (1 entry per user)
    const toAdd = [targetUserId];

    const updated = Array.from(new Set([...list, ...toAdd])).filter(
      (id) => !MOCK_USER_IDENTIFIERS.has(id.toLowerCase()),
    );
    const key = FOLLOWING_STORAGE_KEY_PREFIX + currentUserId;
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    // 1. Sync to current user's document in Firestore
    try {
      const userDocRef = doc(db, 'users', currentUserId);
      await withTimeout(
        setDoc(
          userDocRef,
          {
            following: updated,
            followingCount: updated.length,
          },
          { merge: true },
        ),
        3000,
      );
    } catch (firestoreErr) {
      console.warn('followUser current user firestore update warning:', firestoreErr);
    }

    // 2. Sync to target user's followers list (ONLY store current user UID)
    try {
      const targetFollowersKey = FOLLOWERS_STORAGE_KEY_PREFIX + targetUserId;
      const targetLocal = await AsyncStorage.getItem(targetFollowersKey);
      let targetFollowers: string[] = targetLocal ? JSON.parse(targetLocal) : [];
      if (!targetFollowers.includes(currentUserId)) {
        targetFollowers.push(currentUserId);
        await AsyncStorage.setItem(
          targetFollowersKey,
          JSON.stringify(targetFollowers),
        );
      }

      const targetDocRef = doc(db, 'users', targetUserId);
      const targetSnap = await withTimeout(getDoc(targetDocRef), 2000);
      if (targetSnap && targetSnap.exists()) {
        const targetData = targetSnap.data();
        const existingFollowers: string[] = Array.isArray(targetData?.followers)
          ? targetData.followers
          : [];
        if (!existingFollowers.includes(currentUserId)) {
          existingFollowers.push(currentUserId);
          await withTimeout(
            setDoc(
              targetDocRef,
              {
                followers: existingFollowers,
                followersCount: existingFollowers.length,
              },
              { merge: true },
            ),
            3000,
          );
        }
      }
    } catch (targetErr) {
      console.warn('followUser target followers update warning:', targetErr);
    }

    return updated;
  } catch (error) {
    console.error('followUser error:', error);
    return [];
  }
};

/**
 * Unfollows a user.
 * Removes both the UID and any legacy username from following array.
 */
export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string,
  targetUsername?: string,
): Promise<string[]> => {
  try {
    const list = await getFollowingList(currentUserId);
    const cleanId = targetUserId.trim().toLowerCase();
    const cleanUsername = targetUsername ? targetUsername.trim().toLowerCase() : '';

    const updated = list.filter((item) => {
      const lower = item.toLowerCase();
      if (lower === cleanId) return false;
      if (cleanUsername && lower === cleanUsername) return false;
      return true;
    });

    const key = FOLLOWING_STORAGE_KEY_PREFIX + currentUserId;
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    // 1. Sync to current user's document in Firestore
    try {
      const userDocRef = doc(db, 'users', currentUserId);
      await withTimeout(
        setDoc(
          userDocRef,
          {
            following: updated,
            followingCount: updated.length,
          },
          { merge: true },
        ),
        3000,
      );
    } catch (firestoreErr) {
      console.warn('unfollowUser current user firestore update warning:', firestoreErr);
    }

    // 2. Remove current user UID from target user's followers
    try {
      const targetFollowersKey = FOLLOWERS_STORAGE_KEY_PREFIX + targetUserId;
      const targetLocal = await AsyncStorage.getItem(targetFollowersKey);
      if (targetLocal) {
        const targetFollowers: string[] = JSON.parse(targetLocal);
        const filtered = targetFollowers.filter((id) => id !== currentUserId);
        await AsyncStorage.setItem(targetFollowersKey, JSON.stringify(filtered));
      }

      const targetDocRef = doc(db, 'users', targetUserId);
      const targetSnap = await withTimeout(getDoc(targetDocRef), 2000);
      if (targetSnap && targetSnap.exists()) {
        const targetData = targetSnap.data();
        if (Array.isArray(targetData?.followers)) {
          const filteredFollowers = targetData.followers.filter(
            (id: string) => id !== currentUserId,
          );
          await withTimeout(
            setDoc(
              targetDocRef,
              {
                followers: filteredFollowers,
                followersCount: filteredFollowers.length,
              },
              { merge: true },
            ),
            3000,
          );
        }
      }
    } catch (targetErr) {
      console.warn('unfollowUser target followers update warning:', targetErr);
    }

    return updated;
  } catch (error) {
    console.error('unfollowUser error:', error);
    return [];
  }
};

/**
 * Removes a follower from the current user's followers list
 */
export const removeFollower = async (
  currentUserId: string,
  followerIdentifier: string,
): Promise<string[]> => {
  try {
    const list = await getFollowersList(currentUserId);
    const cleanId = followerIdentifier.trim().toLowerCase();

    const updated = list.filter((item) => item.toLowerCase() !== cleanId);
    const key = FOLLOWERS_STORAGE_KEY_PREFIX + currentUserId;
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    // Update in Firestore
    try {
      const userDocRef = doc(db, 'users', currentUserId);
      await withTimeout(
        setDoc(
          userDocRef,
          {
            followers: updated,
            followersCount: updated.length,
          },
          { merge: true },
        ),
        3000,
      );
    } catch (err) {
      console.warn('removeFollower firestore update warning:', err);
    }

    return updated;
  } catch (error) {
    console.error('removeFollower error:', error);
    return [];
  }
};

/**
 * Returns full FollowableUser objects for all actual users the current user is following
 */
export const getFollowingUsers = async (
  currentUserId: string,
): Promise<FollowableUser[]> => {
  try {
    const followingIds = await getFollowingList(currentUserId);
    if (followingIds.length === 0) {
      return [];
    }

    const allUsers = await getUsersFromCollection(currentUserId);
    const matchedUsers: FollowableUser[] = [];
    const seen = new Set<string>();

    for (const id of followingIds) {
      const clean = id.toLowerCase();
      if (seen.has(clean) || MOCK_USER_IDENTIFIERS.has(clean)) continue;

      const found = allUsers.find(
        (u) =>
          u.uid.toLowerCase() === clean || u.username.toLowerCase() === clean,
      );

      if (found && !seen.has(found.uid.toLowerCase())) {
        seen.add(found.uid.toLowerCase());
        matchedUsers.push(found);
      } else {
        try {
          const uDocRef = doc(db, 'users', id);
          const uSnap = await withTimeout(getDoc(uDocRef), 2000);
          if (uSnap && uSnap.exists()) {
            const uData = uSnap.data();
            const uName = uData?.username || id;
            if (
              !seen.has(uSnap.id.toLowerCase()) &&
              !MOCK_USER_IDENTIFIERS.has(uName.toLowerCase())
            ) {
              seen.add(uSnap.id.toLowerCase());
              matchedUsers.push({
                uid: uSnap.id,
                username: uName,
                fullName: uData?.fullName || uName,
                avatar: uData?.profilePicUrl || '',
                bio: uData?.bio || '',
                isVerified: Boolean(uData?.isVerified),
              });
            }
          }
        } catch {}
      }
    }

    return matchedUsers;
  } catch (error) {
    console.error('getFollowingUsers error:', error);
    return [];
  }
};

/**
 * Returns full FollowableUser objects for all actual users following the current user
 */
export const getFollowersUsers = async (
  currentUserId: string,
): Promise<FollowableUser[]> => {
  try {
    const followerIds = await getFollowersList(currentUserId);
    const allUsers = await getUsersFromCollection(currentUserId);
    const matchedUsers: FollowableUser[] = [];
    const seen = new Set<string>();

    // 1. From followerIds
    for (const id of followerIds) {
      const clean = id.toLowerCase();
      if (seen.has(clean) || MOCK_USER_IDENTIFIERS.has(clean)) continue;

      const found = allUsers.find(
        (u) =>
          u.uid.toLowerCase() === clean || u.username.toLowerCase() === clean,
      );

      if (found && !seen.has(found.uid.toLowerCase())) {
        seen.add(found.uid.toLowerCase());
        matchedUsers.push(found);
      } else {
        try {
          const uDocRef = doc(db, 'users', id);
          const uSnap = await withTimeout(getDoc(uDocRef), 2000);
          if (uSnap && uSnap.exists()) {
            const uData = uSnap.data();
            const uName = uData?.username || id;
            if (
              !seen.has(uSnap.id.toLowerCase()) &&
              !MOCK_USER_IDENTIFIERS.has(uName.toLowerCase())
            ) {
              seen.add(uSnap.id.toLowerCase());
              matchedUsers.push({
                uid: uSnap.id,
                username: uName,
                fullName: uData?.fullName || uName,
                avatar: uData?.profilePicUrl || '',
                bio: uData?.bio || '',
                isVerified: Boolean(uData?.isVerified),
              });
            }
          }
        } catch {}
      }
    }

    // 2. Also check all users whose following list includes currentUserId
    for (const user of allUsers) {
      if (MOCK_USER_IDENTIFIERS.has(user.username.toLowerCase())) continue;
      if (Array.isArray(user.following)) {
        const followsMe = user.following.some(
          (fId) => fId.toLowerCase() === currentUserId.toLowerCase(),
        );
        if (followsMe && !seen.has(user.uid.toLowerCase())) {
          seen.add(user.uid.toLowerCase());
          matchedUsers.push(user);
        }
      }
    }

    return matchedUsers;
  } catch (error) {
    console.error('getFollowersUsers error:', error);
    return [];
  }
};
