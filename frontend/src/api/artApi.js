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

export const getArtworks = async () => {
  try {
    const response = await apiClient.get("/artworks");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch artworks" };
  }
};

export const getAdminArtworks = async () => {
  try {
    const response = await apiClient.get("/admin/artworks");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch artworks" };
  }
};

export const getSingleArtwork = async (id) => {
  try {
    const response = await apiClient.get(`/artwork/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch artwork" };
  }
};

export const createArtwork = async (formData) => {
  try {
    const response = await apiClient.post("/admin/artwork/new", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create artwork" };
  }
};

export const updateArtwork = async (id, formData) => {
  try {
    const response = await apiClient.put(`/admin/artwork/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update artwork" };
  }
};

export const deleteArtwork = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/artwork/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete artwork" };
  }
};

export default apiClient;
