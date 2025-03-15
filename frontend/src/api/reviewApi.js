// artApi.js
import axios from "axios";

const API_URL = "http://192.168.1.5:4000/api";

export const getArtworkReviews = async (artworkId,token) => {
    try {
      if (!token) {
        throw new Error("Unauthorized: Please log in first.");
      }
  
      const response = await axios.get(`${API_URL}/reviews/${artworkId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Correctly pass token
        },
      });
  
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Something went wrong fetching reviews" };
    }
  };
  
  
  export const deleteReview = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/review/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong deleting review" };
  }
  };
  