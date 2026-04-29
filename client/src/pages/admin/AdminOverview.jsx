import { useContext, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api/axiosInstance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CardSkeleton } from "../../components/common/Skeleton";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    Users, TrendingUp, ArrowUpRight, Activity, Database, ShieldCheck, Globe, Building2, GraduationCap, Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const StatCard = ({ icon: Icon, label, value, subLabel, trend, glowColor, iconBg, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, type: "spring", stiffness: 200 }}
        className="relative bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-3xl p-6 overflow-hidden group hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none transition-shadow"
    >
        <div className={cn("absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-30 pointer-events-none transition-opacity duration-700 group-hover:opacity-50", glowColor)} />
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white", iconBg)}>
            <Icon size={22} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{value ?? "—"}</p>
            {subLabel && <span className="text-xs text-slate-400 font-medium">{subLabel}</span>}
        </div>
        {trend != null && (
            <p className={cn("text-[10px] font-bold mt-2 flex items-center gap-1", trend >= 0 ? "text-emerald-500" : "text-rose-500")}>
                <ArrowUpRight size={11} />
                {Math.abs(trend)}% vs last period
            </p>
        )}
    </motion.div>
);

const MetricPill = ({ label, value, color }) => (
    <div className="bg-slate-50/60 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-100 dark:border-white/5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{value}</p>
        <div className={cn("h-1 rounded-full mt-3 w-full", color)} />
    </div>
);

const EmptyChart = () => (
    <div className="h-full flex flex-col items-center justify-center text-center py-16">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity size={24} className="text-indigo-400" />
        </div>
        <p className="text-slate-900 dark:text-slate-100 font-bold">Insufficient data</p>
        <p className="text-slate-400 text-sm mt-1 max-w-[200px]">Register more institutions to see platform trends.</p>
    </div>
);

const AdminOverview = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const socket = useSocket();

    const { data: metrics, isLoading } = useQuery({
        queryKey: ['admin-metrics'],
        queryFn: () => api.get("/admin/metrics").then(r => r.data.data),
        enabled: !authLoading && user?.role === "super_admin",
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });

    useEffect(() => {
        if (!socket) return;
        const events = [
            "admin:institution_archived", "admin:institution_restored", "admin:institution_deleted",
            "admin:user_archived", "admin:user_restored", "admin:user_deleted"
        ];
        events.forEach(ev => socket.on(ev, refresh));
        return () => events.forEach(ev => socket.off(ev, refresh));
    }, [socket]);

    const trajectoryChart = metrics?.trajectory ? {
        labels: metrics.trajectory.map(d => d._id),
        datasets: [
            {
                label: 'Institutions',
                data: metrics.trajectory.map(d => d.count),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.06)',
                fill: true, tension: 0.4, borderWidth: 3,
                pointRadius: 5, pointBackgroundColor: isDark ? '#000' : '#fff', pointBorderWidth: 2, pointBorderColor: '#6366f1',
            },
            {
                label: 'Tests',
                data: metrics.testTrajectory?.map(d => d.count) || [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.05)',
                fill: true, tension: 0.4, borderWidth: 3,
                pointRadius: 5, pointBackgroundColor: isDark ? '#000' : '#fff', pointBorderWidth: 2, pointBorderColor: '#10b981',
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1e293b' : '#0f172a',
                titleColor: '#fff',
                bodyColor: '#94a3b8',
                padding: 14, cornerRadius: 12, boxPadding: 6,
            }
        },
        scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: isDark ? '#475569' : '#94a3b8', font: { size: 11, weight: '700' } } },
            y: { grid: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }, border: { display: false }, ticks: { color: isDark ? '#475569' : '#94a3b8' } }
        }
    };

    if (isLoading) return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
        </div>
    );

    const activeRatio = metrics ? Math.round((metrics.activeInstitutions / (metrics.totalInstitutions || 1)) * 100) : 0;
    const successRate = metrics ? Math.round(metrics.avgPlatformScore || 0) : 0;

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                        <Globe size={16} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Global Headquarters</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2">
                    Platform <span className="text-slate-400 dark:text-slate-500 font-light">Command</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Oversee infrastructure, engagement, and global assets</p>
            </div>

            {/* Stat Cards */}
            {metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard index={0} icon={Building2} label="Institutions" value={metrics.totalInstitutions} subLabel={`/ ${metrics.activeInstitutions} active`} trend={12} glowColor="bg-indigo-500/30" iconBg="bg-indigo-500" />
                    <StatCard index={1} icon={Users} label="Global Users" value={metrics.totalUsers} trend={18} glowColor="bg-violet-500/30" iconBg="bg-violet-500" />
                    <StatCard index={2} icon={Activity} label="Submissions" value={metrics.totalAttempts} subLabel={`/ ${metrics.totalTests} tests`} trend={24} glowColor="bg-emerald-500/30" iconBg="bg-emerald-500" />
                    <StatCard index={3} icon={TrendingUp} label="Avg Platform Score" value={`${metrics.avgPlatformScore ?? 0}`} subLabel="/ 100" glowColor="bg-amber-500/30" iconBg="bg-amber-500" />
                </div>
            )}

            {/* Charts + Security */}
            {metrics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Trajectory Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-slate-100 dark:border-white/5 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Platform Trajectory</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Growth & Deployment Analytics</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Infrastructure
                                </span>
                                <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Content
                                </span>
                            </div>
                        </div>
                        <div className="h-[320px] w-full">
                            {trajectoryChart ? <Line data={trajectoryChart} options={chartOptions} /> : <EmptyChart />}
                        </div>
                    </div>

                    {/* Security & Engagement card */}
                    <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-8 border border-slate-100 dark:border-white/5 flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6">
                                <ShieldCheck size={24} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">Security & Engagement</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium leading-relaxed">
                                {metrics.totalQuestions ?? 0} questions and {metrics.totalAttempts ?? 0} submissions globally.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <MetricPill label="Active Ratio" value={`${activeRatio}%`} color="bg-emerald-500" />
                            <MetricPill label="Success Rate" value={`${successRate}%`} color="bg-indigo-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Jump Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Institutions", icon: Database, path: "/admin/institutions", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20", count: metrics?.totalInstitutions },
                    { label: "Instructors", icon: Briefcase, path: "/admin/instructors", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20", count: metrics?.instructorCount },
                    { label: "Students", icon: GraduationCap, path: "/admin/students", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", count: metrics?.studentCount },
                ].map(({ label, icon: Icon, path, color, count }) => (
                    <motion.button
                        key={label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(path)}
                        className="group flex items-center gap-4 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-3xl p-6 text-left hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none transition-all active:scale-[0.98]"
                    >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", color)}>
                            <Icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{label}</p>
                            {count != null && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{count} registered</p>}
                        </div>
                        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                    </motion.button>
                ))}
            </div>
        </div>
        </div>
    );
};

export default AdminOverview;
