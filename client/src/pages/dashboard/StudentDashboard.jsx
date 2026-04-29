import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiBook, FiClock, FiStar, FiAward, FiTrendingUp,
    FiLogIn, FiCheckCircle, FiLock
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getTests } from '../../api/testApi';
import { getMyAttempts } from '../../api/attemptApi';
import AuthContext from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import Skeleton, { CardSkeleton } from '../../components/common/Skeleton';

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' } }),
};

// Score bar component
const ScoreBar = ({ score, total }) => {
    const pct = total > 0 ? Math.min((score / total) * 100, 100) : 0;
    const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-indigo-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
            </div>
            <span className={`text-[10px] font-black ${pct >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>{pct.toFixed(0)}%</span>
        </div>
    );
};

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
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

        socket.on('test:published', handleUpdate);
        socket.on('test:updated', handleUpdate);
        socket.on('test:archived', handleUpdate);
        socket.on('test:attempt_reset', handleUpdate);

        return () => {
            socket.off('test:published', handleUpdate);
            socket.off('test:updated', handleUpdate);
            socket.off('test:archived', handleUpdate);
            socket.off('test:attempt_reset', handleUpdate);
        };
    }, [socket, refetchTests, refetchAttempts]);

    const getAttemptForTest = (testId) =>
        attempts.find(a => a.testId?._id === testId || a.testId === testId);

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                <Skeleton className="w-full h-32 rounded-[32px]" />
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
    const avgScore = validAttempts.length > 0
        ? (validAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / validAttempts.length).toFixed(1)
        : '—';
    const highestScore = validAttempts.length > 0
        ? Math.max(...validAttempts.map(a => a.score || 0))
        : '—';

    const kpis = [
        {
            label: 'Available Tests', value: tests.length,
            icon: FiBook, color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-100',
            sub: 'Ready to attempt'
        },
        {
            label: 'Completed', value: completedCount,
            icon: FiCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100',
            sub: 'Tests finished'
        },
        {
            label: 'Best Score', value: highestScore,
            icon: FiAward, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100',
            sub: 'Personal best'
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">

                {/* Welcome Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[32px] p-8 lg:p-10 mb-8 overflow-hidden shadow-none dark:shadow-none flex items-center justify-between group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
                    <div className="relative z-10 flex items-center gap-6 lg:gap-8">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-slate-100 shadow-none dark:shadow-none flex items-center justify-center bg-indigo-50 text-indigo-600 text-3xl font-black shrink-0 overflow-hidden relative">
                            {user?.profileImage ? (
                                <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:3006/${user.profileImage}`} alt="Profile" className="w-full h-full object-cover rounded-full" loading="eager" fetchpriority="high" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'S'
                            )}
                        </div>
                        <div>
                            <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                Welcome back
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
                                {user?.name?.split(' ')[0] || 'Student'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                                Ready for today's assessment? Keep the streak going.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={i}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-none flex items-center gap-4 group hover:border-indigo-500/30 transition-all duration-300"
                        >
                            <div className={`p-3.5 ${kpi.bg} ${kpi.color} rounded-2xl ring-4 ${kpi.ring} shrink-0`}>
                                <kpi.icon size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{kpi.label}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{kpi.value}</p>
                                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{kpi.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Management Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Available Tests (2/3 wide) */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-1 h-6 bg-indigo-600 rounded-full" />
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Available Assessments</h2>
                            <span className="ml-auto text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                {tests.length} total
                            </span>
                        </div>
                        <div className="grid gap-3">
                            {tests.length === 0 ? (
                                <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-10 rounded-[24px] border border-slate-100 dark:border-white/[0.06] text-center">
                                    <FiBook size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-400 font-semibold text-sm">No tests available yet</p>
                                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Your instructor hasn't published any tests.</p>
                                </div>
                            ) : tests.map((test, idx) => {
                                const attempt = getAttemptForTest(test._id);
                                const isDone = attempt && attempt.status !== 'IN_PROGRESS';
                                const isInProgress = attempt && attempt.status === 'IN_PROGRESS';
                                return (
                                    <motion.div
                                        key={test._id}
                                        custom={idx}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        className={`bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-5 rounded-[22px] flex items-center justify-between gap-4 border transition-all duration-300 ${isDone
                                                ? 'border-slate-100 dark:border-white/[0.06]'
                                                : 'border-slate-100 dark:border-white/[0.06] hover:border-indigo-200 dark:hover:border-indigo-500/30 cursor-pointer'
                                            }`}
                                        onClick={() => !isDone && navigate(`/test/${test._id}`)}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${isDone
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : isInProgress
                                                        ? 'bg-amber-100 text-amber-600'
                                                        : 'bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                                }`}>
                                                {isDone ? <FiAward size={19} /> : isInProgress ? <FiClock size={19} /> : <FiBook size={19} />}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{test.title}</h3>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1">
                                                    <span className="flex items-center gap-1"><FiClock size={10} /> {test.duration} min</span>
                                                    <span className="flex items-center gap-1"><FiStar size={10} /> {test.totalMarks} marks</span>
                                                </div>
                                                {isDone && (
                                                    <ScoreBar score={attempt.score} total={test.totalMarks} />
                                                )}
                                                {isDone && (
                                                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                        Score: {attempt.score} / {test.totalMarks}
                                                    </span>
                                                )}
                                                {isInProgress && (
                                                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                        In Progress
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            disabled={isDone}
                                            onClick={(e) => { e.stopPropagation(); if (!isDone) navigate(`/test/${test._id}`); }}
                                            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs shrink-0 active:scale-95 ${isDone
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                    : isInProgress
                                                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                                                        : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md'
                                                }`}
                                        >
                                            {isDone
                                                ? <><FiLock size={11} /> Done</>
                                                : isInProgress
                                                    ? <><FiClock size={11} /> Resume</>
                                                    : <><FiLogIn size={11} /> Start</>
                                            }
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* My Results */}
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">My Results</h2>
                            {validAttempts.length > 0 && (
                                <span className="ml-auto text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                    {completedCount} done
                                </span>
                            )}
                        </div>
                        <div className="space-y-3">
                            {validAttempts.length === 0 ? (
                                <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-10 rounded-[22px] border border-slate-100 dark:border-white/[0.06] text-center">
                                    <FiTrendingUp size={32} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-400 font-semibold text-sm">No attempts yet</p>
                                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Start a test to see your results.</p>
                                </div>
                            ) : validAttempts.slice(0, 6).map((a, i) => {
                                const total = a.testId?.totalMarks ?? 0;
                                const pct = total > 0 ? Math.round((a.score / total) * 100) : 0;
                                const passed = pct >= 50;
                                return (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-5 rounded-[22px] border border-slate-100 dark:border-white/[0.06]"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight truncate">{a.testId?.title || 'Test'}</p>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums">{a.score}</p>
                                                <p className="text-[10px] font-bold text-slate-400">/{total} pts</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-red-400'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 + 0.4 }}
                                                />
                                            </div>
                                            <span className={`text-[10px] font-black ${passed ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</span>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Leaderboard CTA */}
                            <button
                                onClick={() => navigate('/leaderboard')}
                                className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg dark:shadow-none active:scale-95"
                            >
                                <FiAward size={15} />
                                View Full Leaderboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
