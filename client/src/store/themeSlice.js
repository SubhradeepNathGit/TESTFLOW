import { createSlice } from '@reduxjs/toolkit';

const themeSlice = createSlice({
    name: 'theme',
    initialState: {
        theme: localStorage.getItem('theme') || 'light',
    },
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            const root = document.documentElement;
            if (state.theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            root.style.colorScheme = state.theme;
            localStorage.setItem('theme', state.theme);
        },
        setTheme: (state, action) => {
            state.theme = action.payload;
            const root = document.documentElement;
            if (state.theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            root.style.colorScheme = state.theme;
            localStorage.setItem('theme', state.theme);
        },
    },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const selectTheme = (state) => state.theme.theme;

export default themeSlice.reducer;
