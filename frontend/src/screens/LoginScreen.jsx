import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { loginUser } from "../api/api";
import { useNavigation } from "@react-navigation/native";

const LoginScreen = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      const response = await loginUser(formData);
      dispatch(setUser({ user: response.user, token: response.token }));
      navigation.navigate("Home");  // Navigate to Home screen upon successful login
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Please log in to your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => handleInputChange("email", text)}
        keyboardType="email-address"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => handleInputChange("password", text)}
        secureTextEntry
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
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
  button: {
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

export default LoginScreen;
