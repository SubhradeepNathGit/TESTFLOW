/**
 * useTheme — Drop-in replacement for the old ThemeContext useTheme hook.
 * Reads from Redux store instead of React Context.
 *
 * Usage (same as before):
 *   import { useTheme } from '../../hooks/useTheme';
 *   const { theme, toggleTheme } = useTheme();
 */
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme as toggleThemeAction, selectTheme } from '../store/themeSlice';

export const useTheme = () => {
    const dispatch = useDispatch();
    const theme = useSelector(selectTheme);

    const toggleTheme = () => {
        dispatch(toggleThemeAction());
    };

    return { theme, toggleTheme };
};

export default useTheme;
