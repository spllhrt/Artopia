import axios from "axios";

const API_URL = "http://192.168.1.6:4000/api"; // Replace with your actual backend URL

// Register user function (as you already have)
export const registerUser = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // For sending images
      },
    });
    return response.data; // Returns user and token on successful registration
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during registration" };
  }
};

// Login user function
export const loginUser = async ({ email, password }) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data; // The response should contain user and token
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during login" };
  }
};

// Update user profile
export const updateUserProfile = async (formData, token) => {
  try {
    const response = await axios.put(`${API_URL}/me/update`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, // Bearer token for authentication
      },
    });
    return response.data; // Returns updated user data
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during profile update" };
  }
};

// Update user password
export const updatePassword = async (oldPassword, newPassword, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/password/update`,
      { oldPassword, password: newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Bearer token for authentication
        },
      }
    );
    return response.data; // Returns updated password and user data
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during password update" };
  }
};

// Fetch user profile
export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`, // Bearer token for authentication
      },
    });
    return response.data; // Returns user profile data
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong fetching user profile" };
  }
};

// Logout user
export const logoutUser = () => {
  try {
    // You may want to clear the token in your app's state or storage
    // Optionally, make an API request to logout or invalidate the session
    return { message: "Logged out successfully" };
  } catch (error) {
    throw { message: "Something went wrong during logout" };
  }
};
