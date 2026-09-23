import React, { useEffect, useState } from 'react';
import AuthStack from './AuthStack';
import Splash from '../screens/splash';
import { auth } from '@/config/firebaseConfig';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { getStoredUser } from '@/services/userService';
import { SCREEN_NAMES } from '@/constants';

const AppNavigation: React.FC = () => {
  const [initializing, setInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const splashTimer = new Promise<void>((resolve) => setTimeout(() => resolve(), 800));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let loggedIn = !!user;

      // Fallback check in AsyncStorage if Firebase auth is rehydrating
      if (!loggedIn) {
        const cachedUser = await getStoredUser();
        loggedIn = !!cachedUser;
      }

      await splashTimer;

      if (isMounted) {
        setIsLoggedIn(loggedIn);
        setInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (initializing) {
    return <Splash />;
  }

  return (
    <AuthStack
      initialRoute={isLoggedIn ? SCREEN_NAMES.HOME : SCREEN_NAMES.LOGIN}
    />
  );
};

export default AppNavigation;
