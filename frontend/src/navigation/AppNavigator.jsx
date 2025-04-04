import React, { useRef, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import UserNavigator from "./UserNavigator";
import AdminNavigator from "./AdminNavigator";
import NotificationHandler from "../components/NotificationHandler";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigationRef = useRef(null);

  // Set up global navigation function
  React.useEffect(() => {
    global.navigate = (name, params) => {
      if (navigationRef.current) {
        // Add safety check for nested navigation
        if (navigationRef.current.isReady()) {
          navigationRef.current.navigate(name, params);
        } else {
          // Queue navigation for when navigation is ready
          setTimeout(() => {
            if (navigationRef.current?.isReady()) {
              navigationRef.current.navigate(name, params);
            }
          }, 100);
        }
      }
    };
    
    return () => {
      global.navigate = null;
    };
  }, []);

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        console.log("🔹 Navigation container is ready");
      }}
    >
      {/* NotificationHandler positioned here to access navigation context */}
      <NotificationHandler />
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          user?.role === "admin" ? (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          ) : (
            <Stack.Screen name="User" component={UserNavigator} />
          )
        ) : (
          <>
            <Stack.Screen name="User" component={UserNavigator} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;