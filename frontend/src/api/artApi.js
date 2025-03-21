import axios from "axios";
import { getToken } from "../utils/secureStorage";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra?.API_URL || "http://localhost:4000/api"; // Fallback URL

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getArtworks = async () => {
  try {
    const response = await apiClient.get("/artworks");
    return response.data;
  } catch (error) {
    console.error("Error fetching artworks:", error);
    throw error.response?.data || { message: "Failed to fetch artworks" };
  }
};

export const getAdminArtworks = async () => {
  try {
    const response = await apiClient.get("/admin/artworks");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin artworks:", error);
    throw error.response?.data || { message: "Failed to fetch artworks" };
  }
};

export const getSingleArtwork = async (id) => {
  try {
    const response = await apiClient.get(`/artwork/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching artwork ${id}:`, error);
    throw error.response?.data || { message: "Failed to fetch artwork" };
  }
};

export const createArtwork = async (formData) => {
  try {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const response = await apiClient.post("/admin/artwork/new", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating artwork:", error);
    throw error.response?.data || { message: "Failed to create artwork" };
  }
};

export const updateArtwork = async (id, formData) => {
  try {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const response = await apiClient.put(`/admin/artwork/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating artwork ${id}:`, error);
    throw error.response?.data || { message: "Failed to update artwork" };
  }
};

export const deleteArtwork = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/artwork/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting artwork ${id}:`, error);
    throw error.response?.data || { message: "Failed to delete artwork" };
  }
};

export default apiClient;