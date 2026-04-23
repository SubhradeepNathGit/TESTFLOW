import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiAward, FiUser, FiBarChart2,
    FiStar, FiChevronRight
} from 'react-icons/fi';
import { Medal, Trophy, BarChart2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext';
import { useQuery } from '@tanstack/react-query';

// Medal styles for top ranks
const medalStyles = [
    { bg: 'bg-amber-400', text: 'text-white', shadow: 'shadow-amber-200' },
    { bg: 'bg-slate-400', text: 'text-white', shadow: 'shadow-slate-200' },
    { bg: 'bg-orange-400', text: 'text-white', shadow: 'shadow-orange-200' },
];

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
    const heights = [220, 170, 140];        // 1st, 2nd, 3rd column heights
    const reorderedRank = rank;             // 0=centre(1st), 1=left(2nd), 2=right(3rd)
    const displayRank = [1, 2, 3][rank];
    const medal = medalStyles[displayRank - 1];
    const isFirst = displayRank === 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2 flex-1 min-w-0"
        >
            {/* Avatar */}
            <div className={`relative w-14 h-14 ${isFirst ? 'w-20 h-20' : ''} rounded-full flex items-center justify-center bg-slate-100 border-4 border-white shadow-xl`}>
                {getProfileUrl(student.profileImage) ? (
                    <img src={getProfileUrl(student.profileImage)} alt={student.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                    <FiUser size={isFirst ? 34 : 24} className="text-slate-400" />
                )}
                <span className={`absolute -bottom-1 -right-1`}>
                    <Medal size={isFirst ? 24 : 18} className="text-amber-500 fill-amber-500 shadow-sm" />
                </span>
            </div>

            {/* Info */}
            <div className="text-center min-w-0 w-full px-1">
                <p className={`font-black truncate ${isFirst ? 'text-slate-900 text-base' : 'text-slate-700 text-sm'}`}>{student.name}</p>
                <p className={`font-black ${isFirst ? 'text-2xl text-indigo-600' : 'text-lg text-indigo-500'}`}>{student.totalScore}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {student.testsTaken} tests · avg {student.avgScore}
                </p>
            </div>

            {/* Podium bar */}
            <div
                className={`w-full rounded-t-2xl flex items-end justify-center pb-2 ${isFirst ? 'bg-indigo-600' : 'bg-slate-100 border border-slate-200'} shrink-0`}
                style={{ height: heights[displayRank - 1] }}
            >
                <span className={`text-5xl font-black mb-2 ${isFirst ? 'text-white/20' : 'text-slate-200/80'}`}>#{displayRank}</span>
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
        <div className="flex items-center justify-center h-[80vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading Leaderboard…</p>
            </div>
        </div>
    );

    const top3 = leaderboard.slice(0, 3);
    // Podium visual order: 2nd (left), 1st (centre), 3rd (right)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
    const podiumRanks = [1, 0, 2];   // indices into medalStyles / heights
    const rest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">

                {/* Page header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <FiAward size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Global Leaderboard</h1>
                            <p className="text-sm font-medium text-slate-400">Top performers ranked by cumulative score</p>
                        </div>
                    </div>
                </motion.div>

                {leaderboard.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-[36px] border-2 border-dashed border-slate-100 p-20 text-center"
                    >
                        <BarChart2 size={48} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Rankings Yet</h3>
                        <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                            Students need to complete assessments before rankings appear here.
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* Podium Section */}
                        {top3.length >= 2 && (
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 lg:p-10 mb-8">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                                    <FiStar size={12} className="text-amber-400" /> Top Performers
                                </p>
                                <div className="flex items-end justify-center gap-6 lg:gap-10">
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
                            className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-8"
                        >
                            <div className="px-7 py-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <FiTrendingUp size={18} className="text-emerald-500" />
                                    Full Rankings
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                    {leaderboard.length} Ranked
                                </span>
                            </div>

                            {/* Column heads */}
                            <div className="flex items-center justify-between px-7 py-2.5 bg-slate-50/60">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank · Student</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</span>
                            </div>

                            <div className="divide-y divide-slate-50">
                                {leaderboard.map((student, idx) => {
                                    const medal = medalStyles[idx];
                                    return (
                                        <motion.div
                                            key={idx}
                                            custom={idx}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="show"
                                            className="flex items-center justify-between px-7 py-4 hover:bg-slate-50/70 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Rank badge */}
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs shrink-0 ${
                                                    medal
                                                        ? `${medal.bg} ${medal.text} shadow-md ${medal.shadow}`
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {idx < 3 ? <Medal size={14} className="fill-white" /> : `#${idx + 1}`}
                                                </span>
                                                {/* Avatar circle */}
                                                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors overflow-hidden">
                                                    {getProfileUrl(student.profileImage) ? (
                                                        <img src={getProfileUrl(student.profileImage)} alt={student.name} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        <FiUser size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{student.name}</h4>
                                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                        {student.testsTaken} {student.testsTaken === 1 ? 'test' : 'tests'} completed
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 text-lg tabular-nums">{student.totalScore}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    avg {student.avgScore} pts
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Footer Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 p-8 rounded-[32px] flex items-center gap-6 shadow-xl shadow-indigo-100"
                        >
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-lg">Keep Competing!</h4>
                                <p className="text-sm text-indigo-100 font-medium mt-1">
                                    Rankings update based on cumulative score. Take move tests to climb higher.
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
