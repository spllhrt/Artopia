import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import artReducer from './artSlice';
import matReducer from './matSlice';
import orderReducer from './orderSlice';
import notificationsReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    artworks: artReducer,
    artmats: matReducer,
    orders: orderReducer,
    notifications: notificationsReducer,
  },
});

export default store;
