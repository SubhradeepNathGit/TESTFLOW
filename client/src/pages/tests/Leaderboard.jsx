import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, TrendingUp, User, BarChart3, ChevronUp } from 'lucide-react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useSocket } from '../../hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import Skeleton, { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';

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

// ── Podium card for top 3 ──
const PodiumCard = ({ student, rank, delay }) => {
    const displayRank = [1, 2, 3][rank];
    const isFirst = displayRank === 1;
    const heights = [180, 140, 110];

    const rankConfig = {
        1: { icon: Crown, color: 'text-amber-500', barBg: 'bg-white/[0.04] dark:bg-white/[0.04]', barBorder: 'border-white/[0.06]', lightBarBg: 'bg-slate-50', lightBarBorder: 'border-slate-200/60' },
        2: { icon: Medal, color: 'text-slate-400', barBg: 'bg-white/[0.03] dark:bg-white/[0.03]', barBorder: 'border-white/[0.05]', lightBarBg: 'bg-slate-50/70', lightBarBorder: 'border-slate-200/40' },
        3: { icon: Medal, color: 'text-amber-700 dark:text-amber-600', barBg: 'bg-white/[0.02] dark:bg-white/[0.02]', barBorder: 'border-white/[0.04]', lightBarBg: 'bg-slate-50/50', lightBarBorder: 'border-slate-100' },
    };
    const cfg = rankConfig[displayRank];
    const RankIcon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 flex-1 min-w-0"
        >
            {/* Avatar */}
            <div className="relative" style={{ width: isFirst ? 80 : 56, height: isFirst ? 80 : 56 }}>
                <div className={`w-full h-full rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center overflow-hidden`}>
                    {getProfileUrl(student.profileImage) ? (
                        <img src={getProfileUrl(student.profileImage)} alt={student.name} className="w-full h-full object-cover rounded-full" loading="eager" fetchpriority="high" />
                    ) : (
                        <User size={isFirst ? 28 : 20} strokeWidth={1.5} className="text-slate-300 dark:text-slate-600" />
                    )}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center ${cfg.color} z-10`}>
                    <RankIcon size={12} strokeWidth={2} />
                </span>
            </div>

            {/* Info */}
            <div className="text-center min-w-0 w-full px-1">
                <p className={`font-semibold truncate ${isFirst ? 'text-slate-900 dark:text-white text-sm' : 'text-slate-700 dark:text-slate-300 text-xs'}`}>{student.name}</p>
                <p className={`font-bold tabular-nums ${isFirst ? 'text-xl text-slate-900 dark:text-white' : 'text-base text-slate-700 dark:text-slate-300'}`}>{student.totalScore}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    {student.testsTaken} tests · avg {student.avgScore}
                </p>
            </div>

            {/* Podium bar */}
            <div
                className={`w-full rounded-xl ${cfg.lightBarBg} ${cfg.lightBarBorder} dark:${cfg.barBg} dark:${cfg.barBorder} border flex flex-col items-center justify-start pt-5`}
                style={{ height: heights[displayRank - 1] }}
            >
                <span className="text-3xl font-bold text-slate-200 dark:text-white/[0.06] tabular-nums">#{displayRank}</span>
            </div>
        </motion.div>
    );
};

// ── Main leaderboard ──
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
            <div className="max-w-7xl mx-auto space-y-6">
                <Skeleton className="w-1/3 h-10 mb-6" />
                <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] rounded-[24px] p-8">
                    <div className="flex items-end justify-center gap-6 lg:gap-10">
                        <Skeleton className="w-32 h-40 rounded-xl" />
                        <Skeleton className="w-40 h-56 rounded-xl" />
                        <Skeleton className="w-32 h-32 rounded-xl" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0A0A0A] rounded-[24px] border border-slate-200/60 dark:border-white/[0.06] overflow-hidden p-6">
                    <TableSkeleton rows={5} />
                </div>
            </div>
        </div>
    );

    const top3 = leaderboard.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
    const podiumRanks = [1, 0, 2];

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10 font-sans transition-colors duration-500">
            <div className="max-w-7xl mx-auto">

                {/* ── Page header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center">
                            <Trophy size={18} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Leaderboard</h1>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ranked by cumulative score</p>
                        </div>
                    </div>
                </motion.div>

                {leaderboard.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[#0A0A0A] rounded-[24px] border border-slate-200/60 dark:border-white/[0.06] p-16 text-center"
                    >
                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 dark:border-white/[0.06]">
                            <BarChart3 size={24} strokeWidth={1.5} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">No rankings yet</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs mx-auto">
                            Students need to complete assessments before rankings appear here.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* ── Podium Section ── */}
                        {top3.length >= 2 && (
                            <div className="bg-white dark:bg-[#0A0A0A] rounded-[24px] border border-slate-200/60 dark:border-white/[0.06] p-8 lg:p-10 mb-6">
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
                                    <Crown size={12} strokeWidth={2} className="text-amber-500" /> Top performers
                                </p>
                                <div className="flex items-end justify-center gap-3 sm:gap-6 lg:gap-10 max-w-2xl mx-auto">
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

                        {/* ── Rankings Table ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="bg-white dark:bg-[#0A0A0A] rounded-[24px] border border-slate-200/60 dark:border-white/[0.06] overflow-hidden mb-6"
                        >
                            {/* Table header */}
                            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04]">
                                <div className="flex items-center gap-2.5">
                                    <TrendingUp size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Full Rankings</h3>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] px-2.5 py-1 rounded-lg uppercase tracking-widest tabular-nums">
                                    {leaderboard.length}
                                </span>
                            </div>

                            {/* Column heads */}
                            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/60 dark:bg-white/[0.015] border-b border-slate-100 dark:border-white/[0.04]">
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student</span>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Score</span>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                                {leaderboard.map((student, idx) => (
                                    <motion.div
                                        key={idx}
                                        custom={idx}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            {/* Rank */}
                                            <span className={`w-8 text-center text-xs font-semibold tabular-nums ${
                                                idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700 dark:text-amber-600' : 'text-slate-400 dark:text-slate-500'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            {/* Avatar */}
                                            <div className="w-9 h-9 bg-slate-100 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 shrink-0 overflow-hidden">
                                                {getProfileUrl(student.profileImage) ? (
                                                    <img src={getProfileUrl(student.profileImage)} alt={student.name} className="w-full h-full object-cover rounded-full" loading="eager" fetchpriority="high" />
                                                ) : (
                                                    <User size={14} strokeWidth={1.5} />
                                                )}
                                            </div>
                                            {/* Name */}
                                            <div>
                                                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{student.name}</h4>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {student.testsTaken} {student.testsTaken === 1 ? 'test' : 'tests'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-baseline gap-1">
                                            <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{student.totalScore}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">pts</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ── Footer ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] px-6 py-5 rounded-[20px] flex items-center gap-5"
                        >
                            <div className="w-10 h-10 bg-slate-50 dark:bg-white/[0.03] rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/[0.06]">
                                <ChevronUp size={18} strokeWidth={1.8} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Keep competing</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
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
