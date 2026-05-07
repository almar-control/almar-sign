import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from 
"@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import WorkerHomeScreen from "../screens/WorkerHomeScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AdminScreen from "../screens/AdminScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  WorkerHome: undefined;
  History: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#0A0A0A",
          },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="WorkerHome"
          component={WorkerHomeScreen}
        />

        <Stack.Screen
          name="History"
          component={HistoryScreen}
        />

        <Stack.Screen
          name="Admin"
          component={AdminScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
