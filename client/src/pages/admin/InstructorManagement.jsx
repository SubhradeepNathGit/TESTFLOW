import React, { useState, useEffect } from 'react';
import { Briefcase, UserPlus, Mail, Search, X, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { TableSkeleton } from '../../components/common/Skeleton';
import useDebounce from '../../hooks/useDebounce';
import useThrottle from '../../hooks/useThrottle';
import { useConfirm } from '../../hooks/useConfirm';
import { useSocket } from '../../hooks/useSocket';

const InstructorManagement = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const throttledSearchTerm = useThrottle(searchTerm, 300);
    const debouncedSearchTerm = useDebounce(throttledSearchTerm, 300);
    const { confirm, ConfirmModal } = useConfirm();
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;
        const refresh = () => queryClient.invalidateQueries({ queryKey: ['instructors'] });
        
        socket.on('admin:user_created', (data) => data?.role === 'instructor' && refresh());
        socket.on('admin:user_updated', (data) => data?.role === 'instructor' && refresh());
        socket.on('admin:user_toggled', (data) => data?.role === 'instructor' && refresh());
        socket.on('admin:user_deleted', (data) => data?.role === 'instructor' && refresh());

        return () => {
            socket.off('admin:user_created');
            socket.off('admin:user_updated');
            socket.off('admin:user_toggled');
            socket.off('admin:user_deleted');
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

    const handleDelete = async (instructorId, instructorName) => {
        const ok = await confirm({
            title: 'Archive Instructor',
            message: `Are you sure you want to move "${instructorName}" to the archive? Their profile will be hidden but can be restored by a Super Admin.`,
            confirmText: 'Archive'
        });

        if (ok) {
            try {
                await api.delete(`/users/instructors/${instructorId}`);
                toast.success('Instructor moved to archive');
                queryClient.invalidateQueries({ queryKey: ['instructors'] });
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to archive instructor');
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
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Instructor <span className="text-slate-400 dark:text-white/30 font-light">Management</span>
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
                        <div key={i} className="bg-white dark:bg-black border border-slate-200 dark:border-white/[0.06] rounded-[24px] p-6 group relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 blur-[50px] pointer-events-none group-hover:bg-slate-500/10 transition-colors" />
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                    <input
                        type="text"
                        placeholder="Search by name, email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-black border border-slate-200 dark:border-white/[0.06] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 transition-all"
                    />
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-black rounded-[32px] border border-slate-200 dark:border-white/[0.06] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
                    {loading ? (
                        <TableSkeleton rows={5} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
                                        {['Instructor', 'Contributions', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                    {instructors.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-24 text-center">
                                                <div className="w-20 h-20 bg-slate-50 dark:bg-white/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-white/[0.06]">
                                                    <Briefcase size={32} className="text-slate-300 dark:text-white/20" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Instructors Found</h3>
                                                <p className="text-slate-500 dark:text-white/40 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                                                    Your teaching staff directory is currently empty. Staff members will appear here once they register.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : instructors.map(instructor => (
                                        <tr key={instructor._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 dark:bg-white/[0.05] rounded-full flex items-center justify-center text-slate-500 dark:text-white/50 font-black text-sm">
                                                        {instructor.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white/90 text-sm">{instructor.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-white/40">{instructor.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                                                        {instructor.testCount || 0} Tests
                                                    </span>
                                                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                                                        {instructor.questionCount || 0} Qs
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(instructor._id, instructor.isActive)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                                                        instructor.isActive
                                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                                            : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                                    }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${instructor.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                    {instructor.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-white/40 font-medium">
                                                {instructor.joinedAt
                                                    ? new Date(instructor.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : <span className="text-slate-400 dark:text-white/20 italic text-[11px]">Not joined yet</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {!instructor.isActive && user?.role === 'owner' && (
                                                        <button
                                                            onClick={() => handleDelete(instructor._id, instructor.name)}
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
            <ConfirmModal />
        </div>
    );
};

export default InstructorManagement;
