import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiChevronLeft, FiChevronRight, FiClock, FiFlag,
    FiMenu, FiX, FiAlertTriangle, FiCheckCircle, FiSend, FiZap
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { saveAnswer, submitAttempt, startAttempt } from '../../api/attemptApi';
import { getTest } from '../../api/testApi';
import Skeleton, { CardSkeleton } from '../../components/common/Skeleton';

// Submit confirmation modal
const SubmitModal = ({ isOpen, onClose, onConfirm, isSubmitting, answered, total }) => {
    if (!isOpen) return null;
    const unanswered = total - answered;
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="relative w-full max-w-md bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none"
                    >
                        {/* Top accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />

                        <div className="p-5 sm:p-8">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                                <FiSend size={26} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1.5">Submit Assessment?</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                                Once submitted, you cannot modify your answers. Please review carefully.
                            </p>

                            {/* Stats row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{answered}</p>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Answered</p>
                                </div>
                                {unanswered > 0 && (
                                    <div className="flex-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-2xl p-4 text-center">
                                        <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{unanswered}</p>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Unanswered</p>
                                    </div>
                                )}
                                <div className="flex-1 bg-slate-50 dark:bg-white/5/50 border border-slate-100 dark:border-slate-600 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{total}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Review More
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><FiSend size={14} /> Submit Now</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Main test player component
const TestPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});       // { qId: 'A' | 'B' | ... }
    const [marked, setMarked] = useState({});          // { qId: true }
    const [visited, setVisited] = useState({});        // { qId: true }
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [attemptId, setAttemptId] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const fetchTestData = async () => {
        try {
            const { data: attemptData } = await startAttempt(id);
            setAttemptId(attemptData.data._id);

            const { data: testData } = await getTest(id);
            setTest(testData.data.test);
            setQuestions(testData.data.questions);

            const expiresAt = new Date(attemptData.data.expiresAt).getTime();
            setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

            const existingAnswers = {};
            attemptData.data.answers?.forEach(a => {
                existingAnswers[a.questionId] = a.selectedOption;
            });
            setAnswers(existingAnswers);
            setLoading(false);
        } catch {
            toast.error('Failed to load test. It may not be available.');
            navigate('/student-dashboard');
        }
    };

    const handleSaveAnswer = async (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
        try { await saveAnswer(attemptId, questionId, option); } catch { /* silent */ }
    };

    const handleToggleMark = (questionId) => {
        setMarked(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    const handleClearResponse = () => {
        const q = questions[currentIdx];
        if (!q) return;
        setAnswers(prev => { const n = { ...prev }; delete n[q._id]; return n; });
    };

    const handleSubmit = () => setShowSubmitModal(true);

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            await submitAttempt(attemptId);
            toast.success('Assessment submitted successfully!');
            navigate('/results');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
            setIsSubmitting(false);
            setShowSubmitModal(false);
        }
    };

    const handleAutoSubmit = useCallback(async () => {
        toast.info('Time expired! Submitting your assessment...');
        try {
            if (attemptId) await submitAttempt(attemptId);
        } catch { /* silent */ }
        navigate('/results');
    }, [attemptId, navigate]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    // Fetch test data on mount
    useEffect(() => {
        fetchTestData();
        const handleVisibilityChange = () => {
            if (document.hidden) {
                toast.warning('Warning: Do not switch tabs during the exam.', { toastId: 'tab-switch' });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Mark current question as visited
    useEffect(() => {
        if (!questions.length) return;
        const q = questions[currentIdx];
        if (q) setVisited(prev => ({ ...prev, [q._id]: true }));
    }, [currentIdx, questions]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) {
            if (!loading && attemptId) handleAutoSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, loading, attemptId]);

    // Loading state
    if (loading) return (
        <div className="flex h-screen bg-[#F8F9FD] dark:bg-black overflow-hidden font-sans">
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white dark:bg-black/60 dark:backdrop-blur-md border-white/10 shadow-none">
                    <Skeleton className="w-48 h-6" />
                    <Skeleton className="w-24 h-10 rounded-2xl" />
                </header>
                <main className="flex-1 p-6 lg:p-10 flex flex-col">
                    <div className="max-w-3xl w-full mx-auto my-auto">
                        <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl space-y-6">
                            <Skeleton className="w-32 h-4 mb-4" />
                            <Skeleton className="w-full h-8 mb-6" />
                            <div className="space-y-3">
                                <Skeleton className="w-full h-16 rounded-2xl" />
                                <Skeleton className="w-full h-16 rounded-2xl" />
                                <Skeleton className="w-full h-16 rounded-2xl" />
                                <Skeleton className="w-full h-16 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <aside className="w-72 xl:w-80 bg-white dark:bg-black/40 dark:backdrop-blur-md hidden lg:flex flex-col shrink-0 p-6">
                <Skeleton className="w-32 h-4 mb-8" />
                <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                </div>
            </aside>
        </div>
    );

    const currentQuestion = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;
    const isTimeCritical = timeLeft < 300;
    const isTimeWarning = timeLeft < 60;

    // Get status for palette buttons
    const getQStatus = (q) => {
        const isAnswered = !!answers[q._id];
        const isMarkedQ = !!marked[q._id];
        const isVisited = !!visited[q._id];
        if (isMarkedQ && isAnswered) return 'marked-answered';
        if (isMarkedQ) return 'marked';
        if (isAnswered) return 'answered';
        if (isVisited) return 'visited';
        return 'not-visited';
    };

    const qStatusStyles = {
        'answered':        'bg-emerald-500 text-white shadow-sm dark:shadow-none dark:shadow-none',
        'marked':          'bg-amber-400 text-white shadow-sm dark:shadow-none dark:shadow-none',
        'marked-answered': 'bg-violet-600 text-white shadow-sm dark:shadow-none dark:shadow-none',
        'visited':         'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
        'not-visited':     'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600',
    };

    return (
        <>
            <SubmitModal
                isOpen={showSubmitModal}
                onClose={() => !isSubmitting && setShowSubmitModal(false)}
                onConfirm={confirmSubmit}
                isSubmitting={isSubmitting}
                answered={answeredCount}
                total={questions.length}
            />

            <div className="flex h-screen bg-[#F8F9FD] dark:bg-black overflow-hidden font-sans select-none">

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Header */}
                    <header className="h-16 bg-white dark:bg-black/60 dark:backdrop-blur-md border-b border-slate-100 dark:border-white/10 flex items-center justify-between px-4 sm:px-6 shadow-none z-10 shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors lg:hidden"
                            >
                                <FiMenu size={20} />
                            </button>
                            <div className="flex items-center gap-3 min-w-0">
                                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{test.title}</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            {/* Timer */}
                            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-mono font-bold text-sm transition-all ${
                                isTimeWarning
                                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200 dark:shadow-none'
                                    : isTimeCritical
                                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-100 dark:border-red-800'
                                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/[0.06]'
                            }`}>
                                <FiClock size={16} className={isTimeWarning ? 'text-white' : 'text-slate-400'} />
                                <span className="tabular-nums">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </header>

                    {/* Question progress bar */}
                    <div className="h-0.5 bg-slate-100 dark:bg-white/5 shrink-0">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Question Area */}
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 flex flex-col">
                        <div className="max-w-3xl w-full mx-auto my-auto">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIdx}
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ duration: 0.18, ease: 'easeOut' }}
                                    className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl"
                                >
                                    {/* Question header */}
                                    <div className="flex items-center justify-between mb-7">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                                Question {currentIdx + 1}
                                            </span>
                                            <span className="text-xs text-slate-300 font-bold">/ {questions.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {marked[currentQuestion._id] && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-wider bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 px-2.5 py-1 rounded-full">
                                                    <FiFlag size={10} /> Marked
                                                </span>
                                            )}
                                            <span className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                                                1.0 Mark
                                            </span>
                                        </div>
                                    </div>

                                    {/* Question text */}
                                    <h2 className="text-lg lg:text-xl text-slate-800 dark:text-slate-200 font-semibold leading-relaxed mb-8">
                                        {currentQuestion.questionText}
                                    </h2>

                                    {/* Options */}
                                    <div className="grid gap-3">
                                        {currentQuestion.options.map((option, idx) => {
                                            const label = String.fromCharCode(65 + idx);
                                            const isSelected = answers[currentQuestion._id] === label;
                                            return (
                                                <motion.button
                                                    key={idx}
                                                    whileHover={{ scale: 1.005 }}
                                                    whileTap={{ scale: 0.998 }}
                                                    onClick={() => handleSaveAnswer(currentQuestion._id, label)}
                                                    className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                                                        isSelected
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                                                            : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-white dark:bg-white/5 dark:border-white/10 shadow-none'
                                                    }`}
                                                >
                                                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm mr-4 shrink-0 transition-all ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white shadow-md dark:shadow-none dark:shadow-none'
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                    }`}>
                                                        {label}
                                                    </span>
                                                    <span className={`font-medium text-base transition-colors ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {option}
                                                    </span>
                                                    {isSelected && (
                                                        <FiCheckCircle size={18} className="ml-auto text-indigo-500 shrink-0" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </main>

                    {/* Footer Controls */}
                    <footer className="bg-white dark:bg-black/60 dark:backdrop-blur-md border-t border-slate-100 dark:border-white/10 shrink-0">
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 sm:px-8 py-4">

                            {/* Left — Previous */}
                            <button
                                disabled={currentIdx === 0}
                                onClick={() => setCurrentIdx(prev => prev - 1)}
                                className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-indigo-600 disabled:opacity-25 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-w-[100px]"
                            >
                                <FiChevronLeft size={18} />
                                Previous
                            </button>

                            {/* Centre — Mark / Clear */}
                            <div className="flex w-full sm:w-auto justify-center gap-2.5 order-first sm:order-none">
                                <button
                                    onClick={() => handleToggleMark(currentQuestion._id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all active:scale-95 ${
                                        marked[currentQuestion._id]
                                            ? 'border-amber-400 bg-amber-400 text-white shadow-md dark:shadow-none dark:shadow-none'
                                            : 'border-amber-200 dark:border-amber-800/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                    }`}
                                >
                                    <FiFlag size={13} />
                                    {marked[currentQuestion._id] ? 'Unmark' : 'Mark Review'}
                                </button>
                                <button
                                    onClick={handleClearResponse}
                                    disabled={!answers[currentQuestion._id]}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <FiX size={13} />
                                    Clear Response
                                </button>
                            </div>

                            {/* Right — Next / Finish */}
                            <button
                                onClick={() => {
                                    if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
                                    else handleSubmit();
                                }}
                                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-md active:scale-95 min-w-[100px] justify-center"
                            >
                                {currentIdx === questions.length - 1 ? 'Finish' : 'Next'}
                                <FiChevronRight size={18} />
                            </button>
                        </div>
                    </footer>
                </div>

                {/* Question Palette Sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            key="palette"
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="absolute right-0 top-0 bottom-0 z-40 lg:relative w-72 xl:w-80 bg-white dark:bg-black/90 dark:backdrop-blur-xl flex flex-col shrink-0 border-l border-slate-100 dark:border-white/[0.06] shadow-2xl lg:shadow-none"
                        >
                            {/* Palette Header */}
                            <div className="px-5 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Question Palette</h3>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400 lg:hidden transition-all"
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>

                                {/* Progress bar */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex-1 h-2 bg-slate-50 dark:bg-white/[0.04] rounded-full overflow-hidden border border-slate-100 dark:border-white/[0.06]">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-none dark:shadow-none"
                                            animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-500 tabular-nums w-10 text-right">
                                        {answeredCount}/{questions.length}
                                    </span>
                                </div>

                                {/* Grid */}
                                <div className="grid grid-cols-5 gap-2 max-h-[48vh] overflow-y-auto no-scrollbar p-1.5">
                                    {questions.map((q, idx) => {
                                        const status = getQStatus(q, idx);
                                        const isCurrent = currentIdx === idx;
                                        return (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.07 }}
                                                whileTap={{ scale: 0.93 }}
                                                onClick={() => setCurrentIdx(idx)}
                                                className={`w-full aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all relative ${qStatusStyles[status]} ${
                                                    isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-black' : ''
                                                }`}
                                            >
                                                {idx + 1}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="px-6 py-4 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Legend</p>
                                <div className="space-y-2.5">
                                    {[
                                        { color: 'bg-emerald-500', label: 'Answered' },
                                        { color: 'bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800', label: 'Visited', textColor: 'text-slate-500 dark:text-slate-400' },
                                        { color: 'bg-amber-400', label: 'Marked for Review' },
                                        { color: 'bg-violet-600', label: 'Marked & Answered' },
                                        { color: 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600', label: 'Not Visited', textColor: 'text-slate-500 dark:text-slate-400' },
                                    ].map(({ color, label, textColor }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            <span className={`w-5 h-5 rounded-lg shrink-0 ${color}`} />
                                            <span className={`text-xs font-semibold ${textColor || 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit CTA */}
                            <div className="p-5 border-t border-slate-50 dark:border-white/[0.06]">
                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg dark:shadow-none flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <FiSend size={15} />
                                    Submit Assessment
                                </button>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Mobile sidebar toggle (floating) */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed bottom-24 right-4 z-50 lg:hidden w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center"
                    >
                        <FiMenu size={20} />
                    </button>
                )}
            </div>
        </>
    );
};

export default TestPlayer;
