import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector } from "react-redux";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen"; // Use the combined profile screen
import HomeScreen from "../screens/HomeScreen"; // You can add Home or Dashboard after login

const Stack = createStackNavigator();

const AppNavigator = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          // Authenticated user flow
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          // Unauthenticated user flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
