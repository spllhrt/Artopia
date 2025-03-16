import axios from "axios";
import { getToken } from "../utils/secureStorage";

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

// Generic function to get reviews for any type of item
export const getReviews = async (itemType, itemId) => {
  try {
    // Check if itemType is valid
    if (itemType !== 'artwork' && itemType !== 'artmat') {
      throw new Error("Invalid item type. Must be 'artwork' or 'artmat'");
    }
    
    const response = await apiClient.get(`/reviews/${itemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: `Failed to fetch ${itemType} reviews` };
  }
};

// For backward compatibility - specific functions for each type
export const getArtworkReviews = async (artworkId) => {
  return getReviews('artwork', artworkId);
};

export const getArtmatReviews = async (artmatId) => {
  return getReviews('artmat', artmatId);
};

// Create a review for either artwork or artmat
export const createReview = async (itemType, itemId, reviewData) => {
  try {
    // Check if itemType is valid
    if (itemType !== 'artwork' && itemType !== 'artmat') {
      throw new Error("Invalid item type. Must be 'artwork' or 'artmat'");
    }
    
    const response = await apiClient.put(`/review/${itemId}`, reviewData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: `Failed to create ${itemType} review` };
  }
};

// Delete a review
export const deleteReview = async (reviewId) => {
  try {
    const response = await apiClient.delete(`/review/${reviewId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete review" };
  }
};

export default apiClient;