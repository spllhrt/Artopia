import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import artReducer from './artSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    artworks: artReducer,
  },
});

export default store;
