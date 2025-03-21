import { createSlice } from '@reduxjs/toolkit';

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    userReview: null,
    reviewsByItem: {},  // Object to store reviews by item type and ID
    loading: false,
    error: null,
    isCreated: false,
    isUpdated: false,
    isDeleted: false
  },
  reducers: {
    // Get all reviews for an item
    reviewsRequest: (state) => {
      state.loading = true;
    },
    reviewsSuccess: (state, action) => {
      state.loading = false;
      state.reviews = action.payload;
      
      // Also store by item type and ID for easier lookup
      if (action.payload.itemType && action.payload.itemId) {
        const key = `${action.payload.itemType}-${action.payload.itemId}`;
        state.reviewsByItem[key] = action.payload.reviews;
      }
    },
    reviewsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Get user review for an item
    userReviewRequest: (state) => {
      state.loading = true;
    },
    userReviewSuccess: (state, action) => {
      state.loading = false;
      state.userReview = action.payload;
    },
    userReviewFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Create new review
    createReviewRequest: (state) => {
      state.loading = true;
    },
    createReviewSuccess: (state, action) => {
      state.loading = false;
      state.isCreated = true;
      
      // Add to reviews array
      state.reviews.push(action.payload);
      
      // Set as user review if it matches current user
      if (action.payload.isUserReview) {
        state.userReview = action.payload;
      }
      
      // Update reviewsByItem if we have item info
      if (action.payload.itemType && action.payload.itemId) {
        const key = `${action.payload.itemType}-${action.payload.itemId}`;
        if (state.reviewsByItem[key]) {
          state.reviewsByItem[key] = [...state.reviewsByItem[key], action.payload];
        } else {
          state.reviewsByItem[key] = [action.payload];
        }
      }
    },
    createReviewFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    createReviewReset: (state) => {
      state.isCreated = false;
      state.error = null;
    },
    
    // Update review
    updateReviewRequest: (state) => {
      state.loading = true;
    },
    updateReviewSuccess: (state, action) => {
      state.loading = false;
      state.isUpdated = true;
      
      // Update the review in reviews array
      const index = state.reviews.findIndex(review => review._id === action.payload._id);
      if (index !== -1) {
        state.reviews[index] = action.payload;
      }
      
      // Update user review if it's the one being updated
      if (state.userReview && state.userReview._id === action.payload._id) {
        state.userReview = action.payload;
      }
      
      // Update in reviewsByItem if it exists there
      if (action.payload.itemType && action.payload.itemId) {
        const key = `${action.payload.itemType}-${action.payload.itemId}`;
        if (state.reviewsByItem[key]) {
          state.reviewsByItem[key] = state.reviewsByItem[key].map(review => 
            review._id === action.payload._id ? action.payload : review
          );
        }
      }
    },
    updateReviewFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateReviewReset: (state) => {
      state.isUpdated = false;
      state.error = null;
    },
    
    // Delete review
    deleteReviewRequest: (state) => {
      state.loading = true;
    },
    deleteReviewSuccess: (state, action) => {
      state.loading = false;
      state.isDeleted = true;
      
      // Remove from reviews array
      state.reviews = state.reviews.filter(review => review._id !== action.payload);
      
      // Clear user review if it's the one being deleted
      if (state.userReview && state.userReview._id === action.payload) {
        state.userReview = null;
      }
      
      // Remove from reviewsByItem
      for (const key in state.reviewsByItem) {
        if (state.reviewsByItem[key]) {
          state.reviewsByItem[key] = state.reviewsByItem[key].filter(
            review => review._id !== action.payload
          );
        }
      }
    },
    deleteReviewFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteReviewReset: (state) => {
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
  reviewsRequest,
  reviewsSuccess,
  reviewsFailure,
  userReviewRequest,
  userReviewSuccess,
  userReviewFailure,
  createReviewRequest,
  createReviewSuccess,
  createReviewFailure,
  createReviewReset,
  updateReviewRequest,
  updateReviewSuccess,
  updateReviewFailure,
  updateReviewReset,
  deleteReviewRequest,
  deleteReviewSuccess,
  deleteReviewFailure,
  deleteReviewReset,
  clearErrors
} = reviewSlice.actions;

export default reviewSlice.reducer;