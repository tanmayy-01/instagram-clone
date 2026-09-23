import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';
import {
  getStoredUser,
  logoutUser,
  saveKnownUser,
  syncUserProfile,
  withTimeout,
  UserData,
} from '@/services/userService';
import { FONT_SIZES, FONT_STYLES, FONT_WEIGHTS, LIGHT_COLORS, SCREEN_NAMES } from '@/constants';
import * as Navigation from '@/utils';

const Home: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchUserData = async () => {
    try {
      // 1. Get the current user's UID (from Firebase Auth or local storage)
      const currentUid = auth.currentUser?.uid;
      const cached = await getStoredUser();
      const targetUid = currentUid || cached?.uid;

      if (cached) {
        setUserData(cached);
        if (cached.username && cached.email) {
          saveKnownUser({
            username: cached.username,
            email: cached.email,
            uid: cached.uid,
          });
        }
      }

      if (!targetUid) {
        return;
      }

      // 2. Fetch or sync profile safely with Firestore
      try {
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
          saveKnownUser({
            username: profile.username,
            email: profile.email,
            uid: targetUid,
          });
        }
      } catch (firestoreError) {
        console.warn('Home Firestore sync warning:', firestoreError);
      }
    } catch (error) {
      console.error('Error fetching user document:', error);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    setIsLoggingOut(false);
    Navigation.resetAndNavigate(SCREEN_NAMES.LOGIN);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {userData?.username ? (
        <Text style={styles.welcomeText}>Welcome, @{userData.username}</Text>
      ) : (
        <Text style={styles.welcomeText}>Loading profile...</Text>
      )}
      {userData?.email ? (
        <Text style={styles.emailText}>{userData.email}</Text>
      ) : null}

      {/* Log out Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoggingOut}
        activeOpacity={0.8}
      >
        {isLoggingOut ? (
          <ActivityIndicator size="small" color={LIGHT_COLORS.white} />
        ) : (
          <Text style={styles.logoutButtonText}>Log out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.textPrimary,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_STYLES.medium,
    color: LIGHT_COLORS.brandBlue,
    marginBottom: 4,
  },
  emailText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
  },
  logoutButton: {
    marginTop: 28,
    width: '100%',
    maxWidth: 220,
    height: 44,
    backgroundColor: LIGHT_COLORS.brandBlue,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});

export default Home;
