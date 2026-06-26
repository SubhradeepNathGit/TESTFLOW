import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiUser, FiBarChart2, FiChevronRight
} from 'react-icons/fi';
import { Crown, Medal, Trophy } from 'lucide-react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useSocket } from '../../hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import Skeleton, { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';

// Rank badge icon for the table
const RankBadge = ({ rank }) => {
    if (rank === 1) return (
        <span className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
            <Crown size={20} strokeWidth={2.5} />
        </span>
    );
    if (rank === 2) return (
        <span className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/20">
            <Medal size={20} strokeWidth={2.5} />
        </span>
    );
    if (rank === 3) return (
        <span className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
            <Medal size={20} strokeWidth={2.5} />
        </span>
    );
    return (
        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/[0.05] border border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold text-sm shrink-0">
            {rank}
        </span>
    );
};

// Podium avatar medal pin
const PodiumMedalPin = ({ rank }) => {
    if (rank === 1) return (
        <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 text-amber-500 z-10">
            <Crown size={16} strokeWidth={2.5} />
        </span>
    );
    if (rank === 2) return (
        <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 z-10">
            <Medal size={14} strokeWidth={2.5} />
        </span>
    );
    return (
        <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-orange-500 z-10">
            <Medal size={14} strokeWidth={2.5} />
        </span>
    );
};

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 + 0.3, duration: 0.35, ease: 'easeOut' } }),
};

const getProfileUrl = (img) => {
    if (!img || img === 'no-photo.jpg') return null;
    if (img.startsWith('http')) return img;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:3006';
    return `${baseUrl}/${img}`;
};

// Podium card for top 3 students
const PodiumCard = ({ student, rank, delay }) => {
    const heights = [220, 170, 140];
    const displayRank = [1, 2, 3][rank];
    const isFirst = displayRank === 1;

    // Premium elegant gradients and borders instead of primary vibrant ones
    const podiumStyles = [
        {
            bg: 'bg-indigo-100/70 dark:bg-indigo-500/10',
            border: 'border-indigo-200 dark:border-indigo-500/20',
            text: 'text-indigo-600 dark:text-indigo-400',
            score: 'text-indigo-700 dark:text-indigo-300'
        },
        {
            bg: 'bg-slate-100/70 dark:bg-slate-800/50',
            border: 'border-slate-300 dark:border-slate-700',
            text: 'text-slate-500 dark:text-slate-400',
            score: 'text-slate-700 dark:text-slate-300'
        },
        {
            bg: 'bg-orange-100/70 dark:bg-orange-500/10',
            border: 'border-orange-200 dark:border-orange-500/20',
            text: 'text-orange-600 dark:text-orange-400',
            score: 'text-orange-700 dark:text-orange-300'
        }
    ];

    const style = podiumStyles[displayRank - 1];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 flex-1 min-w-0"
        >
            {/* Avatar */}
            <div
                className={`relative rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 transition-all duration-300 hover:scale-105`}
                style={{
                    width: isFirst ? 88 : 64,
                    height: isFirst ? 88 : 64,
                    boxShadow: isFirst
                        ? '0 12px 24px -8px rgba(99,102,241,0.25)'
                        : '0 8px 16px -6px rgba(0,0,0,0.1)',
                }}
            >
                {getProfileUrl(student.profileImage) ? (
                    <img src={getProfileUrl(student.profileImage)} alt={student.name} className="w-full h-full object-cover rounded-full" loading="eager" fetchpriority="high" />
                ) : (
                    <FiUser size={isFirst ? 34 : 24} className="text-slate-400" />
                )}
                <PodiumMedalPin rank={displayRank} />
            </div>

            {/* Info */}
            <div className="text-center min-w-0 w-full px-2 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl py-2.5 shadow-sm border border-slate-100 dark:border-slate-800/80 -mt-8 relative transition-transform hover:-translate-y-1">
                <p className={`font-bold truncate ${isFirst ? 'text-slate-900 dark:text-slate-100 text-base' : 'text-slate-700 dark:text-slate-300 text-sm'}`}>{student.name}</p>
                <p className={`font-black tracking-tight ${isFirst ? 'text-2xl text-indigo-600 dark:text-indigo-400' : 'text-lg text-slate-700 dark:text-slate-300'}`}>{student.totalScore}</p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                    {student.testsTaken} tests · avg {student.avgScore}
                </p>
            </div>

            {/* Podium bar */}
            <div
                className={`w-full rounded-2xl flex flex-col items-center justify-start pt-6 border-t border-l border-r ${style.bg} ${style.border} relative overflow-hidden group`}
                style={{
                    height: heights[displayRank - 1],
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5 mix-blend-overlay pointer-events-none" />
                <span className={`text-5xl font-black ${style.text} opacity-20 group-hover:opacity-40 transition-opacity duration-300`}>#{displayRank}</span>
            </div>
        </motion.div>
    );
};

// Main leaderboard component
const Leaderboard = () => {
    const socket = useSocket();

    const { data, isLoading: loading, refetch } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const { data } = await api.get('/tests/leaderboard');
            return data.data || [];
        },
        onError: () => toast.error('Failed to load leaderboard'),
    });

    const leaderboard = data || [];

    useEffect(() => {
        if (!socket) return;
        socket.on('leaderboard:update', refetch);
        socket.on('test:deleted', refetch);
        socket.on('test:archived', refetch);
        return () => {
            socket.off('leaderboard:update', refetch);
            socket.off('test:deleted', refetch);
            socket.off('test:archived', refetch);
        };
    }, [socket, refetch]);

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10 mb-8" />
                <div className="bg-white dark:bg-black dark:backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[32px] p-8">
                    <div className="flex items-end justify-center gap-6 lg:gap-10">
                        <Skeleton className="w-32 h-40 rounded-2xl" />
                        <Skeleton className="w-40 h-56 rounded-2xl" />
                        <Skeleton className="w-32 h-32 rounded-2xl" />
                    </div>
                </div>
                <div className="bg-white dark:bg-black dark:backdrop-blur-xl rounded-[32px] border border-slate-200 dark:border-white/5 overflow-hidden p-6">
                    <TableSkeleton rows={5} />
                </div>
            </div>
        </div>
    );

    const top3 = leaderboard.slice(0, 3);
    // Podium visual order: 2nd (left), 1st (centre), 3rd (right)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
    const podiumRanks = [1, 0, 2];

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10 font-sans selection:bg-indigo-500/30 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">

                {/* Page header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-white dark:bg-black dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-sm">
                            <Trophy size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Global Leaderboard</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Top performers ranked by cumulative score</p>
                        </div>
                    </div>
                </motion.div>

                {leaderboard.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-black dark:backdrop-blur-xl rounded-[32px] border border-slate-200 dark:border-white/5 p-16 text-center shadow-sm"
                    >
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/[0.04] rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                            <FiBarChart2 size={32} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">No Rankings Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed">
                            The competition hasn't started! Students need to complete assessments before rankings appear here.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* Podium Section */}
                        {top3.length >= 2 && (
                            <div className="bg-white dark:bg-black dark:backdrop-blur-xl rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm p-8 lg:p-12 mb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                                
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-12 flex items-center justify-center gap-2">
                                    <Crown size={14} className="text-amber-500" /> Top Performers
                                </p>
                                <div className="flex items-end justify-center gap-3 sm:gap-6 lg:gap-12 relative z-10 max-w-3xl mx-auto">
                                    {podiumOrder.map((student, i) => (
                                        student && (
                                            <PodiumCard
                                                key={student.name}
                                                student={student}
                                                rank={podiumRanks[i]}
                                                delay={i * 0.12}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rankings Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="bg-white dark:bg-black dark:backdrop-blur-xl rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-8"
                        >
                            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <FiTrendingUp size={18} className="text-indigo-500" />
                                    Full Rankings
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/5 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                    {leaderboard.length} Ranked
                                </span>
                            </div>

                            {/* Column heads */}
                            <div className="flex items-center justify-between px-6 py-3 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rank · Student</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Score</span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {leaderboard.map((student, idx) => (
                                    <motion.div
                                        key={idx}
                                        custom={idx}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank badge */}
                                            <RankBadge rank={idx + 1} />
                                            {/* Avatar circle */}
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-400 shrink-0 group-hover:ring-2 group-hover:ring-indigo-500/20 transition-all overflow-hidden">
                                                {getProfileUrl(student.profileImage) ? (
                                                    <img src={getProfileUrl(student.profileImage)} alt={student.name} className="w-full h-full object-cover rounded-full" loading="eager" fetchpriority="high" />
                                                ) : (
                                                    <FiUser size={16} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.name}</h4>
                                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {student.testsTaken} {student.testsTaken === 1 ? 'test' : 'tests'} completed
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 dark:text-slate-100 text-lg tabular-nums">{student.totalScore}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                                avg {student.avgScore} pts
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Footer Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white dark:bg-black dark:backdrop-blur-xl border border-slate-200 dark:border-white/5 p-6 sm:p-8 rounded-[32px] flex items-center gap-6 shadow-sm relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-500/5 pointer-events-none" />
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                                <FiTrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0 z-10">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Keep Competing!</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                                    Rankings update based on cumulative score. Take more tests to climb higher.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
