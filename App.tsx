import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigation from './src/navigation/AppNavigation';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from '@/utils';

const App = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <StatusBar barStyle="auto" />
        <NavigationContainer ref={navigationRef}>
          <AppNavigation />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
