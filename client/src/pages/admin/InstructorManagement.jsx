import React, { useState, useContext } from 'react';
import { Briefcase, UserPlus, Mail, Search, X, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const InstructorManagement = () => {
    const { user } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: instructors = [], isLoading: loading } = useQuery({
        queryKey: ['instructors', searchTerm],
        queryFn: () => api.get(`/users/instructors?search=${searchTerm}`).then(r => r.data.data || []),
        keepPreviousData: true,
    });

    const handleToggleStatus = async (instructorId, currentStatus) => {
        try {
            await api.patch(`/users/instructors/${instructorId}/toggle`);
            queryClient.setQueryData(['instructors', searchTerm], (old = []) =>
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
        <div className="min-h-screen bg-slate-50 p-6 lg:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Management</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Instructor <span className="text-slate-400 font-light">Management</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage teaching staff and view their activity</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Staff', value: instructors.length },
                        { label: 'Active', value: instructors.filter(s => s.isActive).length },
                        { label: 'Tests Published', value: instructors.reduce((acc, curr) => acc + (curr.testCount || 0), 0) },
                        { label: 'Questions Authored', value: instructors.reduce((acc, curr) => acc + (curr.questionCount || 0), 0) },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
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
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium text-slate-900 placeholder-slate-400 transition-all"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Instructors...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {['Instructor', 'Contributions', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {instructors.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center">
                                                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <p className="text-slate-400 font-medium">No instructors found</p>
                                            </td>
                                        </tr>
                                    ) : instructors.map(instructor => (
                                        <tr key={instructor._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                                                        {instructor.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{instructor.name}</p>
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
