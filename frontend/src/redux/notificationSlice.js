// redux/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchNotifications, 
  fetchNotificationById,
  promoteArtwork,
  promoteArtMaterial,
  promoteEvent,
  cleanupTokens
} from '../api/notificationApi';

// Get all notifications
export const getNotifications = createAsyncThunk(
  'notifications/getNotifications',
  async (userRole, { rejectWithValue }) => {
    try {
      const response = await fetchNotifications(userRole);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Get a single notification by ID
export const getNotificationById = createAsyncThunk(
  'notifications/getNotificationById',
  async ({ notificationId, userRole }, { rejectWithValue }) => {
    try {
      const response = await fetchNotificationById(notificationId, userRole);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Mark notification as read
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ notificationId, userRole }, { rejectWithValue }) => {
    try {
      // Note: This function isn't in your API file, but I'm keeping it since it's referenced
      // You'll need to implement markNotificationAsRead in your API file
      await markNotificationAsRead(notificationId, userRole);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Promote artwork
export const promoteArtworkAsync = createAsyncThunk(
  'notifications/promoteArtwork',
  async (artworkId, { rejectWithValue }) => {
    try {
      const response = await promoteArtwork(artworkId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Promote art material
export const promoteArtMaterialAsync = createAsyncThunk(
  'notifications/promoteArtMaterial',
  async (artmatId, { rejectWithValue }) => {
    try {
      const response = await promoteArtMaterial(artmatId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Promote event
export const promoteEventAsync = createAsyncThunk(
  'notifications/promoteEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await promoteEvent(eventData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Cleanup tokens
export const cleanupTokensAsync = createAsyncThunk(
  'notifications/cleanupTokens',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cleanupTokens();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    currentNotification: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    unreadCount: 0,
    promotionStatus: 'idle', // for tracking promotion operations
    promotionError: null,
    lastUpdated: null
  },
  reducers: {
    resetNotifications: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
      state.unreadCount = 0;
      state.currentNotification = null;
    },
    clearPromotionStatus: (state) => {
      state.promotionStatus = 'idle';
      state.promotionError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle getNotifications
      .addCase(getNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.unreadCount = action.payload.filter(item => !item.read).length;
        state.lastUpdated = Date.now();
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Handle getNotificationById
      .addCase(getNotificationById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getNotificationById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentNotification = action.payload;
        
        // If this notification isn't already in our items array, add it
        if (action.payload && !state.items.find(item => item._id === action.payload._id)) {
          state.items.push(action.payload);
          state.unreadCount = state.items.filter(item => !item.read).length;
        }
      })
      .addCase(getNotificationById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Handle markAsRead
      .addCase(markAsRead.fulfilled, (state, action) => {
        if (!action.payload) return; // Prevent errors if payload is undefined
        
        // Update in items array
        const index = state.items.findIndex(item => item._id === action.payload);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], read: true };
          state.unreadCount = state.items.filter(item => !item.read).length;
        }
        
        // Also update currentNotification if it matches
        if (state.currentNotification && state.currentNotification._id === action.payload) {
          state.currentNotification = { ...state.currentNotification, read: true };
        }
      })
      
      // Handle promotion actions
      .addCase(promoteArtworkAsync.pending, (state) => {
        state.promotionStatus = 'loading';
      })
      .addCase(promoteArtworkAsync.fulfilled, (state) => {
        state.promotionStatus = 'succeeded';
      })
      .addCase(promoteArtworkAsync.rejected, (state, action) => {
        state.promotionStatus = 'failed';
        state.promotionError = action.payload;
      })
      
      // Art Material promotion
      .addCase(promoteArtMaterialAsync.pending, (state) => {
        state.promotionStatus = 'loading';
      })
      .addCase(promoteArtMaterialAsync.fulfilled, (state) => {
        state.promotionStatus = 'succeeded';
      })
      .addCase(promoteArtMaterialAsync.rejected, (state, action) => {
        state.promotionStatus = 'failed';
        state.promotionError = action.payload;
      })
      
      // Event promotion
      .addCase(promoteEventAsync.pending, (state) => {
        state.promotionStatus = 'loading';
      })
      .addCase(promoteEventAsync.fulfilled, (state) => {
        state.promotionStatus = 'succeeded';
      })
      .addCase(promoteEventAsync.rejected, (state, action) => {
        state.promotionStatus = 'failed';
        state.promotionError = action.payload;
      })
      
      // Token cleanup
      .addCase(cleanupTokensAsync.fulfilled, (state) => {
        // No state changes needed, but could add a lastCleanup timestamp if desired
      });
  }
});

export const { resetNotifications, clearPromotionStatus } = notificationSlice.actions;
export default notificationSlice.reducer;