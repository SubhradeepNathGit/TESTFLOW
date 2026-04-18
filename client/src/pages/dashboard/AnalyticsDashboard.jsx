import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chart as ChartJS,
    ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend,
    CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { getTests, getTestStats } from '../../api/testApi';
import { useSocket } from '../../context/SocketContext';
import {
    FiBarChart2, FiUsers, FiAward, FiTrendingUp,
    FiPieChart, FiTarget, FiZap, FiActivity, FiCheckCircle,
    FiAlertTriangle, FiClock, FiStar
} from 'react-icons/fi';
import CustomSelect from '../../components/common/CustomSelect';
import { useQuery, useQueryClient } from '@tanstack/react-query';

ChartJS.register(
    ArcElement, ChartTooltip, ChartLegend,
    CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, Filler
);

/* ── Shared chart defaults ──────────────────────────────────── */
const chartFont = { family: "'Inter', system-ui, sans-serif", weight: '700' };
const gridColor = 'rgba(148,163,184,0.08)';
const baseLineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
        backgroundColor: '#0f172a', titleColor: '#e2e8f0', bodyColor: '#94a3b8',
        padding: 12, cornerRadius: 12, titleFont: chartFont,
    }},
    scales: {
        x: { grid: { color: gridColor }, ticks: { color: '#94a3b8', font: chartFont } },
        y: { grid: { color: gridColor }, ticks: { color: '#94a3b8', font: chartFont } },
    }
};

/* ── animation variants ──────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};

/* ── Stat card ───────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, gradient, index }) => (
    <motion.div
        custom={index} variants={fadeUp} initial="hidden" animate="show"
        className="relative overflow-hidden rounded-[1.75rem] p-6 text-white shadow-xl"
        style={{ background: gradient }}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none translate-x-8 -translate-y-8" />
        <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Icon size={18} />
            </div>
            {sub !== undefined && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {sub}
                </span>
            )}
        </div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mt-1">{label}</p>
    </motion.div>
);

/* ── Empty state ─────────────────────────────────────────────── */
const Empty = ({ icon: Icon, title, desc }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Icon size={28} className="text-slate-300" />
        </div>
        <p className="font-bold text-slate-500">{title}</p>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
);

/* ── Difficulty badge ────────────────────────────────────────── */
const DiffBadge = ({ pct }) => {
    if (pct >= 70) return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full uppercase">Easy</span>;
    if (pct >= 40) return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black rounded-full uppercase">Medium</span>;
    return <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black rounded-full uppercase">Hard</span>;
};

/* ── Main Component ──────────────────────────────────────────── */
const AnalyticsDashboard = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();
    const [selectedTest, setSelectedTest] = useState(null);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const { data: testsData = [], isLoading: loading } = useQuery({
        queryKey: ['analytics-tests'],
        queryFn: () => getTests().then(r => (r.data.data || []).filter(t => !t.isDeleted)),
    });

    // Auto-select first test once loaded
    useEffect(() => {
        if (testsData.length > 0 && !selectedTest) {
            handleTestSelect(testsData[0]._id);
        }
    }, [testsData]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (data) => {
            if (selectedTest === data?.testId || data?.testId === 'REFRESH') handleTestSelect(selectedTest);
        };
        const handleArchive = () => queryClient.invalidateQueries({ queryKey: ['analytics-tests'] });
        socket.on('test:attempt_submitted', handleUpdate);
        socket.on('test:updated', handleUpdate);
        socket.on('test:archived', handleArchive);
        return () => {
            socket.off('test:attempt_submitted', handleUpdate);
            socket.off('test:updated', handleUpdate);
            socket.off('test:archived', handleArchive);
        };
    }, [socket, selectedTest, queryClient]);

    const tests = testsData;

    const handleTestSelect = async (testId) => {
        if (!testId) return;
        setStatsLoading(true);
        setActiveTab('overview');
        try {
            const { data } = await getTestStats(testId);
            setStats(data.data);
            setSelectedTest(testId);
        } catch (err) {
            console.error(err);
        } finally {
            setStatsLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#F6F7FB]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Analytics</p>
            </div>
        </div>
    );

    /* ── chart data builders ── */
    const distributionChart = stats ? {
        labels: ['Below 40%', '40–60%', '60–80%', '80–100%'],
        datasets: [{
            data: [0, 40, 60, 80].map(b => {
                const found = stats.scoreDistribution?.find(d => d._id === b);
                return found ? found.count : 0;
            }),
            backgroundColor: ['#f43f5e', '#f59e0b', '#6366f1', '#10b981'],
            borderWidth: 0,
            hoverOffset: 8,
        }]
    } : null;

    const timelineChart = stats?.scoreTimeline?.length > 0 ? {
        labels: stats.scoreTimeline.map(d => d._id),
        datasets: [{
            label: 'Avg Score',
            data: stats.scoreTimeline.map(d => d.avgScore?.toFixed(1)),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.06)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            pointHoverRadius: 7,
        }]
    } : null;

    const difficultyChart = stats?.questionDifficulty?.length > 0 ? {
        labels: stats.questionDifficulty.map((q, i) => `Q${i + 1}`),
        datasets: [{
            label: 'Accuracy %',
            data: stats.questionDifficulty.map(q => q.accuracyRate),
            backgroundColor: stats.questionDifficulty.map(q =>
                q.accuracyRate >= 70 ? 'rgba(16,185,129,0.8)' :
                q.accuracyRate >= 40 ? 'rgba(245,158,11,0.8)' : 'rgba(244,63,94,0.8)'
            ),
            borderRadius: 8,
            borderSkipped: false,
        }]
    } : null;

    const kpis = stats ? [
        { label: 'Avg Score', value: `${stats.averageScore}`, sub: `/ ${stats.totalMarks} pts`, icon: FiTrendingUp, gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', shadow: 'shadow-indigo-200' },
        { label: 'Pass Rate', value: `${stats.passRate}%`, sub: `${stats.totalAttempts} attempts`, icon: FiCheckCircle, gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', shadow: 'shadow-emerald-200' },
        { label: 'Completion', value: `${stats.completionRate}%`, sub: `${stats.enrolledStudents} enrolled`, icon: FiUsers, gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', shadow: 'shadow-amber-200' },
        { label: 'Top Score', value: stats.maxScore, sub: `Std Dev: ${stats.stdDev}`, icon: FiAward, gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', shadow: 'shadow-pink-200' },
    ] : [];

    return (
        <div className="min-h-screen bg-[#F6F7FB] font-sans">
            {/* Ambient glows */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] opacity-70 pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-purple-50 rounded-full blur-[80px] opacity-50 pointer-events-none translate-y-1/2 -translate-x-1/3" />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-12 space-y-8">

                {/* ── HEADER ─────────────────────────────────────── */}
                <motion.div variants={fadeUp} initial="hidden" animate="show"
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                                <FiPieChart size={20} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics</h1>
                        </div>
                        <p className="text-slate-500 font-medium pl-1 text-sm">
                            Deep insights powered by MongoDB Aggregation Pipelines
                        </p>
                    </div>

                    <div className="min-w-[280px]">
                        <CustomSelect
                            label="Select Assessment"
                            options={tests.map(t => ({ value: t._id, label: t.title }))}
                            value={selectedTest || ''}
                            onChange={(val) => handleTestSelect(val)}
                            disabled={loading || statsLoading}
                        />
                    </div>
                </motion.div>

                {/* ── NO STATS YET ─────────────────────────────── */}
                {!stats && !statsLoading && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center">
                        <Empty icon={FiBarChart2} title="No data available" desc="Select a test to see detailed analytics." />
                    </div>
                )}

                {/* ── LOADING OVERLAY ──────────────────────────── */}
                {statsLoading && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-16 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">Running aggregation pipeline…</p>
                        </div>
                    </div>
                )}

                {stats && !statsLoading && (
                    <AnimatePresence mode="wait">
                        <motion.div key={selectedTest} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

                            {/* ── KPI GRID ─────────────────────────────────── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {kpis.map((kpi, i) => (
                                    <StatCard key={i} index={i} label={kpi.label} value={kpi.value} sub={kpi.sub} icon={kpi.icon} gradient={kpi.gradient} />
                                ))}
                            </div>

                            {/* ── TAB NAVIGATION ───────────────────────────── */}
                            <div className="flex bg-white border border-slate-100 rounded-2xl p-1.5 w-fit shadow-sm gap-1">
                                {[
                                    { id: 'overview', label: 'Overview', icon: FiBarChart2 },
                                    { id: 'students', label: 'Students', icon: FiUsers },
                                    { id: 'questions', label: 'Questions', icon: FiTarget },
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* ── OVERVIEW TAB ─────────────────────────────── */}
                            {activeTab === 'overview' && (
                                <motion.div variants={fadeUp} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                    {/* Score Distribution Donut */}
                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FiPieChart className="text-indigo-500" size={16} />
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Score Bands</h3>
                                        </div>
                                        {distributionChart ? (
                                            <>
                                                <div className="h-44 flex items-center justify-center">
                                                    <Doughnut data={distributionChart} options={{
                                                        responsive: true, maintainAspectRatio: false, cutout: '72%',
                                                        plugins: { legend: { display: false }, tooltip: {
                                                            backgroundColor: '#0f172a', titleColor: '#e2e8f0',
                                                            bodyColor: '#94a3b8', padding: 12, cornerRadius: 12,
                                                        }}
                                                    }} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    {[
                                                        { label: 'Below 40%', color: '#f43f5e', idx: 0 },
                                                        { label: '40–60%', color: '#f59e0b', idx: 1 },
                                                        { label: '60–80%', color: '#6366f1', idx: 2 },
                                                        { label: '80–100%', color: '#10b981', idx: 3 },
                                                    ].map(band => (
                                                        <div key={band.idx} className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: band.color }} />
                                                            <span className="text-[10px] font-bold text-slate-500">{band.label}</span>
                                                            <span className="ml-auto text-[10px] font-black text-slate-800">
                                                                {distributionChart.datasets[0].data[band.idx]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : <Empty icon={FiPieChart} title="No data" desc="No submissions yet." />}
                                    </div>

                                    {/* Score Timeline Line Chart */}
                                    <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <FiActivity className="text-indigo-500" size={16} />
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Score Timeline</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full uppercase">
                                                Avg per day
                                            </span>
                                        </div>
                                        {timelineChart ? (
                                            <div className="h-52">
                                                <Line data={timelineChart} options={{
                                                    ...baseLineOptions,
                                                    plugins: { ...baseLineOptions.plugins, legend: { display: false } }
                                                }} />
                                            </div>
                                        ) : (
                                            <Empty icon={FiActivity} title="No timeline data" desc="Submissions will appear here over time." />
                                        )}
                                    </div>

                                    {/* Summary stats */}
                                    <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
                                        <div className="flex items-center gap-2 mb-6">
                                            <FiZap className="text-amber-500" size={16} />
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Assessment Summary</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                            {[
                                                { label: 'Total Marks', value: stats.totalMarks, icon: FiStar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                                { label: 'Duration', value: `${stats.duration}m`, icon: FiClock, color: 'text-amber-600', bg: 'bg-amber-50' },
                                                { label: 'Enrolled', value: stats.enrolledStudents, icon: FiUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
                                                { label: 'Attempts', value: stats.totalAttempts, icon: FiActivity, color: 'text-purple-600', bg: 'bg-purple-50' },
                                                { label: 'Max Score', value: stats.maxScore, icon: FiAward, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                                { label: 'Min Score', value: stats.minScore, icon: FiAlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                                                { label: 'Std Deviation', value: stats.stdDev, icon: FiBarChart2, color: 'text-slate-600', bg: 'bg-slate-50' },
                                            ].map((s, i) => (
                                                <div key={i} className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
                                                    <div className={`p-2 rounded-xl ${s.bg} ${s.color} mb-2`}>
                                                        <s.icon size={16} />
                                                    </div>
                                                    <p className="text-xl font-black text-slate-900">{s.value}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── STUDENTS TAB ──────────────────────────────── */}
                            {activeTab === 'students' && (
                                <motion.div variants={fadeUp} initial="hidden" animate="show"
                                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-7 py-5 border-b border-slate-50 flex items-center justify-between">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Student Performance</h3>
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase">
                                            {stats.performance.length} Results
                                        </span>
                                    </div>
                                    {stats.performance.length === 0 ? (
                                        <Empty icon={FiUsers} title="No submissions yet" desc="Students will appear here after submitting." />
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-slate-50/60 text-left">
                                                        {['Rank', 'Student', 'Score', 'Progress', 'Status', 'Time', 'Date'].map(h => (
                                                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {stats.performance.map((p, i) => {
                                                        const pct = stats.totalMarks > 0 ? Math.round((p.score / stats.totalMarks) * 100) : 0;
                                                        const passed = pct >= 50;
                                                        const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 40 ? '#f59e0b' : '#f43f5e';
                                                        const timeMins = p.timeTaken ? Math.round(p.timeTaken / 60000) : null;
                                                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

                                                        return (
                                                            <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <span className="text-base">{medal || <span className="text-sm font-black text-slate-400">#{i + 1}</span>}</span>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                                                                            {p.profileImage
                                                                                ? <img src={p.profileImage.startsWith('http') ? p.profileImage : `http://localhost:3006/${p.profileImage}`} alt="" className="w-full h-full object-cover rounded-full" />
                                                                                : p.studentName?.charAt(0).toUpperCase()
                                                                            }
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-700 text-sm">{p.studentName}</p>
                                                                            <p className="text-[10px] text-slate-400">{p.studentRoll || p.studentEmail}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-xl font-black" style={{ color }}>{p.score}</span>
                                                                    <span className="text-xs text-slate-400 ml-1">/{stats.totalMarks}</span>
                                                                </td>
                                                                <td className="px-6 py-4 min-w-[120px]">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                                                        </div>
                                                                        <span className="text-[10px] font-black" style={{ color }}>{pct}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                                        {passed ? 'Passed' : 'Failed'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                                                                    {timeMins != null ? `${timeMins} min` : '—'}
                                                                </td>
                                                                <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">
                                                                    {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── QUESTIONS TAB ─────────────────────────────── */}
                            {activeTab === 'questions' && (
                                <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">

                                    {/* Bar chart: accuracy per question */}
                                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <FiBarChart2 className="text-indigo-500" size={16} />
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Question Accuracy Rates</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">Hardest → Easiest</span>
                                        </div>
                                        {difficultyChart ? (
                                            <div className="h-56">
                                                <Bar data={difficultyChart} options={{
                                                    ...baseLineOptions,
                                                    scales: {
                                                        ...baseLineOptions.scales,
                                                        y: { ...baseLineOptions.scales.y, min: 0, max: 100, ticks: { ...baseLineOptions.scales.y.ticks, callback: v => `${v}%` } }
                                                    },
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: { ...baseLineOptions.plugins.tooltip, callbacks: { label: c => ` Accuracy: ${c.raw}%` } }
                                                    }
                                                }} />
                                            </div>
                                        ) : <Empty icon={FiBarChart2} title="No question data" desc="Question difficulty data will appear after attempts." />}
                                    </div>

                                    {/* Question detail list */}
                                    {stats.questionDifficulty?.length > 0 && (
                                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="px-7 py-5 border-b border-slate-50">
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Question Breakdown</h3>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {stats.questionDifficulty.map((q, i) => (
                                                    <div key={i} className="px-7 py-5 flex items-center gap-5 hover:bg-slate-50/40 transition-colors">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                                                            Q{i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-700 text-sm truncate">{q.questionText}</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${q.accuracyRate}%`,
                                                                            background: q.accuracyRate >= 70 ? '#10b981' : q.accuracyRate >= 40 ? '#f59e0b' : '#f43f5e'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-black text-slate-500 whitespace-nowrap">{q.accuracyRate}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <DiffBadge pct={q.accuracyRate} />
                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                                                                {q.correctAttempts}/{q.totalAttempts} correct
                                                            </span>
                                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                                                {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
