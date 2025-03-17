import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import artReducer from './artSlice';
import matReducer from './matSlice';
import orderReducer from './orderSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    artworks: artReducer,
    artmats: matReducer,
    orders: orderReducer,
  },
});

export default store;
