import React from "react";
import { Platform } from "react-native";
import { Provider } from "react-redux";
import store from "./src/redux/store";
import AppNavigator from "./src/navigation/AppNavigator";
import * as Notifications from "expo-notifications";

// Configure notification handling once at the app root level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Setup Android Notification Channel
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("high-priority", {
    name: "Art Promotions",
    importance: Notifications.AndroidImportance.MAX,
    sound: true,
    lightColor: '#FF231F7C',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    enableLights: true,
    bypassDnd: true, // Bypass Do Not Disturb mode
  });
}

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}