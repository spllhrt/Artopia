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
export const getArtmats = async () => {
  try {
    const response = await apiClient.get("/artmats");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch art materials" };
  }
};

export const getAdminArtmats = async () => {
  try {
    const response = await apiClient.get("/admin/artmats");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch art materials" };
  }
};

export const getSingleArtmat = async (id) => {
  try {
    const response = await apiClient.get(`/artmat/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch art material" };
  }
};

export const createArtmat = async (formData) => {
  try {
    const response = await apiClient.post("/admin/artmat/new", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create art material" };
  }
};

export const updateArtmat = async (id, formData) => {
  try {
    const response = await apiClient.put(`/admin/artmat/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update art material" };
  }
};

export const deleteArtmat = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/artmat/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete art material" };
  }
};

export default apiClient;
