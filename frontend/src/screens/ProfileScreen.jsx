import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { getUserProfile, updateUserProfile, updatePassword } from "../api/api";
import * as ImagePicker from "expo-image-picker";
import { updateUser } from "../redux/authSlice";
import { MaterialIcons } from "@expo/vector-icons";

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await getUserProfile(token);
        dispatch(updateUser(response.user));
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.cancelled) {
      setAvatar(result.uri);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);

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
      const updatedUser = await updateUserProfile(formData, token);
      dispatch(updateUser(updatedUser.user));
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
      await updatePassword(oldPassword, newPassword, token);
      Alert.alert("Success", "Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatar || user?.avatar?.url }} style={styles.avatar} />
          <TouchableOpacity style={styles.avatarEdit} onPress={handleAvatarChange}>
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput value={name} onChangeText={setName} placeholder="Full Name" style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email Address" style={styles.input} />

        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile} disabled={loading}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Change Password</Text>
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
      </View>

      {loading && <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingIndicator} />}
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: "#E3EAF2", 
    flexGrow: 1,
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#2C3E50", 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#BFD7EA", 
  },
  avatarEdit: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "#2C3E50", 
    borderRadius: 15,
    padding: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C3E50",
    fontFamily: "serif",
  },
  email: {
    fontSize: 16,
    color: "#566573",
    fontStyle: "italic",
  },
  formContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D6D6D6", 
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA", 
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2C3E50",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "serif",
  },
  divider: {
    height: 1,
    backgroundColor: "#D6D6D6",
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#2C3E50",
    fontFamily: "serif",
  },
  loadingIndicator: {
    marginTop: 20,
  },
});


export default ProfileScreen;
