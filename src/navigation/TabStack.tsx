import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/main/Home';
import { ICON_NAMES, LIGHT_COLORS, SCREEN_NAMES } from '../constants';
import Icon from '@/components/Icon';
import Profile from '@/screens/main/Profile';
import Search from '@/screens/main/Search';
import Chat from '@/screens/main/Chat';

const Tab = createBottomTabNavigator();

const TabStack = () => {
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
