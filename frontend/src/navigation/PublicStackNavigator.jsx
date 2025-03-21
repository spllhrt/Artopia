import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ShopScreen from "../screens/user/ShopScreen";
import ArtmatsScreen from "../screens/user/ArtmatsScreen";
import ArtworksScreen from "../screens/user/ArtworksScreen";
import ArtworkDetailScreen from "../screens/user/ArtworkDetailScreen";
import ArtmatDetailScreen from "../screens/user/ArtmatDetailScreen";

const PublicStack = createStackNavigator();

const PublicStackNavigator = () => {
  return (
    <PublicStack.Navigator screenOptions={{ headerShown: false }}>
      <PublicStack.Screen name="ShopMain" component={ShopScreen} />
      <PublicStack.Screen name="ArtmatsScreen" component={ArtmatsScreen} />
      <PublicStack.Screen name="ArtworksScreen" component={ArtworksScreen} />
      <PublicStack.Screen name="ArtworkDetailScreen" component={ArtworkDetailScreen} />
      <PublicStack.Screen name="ArtmatDetailScreen" component={ArtmatDetailScreen} />
    </PublicStack.Navigator>
  );
};

export default PublicStackNavigator;