/**
 * AppInit — Handles app-level side effects previously inside AuthProvider:
 *   1. On mount: fetches /auth/me if a token exists in localStorage and
 *      populates the Redux store with the user object.
 *   2. Listens for the global "auth-error" event dispatched by the Axios
 *      interceptor and triggers logout.
 *
 * This is rendered ONCE at the top of the component tree (inside App.jsx)
 * and returns null — it is purely a side-effect component.
 */
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import {
    setCredentials,
    setLoading,
    clearCredentials,
    selectToken,
    selectUser,
} from '../../store/authSlice';

const AppInit = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = useSelector(selectToken);
    const user = useSelector(selectUser);

    // ── 1. Bootstrap: fetch current user if we have a token but no user yet ──
    useEffect(() => {
        const initAuth = async () => {
            if (token && !user) {
                try {
                    const { data } = await api.get('/auth/me');
                    dispatch(setCredentials({ user: data.data }));
                } catch {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    dispatch(clearCredentials());
                }
            }
            dispatch(setLoading(false));
        };

        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount only

    // ── 2. Global auth-error → logout ─────────────────────────────────────────
    useEffect(() => {
        const handleAuthError = () => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            dispatch(clearCredentials());
            navigate('/login');
            toast.info('Session expired. Please log in again.');
        };

        window.addEventListener('auth-error', handleAuthError);
        return () => window.removeEventListener('auth-error', handleAuthError);
    }, [dispatch, navigate]);

    return null;
};

export default AppInit;
