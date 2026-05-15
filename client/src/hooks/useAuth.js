/**

 *

 
 * Usage (same as before):
 *   import { useAuth } from '../../hooks/useAuth';
 *   const { user, login, logout, hasPermission, ... } = useAuth();
 */
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosInstance';
import {
    setCredentials,
    setUser as setUserAction,
    clearCredentials,
    selectUser,
    selectToken,
    selectAuthLoading,
} from '../store/authSlice';

// Mirrors the rolesPermissions object from the old AuthContext
const rolesPermissions = {
    super_admin: [
        'view_platform_metrics', 'manage_institutions', 'manage_all_users',
        'view_all_tests', 'view_all_results', 'reset_attempt',
    ],
    owner: [
        'manage_students', 'manage_instructors', 'view_institution_metrics',
        'create_test', 'read_test', 'update_test', 'delete_test',
        'publish_test', 'view_results', 'reset_attempt',
    ],
    instructor: [
        'create_test', 'read_test', 'update_test', 'delete_test',
        'view_results', 'manage_questions', 'publish_test', 'reset_attempt',
    ],
    student: ['read_test', 'take_test', 'view_own_results'],
};

export const useAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const user = useSelector(selectUser);
    const token = useSelector(selectToken);
    const loading = useSelector(selectAuthLoading);

    // ─── logout ───────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        const isSessionActive = !!localStorage.getItem('accessToken');

        if (!isSessionActive) {
            dispatch(clearCredentials());
            navigate('/login');
            return;
        }

        try {
            await api.get('/auth/logout');
        } catch (e) {
            console.log('Logout api error', e);
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        dispatch(clearCredentials());
        navigate('/login');
        toast.info('Logged out');
    }, [dispatch, navigate]);

    // ─── login ────────────────────────────────────────────────────────────────
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user: userData } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));
            dispatch(setCredentials({ user: userData, token: accessToken }));

            if (userData.role === 'super_admin') {
                toast.success('Welcome back, Platform Administrator!');
                navigate('/admin/dashboard');
            } else if (userData.role === 'instructor') {
                toast.success('Instructor session started');
                navigate('/instructor-dashboard');
            } else if (userData.role === 'owner') {
                toast.success('Management portal ready');
                navigate('/students');
            } else {
                toast.success('Welcome back!');
                navigate('/student-dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            toast.error(message);
            throw error;
        }
    };

    // ─── register ─────────────────────────────────────────────────────────────
    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            toast.success(response.data.message || 'OTP sent to your email!');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
            throw error;
        }
    };

    // ─── OTP helpers ─────────────────────────────────────────────────────────
    const verifyOtp = async (email, otp) => {
        try {
            const response = await api.post('/auth/verify-email', { email, otp });
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
            throw error;
        }
    };

    const resendOtp = async (email) => {
        try {
            const response = await api.post('/auth/resend-otp', { email });
            toast.success('OTP resent successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Resend failed');
            throw error;
        }
    };

    // ─── password helpers ─────────────────────────────────────────────────────
    const forgotPassword = async (email) => {
        try {
            const response = await api.post('/auth/forgotpassword', { email });
            toast.success('Password reset email sent!');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send email');
            throw error;
        }
    };

    const resetPassword = async (resetToken, password) => {
        try {
            const response = await api.put(`/auth/resetpassword/${resetToken}`, { password });
            toast.success('Password reset successful!');
            navigate('/login');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password reset failed');
            throw error;
        }
    };

    const updatePassword = async (currentPassword, newPassword) => {
        try {
            const response = await api.put('/auth/updatepassword', { currentPassword, newPassword });
            const { accessToken, refreshToken, user: updatedUser } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            dispatch(setCredentials({ user: updatedUser, token: accessToken }));

            toast.success('Password updated successfully!');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
            throw error;
        }
    };

    // ─── setUser (used in ProfileModal) ──────────────────────────────────────
    const setUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        dispatch(setUserAction(userData));
    };

    // ─── RBAC ─────────────────────────────────────────────────────────────────
    const hasPermission = (permission) => {
        if (!user) return false;
        const userRole = (user.role || 'owner').toLowerCase();
        const permissions = rolesPermissions[userRole] || [];
        return permissions.includes(permission);
    };

    return {
        // State
        user,
        token,
        loading,
        // Actions
        login,
        logout,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        updatePassword,
        setUser,
        hasPermission,
    };
};

export default useAuth;
