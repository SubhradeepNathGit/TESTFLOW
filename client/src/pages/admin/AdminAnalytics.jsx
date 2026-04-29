import React, { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import AuthContext from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Label,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Line, Legend, Scatter
} from 'recharts';
import {
    Activity, Download, RefreshCw, BarChart3, TrendingUp, Users,
    Target, ShieldCheck, Building2, GraduationCap, Briefcase, Award,
    Globe, Zap, Clock, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '../../utils/cn';

const PALETTE = {
    indigo:  '#6366f1',
    violet:  '#8b5cf6',
    emerald: '#10b981',
    amber:   '#f59e0b',
    rose:    '#f43f5e',
    sky:     '#0ea5e9',
    fuchsia: '#d946ef',
    teal:    '#14b8a6',
};
const PIE_COLORS   = [PALETTE.emerald, PALETTE.rose];
const ROLE_COLORS  = [PALETTE.indigo, PALETTE.violet, PALETTE.emerald, PALETTE.amber];
const BAR_COLORS   = [PALETTE.indigo, PALETTE.violet, PALETTE.emerald, PALETTE.amber, PALETTE.sky];

/* ─── Tooltip ─── */
const Tip = ({ active, payload, label, isDark }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={cn('px-4 py-3 rounded-2xl border shadow-2xl text-xs', isDark ? 'bg-slate-950/95 border-white/10 text-slate-200' : 'bg-white/95 border-slate-100 text-slate-800')}>
            {label && <p className="font-bold mb-2 text-[11px] uppercase tracking-widest text-slate-400">{label}</p>}
            {payload.map((e, i) => (
                <div key={i} className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color || e.fill }} />
                    <span className="capitalize opacity-60">{e.name}:</span>
                    <span className="font-bold">{e.value}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── Donut centre label ─── */
const DonutCenter = ({ viewBox, total, label, color }) => {
    const { cx, cy } = viewBox;
    return (
        <g>
            <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={900} fill={color}>{total}</text>
            <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={700} fill="#94a3b8" letterSpacing={1}>{label?.toUpperCase()}</text>
        </g>
    );
};

/* ─── Stat pill ─── */
const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 220 }}
        className="relative overflow-hidden rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-6 group hover:shadow-xl hover:shadow-slate-100/60 dark:hover:shadow-none transition-shadow">
        <div className={cn('absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 dark:opacity-0 group-hover:dark:opacity-0 transition-opacity pointer-events-none', color)} />
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-5', color.replace('bg-', 'bg-').split(' ')[0])}>
            <Icon size={22} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>}
    </motion.div>
);

/* ─── Chart card ─── */
const ChartCard = ({ title, subtitle, icon: Icon, iconColor = 'text-indigo-500', glow, children, className = '', delay = 0, span2 = false }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 180 }}
        className={cn('relative overflow-hidden rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-7 shadow-xl shadow-slate-100/40 dark:shadow-none min-w-0 flex flex-col', span2 && 'lg:col-span-2', className)}>

        <div className="flex items-center gap-2.5 mb-6">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-white/5', iconColor)}>
                <Icon size={18} />
            </div>
            <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 leading-none">{title}</h3>
                {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{subtitle}</p>}
            </div>
        </div>
        {children}
    </motion.div>
);

/* ─── Legend row ─── */
const LegendRow = ({ items }) => (
    <div className="flex flex-wrap gap-3 mt-4">
        {items.map((it, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
                {it.label}
            </div>
        ))}
    </div>
);

/* ══════════════════════ MAIN ══════════════════════ */
const AdminAnalytics = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [range] = useState('6m');

    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['admin-comprehensive-analytics', range],
        queryFn: () => api.get('/admin/analytics').then(r => r.data.data),
        enabled: !authLoading && user?.role === 'super_admin',
    });

    /* ─── Loading skeleton ─── */
    if (isLoading) return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-10 animate-pulse">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="h-12 w-72 bg-slate-200 dark:bg-white/5 rounded-2xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-100 dark:bg-white/5 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-[340px] bg-slate-100 dark:bg-white/5 rounded-3xl" />)}
                </div>
            </div>
        </div>
    );

    if (!data) return null;

    const { platformGrowth = [], scoreDistribution = [], topInstitutions = [], passFailRatio = [], roleDistribution = [] } = data;

    /* derived stats */
    const totalAttempts = passFailRatio.reduce((s, x) => s + x.value, 0);
    const passCount = passFailRatio.find(p => p.name === 'Pass')?.value ?? 0;
    const failCount = passFailRatio.find(p => p.name === 'Fail')?.value ?? 0;
    const totalUsers = roleDistribution.reduce((s, x) => s + x.value, 0);
    const totalGrowthUsers = platformGrowth.reduce((s, x) => s + x.users, 0);
    const totalGrowthTests = platformGrowth.reduce((s, x) => s + x.tests, 0);

    const radarData = scoreDistribution.map(d => ({ subject: d.range, value: d.count }));
    const axisColor = isDark ? '#334155' : '#e2e8f0';
    const tickColor = isDark ? '#64748b' : '#94a3b8';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                                <BarChart3 size={16} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Platform Intelligence</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2">
                            Analytics <span className="text-slate-400 dark:text-slate-500 font-light">Hub</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Live aggregated data across all institutions, users, and assessments</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => refetch()} disabled={isRefetching}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            <RefreshCw size={16} className={cn("text-indigo-500", isRefetching && "animate-spin")} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard icon={Globe} label="New Users (6m)" value={totalGrowthUsers} sub="Platform registrations" color="bg-indigo-500" delay={0.05} />
                    <StatCard icon={Zap} label="New Tests (6m)" value={totalGrowthTests} sub="Assessments created" color="bg-violet-500" delay={0.1} />
                    <StatCard icon={CheckCircle2} label="Pass Rate" value={totalAttempts ? `${Math.round((passCount / totalAttempts) * 100)}%` : '—'} sub={`${passCount} of ${totalAttempts} attempts`} color="bg-emerald-500" delay={0.15} />
                    <StatCard icon={Users} label="Total Users" value={totalUsers} sub="Across all roles" color="bg-amber-500" delay={0.2} />
                </div>

                {/* ── Big Donut Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Donut 1 — Pass/Fail */}
                    <ChartCard title="Success Rate" subtitle="Passed vs Failed Assessments" icon={Award} iconColor="text-emerald-500" delay={0.25}>
                        <div className="flex flex-col items-center">
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={passFailRatio} cx="50%" cy="50%" innerRadius={70} outerRadius={120}
                                            paddingAngle={4} cornerRadius={6} dataKey="value" stroke="none"
                                            animationBegin={200} animationDuration={900}>
                                            {passFailRatio.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            <Label content={<DonutCenter total={passCount} label="passed" color={PALETTE.emerald} />} />
                                        </Pie>
                                        <RTooltip content={<Tip isDark={isDark} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-8 mt-2">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-500">{passCount}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passed</p>
                                </div>
                                <div className="w-px bg-slate-100 dark:bg-white/5" />
                                <div className="text-center">
                                    <p className="text-2xl font-black text-rose-500">{failCount}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Failed</p>
                                </div>
                            </div>
                        </div>
                    </ChartCard>

                    {/* Donut 2 — Role Distribution */}
                    <ChartCard title="User Demographics" subtitle="Platform-wide role distribution" icon={Users} iconColor="text-violet-500" delay={0.3}>
                        <div className="flex flex-col items-center">
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={120}
                                            paddingAngle={4} cornerRadius={6} dataKey="value" stroke="none"
                                            animationBegin={300} animationDuration={900}>
                                            {roleDistribution.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                                            <Label content={<DonutCenter total={totalUsers} label="users" color={PALETTE.violet} />} />
                                        </Pie>
                                        <RTooltip content={<Tip isDark={isDark} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                {roleDistribution.map((r, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <span className="w-3 h-3 rounded-full" style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }} />
                                        {r.name} <span className="font-black text-slate-700 dark:text-slate-200">({r.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ChartCard>
                </div>

                {/* ── Full-width Growth Area Chart ── */}
                <ChartCard title="Platform Growth Trajectory" subtitle="Monthly registrations — last 6 months"
                    icon={TrendingUp} iconColor="text-indigo-500" delay={0.35} span2>
                    <LegendRow items={[
                        { label: 'Users', color: PALETTE.indigo },
                        { label: 'Tests', color: PALETTE.emerald },
                        { label: 'Attempts', color: PALETTE.amber },
                    ]} />
                    <div className="h-[320px] mt-4 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={platformGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    {[['indigo', PALETTE.indigo], ['emerald', PALETTE.emerald], ['amber', PALETTE.amber]].map(([id, color]) => (
                                        <linearGradient key={id} id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
                                <RTooltip content={<Tip isDark={isDark} />} />
                                <Area type="monotone" dataKey="users" name="Users" stroke={PALETTE.indigo} strokeWidth={2.5} fill="url(#g-indigo)" />
                                <Area type="monotone" dataKey="tests" name="Tests" stroke={PALETTE.emerald} strokeWidth={2.5} fill="url(#g-emerald)" />
                                <Area type="monotone" dataKey="attempts" name="Attempts" stroke={PALETTE.amber} strokeWidth={2.5} fill="url(#g-amber)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* ── Bottom 2-col: Bar + Pie (replacing Radar) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Composed: Institutions avgScore + attemptsCount */}
                    <ChartCard title="Top Institutions" subtitle="Average score & attempt volume" icon={Building2} iconColor="text-amber-500" delay={0.4}>
                        <div className="h-[300px] w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={topInstitutions} layout="vertical" margin={{ top: 0, right: 24, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor }} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90}
                                        tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#475569', fontWeight: 700 }} />
                                    <RTooltip content={<Tip isDark={isDark} />} cursor={{ fill: isDark ? '#1e293b55' : '#f8fafc' }} />
                                    <Bar dataKey="avgScore" name="Avg Score %" barSize={20} radius={[0, 6, 6, 0]}>
                                        {topInstitutions.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                                    </Bar>
                                    <Line dataKey="attemptsCount" name="Attempts" type="monotone" dot={{ r: 5, strokeWidth: 2 }} stroke={PALETTE.rose} strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* Pie — Score distribution */}
                    <ChartCard title="Score Distribution" subtitle="Attempt count by performance band" icon={ShieldCheck} iconColor="text-violet-500" delay={0.45}>
                        <div className="flex flex-col items-center">
                            <div className="h-[280px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={radarData} cx="50%" cy="50%" innerRadius={70} outerRadius={120}
                                            paddingAngle={4} cornerRadius={6} dataKey="value" nameKey="subject" stroke="none"
                                            animationBegin={400} animationDuration={900}>
                                            {radarData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                                            <Label content={<DonutCenter total={totalAttempts} label="Attempts" color={PALETTE.violet} />} />
                                        </Pie>
                                        <RTooltip content={<Tip isDark={isDark} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 mt-4">
                                {radarData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <span className="w-3 h-3 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                                        {d.subject} <span className="font-black text-slate-700 dark:text-slate-200">({d.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ChartCard>

                    {/* Stacked Bar — monthly institutions vs tests */}
                    <ChartCard title="Monthly Activity" subtitle="Institutions & tests created per month" icon={Activity} iconColor="text-sky-500" delay={0.5}>
                        <div className="h-[280px] w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={platformGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
                                    <RTooltip content={<Tip isDark={isDark} />} cursor={{ fill: isDark ? '#1e293b55' : '#f8fafc' }} />
                                    <Bar dataKey="institutions" name="Institutions" fill={PALETTE.sky} radius={[4, 4, 0, 0]} stackId="a" barSize={28} />
                                    <Bar dataKey="tests" name="Tests" fill={PALETTE.fuchsia} radius={[4, 4, 0, 0]} stackId="a" barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <LegendRow items={[{ label: 'Institutions', color: PALETTE.sky }, { label: 'Tests', color: PALETTE.fuchsia }]} />
                    </ChartCard>

                    {/* Attempts trend line */}
                    <ChartCard title="Attempt Rate" subtitle="Assessment attempts over time" icon={Target} iconColor="text-rose-500" delay={0.55}>
                        <div className="h-[280px] w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={platformGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
                                    <RTooltip content={<Tip isDark={isDark} />} />
                                    <defs>
                                        <linearGradient id="g-rose" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={PALETTE.rose} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={PALETTE.rose} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="attempts" name="Attempts" stroke={PALETTE.rose} strokeWidth={3} fill="url(#g-rose)" />
                                    <Scatter dataKey="attempts" name="Attempts" fill={PALETTE.rose} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
