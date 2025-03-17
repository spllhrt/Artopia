import axios from "axios";
import { storeToken, getToken, removeToken } from "../utils/secureStorage";

const API_URL = "http://192.168.1.5:4000/api"; 

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async (formData) => {
  try {
    const response = await apiClient.post("/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const response = await apiClient.post("/login", { email, password });

    if (response.data.token) {
      await storeToken(response.data.token); 
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const getUserProfile = async () => {
  try {
    const response = await apiClient.get("/me");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch profile" };
  }
};

export const updateUserProfile = async (data) => {
  try {
    // Check if data is FormData or regular object
    const isFormData = data instanceof FormData;
    
    const headers = isFormData 
      ? { "Content-Type": "multipart/form-data" }
      : { "Content-Type": "application/json" };
    
    const response = await apiClient.put("/me/update", data, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Profile update failed" };
  }
};
export const updatePassword = async (oldPassword, newPassword) => {
  try {
    const response = await apiClient.put("/password/update", {
      oldPassword,
      password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password update failed" };
  }
};

export const logoutUser = async () => {
  try {
    await removeToken(); 
    return { message: "Logged out successfully" };
  } catch (error) {
    throw { message: "Logout failed" };
  }
};

export default apiClient;
