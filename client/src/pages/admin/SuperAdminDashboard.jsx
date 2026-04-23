import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import api from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    Users, TrendingUp, Search, ArrowUpRight, ArrowDownRight, Trash2,
    CheckCircle2, XCircle, Activity, Layers, Database, ShieldCheck,
    Briefcase, GraduationCap, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

ChartJS.register(
    CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
);

// Components

const StatCard = ({ icon: Icon, label, value, subValue, trend, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4"
    >
        <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl ring-4 ring-indigo-50 shrink-0">
            <Icon size={20} />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900">{value}</p>
                {subValue && <span className="text-[11px] font-medium text-slate-400">/ {subValue}</span>}
            </div>
            {trend && (
                <p className={cn(
                    "text-[10px] font-bold mt-0.5 flex items-center gap-0.5",
                    trend > 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                    {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(trend)}% increase
                </p>
            )}
        </div>
    </motion.div>
);

const EmptyState = ({ icon: Icon, title, desc }) => (
    <div className="py-20 text-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Icon size={32} />
        </div>
        <h3 className="text-slate-900 font-black text-lg">{title}</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-[240px] mx-auto leading-relaxed">{desc}</p>
    </div>
);

const TableAction = ({ onClick, color, icon: Icon, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={cn(
            "p-2.5 rounded-xl transition-all active:scale-90 border shadow-sm",
            color === "red" 
                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-100" 
                : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-100"
        )}
    >
        <Icon size={16} />
    </button>
);

// SuperAdmin Dashboard

const SuperAdminDashboard = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const socket = useSocket();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState("overview"); 
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!authLoading && user?.role !== "super_admin") navigate("/");
    }, [user, authLoading, navigate]);

    // Socket: invalidate relevant queries on real-time events
    useEffect(() => {
        if (!socket || user?.role !== "super_admin") return;
        const refresh = () => {
            queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        };
        socket.on('institutionCreated', refresh);
        socket.on('test:published', refresh);
        return () => {
            socket.off('institutionCreated', refresh);
            socket.off('test:published', refresh);
        };
    }, [socket, user, queryClient]);

    // Separate queries per tab
    const { data: metrics, isLoading: metricsLoading } = useQuery({
        queryKey: ['admin-metrics'],
        queryFn: () => api.get("/admin/metrics").then(r => r.data.data),
        enabled: !authLoading && user?.role === "super_admin" && activeTab === "overview",
    });

    const { data: institutions = [], isLoading: instLoading } = useQuery({
        queryKey: ['admin-institutions'],
        queryFn: () => api.get("/admin/institutions").then(r => r.data.data),
        enabled: !authLoading && user?.role === "super_admin" && activeTab === "institutions",
    });

    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users', activeTab, searchTerm],
        queryFn: () => api.get(`/admin/users?role=${activeTab === "instructors" ? "instructor" : "student"}&search=${searchTerm}`).then(r => r.data.data),
        enabled: !authLoading && user?.role === "super_admin" && (activeTab === "instructors" || activeTab === "students"),
    });

    const loading = metricsLoading || instLoading || usersLoading;

    const fetchAllData = () => {
        if (activeTab === "overview") queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
        else if (activeTab === "institutions") queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
        else queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    };

    const handleToggleInstitution = async (id) => {
        try {
            const res = await api.patch(`/admin/institutions/${id}/toggle`);
            toast.success(res.data.message);
            fetchAllData();
        } catch { toast.error("Failed to toggle status"); }
    };

    const handleToggleUser = async (id) => {
        try {
            const res = await api.patch(`/admin/users/${id}/toggle`);
            toast.success(res.data.message);
            fetchAllData();
        } catch { toast.error("Failed to toggle status"); }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm("ARE YOU ABSOLUTELY SURE? This action is permanent and cannot be undone.")) return;
        try {
            const endpoint = type === 'inst' ? `/admin/institutions/${id}` : `/admin/users/${id}`;
            await api.delete(endpoint);
            toast.success(`${type === 'inst' ? 'Institution' : 'User'} removed from platform`);
            fetchAllData();
        } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
    };

    const trajectoryChart = metrics?.trajectory ? {
        labels: metrics.trajectory.map(d => d._id),
        datasets: [
            {
                label: 'Institutions',
                data: metrics.trajectory.map(d => d.count),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                fill: true, tension: 0.4, borderWidth: 4, pointRadius: 5, pointBackgroundColor: '#fff', pointBorderWidth: 2,
            },
            {
                label: 'Tests Authored',
                data: metrics.testTrajectory?.map(d => d.count) || [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                fill: true, tension: 0.4, borderWidth: 4, pointRadius: 5, pointBackgroundColor: '#fff', pointBorderWidth: 2,
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#94a3b8', padding: 12, cornerRadius: 12, boxPadding: 8 }
        },
        scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: "#94a3b8", font: { weight: '700', size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,0.03)' }, border: { display: false }, ticks: { color: "#94a3b8", font: { weight: '500' } } }
        }
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-6 lg:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                                <Globe size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Global Headquarters
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 whitespace-nowrap">
                            Platform <span className="text-slate-400 font-light">Command</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Oversee infrastructure, engagement, and global assets</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-5">
                        <div className="relative group w-full md:w-80 h-12">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchAllData()}
                                className="w-full h-full pl-11 pr-5 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none font-bold text-sm shadow-sm hover:border-slate-300"
                            />
                        </div>
                        <div className="flex bg-white p-1 rounded-full border border-slate-100 shadow-sm w-full md:w-auto h-12">
                            {[
                                { id: "overview", label: "Overview", icon: Layers },
                                { id: "institutions", label: "Institutions", icon: Database },
                                { id: "instructors", label: "Instructors", icon: Briefcase },
                                { id: "students", label: "Students", icon: GraduationCap },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
                                    className={cn(
                                        "flex-1 md:flex-none h-full flex items-center justify-center gap-2 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === tab.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <tab.icon size={13} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="w-10 h-10 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-sm font-bold text-slate-400">Loading platform data...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === "overview" && metrics && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard index={0} icon={Database} label="Institutions" value={metrics.totalInstitutions} subValue={metrics.activeInstitutions} trend={12} />
                                        <StatCard index={1} icon={Users} label="Global Users" value={metrics.totalUsers} trend={18} />
                                        <StatCard index={2} icon={Activity} label="Activities" value={metrics.totalAttempts} subValue={metrics.totalTests} trend={24} />
                                        <StatCard index={3} icon={TrendingUp} label="Platform Score" value={metrics.avgPlatformScore} subValue="100%" />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Platform Trajectory</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Growth & Deployment Analytics</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"> Infrastructure</div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"> Content</div>
                                                </div>
                                            </div>
                                            <div className="h-[340px] w-full">
                                                {trajectoryChart ? <Line data={trajectoryChart} options={chartOptions} /> : <EmptyState icon={Activity} title="Insufficient Data" desc="Launch more institutions to see platform trends." />}
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden relative">
                                            <div>
                                                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-6"><ShieldCheck size={24} /></div>
                                                <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight mb-2">Security & Engagement</h3>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed">{metrics.totalQuestions} questions and {metrics.totalAttempts} submissions globally.</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 mt-8">
                                                {[
                                                    { label: "Active Ratio", value: `${Math.round((metrics.activeInstitutions / (metrics.totalInstitutions || 1)) * 100)}%`, color: "bg-emerald-500" },
                                                    { label: "Success Rate", value: `${Math.round(metrics.avgPlatformScore)}%`, color: "bg-indigo-500" },
                                                ].map((box, i) => (
                                                    <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{box.label}</p>
                                                        <p className="text-2xl font-black text-slate-800">{box.value}</p>
                                                        <div className={cn("w-full h-1 mt-3 rounded-full", box.color)} style={{ width: box.value }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "institutions" && (
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Institution Assets</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Platform Directory</p>
                                        </div>
                                        <div className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                                            {institutions.length} Organizations
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    {["Logo", "Institution", "Status", "Deployment", "Resources", "Actions"].map(h => (
                                                        <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {institutions.length === 0 ? (
                                                    <tr><td colSpan={6}><EmptyState icon={Database} title="Directory Empty" desc="No institutions have been registered yet." /></td></tr>
                                                ) : (
                                                    institutions.map((inst) => (
                                                        <tr key={inst._id} className="group hover:bg-slate-50/40 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm border border-indigo-100">
                                                                    {inst.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <p className="text-slate-900 font-bold tracking-tight text-sm">{inst.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">UID: {inst._id.slice(-8)}</p>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                                    inst.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                                )}>
                                                                    <div className={cn("w-1 h-1 rounded-full", inst.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                                                                    {inst.isActive ? "Operational" : "Suspended"}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 uppercase font-bold text-[10px] text-slate-500 whitespace-nowrap">
                                                                {new Date(inst.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex gap-4">
                                                                    <div className="flex flex-col"><span className="text-xs font-black text-slate-700">{inst.instructorCount}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Instructors</span></div>
                                                                    <div className="flex flex-col"><span className="text-xs font-black text-slate-700">{inst.studentCount}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Students</span></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <TableAction onClick={() => handleToggleInstitution(inst._id)} icon={inst.isActive ? XCircle : CheckCircle2} title={inst.isActive ? "Suspend" : "Activate"} />
                                                                    <TableAction onClick={() => handleDelete('inst', inst._id)} color="red" icon={Trash2} title="Delete" />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {(activeTab === "instructors" || activeTab === "students") && (
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 capitalize">Global {activeTab}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Personnel Oversight</p>
                                        </div>
                                        <div className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                                            {users.length} Records
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    {["User", "Institution", activeTab === "students" ? "Identity" : null, "Status", "Joined", "Actions"].filter(Boolean).map(h => (
                                                        <th key={h} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {users.length === 0 ? (
                                                    <tr><td colSpan={activeTab === "students" ? 6 : 5}><EmptyState icon={Users} title="No Records" desc={`No ${activeTab} match your search criteria.`} /></td></tr>
                                                ) : (
                                                    users.map((u) => (
                                                        <tr key={u._id} className="group hover:bg-slate-50/40 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 font-black shrink-0 shadow-sm">
                                                                        {u.profileImage 
                                                                            ? <img src={u.profileImage.startsWith('http') ? u.profileImage : `http://localhost:3006/${u.profileImage}`} className="w-full h-full object-cover rounded-full" alt="Profile" />
                                                                            : u.name.charAt(0).toUpperCase()
                                                                        }
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-slate-900 font-bold tracking-tight truncate text-sm">{u.name}</p>
                                                                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 font-bold text-sm text-indigo-600">
                                                                {u.institutionId?.name || "Independent"}
                                                            </td>
                                                            {activeTab === "students" && (
                                                                <td className="px-8 py-5">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {u.studentId || "No-ID"}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            <td className="px-8 py-5">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                                    u.isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                                )}>
                                                                    {u.isActive ? "Verified" : "Restricted"}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 uppercase font-bold text-[10px] text-slate-500 whitespace-nowrap">
                                                                {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <TableAction onClick={() => handleToggleUser(u._id)} icon={u.isActive ? XCircle : CheckCircle2} title={u.isActive ? "Restrict" : "Verify"} />
                                                                    <TableAction onClick={() => handleDelete('user', u._id)} color="red" icon={Trash2} title="Delete" />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
