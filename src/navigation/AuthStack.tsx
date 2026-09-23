import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ForgotPassword from '@/screens/auth/ForgotPassword';
import { SCREEN_NAMES } from '@/constants';
import Signup from '@/screens/auth/Signup';
import Login from '@/screens/auth/Login';
import TabStack from './TabStack';

const Stack = createNativeStackNavigator();

interface AuthStackProps {
  initialRoute?: typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];
}

const AuthStack: React.FC<AuthStackProps> = ({
  initialRoute = SCREEN_NAMES.LOGIN,
}) => {
  return (
    <Stack.Navigator
      key={initialRoute}
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={SCREEN_NAMES.LOGIN} component={Login} />
      <Stack.Screen name={SCREEN_NAMES.SIGNUP} component={Signup} />
      <Stack.Screen
        name={SCREEN_NAMES.FORGOT_PASSWORD}
        component={ForgotPassword}
      />
      <Stack.Screen name={SCREEN_NAMES.HOME} component={TabStack} />
    </Stack.Navigator>
  );
};

export default AuthStack;