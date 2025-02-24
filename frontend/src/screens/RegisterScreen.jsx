import React, { useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { TextInput, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { registerUser } from "../api/api";
import { useNavigation } from "@react-navigation/native";

const RegisterScreen = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required to pick an image.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (!avatar) {
      Alert.alert("Error", "Please upload an avatar image");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("avatar", { uri: avatar, type: "image/jpeg", name: "avatar.jpg" });

    setLoading(true);
    try {
      const response = await registerUser(data);
      dispatch(setUser({ user: response.user, token: response.token }));
      Alert.alert("Success", "Registration successful!");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <TextInput
        label="Full Name"
        value={formData.name}
        onChangeText={(text) => handleInputChange("name", text)}
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: "#3b82f6" } }}
      />
      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={(text) => handleInputChange("email", text)}
        keyboardType="email-address"
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: "#3b82f6" } }}
      />
      <TextInput
        label="Password"
        value={formData.password}
        onChangeText={(text) => handleInputChange("password", text)}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: "#3b82f6" } }}
      />

      <Button mode="contained" onPress={pickImage} style={styles.imagePickerButton}>
        Pick an Avatar
      </Button>

      {avatar && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        </View>
      )}

      <Button mode="contained" onPress={handleRegister} loading={loading} style={styles.button}>
        Register
      </Button>

      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Login
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  imagePickerButton: {
    marginBottom: 15,
    backgroundColor: "#2C3E50",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: "#2C3E50",
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
  link: {
    color: "#2C3E50",
    fontWeight: "bold",
  },
});

export default RegisterScreen;
