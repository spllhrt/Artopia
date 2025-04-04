import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { storeToken, getToken, removeToken } from "../utils/secureStorage"; // Import SecureStore functions
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;
const apiClient = axios.create({
  baseURL: API_URL,
});

// apiClient.interceptors.request.use(async (config) => {
//   const token = await getToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  pushToken: null,
};

export const savePushToken = createAsyncThunk(
  "auth/savePushToken",
  async ({ userId, pushToken }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/save-push-token", {
        userId,
        pushToken,
      });

      console.log("Push token saved:", response.data);
      return pushToken; // Return token to update state
    } catch (error) {
      console.log("❌ Error saving push token:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || "Failed to save push token");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.pushToken = action.payload.pushToken;

      // Store token securely
      storeToken(action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.pushToken = null;

      // Remove token from SecureStore
      removeToken();
    },
    updatePushToken: (state, action) => {
      state.pushToken = action.payload;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setTokenFromStorage: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(savePushToken.fulfilled, (state, action) => {
        state.pushToken = action.payload; // Update pushToken in state
      })
      .addCase(savePushToken.rejected, (state, action) => {
        console.log("❌ Failed to save push token:", action.payload);
      });
  },
});

export const { setUser, logout, updateUser, setTokenFromStorage, updatePushToken } = authSlice.actions;
export default authSlice.reducer;
