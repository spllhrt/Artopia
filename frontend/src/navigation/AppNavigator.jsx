import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { Image, View, Text, StyleSheet, TouchableOpacity } from "react-native";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ArtworksScreen from "../screens/user/ArtworksScreen";
import CategoriesScreen from "../screens/user/CategoriesScreen";

const Stack = createStackNavigator();

// Top Tabs Navigation
const TopTabs = createMaterialTopTabNavigator();
const TopTabNavigator = () => (
  <TopTabs.Navigator
    screenOptions={{
      tabBarStyle: styles.tabBarStyle,
      tabBarIndicatorStyle: { backgroundColor: "#C4A77D" },
    }}
  >
    <TopTabs.Screen name="Artworks" component={ArtworksScreen} />
    <TopTabs.Screen name="Categories" component={CategoriesScreen} />
  </TopTabs.Navigator>
);

// Bottom Tabs Navigation
const BottomTabs = createBottomTabNavigator();
const BottomTabNavigator = () => {
  const user = useSelector((state) => state.auth.user);
  const avatar = user?.avatar?.url;

  return (
    <BottomTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBarStyle,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === "Profile" && avatar) {
            return (
              <Image
                source={{ uri: avatar }}
                style={{ width: size, height: size, borderRadius: size / 2, borderWidth: focused ? 2 : 0, borderColor: focused ? "#C4A77D" : "transparent" }}
              />
            );
          }

          let iconName;
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Explore") iconName = "search-outline";
          else if (route.name === "Profile") iconName = "person-outline";

          return <Ionicons name={iconName} size={size} color={focused ? "#C4A77D" : color} />;
        },
      })}
    >
      <BottomTabs.Screen name="Home" component={HomeScreen} />
      <BottomTabs.Screen name="Explore" component={TopTabNavigator} />
      <BottomTabs.Screen name="Profile" component={ProfileScreen} />
    </BottomTabs.Navigator>
  );
};

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const user = useSelector((state) => state.auth.user);
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Text style={styles.appName}>Artopia</Text>
        <Text style={styles.drawerUsername}>{user?.name || "Guest"}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

// Drawer Navigation
const Drawer = createDrawerNavigator();
const DrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      drawerStyle: styles.drawerStyle,
      drawerActiveTintColor: "#C4A77D",
      drawerLabelStyle: { fontSize: 16, fontWeight: "bold" },
    }}
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <Drawer.Screen name="Home" component={BottomTabNavigator} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
  </Drawer.Navigator>
);

// Main App Navigation
const AppNavigator = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user?.role === "user" ? (
          <Stack.Screen name="App" component={DrawerNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    fontFamily: "serif",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  drawerHeader: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#C4A77D",
  },
  drawerStyle: {
    backgroundColor: "#F7F7F7",
  },
  drawerUsername: {
    fontSize: 18,
    color: "#2C3E50",
    fontWeight: "600",
  },
  tabBarStyle: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    height: 45,
  },
});

export default AppNavigator;