import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useDispatch } from "react-redux";
import { logoutUser } from "../api/authApi";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const SettingsScreen = () => {
  
const navigation = useNavigation(); // Initialize navigation
const dispatch = useDispatch();
  
const handleLogout = async () => {
  // Show confirmation dialog
  Alert.alert(
    "Confirm Logout",
    "Are you sure you want to logout?",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutUser(navigation, dispatch);
            // Success handling is not needed here since navigation will happen in logoutUser
          } catch (error) {
            // Error handling
            Alert.alert("Logout Failed", error.message || "Failed to log out. Please try again.");
            console.error(error.message);
          }
        }
      }
    ],
    { cancelable: true }
  );
};

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Settings</Text>
      </View>
      
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate("Profile")}>
        <Ionicons name="person-outline" size={20} color="#2C3E50" style={styles.icon} />
        <Text style={styles.itemText}>Go to Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Ionicons name="help-circle-outline" size={20} color="#2C3E50" style={styles.icon} />
        <Text style={styles.itemText}>Help & Support</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Ionicons name="lock-closed-outline" size={20} color="#2C3E50" style={styles.icon} />
        <Text style={styles.itemText}>Privacy Policy</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="red" style={styles.icon} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#F7F7F7",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    backgroundColor: "#FFF",
  },
  itemText: {
    fontSize: 16,
    color: "#555",
  },
  icon: {
    marginRight: 15,
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 30,
  },
  logoutText: {
    fontSize: 16,
    color: "red",
    fontWeight: "bold",
  },
});

export default SettingsScreen;