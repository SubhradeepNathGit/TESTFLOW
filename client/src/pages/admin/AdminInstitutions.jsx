import { useState, useContext, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import AuthContext from "../../context/AuthContext";
import api from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { TableSkeleton } from "../../components/common/Skeleton";
import { Database, CheckCircle2, XCircle, Trash2, Search, Building2, Users, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import useDebounce from "../../hooks/useDebounce";
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

const AdminInstitutions = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const { confirm, ConfirmModal } = useConfirm();
    const socket = useSocket();

    const { data: institutions = [], isLoading } = useQuery({
        queryKey: ['admin-institutions', debouncedSearch],
        queryFn: () => api.get(`/admin/institutions?search=${debouncedSearch}`).then(r => r.data.data),
        enabled: !authLoading && user?.role === "super_admin",
        placeholderData: keepPreviousData,
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });

    useEffect(() => {
        if (!socket) return;
        socket.on("admin:institution_archived", refresh);
        socket.on("admin:institution_restored", refresh);
        socket.on("admin:institution_deleted", refresh);
        socket.on("admin:institution_toggled", refresh);
        return () => {
            socket.off("admin:institution_archived", refresh);
            socket.off("admin:institution_restored", refresh);
            socket.off("admin:institution_deleted", refresh);
            socket.off("admin:institution_toggled", refresh);
        };
    }, [socket]);

    const handleToggle = async (id) => {
        try {
            const res = await api.patch(`/admin/institutions/${id}/toggle`);
            toast.success(res.data.message);
            refresh();
        } catch { toast.error("Failed to update status"); }
    };

    const handleDelete = async (id, name) => {
        const ok = await confirm({
            title: "Archive Institution",
            message: `Are you sure you want to move "${name}" to Archive? Its data will be hidden but can be restored later.`,
            confirmText: "Archive"
        });

        if (ok) {
            try {
                await api.delete(`/admin/institutions/${id}`);
                toast.success("Institution moved to archive");
                refresh();
            } catch (err) { toast.error(err.response?.data?.message || "Action failed"); }
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                            <Building2 size={16} className="text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Platform Directory</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        Institutions <span className="text-slate-400 dark:text-slate-500 font-light">Registry</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and oversee all registered organizations</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search institutions..."
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                    />
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden">
                {/* Table Head */}
                <div className="px-8 py-5 border-b border-slate-50 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.02] flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {isLoading ? "Loading..." : `${institutions.length} organization${institutions.length !== 1 ? 's' : ''}`}
                    </p>
                    <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        Institution Assets
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-6"><TableSkeleton rows={4} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    {["Logo", "Institution", "Status", "Users", "Tests", "Registered", "Actions"].map(h => (
                                        <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                                <AnimatePresence>
                                    {institutions.length === 0 ? (
                                        <tr><td colSpan={7}><EmptyState icon={Database} title="No Institutions" desc="No institutions have been registered yet." /></td></tr>
                                    ) : institutions.map((inst, i) => (
                                        <motion.tr
                                            key={inst._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="group hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-base">
                                                    {inst.name.charAt(0).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{inst.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {inst._id.slice(-8)}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    inst.isActive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400"
                                                )}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", inst.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                                                    {inst.isActive ? "Operational" : "Suspended"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{inst.instructorCount ?? 0}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Instructors</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{inst.studentCount ?? 0}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Students</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{inst.testCount ?? "—"}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tests</p>
                                            </td>
                                            <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                                                {new Date(inst.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleToggle(inst._id)}
                                                        title={inst.isActive ? "Suspend" : "Activate"}
                                                        className={cn(
                                                            "p-2.5 rounded-xl border transition-all active:scale-90",
                                                            inst.isActive
                                                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                                                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-transparent hover:border-emerald-100"
                                                        )}
                                                    >
                                                        {inst.isActive ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(inst._id, inst.name)}
                                                        title="Move to archive"
                                                        className="p-2.5 rounded-xl border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-100 transition-all active:scale-90"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
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

export default AdminInstitutions;
