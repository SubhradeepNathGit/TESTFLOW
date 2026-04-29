import { useState, useContext, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import AuthContext from "../../context/AuthContext";
import api from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { TableSkeleton } from "../../components/common/Skeleton";
import { Library, RefreshCcw, Trash2, Building2, Users, GraduationCap, Briefcase, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { useConfirm } from "../../hooks/useConfirm.jsx";

const EmptyState = ({ icon: Icon, title, desc }) => (
    <div className="py-24 text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
            <Icon size={32} />
        </div>
        <h3 className="text-slate-900 dark:text-slate-100 font-black text-lg">{title}</h3>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 max-w-[220px] mx-auto leading-relaxed">{desc}</p>
    </div>
);

const AdminArchive = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("institutions");
    const [search, setSearch] = useState("");
    const { confirm, ConfirmModal } = useConfirm();
    const socket = useSocket();

    const { data: archive = { institutions: [], users: [] }, isLoading } = useQuery({
        queryKey: ['admin-archive'],
        queryFn: () => api.get("/admin/archive").then(r => r.data.data),
        enabled: !authLoading && user?.role === "super_admin",
        placeholderData: keepPreviousData,
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-archive'] });

    useEffect(() => {
        if (!socket) return;
        const events = [
            "admin:institution_archived", "admin:institution_restored", "admin:institution_deleted",
            "admin:user_archived", "admin:user_restored", "admin:user_deleted"
        ];
        events.forEach(ev => socket.on(ev, refresh));
        return () => events.forEach(ev => socket.off(ev, refresh));
    }, [socket]);

    const handleRestore = async (type, id) => {
        const ok = await confirm({
            title: "Restore Record",
            message: "Are you sure you want to restore this record? It will be moved back to the active directory.",
            confirmText: "Restore"
        });

        if (ok) {
            try {
                const res = await api.patch(`/admin/archive/${type}/${id}/restore`);
                toast.success(res.data.message);
                refresh();
                queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
            } catch { toast.error("Restore failed"); }
        }
    };

    const handlePermanentDelete = async (type, id, name) => {
        const ok = await confirm({
            title: "Permanent Deletion",
            message: `CRITICAL: Permanently delete "${name}"? This will wipe all associated data from the database FOREVER.`,
            confirmText: "Delete Permanently",
            type: "danger"
        });

        if (ok) {
            try {
                const res = await api.delete(`/admin/archive/${type}/${id}`);
                toast.success(res.data.message);
                refresh();
                queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
            } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
        }
    };

    const filteredInstitutions = archive.institutions.filter(inst => 
        inst.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredUsers = archive.users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const tabs = [
        { id: "institutions", label: "Institutions", icon: Building2, count: filteredInstitutions.length },
        { id: "users", label: "Users", icon: Users, count: filteredUsers.length },
    ];

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center">
                            <Library size={16} className="text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data Recovery Center</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        Platform <span className="text-slate-400 dark:text-slate-500 font-light">Archive</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review, restore, or permanently purge soft-deleted records</p>
                </div>
                
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={`Search archived ${activeTab}...`}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/40 transition-all"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-white/[0.03] rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                            activeTab === tab.id 
                                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" 
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        <span className={cn(
                            "ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-tighter",
                            activeTab === tab.id ? "bg-rose-500 text-white" : "bg-slate-200 dark:bg-white/5 text-slate-500"
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden">
                {isLoading ? (
                    <div className="p-6"><TableSkeleton rows={4} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/40 dark:bg-white/[0.02] border-b border-slate-50 dark:border-white/5">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Deleted Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {activeTab === "institutions" ? (
                                        filteredInstitutions.length > 0 ? (
                                            filteredInstitutions.map((inst) => (
                                                <motion.tr
                                                    key={inst._id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/30 dark:hover:bg-white/[0.01] transition-colors"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black">
                                                                {inst.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{inst.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Institution ID: {inst._id.slice(-8)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs font-medium text-slate-500">
                                                        {new Date(inst.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleRestore("institutions", inst._id)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                                                            >
                                                                <RefreshCcw size={14} />
                                                                Restore
                                                            </button>
                                                            <button
                                                                onClick={() => handlePermanentDelete("institutions", inst._id, inst.name)}
                                                                className="p-2.5 rounded-xl border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-100 transition-all active:scale-95"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="3"><EmptyState icon={Building2} title="No Archived Institutions" desc="Soft-deleted organizations will appear here for final review." /></td></tr>
                                        )
                                    ) : (
                                        filteredUsers.length > 0 ? (
                                            filteredUsers.map((u) => (
                                                <motion.tr
                                                    key={u._id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/30 dark:hover:bg-white/[0.01] transition-colors"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                                                                u.role === "instructor" ? "bg-violet-600" : "bg-emerald-600"
                                                            )}>
                                                                {u.role === "instructor" ? <Briefcase size={18} /> : <GraduationCap size={18} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.role}</p>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.institutionId?.name || "Independent"}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs font-medium text-slate-500">
                                                        {new Date(u.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleRestore("users", u._id)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                                                            >
                                                                <RefreshCcw size={14} />
                                                                Restore
                                                            </button>
                                                            <button
                                                                onClick={() => handlePermanentDelete("users", u._id, u.name)}
                                                                className="p-2.5 rounded-xl border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-100 transition-all active:scale-95"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="3"><EmptyState icon={Users} title="No Archived Users" desc="Deleted instructors and students will appear here before permanent purging." /></td></tr>
                                        )
                                    )}
                                </AnimatePresence>
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

export default AdminArchive;
