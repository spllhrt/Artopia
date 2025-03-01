// artSlice.js
import { createSlice } from '@reduxjs/toolkit';

const artSlice = createSlice({
  name: 'artworks',
  initialState: {
    artworks: [],
    selectedArtwork: null,
    loading: false,
    error: null,
  },
  reducers: {
    setArtworks: (state, action) => {
      state.artworks = action.payload;
    },
    setSelectedArtwork: (state, action) => {
      state.selectedArtwork = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setArtworks, setSelectedArtwork, setLoading, setError } = artSlice.actions;
export default artSlice.reducer;
