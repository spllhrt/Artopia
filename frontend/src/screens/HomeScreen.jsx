import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());  // Logout action
    navigation.navigate("Login");  // Navigate to login screen
  };

  const goToProfile = () => {
    navigation.navigate("Profile");  // Navigate to Profile screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>

      <TouchableOpacity style={styles.button} onPress={goToProfile}>
        <Text style={styles.buttonText}>Go to Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",  // Light background color for a modern look
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#333",  // Dark text for better readability
  },
  button: {
    backgroundColor: "#4CAF50",  // Primary green button color
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
    width: "100%",
    maxWidth: 300,  // Restrict max width for consistency
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#f44336",  // Red color for logout to signify caution
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default HomeScreen;
