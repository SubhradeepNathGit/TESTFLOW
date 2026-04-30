import React, { useState, useContext, useEffect } from 'react';
import { Briefcase, UserPlus, Mail, Search, X, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { TableSkeleton } from '../../components/common/Skeleton';
import useDebounce from '../../hooks/useDebounce';
import { useSocket } from '../../context/SocketContext';

const InstructorManagement = () => {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (data) => {
            // Only refetch if it's an instructor
            if (data?.role === 'instructor') {
                queryClient.invalidateQueries({ queryKey: ['instructors'] });
            }
        };

        socket.on('userCreated', handleUpdate);
        socket.on('userVerified', handleUpdate);

        return () => {
            socket.off('userCreated', handleUpdate);
            socket.off('userVerified', handleUpdate);
        };
    }, [socket, queryClient]);

    const { data: instructors = [], isLoading: loading } = useQuery({
        queryKey: ['instructors', debouncedSearchTerm],
        queryFn: () => api.get(`/users/instructors?search=${debouncedSearchTerm}`).then(r => r.data.data || []),
        placeholderData: keepPreviousData,
    });

    const handleToggleStatus = async (instructorId, currentStatus) => {
        try {
            await api.patch(`/users/instructors/${instructorId}/toggle`);
            queryClient.setQueryData(['instructors', debouncedSearchTerm], (old = []) =>
                old.map(s => s._id === instructorId ? { ...s, isActive: !currentStatus } : s)
            );
            toast.success(`Instructor ${currentStatus ? 'deactivated' : 'activated'}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (instructorId) => {
        if (!window.confirm('Permanently delete this instructor? This cannot be undone.')) return;
        try {
            await api.delete(`/users/instructors/${instructorId}`);
            toast.success('Instructor removed');
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
        } catch {
            toast.error('Failed to delete instructor');
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
                            Instructor <span className="text-slate-400 font-light">Management</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage teaching staff and view their activity</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Staff', value: instructors.length, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
                        { label: 'Active', value: instructors.filter(s => s.isActive).length, icon: ToggleRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
                        { label: 'Tests Published', value: instructors.reduce((acc, curr) => acc + (curr.testCount || 0), 0), icon: Search, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
                        { label: 'Questions Authored', value: instructors.reduce((acc, curr) => acc + (curr.questionCount || 0), 0), icon: Mail, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
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
                        placeholder="Search by name, email..."
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
                                        {['Instructor', 'Contributions', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {instructors.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-24 text-center">
                                                <div className="w-20 h-20 bg-slate-50 dark:bg-white/[0.02] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                                                    <Briefcase size={32} className="text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">No Instructors Found</h3>
                                                <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                                                    Your teaching staff directory is currently empty. Staff members will appear here once they register.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : instructors.map(instructor => (
                                        <tr key={instructor._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                                                        {instructor.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{instructor.name}</p>
                                                        <p className="text-xs text-slate-400">{instructor.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                        {instructor.testCount || 0} Tests
                                                    </span>
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                                        {instructor.questionCount || 0} Qs
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(instructor._id, instructor.isActive)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                                                        instructor.isActive
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${instructor.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                    {instructor.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                {instructor.joinedAt
                                                    ? new Date(instructor.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : <span className="text-slate-300 italic">Not yet</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {!instructor.isActive && user?.role === 'owner' && (
                                                        <button
                                                            onClick={() => handleDelete(instructor._id)}
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
        </div>
    );
};

export default InstructorManagement;
