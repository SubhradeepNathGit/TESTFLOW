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
import { useTheme } from '../../context/ThemeContext';
import {
    FiBarChart2, FiUsers, FiAward, FiTrendingUp,
    FiPieChart, FiTarget, FiActivity, FiCheckCircle,
    FiAlertTriangle, FiClock, FiStar
} from 'react-icons/fi';
import { Medal, Trophy, Award } from 'lucide-react';
import CustomSelect from '../../components/common/CustomSelect';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Skeleton, { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';

ChartJS.register(
    ArcElement, ChartTooltip, ChartLegend,
    CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, Filler
);

// Chart defaults
const chartFont = { family: "'Inter', system-ui, sans-serif", weight: '700' };
const gridColor = 'rgba(148,163,184,0.08)';
const baseLineOptions = (isDark) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
        legend: { display: false }, tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#0f172a',
            titleColor: isDark ? '#f8fafc' : '#e2e8f0',
            bodyColor: isDark ? '#94a3b8' : '#94a3b8',
            padding: 12, cornerRadius: 12, titleFont: chartFont,
        }
    },
    scales: {
        x: { grid: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: chartFont } },
        y: { grid: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: chartFont } },
    }
});

// Animation variants
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};

// Stat card component
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

// Empty state component
const Empty = ({ icon: Icon, title, desc }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4">
            <Icon size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="font-bold text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{desc}</p>
    </div>
);

// Difficulty badge component
const DiffBadge = ({ pct }) => {
    if (pct >= 70) return <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black rounded-full uppercase">Easy</span>;
    if (pct >= 40) return <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black rounded-full uppercase">Medium</span>;
    return <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black rounded-full uppercase">Hard</span>;
};

// Main analytics component
const AnalyticsDashboard = () => {
    const socket = useSocket();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
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
        <div className="min-h-screen bg-[#F6F7FB] dark:bg-black font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
                <div className="flex justify-between mb-8">
                    <Skeleton className="w-1/3 h-12" />
                    <Skeleton className="w-48 h-12 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
                </div>
                <CardSkeleton />
            </div>
        </div>
    );

    // Chart data builders
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
        { label: 'Avg Score', value: `${stats.averageScore}`, sub: `/ ${stats.totalMarks} pts`, icon: FiTrendingUp, gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', shadow: 'dark:shadow-none' },
        { label: 'Pass Rate', value: `${stats.passRate}%`, sub: `${stats.totalAttempts} attempts`, icon: FiCheckCircle, gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', shadow: 'dark:shadow-none' },
        { label: 'Completion', value: `${stats.completionRate}%`, sub: `${stats.enrolledStudents} enrolled`, icon: FiUsers, gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', shadow: 'dark:shadow-none' },
        { label: 'Top Score', value: stats.maxScore, sub: `Std Dev: ${stats.stdDev}`, icon: FiAward, gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', shadow: 'dark:shadow-none' },
    ] : [];

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10"
                >
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2">
                            Intelligence <span className="text-slate-400 dark:text-slate-500 font-light">Suite</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Deep assessment analytics and performance trends.</p>
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

                <div className={`bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none dark:shadow-none min-h-[500px] relative overflow-hidden group flex flex-col ${tests.length === 0 ? 'items-center justify-center' : ''}`}>
                    {tests.length === 0 ? (
                        <Empty icon={FiActivity} title="No Assessments" desc="Launch your first test to see analytics." />
                    ) : (
                        <div className="space-y-10">
                            {/* Tab navigation */}
                            <div className="flex flex-wrap bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-1.5 rounded-[22px] border border-slate-100 dark:border-white/5 shadow-none dark:shadow-none w-fit gap-1">
                                {[
                                    { id: 'overview', icon: FiPieChart, label: 'Overview' },
                                    { id: 'participants', icon: FiUsers, label: 'Participants' },
                                    { id: 'questions', icon: FiTarget, label: 'Questions' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-none dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {!stats && !statsLoading ? (
                                <Empty icon={FiBarChart2} title="No data available" desc="Select a test to see detailed analytics." />
                            ) : statsLoading ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <CardSkeleton />
                                        <div className="lg:col-span-2"><CardSkeleton /></div>
                                    </div>
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                        {/* Overview Tab Content */}
                                        {activeTab === 'overview' && (
                                            <div className="space-y-10">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <StatCard index={0} label="Success Rate" value={`${stats?.completionRate || 0}%`} icon={FiAward} gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" />
                                                    <StatCard index={1} label="Participants" value={stats?.completedStudentCount || 0} sub={stats?.enrolledStudents} icon={FiUsers} gradient="linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" />
                                                    <StatCard index={2} label="Average Score" value={stats?.averageScore || 0} icon={FiTrendingUp} gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
                                                    <StatCard index={3} label="Total Items" value={stats?.totalQuestions || 0} icon={FiTarget} gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                    <div className="lg:col-span-2 space-y-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Score Distribution</h3>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Student Performance Spread</p>
                                                        </div>
                                                        <div className="h-[320px]">
                                                            {stats?.performance?.length > 0 ? (
                                                                <Bar
                                                                    data={{
                                                                        labels: stats.performance.map(p => p.studentName.split(' ')[0]),
                                                                        datasets: [{
                                                                            data: stats.performance.map(p => p.score),
                                                                            backgroundColor: '#6366f1',
                                                                            borderRadius: 8,
                                                                            barThickness: 32,
                                                                        }]
                                                                    }}
                                                                    options={baseLineOptions(isDark)}
                                                                />
                                                            ) : <Empty icon={FiActivity} title="Insufficient Data" desc="Scores will appear here once students submit." />}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Completion Status</h3>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Submission Tracking</p>
                                                        </div>
                                                        <div className="h-[320px] flex items-center justify-center">
                                                            {stats ? (
                                                                <Doughnut
                                                                    data={{
                                                                        labels: ['Completed', 'Pending'],
                                                                        datasets: [{
                                                                            data: [stats.completedStudentCount, stats.enrolledStudents - stats.completedStudentCount],
                                                                            backgroundColor: ['#6366f1', isDark ? '#334155' : '#e2e8f0'],
                                                                            borderWidth: 0,
                                                                            cutout: '80%',
                                                                        }]
                                                                    }}
                                                                    options={{
                                                                        plugins: { legend: { display: false } },
                                                                        maintainAspectRatio: false
                                                                    }}
                                                                />
                                                            ) : <Empty icon={FiActivity} title="Status Unknown" desc="Waiting for test data..." />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Participants Tab Content */}
                                        {activeTab === 'participants' && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Exam Roster</h3>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Detailed Student Performance</p>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-black/50">
                                                                {['Student', 'Roll Number', 'Score', 'Status', 'Accuracy'].map(h => (
                                                                    <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                                            {stats?.performance?.map((p, i) => (
                                                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                                                    <td className="px-6 py-5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs">
                                                                                {p.profileImage
                                                                                    ? <img src={p.profileImage.startsWith('http') ? p.profileImage : `http://localhost:3006/${p.profileImage}`} alt="" className="w-full h-full object-cover rounded-full" loading="eager" fetchpriority="high" />
                                                                                    : p.studentName?.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-bold text-slate-700 dark:text-slate-300">{p.studentName}</p>
                                                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.studentEmail}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-5 text-sm font-bold text-slate-500 dark:text-slate-400">{p.studentRoll || 'N/A'}</td>
                                                                    <td className="px-6 py-5">
                                                                        <span className="text-lg font-black text-slate-800 dark:text-slate-200">{p.score}</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-bold">PTS</span>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'SUBMITTED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                                                            {p.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden min-w-[60px]">
                                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.score / (stats.totalMarks || 1)) * 100}%` }} />
                                                                            </div>
                                                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{Math.round((p.score / (stats.totalMarks || 1)) * 100)}%</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Questions Tab Content */}
                                        {activeTab === 'questions' && (
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Item Analysis</h3>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Accuracy Per Question</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {stats?.questionDifficulty?.map((q, i) => (
                                                        <div key={i} className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-none group hover:border-indigo-500/30 transition-all duration-300">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="w-8 h-8 bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-xl flex items-center justify-center text-xs font-black text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5">
                                                                    {i + 1}
                                                                </span>
                                                                <DiffBadge pct={q.accuracyRate} />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">{q.questionText}</p>
                                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                                                <div className="flex items-center gap-2">
                                                                    <FiCheckCircle className="text-emerald-500" />
                                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accuracy</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    <DiffBadge pct={q.accuracyRate} />
                                                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{q.accuracyRate}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
