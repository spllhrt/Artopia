import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { registerUser } from "../api/api"; // Your centralized API function
import { useNavigation } from "@react-navigation/native"; // Import useNavigation hook

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const dispatch = useDispatch();
  const navigation = useNavigation(); // Initialize navigation

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const pickImage = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Gallery access is required to pick an image.");
        return;
      }

      // Launch the image library picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log("ImagePicker result:", result); // Debug log for the full result object

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri; // Access the URI from the assets array
        console.log("Selected image URI:", selectedImageUri); // Log the URI to confirm
        setAvatar(selectedImageUri); // Set the image URI to the state
      } else {
        console.log("Image selection was cancelled.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
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
  
    // Prepare FormData to send image and text fields
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("avatar", {
      uri: avatar,
      type: "image/jpeg",
      name: "avatar.jpg",
    });
  
    console.log("Form data being sent:", {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      avatar,
    });
  
    try {
      const response = await registerUser(data); // Call the API function
      console.log("API Response:", response); // Log the response from the server
      Alert.alert("Success", "Registration successful!");
      navigation.navigate("Login"); // Navigate to Login screen after successful registration
    } catch (error) {
      console.error("Registration error:", error); // Log the error for debugging
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  // Debug avatar state updates
  useEffect(() => {
    console.log("Avatar state updated:", avatar);
  }, [avatar]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(text) => handleInputChange("name", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => handleInputChange("email", text)}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => handleInputChange("password", text)}
        secureTextEntry
      />

      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        <Text style={styles.imagePickerText}>Pick an Avatar</Text>
      </TouchableOpacity>

      {avatar && (
        <Image source={{ uri: avatar }} style={styles.avatarImage} />
      )}

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{" "}
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
    padding: 30,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
  },
  imagePickerButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  imagePickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginVertical: 10,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  registerButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
  link: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
});

export default RegisterScreen;
