import axios from "axios";

const API_URL = "http://192.168.1.6:4000/api";


export const registerUser = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; 
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during registration" };
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data; 
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during login" };
  }
};

export const updateUserProfile = async (formData, token) => {
  try {
    const response = await axios.put(`${API_URL}/me/update`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, 
      },
    });
    return response.data; 
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during profile update" };
  }
};

export const updatePassword = async (oldPassword, newPassword, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/password/update`,
      { oldPassword, password: newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; 
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong during password update" };
  }
};

export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });
    return response.data; 
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong fetching user profile" };
  }
};

export const logoutUser = () => {
  try {
    return { message: "Logged out successfully" };
  } catch (error) {
    throw { message: "Something went wrong during logout" };
  }
};
