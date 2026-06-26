import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen, Clock, Award, TrendingUp,
    ArrowRight, CheckCircle2, Play, BarChart3,
    Target, Layers, ChevronRight
} from 'lucide-react';

import { getTests } from '../../api/testApi';
import { getMyAttempts } from '../../api/attemptApi';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import Skeleton, { CardSkeleton } from '../../components/common/Skeleton';

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' } }),
};

// Animated progress bar
const ProgressBar = ({ value, className = '' }) => (
    <div className={`h-1 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden ${className}`}>
        <motion.div
            className="h-full rounded-full bg-slate-900 dark:bg-white/80"
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
    </div>
);

const StudentDashboard = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const { data: testsData, isLoading: testsLoading, refetch: refetchTests } = useQuery({
        queryKey: ['student-tests'],
        queryFn: () => getTests().then(r => r.data.data || []),
    });

    const { data: attemptsData, isLoading: attemptsLoading, refetch: refetchAttempts } = useQuery({
        queryKey: ['my-attempts'],
        queryFn: () => getMyAttempts().then(r => r.data.data || []),
    });

    const tests = testsData || [];
    const attempts = attemptsData || [];
    const loading = testsLoading || attemptsLoading;

    // Real-time listeners
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            refetchTests();
            refetchAttempts();
        };

        socket.on('test:created', handleUpdate);
        socket.on('test:published', handleUpdate);
        socket.on('test:updated', handleUpdate);
        socket.on('test:archived', handleUpdate);
        socket.on('test:restored', handleUpdate);
        socket.on('test:deleted', handleUpdate);
        socket.on('test:attempt_reset', handleUpdate);
        socket.on('test:attempt_submitted', handleUpdate);
        socket.on('leaderboard:update', handleUpdate);

        return () => {
            socket.off('test:created', handleUpdate);
            socket.off('test:published', handleUpdate);
            socket.off('test:updated', handleUpdate);
            socket.off('test:archived', handleUpdate);
            socket.off('test:restored', handleUpdate);
            socket.off('test:deleted', handleUpdate);
            socket.off('test:attempt_reset', handleUpdate);
            socket.off('test:attempt_submitted', handleUpdate);
            socket.off('leaderboard:update', handleUpdate);
        };
    }, [socket, refetchTests, refetchAttempts]);

    const getAttemptForTest = (testId) => {
        if (!attempts || attempts.length === 0) return null;
        const testAttempts = attempts.filter(a => (a.testId?._id === testId || a.testId === testId));
        if (testAttempts.length === 0) return null;

        // Prioritize SUBMITTED or AUTO_SUBMITTED attempts over IN_PROGRESS
        const completedAttempts = testAttempts.filter(a => a.status !== 'IN_PROGRESS');
        if (completedAttempts.length > 0) {
            return completedAttempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        }

        // Fallback to the latest IN_PROGRESS attempt
        return testAttempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                <Skeleton className="w-full h-32 rounded-[28px]" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <CardSkeleton /><CardSkeleton /><CardSkeleton />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                        <Skeleton className="w-1/3 h-6 mb-5" />
                        <CardSkeleton /><CardSkeleton />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="w-1/2 h-6 mb-5" />
                        <CardSkeleton /><CardSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );

    // Filter out any attempts whose test reference is null (archived/deleted tests)
    const validAttemptsUnfiltered = attempts.filter(a => a.testId !== null && a.testId !== undefined);

    // Deduplicate attempts: keep only the most recent attempt for each test
    const validAttempts = validAttemptsUnfiltered.reduce((acc, curr) => {
        const testIdStr = curr.testId?._id || curr.testId;
        if (!acc.some(a => (a.testId?._id || a.testId) === testIdStr)) {
            acc.push(curr);
        }
        return acc;
    }, []);

    const completedCount = validAttempts.filter(a => a.status !== 'IN_PROGRESS').length;

    const highestScore = validAttempts.length > 0
        ? Math.max(...validAttempts.map(a => a.score || 0))
        : '\u2014';

    const avgScore = validAttempts.length > 0
        ? Math.round(validAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / validAttempts.length)
        : 0;

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">

                {/* ── Welcome Banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] rounded-[28px] p-8 lg:p-10 mb-6 overflow-hidden"
                >
                    <div className="flex items-center gap-6 lg:gap-8">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 text-3xl sm:text-4xl font-semibold shrink-0 overflow-hidden">
                            {user?.profileImage ? (
                                <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:3006/${user.profileImage}`} alt="Profile" className="w-full h-full object-cover rounded-2xl" loading="eager" fetchpriority="high" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'S'
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-slate-400 dark:text-slate-500 font-medium text-xs uppercase tracking-widest mb-1">
                                Welcome back
                            </p>
                            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {user?.name || 'Student'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 hidden sm:block">
                                Ready for your next assessment? Your progress is looking great.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    {[
                        { label: 'Available', value: tests.length, icon: Layers, suffix: 'tests' },
                        { label: 'Completed', value: completedCount, icon: CheckCircle2, suffix: 'done' },
                        { label: 'Best Score', value: highestScore, icon: Target, suffix: 'pts' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            className="bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] rounded-[20px] p-4 sm:p-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                <stat.icon size={15} strokeWidth={1.5} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">{stat.value}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{stat.suffix}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Main Content Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* ── Assessments Panel (3/5) ── */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] rounded-[24px] overflow-hidden">
                            {/* Panel header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.04]">
                                <div className="flex items-center gap-2.5">
                                    <BookOpen size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
                                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Assessments</h2>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] px-2.5 py-1 rounded-lg uppercase tracking-widest tabular-nums">
                                    {tests.length}
                                </span>
                            </div>

                            {/* Test list */}
                            <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                                {tests.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <BookOpen size={28} strokeWidth={1.2} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium text-sm">No assessments available</p>
                                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Check back once your instructor publishes a test.</p>
                                    </div>
                                ) : tests.map((test, idx) => {
                                    const attempt = getAttemptForTest(test._id);
                                    const isDone = attempt && attempt.status !== 'IN_PROGRESS';
                                    const isInProgress = attempt && attempt.status === 'IN_PROGRESS';
                                    const pct = isDone && test.totalMarks > 0 ? Math.round((attempt.score / test.totalMarks) * 100) : 0;

                                    return (
                                        <motion.div
                                            key={test._id}
                                            custom={idx}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="show"
                                            className={`px-6 py-4 flex items-center gap-4 transition-colors duration-200 ${!isDone ? 'cursor-pointer hover:bg-slate-50/60 dark:hover:bg-white/[0.02]' : ''}`}
                                            onClick={() => !isDone && navigate(`/test/${test._id}`)}
                                        >
                                            {/* Left: status indicator */}
                                            <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                    isDone
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : isInProgress
                                                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                            : 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500'
                                                }`}>
                                                    {isDone ? <CheckCircle2 size={18} strokeWidth={1.8} /> : isInProgress ? <Clock size={18} strokeWidth={1.8} /> : <BookOpen size={18} strokeWidth={1.8} />}
                                                </div>
                                            </div>

                                            {/* Center: info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{test.title}</h3>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1"><Clock size={10} strokeWidth={1.5} /> {test.duration} min</span>
                                                    <span className="w-px h-3 bg-slate-200 dark:bg-white/10" />
                                                    <span className="flex items-center gap-1"><Target size={10} strokeWidth={1.5} /> {test.totalMarks} marks</span>
                                                </div>
                                                {isDone && (
                                                    <div className="mt-2.5 flex items-center gap-3">
                                                        <ProgressBar value={pct} className="flex-1" />
                                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums w-14 text-right">{attempt.score}/{test.totalMarks}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: action */}
                                            <div className="shrink-0">
                                                {isDone ? (
                                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Submitted</span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/test/${test._id}`); }}
                                                        className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors active:scale-95 ${
                                                            isInProgress
                                                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                                : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {isInProgress ? (
                                                            <><Play size={11} strokeWidth={2} /> Resume</>
                                                        ) : (
                                                            <><ArrowRight size={11} strokeWidth={2} /> Start</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Results Panel (2/5) ── */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] rounded-[24px] overflow-hidden">
                            {/* Panel header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.04]">
                                <div className="flex items-center gap-2.5">
                                    <BarChart3 size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
                                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Results</h2>
                                </div>
                                {validAttempts.length > 0 && (
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] px-2.5 py-1 rounded-lg uppercase tracking-widest tabular-nums">
                                        {completedCount}
                                    </span>
                                )}
                            </div>

                            {/* Results list */}
                            <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                                {validAttempts.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <TrendingUp size={28} strokeWidth={1.2} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium text-sm">No results yet</p>
                                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Complete an assessment to see your scores.</p>
                                    </div>
                                ) : validAttempts.slice(0, 6).map((a, i) => {
                                    const total = a.testId?.totalMarks ?? 0;
                                    const pct = total > 0 ? Math.round((a.score / total) * 100) : 0;

                                    return (
                                        <motion.div
                                            key={i}
                                            custom={i}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="show"
                                            className="px-6 py-4"
                                        >
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm leading-tight truncate">{a.testId?.title || 'Test'}</p>
                                                <div className="text-right shrink-0 flex items-baseline gap-1">
                                                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{a.score}</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">/{total}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-1 h-1 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full bg-slate-900 dark:bg-white/80"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 + 0.3 }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Leaderboard CTA */}
                            <div className="p-4 pt-2">
                                <button
                                    onClick={() => navigate('/leaderboard')}
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <Award size={15} strokeWidth={1.8} />
                                    View Leaderboard
                                    <ChevronRight size={14} strokeWidth={2} className="ml-auto" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
