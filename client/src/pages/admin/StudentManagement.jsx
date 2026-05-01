import React, { useState, useContext, useEffect } from 'react';
import { Users, UserPlus, Mail, Search, X, Eye, ToggleLeft, ToggleRight, Trash2, Ban } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { TableSkeleton } from '../../components/common/Skeleton';
import useDebounce from '../../hooks/useDebounce';
import { useConfirm } from '../../hooks/useConfirm';

const StudentManagement = () => {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const { confirm, ConfirmModal } = useConfirm();

    useEffect(() => {
        if (!socket) return;
        const refresh = () => queryClient.invalidateQueries({ queryKey: ['students'] });
        
        socket.on('admin:user_created', (data) => data?.role === 'student' && refresh());
        socket.on('admin:user_updated', (data) => data?.role === 'student' && refresh());
        socket.on('admin:user_toggled', (data) => data?.role === 'student' && refresh());
        socket.on('admin:user_deleted', (data) => data?.role === 'student' && refresh());

        return () => {
            socket.off('admin:user_created');
            socket.off('admin:user_updated');
            socket.off('admin:user_toggled');
            socket.off('admin:user_deleted');
        };
    }, [socket, queryClient]);
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

    const handleDelete = async (studentId, studentName) => {
        const ok = await confirm({
            title: 'Archive Student',
            message: `Are you sure you want to move "${studentName}" to the archive? Their profile will be hidden but can be restored by a Super Admin.`,
            confirmText: 'Archive'
        });

        if (ok) {
            try {
                await api.delete(`/users/students/${studentId}`);
                toast.success('Student moved to archive');
                queryClient.invalidateQueries({ queryKey: ['students'] });
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to archive student');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black p-4 sm:p-6 lg:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Management</p>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
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
                        { label: 'Total Students', value: students.length, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
                        { label: 'Active', value: students.filter(s => s.isActive).length, icon: ToggleRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
                        { label: 'Inactive', value: students.filter(s => !s.isActive).length, icon: Ban, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[24px] p-6 shadow-none dark:shadow-none group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 blur-[50px] pointer-events-none group-hover:bg-slate-500/10 transition-colors" />
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{stat.value}</p>
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
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-sm">
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
                                                    : <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Not joined yet</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {!student.isActive && user?.role === 'owner' && (
                                                        <button
                                                            onClick={() => handleDelete(student._id, student.name)}
                                                            className="p-2.5 bg-red-50/50 dark:bg-red-900/20 text-red-500 hover:text-red-600 border border-red-100/50 dark:border-red-500/10 rounded-xl transition-all active:scale-90"
                                                            title="Move to Archive"
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-300" onClick={() => setShowAddModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-white/5 dark:backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-white/10 shadow-none overflow-hidden transition-all duration-500 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Add Student</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Credentials auto-generated and emailed</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                                <input
                                    type="text" required
                                    value={newStudent.name}
                                    onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email" required
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                        placeholder="student@email.com"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50/70 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-500/20 flex gap-3.5 items-start shadow-none">
                                <div className="mt-0.5 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                                <p className="text-[13px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                                    <strong className="block text-indigo-900 dark:text-indigo-200 font-bold mb-0.5 tracking-tight">Automated Provisioning</strong>
                                    A secure temporary password and unique Student ID will be generated and privately dispatched to the candidate's email address.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Add Student'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal />
        </div>
    );
};

export default StudentManagement;
