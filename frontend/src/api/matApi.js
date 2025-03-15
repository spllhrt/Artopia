// matApi.js
import axios from "axios";

const API_URL = "http://192.168.1.5:4000/api";

export const getAdminArtmats = async (token) => {
    try {
      if (!token) {
        throw new Error("Unauthorized: Please log in first.");
      }
  
      const response = await axios.get(`${API_URL}/admin/artmats`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Correctly pass token
        },
      });
  
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Something went wrong fetching artmats" };
    }
  };

export const getSingleArtmat = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/artmat/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong fetching artmat" };
  }
};

export const createArtmat = async (formData, token) => {
  try {
    const response = await axios.post(`${API_URL}/admin/artmat/new`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong creating artmat" };
  }
};

export const updateArtmat = async (id, formData, token) => {
  try {
    const response = await axios.put(`${API_URL}/admin/artmat/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong updating artmat" };
  }
};

export const deleteArtmat = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/artmat/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong deleting artmat" };
  }
};
