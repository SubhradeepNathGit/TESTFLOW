import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiAward, FiUser, FiBarChart2,
    FiStar, FiChevronRight
} from 'react-icons/fi';
import { BarChart2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import Skeleton, { CardSkeleton, TableSkeleton } from '../../components/common/Skeleton';

// Premium SVG trophy for rank 1
const GoldTrophy = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gold-cup" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="gold-stem" x1="14" y1="18" x2="18" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <filter id="gold-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
        </defs>
        {/* Handles */}
        <path d="M6 9 Q2 9 2 13 Q2 17 6 17" stroke="url(#gold-cup)" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M26 9 Q30 9 30 13 Q30 17 26 17" stroke="url(#gold-cup)" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Cup body */}
        <path d="M6 5 L6 17 Q6 23 16 23 Q26 23 26 17 L26 5 Z" fill="url(#gold-cup)" filter="url(#gold-glow)" />
        {/* Shine */}
        <path d="M10 7 Q11 9 10 12" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        {/* Stem */}
        <rect x="14" y="23" width="4" height="4" fill="url(#gold-stem)" rx="0.5" />
        {/* Base */}
        <path d="M10 27 Q10 29 16 29 Q22 29 22 27 L21 27 Q21 28 16 28 Q11 28 11 27 Z" fill="url(#gold-cup)" />
        <line x1="10" y1="27" x2="22" y2="27" stroke="url(#gold-cup)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Star on cup */}
        <path d="M16 9 L16.8 11.5 L19.4 11.5 L17.3 13 L18.1 15.5 L16 14 L13.9 15.5 L14.7 13 L12.6 11.5 L15.2 11.5 Z" fill="#FEF3C7" opacity="0.9" />
    </svg>
);

// Premium SVG silver medal for rank 2
const SilverMedal = ({ size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="silver-ribbon-l" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="silver-ribbon-r" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="silver-disc" x1="8" y1="10" x2="24" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="35%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <filter id="silver-shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#94A3B8" floodOpacity="0.5" />
            </filter>
        </defs>
        {/* Ribbon left */}
        <path d="M12 2 L16 8 L10 14 L6 8 Z" fill="url(#silver-ribbon-l)" />
        {/* Ribbon right */}
        <path d="M20 2 L24 8 L18 14 L16 8 Z" fill="url(#silver-ribbon-r)" />
        {/* Disc */}
        <circle cx="16" cy="21" r="10" fill="url(#silver-disc)" filter="url(#silver-shadow)" />
        {/* Shine arc */}
        <path d="M11 16 Q13 14 17 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Number */}
        <text x="16" y="25" textAnchor="middle" fontSize="9" fontWeight="900" fill="white" fontFamily="system-ui" letterSpacing="-0.5">2</text>
    </svg>
);

// Premium SVG bronze medal for rank 3
const BronzeMedal = ({ size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bronze-ribbon-l" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C2763B" />
                <stop offset="100%" stopColor="#7C3B1A" />
            </linearGradient>
            <linearGradient id="bronze-ribbon-r" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8996A" />
                <stop offset="100%" stopColor="#A0522D" />
            </linearGradient>
            <linearGradient id="bronze-disc" x1="8" y1="10" x2="24" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FCD9B0" />
                <stop offset="35%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <filter id="bronze-shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#B45309" floodOpacity="0.5" />
            </filter>
        </defs>
        {/* Ribbon left */}
        <path d="M12 2 L16 8 L10 14 L6 8 Z" fill="url(#bronze-ribbon-l)" />
        {/* Ribbon right */}
        <path d="M20 2 L24 8 L18 14 L16 8 Z" fill="url(#bronze-ribbon-r)" />
        {/* Disc */}
        <circle cx="16" cy="21" r="10" fill="url(#bronze-disc)" filter="url(#bronze-shadow)" />
        {/* Shine arc */}
        <path d="M11 16 Q13 14 17 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Number */}
        <text x="16" y="25" textAnchor="middle" fontSize="9" fontWeight="900" fill="white" fontFamily="system-ui" letterSpacing="-0.5">3</text>
    </svg>
);

// Rank badge icon for the table
const RankBadge = ({ rank }) => {
    if (rank === 1) return (
        <span className="w-10 h-10 flex items-center justify-center shrink-0">
            <GoldTrophy size={28} />
        </span>
    );
    if (rank === 2) return (
        <span className="w-10 h-10 flex items-center justify-center shrink-0">
            <SilverMedal size={28} />
        </span>
    );
    if (rank === 3) return (
        <span className="w-10 h-10 flex items-center justify-center shrink-0">
            <BronzeMedal size={28} />
        </span>
    );
    return (
        <span className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 font-black text-xs shrink-0">
            #{rank}
        </span>
    );
};

// Podium avatar medal pin
const PodiumMedalPin = ({ rank }) => {
    if (rank === 1) return (
        <span className="absolute -bottom-2 -right-2 flex items-center justify-center">
            <GoldTrophy size={22} />
        </span>
    );
    if (rank === 2) return (
        <span className="absolute -bottom-2 -right-2 flex items-center justify-center">
            <SilverMedal size={20} />
        </span>
    );
    return (
        <span className="absolute -bottom-2 -right-2 flex items-center justify-center">
            <BronzeMedal size={20} />
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

    const podiumGradients = [
        'linear-gradient(160deg, #6366f1 0%, #4f46e5 60%, #3730a3 100%)',
        'linear-gradient(160deg, #94A3B8 0%, #64748B 100%)',
        'linear-gradient(160deg, #D97706 0%, #92400E 100%)',
    ];
    const podiumShadows = [
        '0 8px 32px rgba(99,102,241,0.35)',
        '0 6px 20px rgba(100,116,139,0.25)',
        '0 6px 20px rgba(180,83,9,0.25)',
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2 flex-1 min-w-0"
        >
            {/* Avatar */}
            <div
                className={`relative rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-800`}
                style={{
                    width: isFirst ? 80 : 56,
                    height: isFirst ? 80 : 56,
                    boxShadow: isFirst
                        ? '0 0 0 4px rgba(99,102,241,0.15), 0 8px 24px rgba(99,102,241,0.25)'
                        : '0 4px 12px rgba(0,0,0,0.12)',
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
            <div className="text-center min-w-0 w-full px-1 mt-2">
                <p className={`font-black truncate ${isFirst ? 'text-slate-900 dark:text-slate-100 text-base' : 'text-slate-700 dark:text-slate-300 text-sm'}`}>{student.name}</p>
                <p className={`font-black ${isFirst ? 'text-2xl text-indigo-600' : 'text-lg text-indigo-500'}`}>{student.totalScore}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {student.testsTaken} tests · avg {student.avgScore}
                </p>
            </div>

            {/* Podium bar */}
            <div
                className="w-full rounded-t-2xl flex items-end justify-center pb-3 shrink-0"
                style={{
                    height: heights[displayRank - 1],
                    background: podiumGradients[displayRank - 1],
                    boxShadow: podiumShadows[displayRank - 1],
                }}
            >
                <span className={`text-5xl font-black mb-2 text-white/20`}>#{displayRank}</span>
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

    // WebSocket Listener
    useEffect(() => {
        if (!socket) return;
        socket.on('leaderboard:update', refetch);
        return () => socket.off('leaderboard:update', refetch);
    }, [socket, refetch]);

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10 mb-8" />
                <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none">
                    <div className="flex items-end justify-center gap-6 lg:gap-10">
                        <Skeleton className="w-32 h-40 rounded-t-2xl" />
                        <Skeleton className="w-40 h-56 rounded-t-2xl" />
                        <Skeleton className="w-32 h-32 rounded-t-2xl" />
                    </div>
                </div>
                <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none dark:shadow-none overflow-hidden p-6">
                    <TableSkeleton rows={5} />
                </div>
            </div>
        </div>
    );

    const top3 = leaderboard.slice(0, 3);
    // Podium visual order: 2nd (left), 1st (centre), 3rd (right)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
    const podiumRanks = [1, 0, 2];
    const rest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">

                {/* Page header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-none dark:shadow-none">
                            <FiAward size={20} />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Global Leaderboard</h1>
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Top performers ranked by cumulative score</p>
                        </div>
                    </div>
                </motion.div>

                {leaderboard.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-white/5 p-16 text-center shadow-none dark:shadow-none"
                    >
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/[0.02] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                            <FiBarChart2 size={32} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">No Rankings Yet</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                            The competition hasn't started! Students need to complete assessments before rankings appear here.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* Podium Section */}
                        {top3.length >= 2 && (
                            <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none dark:shadow-none p-8 lg:p-10 mb-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                                    <FiStar size={12} className="text-amber-400" /> Top Performers
                                </p>
                                <div className="flex items-end justify-center gap-2 sm:gap-6 lg:gap-10">
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
                            className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none dark:shadow-none overflow-hidden mb-8"
                        >
                            <div className="px-7 py-6 flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <FiTrendingUp size={18} className="text-emerald-500" />
                                    Full Rankings
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                    {leaderboard.length} Ranked
                                </span>
                            </div>

                            {/* Column heads */}
                            <div className="flex items-center justify-between px-4 sm:px-7 py-2.5 bg-slate-50/60 dark:bg-slate-700/30">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rank · Student</span>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Score</span>
                            </div>

                            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {leaderboard.map((student, idx) => (
                                    <motion.div
                                        key={idx}
                                        custom={idx}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="flex items-center justify-between px-4 sm:px-7 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-700/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank badge */}
                                            <RankBadge rank={idx + 1} />
                                            {/* Avatar circle */}
                                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-400 transition-colors overflow-hidden">
                                                {getProfileUrl(student.profileImage) ? (
                                                    <img src={getProfileUrl(student.profileImage)} alt={student.name} className="w-full h-full object-cover rounded-full" loading="eager" fetchpriority="high" />
                                                ) : (
                                                    <FiUser size={16} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.name}</h4>
                                                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                    {student.testsTaken} {student.testsTaken === 1 ? 'test' : 'tests'} completed
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 dark:text-slate-100 text-lg tabular-nums">{student.totalScore}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                            className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 p-8 rounded-[32px] flex items-center gap-6 shadow-none dark:shadow-none"
                        >
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-lg">Keep Competing!</h4>
                                <p className="text-sm text-indigo-100 font-medium mt-1">
                                    Rankings update based on cumulative score. Take more tests to climb higher.
                                </p>
                            </div>
                            <FiChevronRight size={24} className="text-white/40 shrink-0" />
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
