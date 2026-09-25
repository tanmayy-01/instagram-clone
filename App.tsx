import React, { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigation from './src/navigation/AppNavigation';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from '@/utils';
import { GlobalToastContainer } from '@/components/toast';
import { auth } from '@/config/firebaseConfig';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import {
  requestNotificationPermission,
  getAndSaveFCMToken,
  initForegroundNotificationService,
  subscribeToIncomingMessages,
} from '@/services/notificationService';
import { SCREEN_NAMES } from '@/constants';

const App = () => {
  useEffect(() => {
    // 1. Request notification permissions and register FCM token
    requestNotificationPermission().then((granted) => {
      if (granted) {
        getAndSaveFCMToken();
      }
    });

    // 2. Initialize Foreground FCM service and notification tap handler
    const unsubscribeForeground = initForegroundNotificationService(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(SCREEN_NAMES.CHAT as never);
      }
    });

    // 3. Listen to auth state to save token for logged-in user and listen to real-time incoming messages
    let unsubscribeIncoming: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        getAndSaveFCMToken(user.uid);
        if (unsubscribeIncoming) unsubscribeIncoming();
        unsubscribeIncoming = subscribeToIncomingMessages(user.uid);
      } else {
        if (unsubscribeIncoming) {
          unsubscribeIncoming();
          unsubscribeIncoming = null;
        }
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeAuth();
      if (unsubscribeIncoming) unsubscribeIncoming();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <StatusBar barStyle="light-content" />
        <NavigationContainer ref={navigationRef}>
          <AppNavigation />
        </NavigationContainer>
      </SafeAreaView>
      <GlobalToastContainer />
    </SafeAreaProvider>
  );
};

export default App;
