import axios from "axios";
import { getToken } from "../utils/secureStorage";
import {
  ordersRequest,
  ordersSuccess,
  ordersFailure,
  orderDetailsRequest,
  orderDetailsSuccess,
  orderDetailsFailure,
  createOrderRequest,
  createOrderSuccess,
  createOrderFailure,
  updateOrderRequest,
  updateOrderSuccess,
  updateOrderFailure,
  deleteOrderRequest,
  deleteOrderSuccess,
  deleteOrderFailure,
  clearErrors
} from '../redux/orderSlice';

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

// Create new order
export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch(createOrderRequest());
    
    const { data } = await apiClient.post('/order/new', orderData);
    
    dispatch(createOrderSuccess(data.order));
    return data.order;
  } catch (error) {
    console.error("Create order error:", error.response || error);
    const errorMessage = error.response?.data?.message || 'Order creation failed';
    dispatch(createOrderFailure(errorMessage));
    throw error;
  }
};

// Create order from cart
export const createOrderFromCart = (orderData) => async (dispatch) => {
  try {
    dispatch(createOrderRequest());
    
    const { data } = await apiClient.post('/order/from-cart', orderData);
    
    dispatch(createOrderSuccess(data.order));
    return data.order;
  } catch (error) {
    console.error("Create order from cart error:", error.response || error);
    const errorMessage = error.response?.data?.message || 'Order creation failed';
    dispatch(createOrderFailure(errorMessage));
    throw error;
  }
};

// Get currently logged in user orders
export const getMyOrders = () => async (dispatch) => {
  try {
    dispatch(ordersRequest());
    
    const { data } = await apiClient.get('/orders/me');
    
    dispatch(ordersSuccess({
      orders: data.orders,
      totalAmount: data.totalAmount || 0
    }));
    return data.orders;
  } catch (error) {
    console.error("Get my orders error:", error.response || error);
    const errorMessage = error.response?.data?.message || 'Failed to fetch your orders';
    dispatch(ordersFailure(errorMessage));
    throw error;
  }
};

// Get order details
export const getOrderDetails = (id) => async (dispatch) => {
  try {
    dispatch(orderDetailsRequest());
    
    const { data } = await apiClient.get(`/order/${id}`);
    
    dispatch(orderDetailsSuccess(data.order));
    return data.order;
  } catch (error) {
    console.error("Get order details error:", error.response || error);
    const errorMessage = error.response?.data?.message || 'Failed to fetch order details';
    dispatch(orderDetailsFailure(errorMessage));
    throw error;
  }
};
// Get all orders (admin)
export const getAllOrders = () => async (dispatch) => {
  try {
    dispatch(ordersRequest());
    
    const { data } = await apiClient.get('/admin/orders');
    
    dispatch(ordersSuccess({
      orders: data.orders || [],
      totalAmount: data.totalAmount || 0
    }));
    return data;
  } catch (error) {
    // Handle "No orders found" as a success case with empty array
    if (error.response?.status === 404 && error.response?.data?.message === "No orders found") {
      dispatch(ordersSuccess({
        orders: [],
        totalAmount: 0
      }));
      return { orders: [], totalAmount: 0 };
    }
    
    console.error("Get all orders error:", error.response || error);
    const errorMessage = error.response?.data?.message || 'Failed to fetch orders';
    dispatch(ordersFailure(errorMessage));
    throw error;
  }
};

// Update order (can be used by both user for cancellation and admin for status changes)
export const updateOrder = (id, orderData) => async (dispatch) => {
  try {
    dispatch(updateOrderRequest());
    
    // Use different endpoints for user vs admin updates
    let endpoint;
    
    // If we're updating as admin, use admin endpoint
    if (orderData && orderData.isAdmin) {
      endpoint = `/admin/order/${id}`; // Match the route defined in your Express router
      delete orderData.isAdmin; // Remove the flag before sending
    } else {
      endpoint = `/order/${id}/status`;
    }
    
    const { data } = await apiClient.put(endpoint, orderData);
    
    // After success, get the updated order details
    const { data: updatedOrderData } = await apiClient.get(`/order/${id}`);
    
    dispatch(updateOrderSuccess(updatedOrderData.order));
    return updatedOrderData.order;
  } catch (error) {
    console.error("Update order error:", error.response || error);
    const errorMessage = error.response?.data?.message || 'Order update failed';
    dispatch(updateOrderFailure(errorMessage));
    throw error;
  }
};

// Delete order (admin only)
export const deleteOrder = (id) => async (dispatch) => {
  try {
    dispatch(deleteOrderRequest());
    
    await apiClient.delete(`/admin/order/${id}`);
    
    dispatch(deleteOrderSuccess(id));
    return id;
  } catch (error) {
    console.error("Delete order error:", error.response || error);
    const errorMessage = error.response?.data?.message || 'Order deletion failed';
    dispatch(deleteOrderFailure(errorMessage));
    throw error;
  }
};

// Clear all errors
export const clearOrderErrors = () => (dispatch) => {
  dispatch(clearErrors());
};