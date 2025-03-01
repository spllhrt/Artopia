// artApi.js
import axios from "axios";

const API_URL = "http://192.168.55.103:4000/api";

export const getArtworks = async (token) => {
    try {
      if (!token) {
        throw new Error("Unauthorized: Please log in first.");
      }
  
      const response = await axios.get(`${API_URL}/admin/artworks`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Correctly pass token
        },
      });
  
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Something went wrong fetching artworks" };
    }
  };

export const getSingleArtwork = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/artwork/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong fetching artwork" };
  }
};

export const createArtwork = async (formData, token) => {
  try {
    const response = await axios.post(`${API_URL}/admin/artwork/new`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong creating artwork" };
  }
};

export const updateArtwork = async (id, formData, token) => {
  try {
    const response = await axios.put(`${API_URL}/admin/artwork/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong updating artwork" };
  }
};

export const deleteArtwork = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/artwork/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong deleting artwork" };
  }
};
