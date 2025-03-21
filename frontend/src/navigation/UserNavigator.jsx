import React, { useState, useEffect } from "react";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { Image, View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import ProfileScreen from "../screens/ProfileScreen";
import HomeScreen from "../screens/user/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ShopScreen from "../screens/user/ShopScreen";
import ArtmatsScreen from "../screens/user/ArtmatsScreen";
import ArtworksScreen from "../screens/user/ArtworksScreen";
import ArtworkDetailScreen from "../screens/user/ArtworkDetailScreen";
import ArtmatDetailScreen from "../screens/user/ArtmatDetailScreen";
import CartScreen from "../screens/user/CartScreen";
import CheckoutScreen from "../screens/user/CheckoutScreen";
import OrderScreen from "../screens/user/OrderScreen";
import OrderDetailsScreen from "../screens/user/OrderDetailsScreen";
// Import the getCartCount function from your cart.js utility
import { getCartCount } from "../utils/cart";
import withAuthCheck from "./withAuthCheck";


const ProtectedOrderScreen = withAuthCheck(OrderScreen);
const ProtectedSettingsScreen = withAuthCheck(SettingsScreen);
const ProtectedProfileScreen = withAuthCheck(ProfileScreen);
const ProtectedCartScreen = withAuthCheck(CartScreen);
// Create Stack Navigator for Shop section
const ShopStack = createStackNavigator();
const ShopStackNavigator = () => {
  return (
    <ShopStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFF",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#EAEAEA",
        },
        headerTintColor: "#C4A77D",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <ShopStack.Screen 
        name="ShopMain" 
        component={ShopScreen} 
        options={{ headerShown: false }}
      />
      <ShopStack.Screen 
        name="ArtmatsScreen" 
        component={ArtmatsScreen} 
        options={{ headerShown: false }}
      />
      <ShopStack.Screen 
        name="ArtworksScreen" 
        component={ArtworksScreen} 
        options={{ headerShown: false }}
      />
      <ShopStack.Screen 
        name="ArtworkDetailScreen" 
        component={ArtworkDetailScreen} 
        options={{ headerShown: false }}
      />
      <ShopStack.Screen 
        name="ArtmatDetailScreen" 
        component={ArtmatDetailScreen} 
        options={{ headerShown: false }}
      />
    </ShopStack.Navigator>
  );
};

// Create Stack Navigator for Cart section
const CartStack = createStackNavigator();
const CartStackNavigator = () => {
  return (
    <CartStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFF",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#EAEAEA",
        },
        headerTintColor: "#C4A77D",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <CartStack.Screen 
        name="CartMain" 
        component={ProtectedCartScreen} // Use the protected CartScreen here
        options={{ title: "Shopping Cart" }}
      />
      <CartStack.Screen 
        name="CheckoutScreen" 
        component={CheckoutScreen} 
        options={{ title: "Checkout" }}
      />
      <CartStack.Screen 
        name="ArtworkDetailScreen" 
        component={ArtworkDetailScreen} 
        options={{ headerShown: false }}
      />
      <CartStack.Screen 
        name="ArtmatDetailScreen" 
        component={ArtmatDetailScreen} 
        options={{ headerShown: false }}
      />
    </CartStack.Navigator>
  );
};

// Bottom Tabs Navigation (without Cart)
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
          else if (route.name === "Shop") iconName = "storefront-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={focused ? "#C4A77D" : color} />;
        },
      })}
    >
      <BottomTabs.Screen name="Home" component={HomeScreen} />
      <BottomTabs.Screen name="Shop" component={ShopStackNavigator} />
      <BottomTabs.Screen name="Profile" component={ProtectedProfileScreen} />
    </BottomTabs.Navigator>
  );
};

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const user = useSelector((state) => state.auth.user);
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerHeaderTop}>
          <Text style={styles.appName}>Artopia</Text>
        </View>
        <Text style={styles.drawerUsername}>{user?.name || "Guest"}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

// Drawer Navigation with SQLite cart count
const Drawer = createDrawerNavigator();
const UserNavigator = () => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const user = useSelector((state) => state.auth.user);
  
  useEffect(() => {
    let isMounted = true; // Track if the component is mounted
  
    const fetchCartCount = async () => {
      try {
        if (user?._id && isMounted) {
          const count = await getCartCount(user._id);
          if (isMounted) {
            setCartItemCount(count);
          }
        }
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    };
  
    fetchCartCount();
  
    const intervalId = setInterval(fetchCartCount, 5000);
  
    return () => {
      isMounted = false; // Mark the component as unmounted
      clearInterval(intervalId); // Clear the interval
    };
  }, [user?._id]);
  
  console.log("Cart Count from SQLite:", cartItemCount);
  
  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        drawerStyle: styles.drawerStyle,
        drawerActiveTintColor: "#C4A77D",
        drawerLabelStyle: { fontSize: 16, fontWeight: "bold" },
        headerTitle: "Artopia", 
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Cart')}
            style={{ marginRight: 15 }}
          >
            <View style={styles.cartIconContainer}>
              <Ionicons name="cart-outline" size={24} color="#C4A77D" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ),
      })}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen 
        name="Shop" 
        component={BottomTabNavigator} 
        options={{ 
          headerTitle: "Artopia"
        }}
      />
      <Drawer.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen} 
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />
      <Drawer.Screen name="Orders" component={ProtectedOrderScreen} />
      <Drawer.Screen name="Settings" component={ProtectedSettingsScreen} />
      <Drawer.Screen 
        name="Cart" 
        component={CartStackNavigator} 
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />
    </Drawer.Navigator>
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
  },
  drawerHeader: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#C4A77D",
  },
  drawerHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  drawerStyle: {
    backgroundColor: "#F7F7F7",
  },
  tabBarStyle: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    height: 45,
  },
  drawerUsername: {
    fontSize: 16,
    color: "#555",
  },
  cartButton: {
    padding: 5,
  },
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#C4A77D',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default UserNavigator;