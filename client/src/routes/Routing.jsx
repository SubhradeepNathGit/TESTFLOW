import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

// Auth Pages (keep same structure, just renamed branding)
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOTP from '../pages/auth/VerifyOTP';
import ForgotPassword from '../pages/auth/ForgotPassword';
import EmailSent from '../pages/auth/EmailSent';
import ResetPassword from '../pages/auth/ResetPassword';

// TESTFLOW Portal Pages
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import InstructorDashboard from '../pages/dashboard/InstructorDashboard';
import TestPlayer from '../pages/tests/TestPlayer';
import ResultsPage from '../pages/tests/ResultsPage';
import Leaderboard from '../pages/tests/Leaderboard';
import ArchivePage from '../pages/dashboard/ArchivePage';
import AnalyticsDashboard from '../pages/dashboard/AnalyticsDashboard';
import AnswerKeysPage from '../pages/dashboard/AnswerKeysPage';

// Management Pages (Institution Admin)
import StudentManagement from '../pages/admin/StudentManagement';
import InstructorManagement from '../pages/admin/InstructorManagement';

// Super Admin
import SuperAdminDashboard from '../pages/admin/SuperAdminDashboard';
import SuperAdminLogin from '../pages/auth/SuperAdminLogin';
import AdminOverview from '../pages/admin/AdminOverview';
import AdminInstitutions from '../pages/admin/AdminInstitutions';
import { AdminInstructors, AdminStudents } from '../pages/admin/AdminUsers';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminArchive from '../pages/admin/AdminArchive';

import PrivateRoute from '../components/auth/PrivateRoute';

/** Smart home redirect based on role */
const HomeRedirect = () => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'instructor') return <Navigate to="/instructor-dashboard" />;
    if (user.role === 'owner') return <Navigate to="/students" />;
    return <Navigate to="/student-dashboard" />;
};

const Routing = () => {
    return (
        <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/email-sent" element={<EmailSent />} />
            <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

            {/* Smart home redirect */}
            <Route path="/" element={<PrivateRoute><HomeRedirect /></PrivateRoute>} />

            {/* Student Routes */}
            <Route path="/student-dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
            <Route path="/test/:id" element={<PrivateRoute><TestPlayer /></PrivateRoute>} />
            <Route path="/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />

            {/* Instructor Routes */}
            <Route path="/instructor-dashboard" element={<PrivateRoute><InstructorDashboard /></PrivateRoute>} />
            <Route path="/archive" element={<PrivateRoute><ArchivePage /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />

            {/* Institution Admin Routes */}
            <Route path="/students" element={<PrivateRoute><StudentManagement /></PrivateRoute>} />
            <Route path="/instructors" element={<PrivateRoute><InstructorManagement /></PrivateRoute>} />

            {/* Super Admin Routes */}
            <Route path="/admin" element={<SuperAdminLogin />} />
            <Route path="/admin/dashboard" element={<PrivateRoute><AdminOverview /></PrivateRoute>} />
            <Route path="/admin/institutions" element={<PrivateRoute><AdminInstitutions /></PrivateRoute>} />
            <Route path="/admin/instructors" element={<PrivateRoute><AdminInstructors /></PrivateRoute>} />
            <Route path="/admin/students" element={<PrivateRoute><AdminStudents /></PrivateRoute>} />
            <Route path="/admin/analytics" element={<PrivateRoute><AdminAnalytics /></PrivateRoute>} />
            <Route path="/admin/archive" element={<PrivateRoute><AdminArchive /></PrivateRoute>} />

            {/* Answer Keys for Instructor, Admin, and Student */}
            <Route path="/answer-keys" element={<PrivateRoute><AnswerKeysPage /></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={
                <div className="flex items-center justify-center h-screen bg-slate-50">
                    <div className="text-center">
                        <p className="text-8xl font-black text-slate-200">404</p>
                        <p className="text-slate-500 font-bold mt-4">Page not found</p>
                    </div>
                </div>
            } />
        </Routes>
    );
};

export default Routing;
