import axios from 'axios';
import { getToken } from "../utils/secureStorage";
import Constants from "expo-constants";

// Get API URL from environment with fallback
const API_URL = Constants.expoConfig.extra?.API_URL || "http://localhost:4000/api";

// Create API client with optimized settings
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Auth interceptor error:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with detailed error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Notification cache
let cachedNotifications = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

export const fetchNotifications = async () => {
  const now = Date.now();
  
  // Return cached notifications if available and fresh
  if (cachedNotifications && (now - lastFetchTime < CACHE_TTL)) {
    console.log('📋 Using cached notifications');
    return cachedNotifications;
  }
  
  try {
    // Add timestamp to prevent caching on the server side
    const response = await apiClient.get(`/notifications?_t=${now}`);
    
    // Validate and process response
    if (response.data && response.data.notifications) {
      cachedNotifications = response.data.notifications;
      lastFetchTime = now;
      return cachedNotifications;
    } else {
      console.warn('⚠️ Invalid notification format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Notification fetch error:', error);
    return cachedNotifications || [];
  }
};

export const fetchNotificationById = async (notificationId) => {
  // Validate ID format before sending to API
  if (!notificationId || typeof notificationId !== 'string') {
    console.error('❌ Invalid notification ID:', notificationId);
    return null;
  }
  
  // Check cache first
  if (cachedNotifications) {
    const cachedNotification = cachedNotifications.find(n => n._id === notificationId);
    if (cachedNotification) {
      console.log('📋 Using cached notification for ID:', notificationId);
      return cachedNotification;
    }
  }
  
  try {
    console.log('🔍 Fetching notification with ID:', notificationId);
    const response = await apiClient.get(`/notifications/${notificationId}`);
    
    if (response.data && response.data.notification) {
      console.log('✅ Notification fetched successfully:', response.data.notification._id);
      return response.data.notification;
    } else {
      console.warn('⚠️ Empty or invalid notification response:', response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching notification by ID ${notificationId}:`, 
      error.response?.data?.error || error.message);
    return null;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    
    // Clear the notification from cache if it exists
    if (cachedNotifications) {
      cachedNotifications = cachedNotifications.filter(n => n._id !== notificationId);
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting notification ${notificationId}:`, 
      error.response?.data?.error || error.message);
    throw error;
  }
};

// Save push token for notification reception
export const savePushToken = async (userId, pushToken) => {
  try {
    console.log('💾 Saving push token for user:', userId);
    const response = await apiClient.post('/save-push-token', { userId, pushToken });
    return response.data;
  } catch (error) {
    console.error('❌ Error saving push token:', 
      error.response?.status, error.response?.data?.error || error.message);
    throw error;
  }
};

// Get token status for a user
export const getTokenStatus = async (userId) => {
  try {
    const response = await apiClient.get(`/token-status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error checking token status:', 
      error.response?.status, error.response?.data?.error || error.message);
    throw error;
  }
};

// Function to promote artwork
export const promoteArtwork = async (artworkId) => {
  try {
    const response = await apiClient.post('/promote-artwork', { artworkId });
    return response.data;
  } catch (error) {
    console.error('❌ Error promoting artwork:', 
      error.response?.status || error.message);
    throw error;
  }
};

// Function to promote art materials
export const promoteArtMaterial = async (artmatId) => {
  try {
    const response = await apiClient.post('/promote-artmat', { artmatId });
    return response.data;
  } catch (error) {
    console.error('❌ Error promoting art material:', 
      error.response?.status || error.message);
    throw error;
  }
};

// Function to clean up stale tokens
export const cleanupTokens = async () => {
  try {
    const response = await apiClient.post('/cleanup-tokens');
    return response.data;
  } catch (error) {
    console.error('❌ Error cleaning up tokens:', 
      error.response?.status || error.message);
    throw error;
  }
};

// Pre-fetch notifications function to call on app startup
export const prefetchNotifications = async () => {
  console.log('🔄 Pre-fetching notifications...');
  return fetchNotifications();
};

// Function to send order update notification
export const sendOrderUpdateNotification = async (orderId, status, message) => {
  try {
    console.log('Sending order update with data:', { orderId, status, message });
    const response = await apiClient.post('/notify-order-update', { 
      orderId,
      status,
      message
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error sending order update notification:', 
      error.response?.status || error.message);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};