import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/main/Home';
import { FONT_STYLES, ICON_NAMES, LIGHT_COLORS, SCREEN_NAMES } from '../constants';
import Icon from '@/components/Icon';
import Profile from '@/screens/main/Profile';
import Search from '@/screens/main/Search';
import Chat from '@/screens/main/Chat';
import { auth } from '@/config/firebaseConfig';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { subscribeToTotalUnreadCount } from '@/services/chatService';
import { scale } from '@/lib/scale';

const Tab = createBottomTabNavigator();

const TabStack = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribeUnread: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (unsubscribeUnread) unsubscribeUnread();
        unsubscribeUnread = subscribeToTotalUnreadCount(user.uid, (count) => {
          setUnreadCount(count);
        });
      } else {
        if (unsubscribeUnread) {
          unsubscribeUnread();
          unsubscribeUnread = null;
        }
        setUnreadCount(0);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUnread) unsubscribeUnread();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: LIGHT_COLORS.black,
        tabBarStyle: { 
          height: 60,
          paddingTop: 5
        }
      }}
    >
      <Tab.Screen
        name={SCREEN_NAMES.HOME}
        component={Home}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? ICON_NAMES.HOME : ICON_NAMES.HOME_OUTLINE}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.CHAT}
        component={Chat}
        options={{
          tabBarBadge:
            unreadCount > 0
              ? (unreadCount > 99 ? '99+' : unreadCount)
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: LIGHT_COLORS.error,
            fontSize: scale.ms(10),
            fontFamily: FONT_STYLES.bold,
            color: LIGHT_COLORS.white,
            textAlign:'center',
          },
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? ICON_NAMES.SEND : ICON_NAMES.SEND_OUTLINE}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.SEARCH}
        component={Search}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? ICON_NAMES.SEARCH : ICON_NAMES.SEARCH_OUTLINE}
              size={29}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.PROFILE}
        component={Profile}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? ICON_NAMES.PERSON : ICON_NAMES.PERSON_OUTLINE}
              size={30}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabStack;
