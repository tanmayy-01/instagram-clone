import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ForgotPassword from "@/screens/auth/ForgotPassword";
import { SCREEN_NAMES } from "@/constants";
import Signup from "@/screens/auth/Signup";
import Login from "@/screens/auth/Login";

const Stack = createNativeStackNavigator()

const AuthStack = () => {
  return (
   <Stack.Navigator
      initialRouteName={SCREEN_NAMES.LOGIN}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={SCREEN_NAMES.LOGIN} component={Login} />
      <Stack.Screen name={SCREEN_NAMES.SIGNUP} component={Signup} />
      <Stack.Screen name={SCREEN_NAMES.FORGOT_PASSWORD} component={ForgotPassword} />
    </Stack.Navigator>
  )
}

export default AuthStack