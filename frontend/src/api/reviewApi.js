import axios from "axios";
import { getToken } from "../utils/secureStorage";
import Constants from "expo-constants";
import {
  reviewsRequest,
  reviewsSuccess,
  reviewsFailure,
  userReviewRequest,
  userReviewSuccess,
  userReviewFailure,
  createReviewRequest,
  createReviewSuccess,
  createReviewFailure,
  updateReviewRequest,
  updateReviewSuccess,
  updateReviewFailure,
  deleteReviewRequest,
  deleteReviewSuccess,
  deleteReviewFailure
} from "../redux/reviewSlice";

const API_URL = Constants.expoConfig.extra.API_URL;
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

// Thunks for Redux
export const fetchReviewsByItem = (itemType, itemId) => async (dispatch) => {
  // Redux action creator function remains the same
  // ...
};

// Direct API functions (not Redux thunks)
export const createReview = async (itemType, itemId, reviewData) => {
  try {
    // Check if itemType is valid
    if (itemType !== 'artwork' && itemType !== 'artmat') {
      throw new Error("Invalid item type. Must be 'artwork' or 'artmat'");
    }
    
    const url = `/${itemType}/review/${itemId}`;
    
    const response = await apiClient.put(url, reviewData);
    return response.data;
  } catch (error) {
    console.log(`Error creating review for ${itemType} ${itemId}:`, error);
    throw error;
  }
};

export const updateReview = async (itemType, itemId, reviewId, reviewData) => {
  try {
    // Use the create endpoint since that's what your API is using
    const url = `/${itemType}/review/${itemId}`;
    
    const response = await apiClient.put(url, reviewData);
    return response.data;
  } catch (error) {
    console.log(`Error updating review for ${itemType} ${itemId}:`, error);
    throw error;
  }
};


export const deleteReview = async (itemType, itemId, reviewId) => {
  try {
    // Customize the URL based on the itemType
    // For artmat, include the itemType and itemId in the URL
    // For artwork, keep the existing endpoint structure
    const url = itemType === 'artmat' 
      ? `/artmat/review/${itemId}/${reviewId}` 
      : `/review/${reviewId}`;
    
    await apiClient.delete(url);
    return { success: true };
  } catch (error) {
    console.log(`Error deleting review ${reviewId}:`, error);
    throw error;
  }
};
// Keep the existing implementation for these functions
export const getReviewsByItem = async (itemType, itemId, userId = null) => {
  // Implementation remains the same
  try {
    // Check if itemType is valid
    if (itemType !== 'artwork' && itemType !== 'artmat') {
      throw new Error("Invalid item type. Must be 'artwork' or 'artmat'");
    }
    
    const url = `/${itemType === 'artwork' ? 'artwork' : 'artmat'}/reviews/${itemId}`;
    
    try {
      const response = await apiClient.get(url);
      return response.data.reviews || [];
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`Reviews not found for ${itemType} ID: ${itemId}`);
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.log(`Error fetching reviews for ${itemType} ${itemId}:`, error);
    return [];
  }
};

export const getUserReviewForItem = async (itemType, itemId, userId) => {
  // Implementation remains the same
  try {
    const response = await fetch(`${API_URL}/reviews/${itemType}/${itemId}/user/${userId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user review');
    }
    
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching user review:', error);
    throw error;
  }
};

// Redux-wrapped versions for components that need to use dispatch
export const createReviewWithRedux = (itemType, itemId, reviewData) => async (dispatch) => {
  try {
    dispatch(createReviewRequest());
    const response = await createReview(itemType, itemId, reviewData);
    dispatch(createReviewSuccess({
      ...response,
      itemType,
      itemId,
      isUserReview: true
    }));
    return response;
  } catch (error) {
    dispatch(createReviewFailure(error.message || `Failed to create ${itemType} review`));
    throw error;
  }
};

export const updateReviewWithRedux = (itemType, itemId, reviewId, reviewData) => async (dispatch) => {
  try {
    dispatch(updateReviewRequest());
    const response = await updateReview(itemType, itemId, reviewData);
    dispatch(updateReviewSuccess({
      ...response,
      itemType,
      itemId
    }));
    return response;
  } catch (error) {
    dispatch(updateReviewFailure(error.message || `Failed to update ${itemType} review`));
    throw error;
  }
};

export const deleteReviewWithRedux = (itemType, itemId, reviewId) => async (dispatch) => {
  try {
    dispatch(deleteReviewRequest());
    await deleteReview(itemType, itemId, reviewId);
    dispatch(deleteReviewSuccess(reviewId));
    return { success: true };
  } catch (error) {
    dispatch(deleteReviewFailure(error.message || "Failed to delete review"));
    throw error;
  }
};

export default apiClient;