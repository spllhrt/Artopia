import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Image, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { getUserProfile, updateUserProfile, updatePassword } from "../api/api"; // Import the API functions
import * as ImagePicker from 'expo-image-picker'; // For picking images

const ProfileScreen = () => {
  const { token } = useSelector((state) => state.auth);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await getUserProfile(token); // Fetch user profile data
        setUser(response.user);
        setName(response.user.name);
        setEmail(response.user.email);
        // console.log("User profile fetched:", response.user); // Log the fetched user
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.cancelled) {
      setAvatar(result.uri);
      // console.log("Selected avatar:", result.uri); // Log the avatar URI when selected
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    
    // Log avatar before appending it to FormData
    // console.log("Avatar before submitting:", avatar);
    
    if (avatar) {
      const avatarUri = avatar;
      const fileType = avatarUri.split(".").pop();
      formData.append("avatar", {
        uri: avatarUri,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    try {
      const updatedUser = await updateUserProfile(formData, token); // Use updateUserProfile API
      setUser(updatedUser.user); // Update the local state with the new user data
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      const response = await updatePassword(oldPassword, newPassword, token); // Use updatePassword API
      Alert.alert("Success", "Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingIndicator} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      
      {/* Conditionally render the avatar if available */}
      {user?.avatar?.url && <Image source={{ uri: user.avatar.url }} style={styles.avatar} />}

      
      {/* Avatar picker section */}
      <TouchableOpacity style={styles.avatarButton} onPress={handleAvatarChange}>
        <Text style={styles.avatarButtonText}>Change Avatar</Text>
      </TouchableOpacity>
      
      {/* Avatar Preview */}
      {avatar && <Image source={{ uri: avatar }} style={styles.avatar} />}
      
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Full Name"
        style={styles.input}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email Address"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdateProfile} disabled={loading}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
      
      <TextInput
        value={oldPassword}
        onChangeText={setOldPassword}
        placeholder="Old Password"
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New Password"
        secureTextEntry
        style={styles.input}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f4f7fc",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 40,
    textAlign: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    marginVertical: 20,
    borderRadius: 60, // For rounded avatar
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  avatarButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
    marginBottom: 20,
  },
  avatarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dcdfe1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "center",
    marginVertical: 10,
    width: "80%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  loadingIndicator: {
    marginTop: 20,
  },
});

export default ProfileScreen;
