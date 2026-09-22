import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/auth/Login";
import Signup from "../screens/auth/Signup";
import { SCREEN_NAMES } from "../constants";

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
    </Stack.Navigator>
  )
}

export default AuthStack