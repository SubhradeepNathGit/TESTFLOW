import React, { useState, useContext } from 'react';
import { Users, UserPlus, Mail, Search, X, Eye, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { TableSkeleton } from '../../components/common/Skeleton';
import useDebounce from '../../hooks/useDebounce';

const StudentManagement = () => {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', email: '' });

    const { data: students = [], isLoading: loading } = useQuery({
        queryKey: ['students', debouncedSearchTerm],
        queryFn: () => api.get(`/users/students?search=${debouncedSearchTerm}`).then(r => r.data.data || []),
        placeholderData: keepPreviousData,
    });

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await api.post('/users/students', newStudent);
            toast.success(data.message || 'Student added! Credentials sent via email.');
            setShowAddModal(false);
            setNewStudent({ name: '', email: '' });
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add student');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (studentId, currentStatus) => {
        try {
            await api.patch(`/users/students/${studentId}/toggle`);
            queryClient.setQueryData(['students', debouncedSearchTerm], (old = []) =>
                old.map(s => s._id === studentId ? { ...s, isActive: !currentStatus } : s)
            );
            toast.success(`Student ${currentStatus ? 'deactivated' : 'activated'}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (studentId) => {
        if (!window.confirm('Permanently delete this student? This cannot be undone.')) return;
        try {
            await api.delete(`/users/students/${studentId}`);
            toast.success('Student removed');
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch {
            toast.error('Failed to delete student');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black p-4 sm:p-6 lg:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Management</p>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Student <span className="text-slate-400 font-light">Management</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Add and manage examinees for your institution</p>
                    </div>
                    {(user?.role === 'owner' || user?.role === 'instructor') && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-lg shadow-slate-900/20 active:scale-95"
                        >
                            <UserPlus size={18} />
                            Add Student
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Students', value: students.length },
                        { label: 'Active', value: students.filter(s => s.isActive).length },
                        { label: 'Inactive', value: students.filter(s => !s.isActive).length },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email or student ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                    />
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
                    {loading ? (
                        <TableSkeleton rows={5} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-600">
                                        {['Student', 'Roll / ID', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-24 text-center">
                                                <div className="w-20 h-20 bg-slate-50 dark:bg-white/[0.02] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                                                    <Users size={32} className="text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">No Students Found</h3>
                                                <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                                                    Start building your institution by adding students. They will appear here once they are onboarded.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : students.map(student => (
                                        <tr key={student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                                                        {student.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.name}</p>
                                                        <p className="text-xs text-slate-400">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                                    {student.studentId || 'Not assigned'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(student._id, student.isActive)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                                                        student.isActive
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${student.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                    {student.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                {student.joinedAt
                                                    ? new Date(student.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : <span className="text-slate-300 italic">Not yet</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {!student.isActive && user?.role === 'owner' && (
                                                        <button
                                                            onClick={() => handleDelete(student._id)}
                                                            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-white/5 border-white/10 shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Add Student</h2>
                                <p className="text-sm text-slate-400 mt-1">Credentials auto-generated and emailed</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Full Name</label>
                                <input
                                    type="text" required
                                    value={newStudent.name}
                                    onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium text-slate-900 dark:text-slate-100 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email" required
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                        placeholder="student@email.com"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium text-slate-900 dark:text-slate-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100/50 flex gap-3.5 items-start shadow-sm">
                                <div className="mt-0.5 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-100 shadow-inner text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                                <p className="text-[13px] text-indigo-700 font-medium leading-relaxed">
                                    <strong className="block text-indigo-900 font-bold mb-0.5 tracking-tight">Automated Provisioning</strong>
                                    A secure temporary password and unique Student ID will be automatically generated and privately dispatched to the candidate's email address.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3.5 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50 active:scale-95">
                                    {submitting ? 'Adding...' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
