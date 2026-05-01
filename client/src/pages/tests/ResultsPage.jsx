import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiAward, FiArrowLeft, FiTrendingUp, FiCheckCircle,
    FiXCircle, FiBarChart2, FiClock, FiRepeat
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getMyAttempts } from '../../api/attemptApi';
import Skeleton, { CardSkeleton } from '../../components/common/Skeleton';

// Score ring component
const ScoreRing = ({ score, total, size = 160, stroke = 10 }) => {
    const pct = total > 0 ? Math.min(score / total, 1) : 0;
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct);
    const pctLabel = Math.round(pct * 100);
    const color = pct >= 0.8 ? '#22c55e' : pct >= 0.6 ? '#6366f1' : pct >= 0.4 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100 dark:text-white/10" />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <motion.span
                    className="text-4xl font-black"
                    style={{ color }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                >
                    {pctLabel}%
                </motion.span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
            </div>
        </div>
    );
};

const getGrade = (pct) => {
    if (pct >= 0.9) return { grade: 'A+', label: 'Outstanding', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
    if (pct >= 0.8) return { grade: 'A', label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
    if (pct >= 0.7) return { grade: 'B+', label: 'Very Good', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' };
    if (pct >= 0.6) return { grade: 'B', label: 'Good', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' };
    if (pct >= 0.5) return { grade: 'C', label: 'Average', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' };
    if (pct >= 0.4) return { grade: 'D', label: 'Below Average', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' };
    return { grade: 'F', label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50 border-red-100' };
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 + 0.6, duration: 0.4, ease: 'easeOut' } }),
};

const ResultsPage = () => {
    const navigate = useNavigate();
    const [lastAttempt, setLastAttempt] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const { data } = await getMyAttempts();
                setLastAttempt(data.data[0]);
            } catch { /* silent */ }
            finally { setLoading(false); }
        };
        fetchResults();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black flex items-center justify-center p-4 sm:p-5 lg:p-10">
            <div className="w-full max-w-lg">
                <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none">
                    <Skeleton className="h-48 w-full rounded-none" />
                    <div className="flex justify-center -mt-20 relative z-10 mb-8">
                        <Skeleton className="w-[160px] h-[160px] rounded-full border-4 border-white dark:border-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 sm:px-7 mb-7">
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );

    const score = lastAttempt?.score ?? 0;
    const total = lastAttempt?.testId?.totalMarks ?? lastAttempt?.totalMarks ?? 100;
    const pct = total > 0 ? score / total : 0;
    const passed = pct >= 0.5;
    const gradeInfo = getGrade(pct);
    const testTitle = lastAttempt?.testId?.title || 'Assessment';
    const duration = lastAttempt?.testId?.duration;

    const stats = [
        {
            icon: FiBarChart2,
            label: 'Your Score',
            value: `${score} / ${total}`,
            sub: 'Points earned',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            icon: passed ? FiCheckCircle : FiXCircle,
            label: 'Result',
            value: passed ? 'PASSED' : 'FAILED',
            sub: passed ? 'Well done!' : 'Keep practicing',
            color: passed ? 'text-emerald-600' : 'text-red-500',
            bg: passed ? 'bg-emerald-50' : 'bg-red-50',
        },
        {
            icon: FiTrendingUp,
            label: 'Grade',
            value: gradeInfo.grade,
            sub: gradeInfo.label,
            color: gradeInfo.color,
            bg: gradeInfo.bg.split(' ')[0],
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black flex items-center justify-center p-4 sm:p-5 lg:p-10">
            <div className="w-full max-w-lg">

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border border-white/[0.06] dark:border-white/[0.08] rounded-[28px] overflow-hidden shadow-xl dark:shadow-none"
                >
                    {/* Top gradient header */}
                    <div className="bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 p-8 pb-24 text-center relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none animate-pulse" />
                        <div className="absolute -left-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-indigo-200/80 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Assessment Complete</p>
                            <h1 className="text-3xl font-black text-white mb-1 px-4 drop-shadow-2xl tracking-tight">{testTitle}</h1>
                        </div>
                    </div>

                    {/* Score Ring */}
                    <div className="flex justify-center -mt-[80px] relative z-10 mb-2">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 250 }}
                            className="w-[160px] h-[160px] bg-white dark:bg-black/60 rounded-full border-4 border-white dark:border-white/[0.08] flex items-center justify-center shadow-xl dark:shadow-none"
                        >
                            <ScoreRing score={score} total={total} size={148} stroke={9} />
                        </motion.div>
                    </div>

                    {/* Grade Badge */}
                    <div className="flex justify-center mb-7">
                        <motion.span
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${gradeInfo.color} ${gradeInfo.bg}`}
                        >
                            <FiAward size={12} />
                            {gradeInfo.grade} · {gradeInfo.label}
                        </motion.span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 sm:px-7 mb-7">
                        {stats.map((s, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={cardVariants}
                                initial="hidden"
                                animate="show"
                                className="bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-4 text-center"
                            >
                                <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                                    <s.icon size={16} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                                <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{s.sub}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="px-7 pb-8 space-y-3"
                    >
                        <button
                            onClick={() => navigate('/student-dashboard')}
                            className="w-full bg-slate-950 dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-xl active:scale-95"
                        >
                            <FiArrowLeft size={14} />
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/leaderboard')}
                            className="w-full bg-indigo-50 dark:bg-white/[0.05] border border-indigo-100 dark:border-white/[0.08] text-indigo-700 dark:text-indigo-400 font-black py-3.5 rounded-2xl hover:bg-indigo-100 dark:hover:bg-white/[0.1] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95"
                        >
                            <FiTrendingUp size={14} />
                            View Leaderboard
                        </button>
                        <p className="text-center text-[11px] font-semibold text-slate-400">
                            Detailed question-by-question analysis coming soon.
                        </p>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
};

export default ResultsPage;
