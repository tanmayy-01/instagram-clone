import React, { useEffect, useState } from 'react';
import AuthStack from './AuthStack';
import Splash from '../screens/splash';

const AppNavigation = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const checkAuthentication = () => {
       setTimeout(() => {
        setIsLoggedIn(true)
       },1000)
    }

    useEffect(() => {
        checkAuthentication()
    },[])

    if(!isLoggedIn) {
        return <Splash />
    }
  return <AuthStack />;
};

export default AppNavigation;
