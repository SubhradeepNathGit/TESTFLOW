import { useState, useContext, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import AuthContext from "../../context/AuthContext";
import api from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { TableSkeleton } from "../../components/common/Skeleton";
import { CheckCircle2, XCircle, Trash2, Search, Users, GraduationCap, Briefcase } from "lucide-react";
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

const AdminUsers = ({ role }) => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const { confirm, ConfirmModal } = useConfirm();
    const socket = useSocket();

    const isStudent = role === "student";
    const Icon = isStudent ? GraduationCap : Briefcase;
    const accentColor = isStudent ? "bg-emerald-600" : "bg-violet-600";
    const accentLight = isStudent ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400";

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users', role, debouncedSearch],
        queryFn: () => api.get(`/admin/users?role=${role}&search=${debouncedSearch}`).then(r => r.data.data),
        enabled: !authLoading && user?.role === "super_admin",
        placeholderData: keepPreviousData,
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-users', role, debouncedSearch] });

    useEffect(() => {
        if (!socket) return;
        socket.on("admin:user_created", refresh);
        socket.on("admin:user_updated", refresh);
        socket.on("admin:user_archived", refresh);
        socket.on("admin:users_archived", refresh); // Bulk archive from institution
        socket.on("admin:user_restored", refresh);
        socket.on("admin:user_deleted", refresh);
        socket.on("admin:user_toggled", refresh);
        return () => {
            socket.off("admin:user_created", refresh);
            socket.off("admin:user_updated", refresh);
            socket.off("admin:user_archived", refresh);
            socket.off("admin:users_archived", refresh);
            socket.off("admin:user_restored", refresh);
            socket.off("admin:user_deleted", refresh);
            socket.off("admin:user_toggled", refresh);
        };
    }, [socket]);

    const handleToggle = async (id) => {
        try {
            const res = await api.patch(`/admin/users/${id}/toggle`);
            toast.success(res.data.message);
            refresh();
        } catch { toast.error("Failed to update status"); }
    };

    const handleDelete = async (id, name) => {
        const ok = await confirm({
            title: "Archive User",
            message: `Are you sure you want to move "${name}" to Archive? Account will be deactivated but can be restored.`,
            confirmText: "Archive"
        });

        if (ok) {
            try {
                await api.delete(`/admin/users/${id}`);
                toast.success("User moved to archive");
                refresh();
            } catch (err) { toast.error(err.response?.data?.message || "Action failed"); }
        }
    };

    const label = isStudent ? "Students" : "Instructors";

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", accentColor)}>
                                <Icon size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personnel Oversight</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Global <span className="text-slate-400 dark:text-slate-500 font-light">{label}</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage all {label.toLowerCase()} across every institution</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${label.toLowerCase()}...`}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="px-8 py-5 border-b border-slate-50 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.02] flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {isLoading ? "Loading..." : `${users.length} record${users.length !== 1 ? 's' : ''}`}
                        </p>
                        <div className={cn("px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-full", accentColor)}>
                            {label}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-6"><TableSkeleton rows={5} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        {["User", "Institution", isStudent ? "Student ID" : null, "Status", "Joined", "Actions"].filter(Boolean).map(h => (
                                            <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                                    <AnimatePresence>
                                        {users.length === 0 ? (
                                            <tr><td colSpan={isStudent ? 6 : 5}><EmptyState icon={Users} title={`No ${label}`} desc={`No ${label.toLowerCase()} match your search.`} /></td></tr>
                                        ) : users.map((u, i) => (
                                            <motion.tr
                                                key={u._id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="group hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden text-slate-500 dark:text-slate-400 font-black shrink-0">
                                                            {u.profileImage
                                                                ? <img src={u.profileImage.startsWith('http') ? u.profileImage : `http://localhost:3006/${u.profileImage}`} className="w-full h-full object-cover" alt="Profile" />
                                                                : u.name.charAt(0).toUpperCase()
                                                            }
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{u.institutionId?.name || "—"}</p>
                                                </td>
                                                {isStudent && (
                                                    <td className="px-8 py-5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.studentId || "—"}</span>
                                                    </td>
                                                )}
                                                <td className="px-8 py-5">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                        u.isActive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400"
                                                    )}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                                                        {u.isActive ? "Active" : "Restricted"}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                                                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleToggle(u._id)}
                                                            title={u.isActive ? "Restrict" : "Activate"}
                                                            className={cn(
                                                                "p-2.5 rounded-xl border transition-all active:scale-90",
                                                                u.isActive
                                                                    ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-transparent hover:border-rose-100"
                                                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-transparent hover:border-emerald-100"
                                                            )}
                                                        >
                                                            {u.isActive ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u._id, u.name)}
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

export const AdminInstructors = () => <AdminUsers role="instructor" />;
export const AdminStudents = () => <AdminUsers role="student" />;

export default AdminUsers;
