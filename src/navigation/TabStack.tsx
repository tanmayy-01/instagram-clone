import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from '../screens/main/Home'
import { SCREEN_NAMES } from '../constants'

const Tab = createBottomTabNavigator()

const TabStack = () => {
  return (
    <Tab.Navigator>
        <Tab.Screen 
            name={SCREEN_NAMES.HOME}
            component={Home}
        />
    </Tab.Navigator>
  )
}

export default TabStack