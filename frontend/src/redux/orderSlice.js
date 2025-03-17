import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    selectedOrder: null,
    loading: false,
    error: null,
    isCreated: false,
    isUpdated: false,
    isDeleted: false,
    totalAmount: 0
  },
  reducers: {
    // Get all orders
    ordersRequest: (state) => {
      state.loading = true;
    },
    ordersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload.orders;
      state.totalAmount = action.payload.totalAmount || 0;
    },
    ordersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Get single order
    orderDetailsRequest: (state) => {
      state.loading = true;
    },
    orderDetailsSuccess: (state, action) => {
      state.loading = false;
      state.selectedOrder = action.payload;
    },
    orderDetailsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Create new order
    createOrderRequest: (state) => {
      state.loading = true;
    },
    createOrderSuccess: (state, action) => {
      state.loading = false;
      state.isCreated = true;
      state.orders.push(action.payload);
    },
    createOrderFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    createOrderReset: (state) => {
      state.isCreated = false;
      state.error = null;
    },
    
    // Update order
    updateOrderRequest: (state) => {
      state.loading = true;
    },
    updateOrderSuccess: (state, action) => {
      state.loading = false;
      state.isUpdated = true;
      
      // Update the order in orders array
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      
      // Update selected order if it's the one being updated
      if (state.selectedOrder && state.selectedOrder._id === action.payload._id) {
        state.selectedOrder = action.payload;
      }
    },
    updateOrderFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateOrderReset: (state) => {
      state.isUpdated = false;
      state.error = null;
    },
    
    // Delete order
    deleteOrderRequest: (state) => {
      state.loading = true;
    },
    deleteOrderSuccess: (state, action) => {
      state.loading = false;
      state.isDeleted = true;
      state.orders = state.orders.filter(order => order._id !== action.payload);
    },
    deleteOrderFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteOrderReset: (state) => {
      state.isDeleted = false;
      state.error = null;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.error = null;
    }
  }
});

export const {
  ordersRequest,
  ordersSuccess,
  ordersFailure,
  orderDetailsRequest,
  orderDetailsSuccess,
  orderDetailsFailure,
  createOrderRequest,
  createOrderSuccess,
  createOrderFailure,
  createOrderReset,
  updateOrderRequest,
  updateOrderSuccess,
  updateOrderFailure,
  updateOrderReset,
  deleteOrderRequest,
  deleteOrderSuccess,
  deleteOrderFailure,
  deleteOrderReset,
  clearErrors
} = orderSlice.actions;

export default orderSlice.reducer;