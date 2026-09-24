import { showToast } from '@/components/toast';
import { auth, db } from '@/config/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from '@react-native-firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  uid: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  following?: string[];
  createdAt?: any;
}

export interface SignUpPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserData;
  error?: string;
}

const USER_SESSION_KEY = 'user_session';
const USERNAME_MAP_PREFIX = 'user_email_';
const KNOWN_USERS_REGISTRY_KEY = 'known_users_registry';

/**
 * Helper to prevent async Firestore promises from hanging the UI thread indefinitely
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs = 3500): Promise<T | null> => {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
};

/**
 * Persists a user in the local device registry for instant username-to-email resolution
 */
export const saveKnownUser = async (user: {
  username: string;
  email: string;
  uid?: string;
}): Promise<void> => {
  try {
    const cleanUsername = user.username.trim().toLowerCase();
    const cleanEmail = user.email.trim().toLowerCase();
    if (!cleanUsername || !cleanEmail) return;

    // 1. Direct key for fast O(1) lookup
    await AsyncStorage.setItem(USERNAME_MAP_PREFIX + cleanUsername, cleanEmail);

    // 2. Persistent registry list
    const raw = await AsyncStorage.getItem(KNOWN_USERS_REGISTRY_KEY);
    let list: Array<{ username: string; email: string; uid?: string }> = raw
      ? JSON.parse(raw)
      : [];

    const existingIndex = list.findIndex(
      (item) => item.username.toLowerCase() === cleanUsername,
    );

    if (existingIndex >= 0) {
      list[existingIndex] = {
        username: cleanUsername,
        email: cleanEmail,
        uid: user.uid || list[existingIndex].uid,
      };
    } else {
      list.push({
        username: cleanUsername,
        email: cleanEmail,
        uid: user.uid,
      });
    }

    await AsyncStorage.setItem(KNOWN_USERS_REGISTRY_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('saveKnownUser warning:', err);
  }
};

/**
 * Attempts to resolve an email from the local device storage
 */
export const resolveEmailFromLocalStorage = async (
  username: string,
): Promise<string | null> => {
  try {
    const cleanUsername = username.trim().toLowerCase();

    // Check direct key
    const directEmail = await AsyncStorage.getItem(
      USERNAME_MAP_PREFIX + cleanUsername,
    );
    if (directEmail && directEmail.includes('@')) {
      console.log('Username resolved via direct AsyncStorage key:', directEmail);
      return directEmail.trim().toLowerCase();
    }

    // Check registry list
    const raw = await AsyncStorage.getItem(KNOWN_USERS_REGISTRY_KEY);
    if (raw) {
      const list: Array<{ username: string; email: string }> = JSON.parse(raw);
      const matched = list.find(
        (item) => item.username.toLowerCase() === cleanUsername,
      );
      if (matched && matched.email?.includes('@')) {
        console.log('Username resolved via registry match:', matched.email);
        return matched.email.trim().toLowerCase();
      }

      // Check if username matches email prefix (e.g. tanmayshende264 in tanmayshende264@gmail.com)
      const prefixMatch = list.find((item) => {
        const emailPrefix = item.email.toLowerCase().split('@')[0];
        return emailPrefix === cleanUsername;
      });
      if (prefixMatch && prefixMatch.email?.includes('@')) {
        console.log('Username resolved via email prefix match in registry:', prefixMatch.email);
        return prefixMatch.email.trim().toLowerCase();
      }
    }

    // Check active stored session
    const session = await getStoredUser();
    if (session) {
      const sessionUser = session.username?.toLowerCase();
      const sessionEmailPrefix = session.email?.toLowerCase().split('@')[0];
      if (sessionUser === cleanUsername || sessionEmailPrefix === cleanUsername) {
        if (session.email?.includes('@')) {
          console.log('Username resolved via stored session:', session.email);
          return session.email.trim().toLowerCase();
        }
      }
    }

    // Scan all keys in AsyncStorage starting with prefix
    const allKeys = await AsyncStorage.getAllKeys();
    const mapKeys = allKeys.filter((k) => k.startsWith(USERNAME_MAP_PREFIX));
    for (const key of mapKeys) {
      const storedName = key.replace(USERNAME_MAP_PREFIX, '').toLowerCase();
      if (storedName === cleanUsername) {
        const val = await AsyncStorage.getItem(key);
        if (val && val.includes('@')) {
          return val.trim().toLowerCase();
        }
      }
    }

    return null;
  } catch (err) {
    console.warn('resolveEmailFromLocalStorage error:', err);
    return null;
  }
};

/**
 * Queries Firestore to resolve email by username
 */
export const resolveEmailFromFirestore = async (
  username: string,
): Promise<string | null> => {
  const cleanUsername = username.trim().toLowerCase();

  // 1. Direct document lookup in 'usernames' collection
  try {
    const unameDocRef = doc(db, 'usernames', cleanUsername);
    const unameSnap = await withTimeout(getDoc(unameDocRef), 3500);
    if (unameSnap && unameSnap.exists()) {
      const data = unameSnap.data() as { email?: string };
      if (data?.email && data.email.includes('@')) {
        console.log('Username resolved via usernames collection doc:', data.email);
        return data.email.trim().toLowerCase();
      }
    }
  } catch (unameErr) {
    console.warn('usernames collection lookup failed:', unameErr);
  }

  // 2. Query 'users' collection where username == cleanUsername
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', cleanUsername));
    const querySnapshot = await withTimeout(getDocs(q), 3500);

    if (querySnapshot && !querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0];
      const data = firstDoc.data() as UserData;
      if (data?.email && data.email.includes('@')) {
        console.log('Username resolved via users collection query:', data.email);
        return data.email.trim().toLowerCase();
      }
    }
  } catch (usersErr) {
    console.warn('users collection username query failed:', usersErr);
  }

  // 3. Query 'users' collection with original casing
  try {
    const usersRef = collection(db, 'users');
    const qOriginal = query(usersRef, where('username', '==', username.trim()));
    const querySnapshot = await withTimeout(getDocs(qOriginal), 3000);

    if (querySnapshot && !querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0];
      const data = firstDoc.data() as UserData;
      if (data?.email && data.email.includes('@')) {
        return data.email.trim().toLowerCase();
      }
    }
  } catch (usersErr) {
    console.warn('users collection original username query failed:', usersErr);
  }

  return null;
};

/**
 * Checks if a specific username is already taken in the Firestore database
 */
export const isUsernameTaken = async (username: string): Promise<boolean> => {
  try {
    const cleanUsername = username.trim().toLowerCase();

    // Check direct doc in usernames collection
    try {
      const unameDocRef = doc(db, 'usernames', cleanUsername);
      const unameSnap = await withTimeout(getDoc(unameDocRef), 2000);
      if (unameSnap && unameSnap.exists()) {
        return true;
      }
    } catch {
      // Continue to query check
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', cleanUsername));
    const querySnapshot = await withTimeout(getDocs(q), 2500);
    return querySnapshot ? !querySnapshot.empty : false;
  } catch (error) {
    console.warn('isUsernameTaken warning (skipping uniqueness check):', error);
    return false;
  }
};

/**
 * Ensures user document exists in Firestore and updates usernames lookup collection
 */
export const syncUserProfile = async (
  uid: string,
  fallbackUsername: string,
  email: string,
): Promise<UserData> => {
  let userData: UserData = {
    uid,
    username: fallbackUsername,
    email,
  };

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await withTimeout(getDoc(userDocRef), 3000);

    if (userDocSnap && userDocSnap.exists()) {
      userData = userDocSnap.data() as UserData;
    } else {
      const newPayload: UserData = {
        uid,
        username: fallbackUsername,
        email,
        bio: '',
        profilePicUrl: '',
        followersCount: 0,
        followingCount: 0,
        createdAt: serverTimestamp(),
      };
      await withTimeout(setDoc(userDocRef, newPayload), 3000);
      userData = newPayload;
    }

    // Also populate dedicated usernames collection for O(1) unauthenticated lookup
    if (userData.username) {
      const unameRef = doc(db, 'usernames', userData.username.toLowerCase());
      await withTimeout(
        setDoc(unameRef, {
          email: userData.email,
          uid,
          createdAt: serverTimestamp(),
        }),
        3000,
      );
    }
  } catch (err) {
    console.warn('syncUserProfile warning:', err);
  }

  return userData;
};

/**
 * Executes the entire Sign-Up sequence:
 * 1. Creates user in Firebase Authentication
 * 2. Saves profile document in Cloud Firestore ('users' & 'usernames' collections)
 * 3. Persists user session and username-to-email mapping in AsyncStorage & registry
 */
export const registerNewUser = async ({
  username,
  email,
  password,
}: SignUpPayload): Promise<boolean> => {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify username uniqueness if reachable
    const taken = await isUsernameTaken(cleanUsername);
    if (taken) {
      showToast('Username is already taken.');
      return false;
    }

    // 2. Create entry in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password,
    );
    const user = userCredential.user;

    // 3. Create profile document inside Firestore with safety timeout
    const userPayload: UserData = {
      uid: user.uid,
      username: cleanUsername,
      email: cleanEmail,
      bio: '',
      profilePicUrl: '',
      followersCount: 0,
      followingCount: 0,
      createdAt: serverTimestamp(),
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await withTimeout(setDoc(userDocRef, userPayload), 3000);
    } catch (firestoreErr) {
      console.warn('Firestore setDoc users warning:', firestoreErr);
    }

    // 4. Create dedicated usernames mapping document for fast lookup
    try {
      const usernameDocRef = doc(db, 'usernames', cleanUsername);
      await withTimeout(
        setDoc(usernameDocRef, {
          email: cleanEmail,
          uid: user.uid,
          createdAt: serverTimestamp(),
        }),
        3000,
      );
    } catch (unameErr) {
      console.warn('Firestore setDoc usernames warning:', unameErr);
    }

    // 5. Save local session and update known registry in AsyncStorage
    try {
      await AsyncStorage.setItem(
        USER_SESSION_KEY,
        JSON.stringify(userPayload),
      );
      await saveKnownUser({
        username: cleanUsername,
        email: cleanEmail,
        uid: user.uid,
      });
    } catch (storageErr) {
      console.warn('AsyncStorage cache warning:', storageErr);
    }

    showToast('Account created successfully!');
    return true;
  } catch (error: any) {
    console.error('Registration Failure:', error);

    const errorCode = String(error?.code || '').toLowerCase();
    const errorMessage = String(error?.message || '').toLowerCase();

    if (
      errorCode.includes('email-already-in-use') ||
      errorMessage.includes('email-already-in-use')
    ) {
      showToast('Email is already registered.');
    } else if (
      errorCode.includes('weak-password') ||
      errorMessage.includes('weak-password')
    ) {
      showToast('Password should be at least 6 characters.');
    } else if (
      errorCode.includes('invalid-email') ||
      errorMessage.includes('invalid-email')
    ) {
      showToast('Please enter a valid email address.');
    } else if (
      errorCode.includes('network-request-failed') ||
      errorMessage.includes('network')
    ) {
      showToast('Network error. Check your connection.');
    } else {
      showToast('Registration failed. Please try again.');
    }
    return false;
  }
};

/**
 * Performs Login action:
 * Accepts email or username.
 * If username is given:
 *  1. Checks local cache (AsyncStorage direct keys & known registry)
 *  2. If not found locally, queries Firestore 'usernames' doc & 'users' collection
 *  3. Fallback: tries smart authentication with ${identifier}@gmail.com if lookups fail
 *  4. Calls signInWithEmailAndPassword with the resolved email
 */
export const loginUser = async (
  identifier: string,
  password: string,
): Promise<AuthResult> => {
  try {
    const cleanIdentifier = identifier.trim();
    let targetEmail = cleanIdentifier.toLowerCase();
    let resolvedUsername = '';

    // If identifier is not an email (does not contain @), look up email by username
    if (!cleanIdentifier.includes('@')) {
      const lowerUsername = cleanIdentifier.toLowerCase();
      resolvedUsername = cleanIdentifier;

      // Step 1: Check local cache for mapped email
      const localEmail = await resolveEmailFromLocalStorage(lowerUsername);
      if (localEmail) {
        targetEmail = localEmail;
        console.log('Username resolved via local storage:', targetEmail);
      }

      // Step 2: If still not resolved, query Cloud Firestore
      if (!targetEmail.includes('@')) {
        const firestoreEmail = await resolveEmailFromFirestore(lowerUsername);
        if (firestoreEmail) {
          targetEmail = firestoreEmail;
          console.log('Username resolved via Firestore:', targetEmail);
          await saveKnownUser({
            username: lowerUsername,
            email: targetEmail,
          });
        }
      }

      // Step 3: Smart fallback - if username couldn't be resolved via local or Firestore
      // (e.g. Firestore rules are locked or collection is empty), try email prefix match with @gmail.com
      if (!targetEmail.includes('@')) {
        const candidateEmail = `${cleanIdentifier}@gmail.com`.toLowerCase();
        console.log('Trying smart fallback authentication:', candidateEmail);
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            candidateEmail,
            password,
          );
          const user = userCredential.user;
          targetEmail = candidateEmail;
          resolvedUsername = cleanIdentifier;

          // Auto-sync profile to Firestore & local cache now that user is authenticated
          const syncedUser = await syncUserProfile(
            user.uid,
            resolvedUsername,
            targetEmail,
          );

          await AsyncStorage.setItem(
            USER_SESSION_KEY,
            JSON.stringify(syncedUser),
          );
          await saveKnownUser({
            username: resolvedUsername,
            email: targetEmail,
            uid: user.uid,
          });

          showToast('Logged in successfully!');
          return { success: true, user: syncedUser };
        } catch (fallbackErr) {
          console.log('Fallback email check did not match:', fallbackErr);
          showToast('No account found with this username. Try your email.');
          return { success: false, error: 'User not found' };
        }
      }
    }

    // Authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      targetEmail,
      password,
    );
    const user = userCredential.user;

    const finalUsername =
      resolvedUsername ||
      (cleanIdentifier.includes('@')
        ? cleanIdentifier.split('@')[0]
        : cleanIdentifier);

    // Sync user details to Firestore & cache
    const userData = await syncUserProfile(
      user.uid,
      finalUsername,
      user.email || targetEmail,
    );

    // Persist session locally and update known users registry
    try {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
      await saveKnownUser({
        username: userData.username,
        email: userData.email,
        uid: user.uid,
      });
    } catch (storageErr) {
      console.warn('AsyncStorage cache warning:', storageErr);
    }

    showToast('Logged in successfully!');
    return { success: true, user: userData };
  } catch (error: any) {
    // console.error('Login Failure:', error);

    const errorCode = String(error?.code || '').toLowerCase();
    const errorMessage = String(error?.message || '').toLowerCase();

    const isWrongCredential =
      errorCode.includes('invalid-credential') ||
      errorCode.includes('wrong-password') ||
      errorCode.includes('user-not-found') ||
      errorMessage.includes('invalid-credential') ||
      errorMessage.includes('wrong-password') ||
      errorMessage.includes('user-not-found') ||
      errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('credential');

    if (isWrongCredential) {
      showToast('Incorrect username/email or password.');
    } else if (
      errorCode.includes('invalid-email') ||
      errorMessage.includes('invalid-email')
    ) {
      showToast('Please enter a valid email address.');
    } else if (
      errorCode.includes('user-disabled') ||
      errorMessage.includes('user-disabled')
    ) {
      showToast('This user account has been disabled.');
    } else if (
      errorCode.includes('too-many-requests') ||
      errorMessage.includes('too-many-requests')
    ) {
      showToast('Too many attempts. Please try again later.');
    } else if (
      errorCode.includes('network-request-failed') ||
      errorMessage.includes('network')
    ) {
      showToast('Network error. Check your connection.');
    } else {
      showToast('Incorrect username/email or password.');
    }

    return { success: false, error: error?.message };
  }
};

/**
 * Sends a password reset link to the user's email.
 * If user enters a username instead of email, it resolves it to their email first.
 */
export const sendPasswordReset = async (
  emailOrUsername: string,
): Promise<{ success: boolean; email?: string; error?: string }> => {
  try {
    const cleanInput = emailOrUsername.trim();
    if (!cleanInput) {
      showToast('Please enter your email or username.');
      return { success: false, error: 'Empty input' };
    }

    let targetEmail = cleanInput.toLowerCase();

    // If identifier is not an email, resolve its email from local storage or Firestore
    if (!cleanInput.includes('@')) {
      const lowerUsername = cleanInput.toLowerCase();

      // Check local storage / registry
      const localEmail = await resolveEmailFromLocalStorage(lowerUsername);
      if (localEmail) {
        targetEmail = localEmail;
      } else {
        // Check Cloud Firestore
        const firestoreEmail = await resolveEmailFromFirestore(lowerUsername);
        if (firestoreEmail) {
          targetEmail = firestoreEmail;
        } else {
          // Smart fallback: try common domain
          targetEmail = `${cleanInput}@gmail.com`.toLowerCase();
        }
      }
    }

    // Call Firebase Auth to send password reset email link
    await sendPasswordResetEmail(auth, targetEmail);

    showToast(`Password reset link sent to ${targetEmail}`);
    return { success: true, email: targetEmail };
  } catch (error: any) {
    console.error('sendPasswordReset error:', error);

    const errorCode = String(error?.code || '').toLowerCase();
    const errorMessage = String(error?.message || '').toLowerCase();

    if (
      errorCode.includes('user-not-found') ||
      errorMessage.includes('user-not-found')
    ) {
      showToast('No account found with this email.');
    } else if (
      errorCode.includes('invalid-email') ||
      errorMessage.includes('invalid-email')
    ) {
      showToast('Please enter a valid email address.');
    } else if (
      errorCode.includes('too-many-requests') ||
      errorMessage.includes('too-many-requests')
    ) {
      showToast('Too many attempts. Please try again later.');
    } else if (
      errorCode.includes('network-request-failed') ||
      errorMessage.includes('network')
    ) {
      showToast('Network error. Check your connection.');
    } else {
      showToast('Failed to send reset link. Please try again.');
    }

    return { success: false, error: error?.message };
  }
};

/**
 * Retrieves the currently cached user session from AsyncStorage
 */
export const getStoredUser = async (): Promise<UserData | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Logs out the current user from Firebase and clears session
 * (preserves known users registry for seamless future username logins)
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    showToast('Logged out');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * Updates user profile fields in Firestore and local storage
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserData>,
): Promise<UserData | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await withTimeout(setDoc(userDocRef, updates, { merge: true }), 3500);

    const currentCached = await getStoredUser();
    const updated: UserData = {
      ...(currentCached || { uid, username: '', email: '' }),
      ...updates,
    };

    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
    if (updated.username && updated.email) {
      await saveKnownUser({
        username: updated.username,
        email: updated.email,
        uid: updated.uid,
      });
    }

    showToast('Profile updated');
    return updated;
  } catch (error) {
    console.error('updateUserProfile error:', error);
    showToast('Failed to update profile');
    return null;
  }
};
