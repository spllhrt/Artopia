// artSlice.js
import { createSlice } from '@reduxjs/toolkit';

const matSlice = createSlice({
  name: 'artmats',
  initialState: {
    artmats: [],
    selectedArtmat: null,
    loading: false,
    error: null,
  },
  reducers: {
    setArtmats: (state, action) => {
      state.artmats = action.payload;
    },
    setSelectedArtmat: (state, action) => {
      state.selectedArtmat = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setArtmats, setSelectedArtmat, setLoading, setError } = matSlice.actions;
export default matSlice.reducer;
