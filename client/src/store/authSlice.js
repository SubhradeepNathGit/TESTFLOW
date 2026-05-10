import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: localStorage.getItem('accessToken') || null,
        loading: true,
    },
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            if (user !== undefined) state.user = user;
            if (token !== undefined) state.token = token;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        clearCredentials: (state) => {
            state.user = null;
            state.token = null;
            state.loading = false;
        },
    },
});

export const { setCredentials, setUser, setLoading, clearCredentials } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;

export default authSlice.reducer;
