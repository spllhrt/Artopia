import React from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { View, Text, StyleSheet } from "react-native";

import Dashboard from "../screens/admin/DashboardScreen";
import Artworks from "../screens/admin/ArtworkScreen";
import Materials from "../screens/admin/MaterialScreen";
import Orders from "../screens/admin/OrderScreen";
import Users from "../screens/admin/UsersScreen";
import Profile from "../screens/ProfileScreen";
import Settings from "../screens/SettingsScreen";
import Notif from "../screens/admin/AdminSendNotificationScreen";

// Bottom Tab Navigator
const BottomTabs = createBottomTabNavigator();
const BottomTabNavigator = () => (
  <BottomTabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ color, size }) => {
        let icons = {
          Dashboard: "grid-outline",
          Artworks: "color-palette-outline",
          Materials: "cube-outline",
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}
  >
    <BottomTabs.Screen name="Dashboard" component={Dashboard} />
    <BottomTabs.Screen name="Artworks" component={Artworks} />
    <BottomTabs.Screen name="Materials" component={Materials} />
  </BottomTabs.Navigator>
);

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const user = useSelector((state) => state.auth.user);
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Text style={styles.appName}>Artopia Admin</Text>
        <Text style={styles.drawerUsername}>{user?.name || "Guest"}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};
// Drawer Navigator
const Drawer = createDrawerNavigator();
const AdminNavigator = () => (
    <Drawer.Navigator
    screenOptions={{
        drawerStyle: styles.drawerStyle,
        drawerActiveTintColor: "#C4A77D",
        drawerLabelStyle: { fontSize: 16, fontWeight: "bold" },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
    <Drawer.Screen name="Home" component={BottomTabNavigator} />
    
    <Drawer.Screen name="Promotions" component={Notif} />
    <Drawer.Screen name="Orders" component={Orders} />
    <Drawer.Screen 
        name="Profile" 
        component={Profile} 
        options={{ drawerItemStyle: { display: "none" } }} 
    />
    <Drawer.Screen name="Users" component={Users} />
    <Drawer.Screen name="Settings" component={Settings} />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  appName: { fontSize: 22, fontWeight: "bold", color: "#2C3E50" },
  drawerHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#ddd", backgroundColor: "#F7F7F7" },
  drawer: { backgroundColor: "#FFF" },
  tabBar: { backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#EAEAEA", height: 50 },
});

export default AdminNavigator;
