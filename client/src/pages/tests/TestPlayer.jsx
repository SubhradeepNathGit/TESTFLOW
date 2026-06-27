import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiChevronLeft, FiChevronRight, FiClock, FiFlag, FiLock, FiFileText,
    FiMenu, FiX, FiAlertTriangle, FiCheckCircle, FiSend, FiZap
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { saveAnswer, submitAttempt, startAttempt, nextSectionAttempt, startSectionAttempt } from '../../api/attemptApi';
import { getTest } from '../../api/testApi';
import Skeleton, { CardSkeleton } from '../../components/common/Skeleton';
import { useSocket } from '../../hooks/useSocket';

// Disqualified Modal
const DisqualifiedModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="relative w-full max-w-md bg-white dark:bg-[#0A0A0A] border border-slate-100 dark:border-white/[0.08] rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-10"
                    >
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiAlertTriangle size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">Attempt Disqualified</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
                            Your test attempt has been forcefully reset or disqualified by the instructor. Any unsaved progress has been discarded. Please contact your instructor for further details.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                            Return to Dashboard
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

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
                        className="relative w-full max-w-md bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl border border-slate-100 dark:border-white/[0.08] rounded-[2.5rem] shadow-2xl dark:shadow-none overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                                <FiSend size={26} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1.5">Submit Assessment?</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                                Once submitted, you cannot modify your answers. Please review carefully.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-500/20 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{answered}</p>
                                    <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mt-0.5">Answered</p>
                                </div>
                                {unanswered > 0 && (
                                    <div className="flex-1 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100/50 dark:border-amber-500/20 rounded-2xl p-4 text-center">
                                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{unanswered}</p>
                                        <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mt-0.5">Unanswered</p>
                                    </div>
                                )}
                                <div className="flex-1 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-500/20 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{total}</p>
                                    <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest mt-0.5">Total</p>
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

// Section Submit confirmation modal
const SectionSubmitModal = ({ isOpen, onClose, onConfirm, isSubmitting, answered, total, sectionName }) => {
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
                        className="relative w-full max-w-md bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl border border-slate-100 dark:border-white/[0.08] rounded-[2.5rem] shadow-2xl dark:shadow-none overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                                <FiAlertTriangle size={26} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1.5">Submit Section?</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                                You are about to submit the <span className="font-bold text-slate-700 dark:text-slate-200">{sectionName}</span> section. Once submitted, you cannot return to this section.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-500/20 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{answered}</p>
                                    <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mt-0.5">Answered</p>
                                </div>
                                {unanswered > 0 && (
                                    <div className="flex-1 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100/50 dark:border-amber-500/20 rounded-2xl p-4 text-center">
                                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{unanswered}</p>
                                        <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mt-0.5">Unanswered</p>
                                    </div>
                                )}
                                <div className="flex-1 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-500/20 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{total}</p>
                                    <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest mt-0.5">Total</p>
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
                                        <><FiSend size={14} /> Submit Section</>
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
    const [isStrictSectionMode, setIsStrictSectionMode] = useState(false);
    const [sectionDurations, setSectionDurations] = useState([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentSectionStatus, setCurrentSectionStatus] = useState('IN_PROGRESS'); // 'IN_PROGRESS' | 'LOBBY'
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showSectionSubmitModal, setShowSectionSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [isStartingSection, setIsStartingSection] = useState(false);
    const socket = useSocket();


    const fetchTestData = useCallback(async () => {
        try {
            const { data: attemptData } = await startAttempt(id);
            setAttemptId(attemptData.data._id);

            const { data: testData } = await getTest(id);
            setTest(testData.data.test);
            setQuestions(testData.data.questions);

            const isStrict = testData.data.test.isStrictSectionMode;
            setIsStrictSectionMode(isStrict);
            if (isStrict) {
                setSectionDurations(testData.data.test.sectionDurations);
                setCurrentSectionIndex(attemptData.data.currentSectionIndex || 0);
                setCurrentSectionStatus(attemptData.data.currentSectionStatus || 'IN_PROGRESS');
            }

            // If in LOBBY state for strict mode, don't set timer from sectionExpiresAt (it's null)
            if (isStrict && (attemptData.data.currentSectionStatus === 'LOBBY' || !attemptData.data.sectionExpiresAt)) {
                setTimeLeft(0); // No active timer in lobby
            } else {
                const activeExpiry = isStrict ? attemptData.data.sectionExpiresAt : attemptData.data.expiresAt;
                const expiresAt = new Date(activeExpiry).getTime();
                setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
            }

            const existingAnswers = {};
            attemptData.data.answers?.forEach(a => {
                existingAnswers[a.questionId] = a.selectedOption;
            });
            setAnswers(existingAnswers);
            
            // Set initial currentIdx to the first question of the current section
            if (testData.data.questions.length > 0) {
                const uniqueSecs = [...new Set(testData.data.questions.map(q => q.section || 'General'))];
                const expectedSec = uniqueSecs[attemptData.data.currentSectionIndex || 0];
                if (expectedSec) {
                    const firstIdx = testData.data.questions.findIndex(q => (q.section || 'General') === expectedSec);
                    if (firstIdx !== -1) setCurrentIdx(firstIdx);
                }
            }
            
            setLoading(false);
        } catch {
            toast.error('Failed to load test. It may not be available.');
            navigate('/student-dashboard');
        }
    }, [id, navigate]);

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

    const handleNextSection = useCallback(async () => {
        setIsSubmitting(true);
        try {
            const { data } = await nextSectionAttempt(attemptId);
            if (data.data.status === 'SUBMITTED') {
                toast.success('Assessment submitted successfully!');
                navigate('/results');
            } else {
                // Moved to LOBBY for next section
                setCurrentSectionIndex(data.data.currentSectionIndex);
                setCurrentSectionStatus('LOBBY');
                setTimeLeft(0); // No timer in lobby
                
                // Find first question of new section robustly
                if (questions.length > 0) {
                    const uniqueSecs = [...new Set(questions.map(q => q.section || 'General'))];
                    const nextSectionName = uniqueSecs[data.data.currentSectionIndex];
                    if (nextSectionName) {
                        const firstIdx = questions.findIndex(q => (q.section || 'General') === nextSectionName);
                        if (firstIdx !== -1) setCurrentIdx(firstIdx);
                    }
                }
                
                setIsSubmitting(false);
                setShowSubmitModal(false);
                setShowSectionSubmitModal(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to move to next section.');
            setIsSubmitting(false);
            setShowSectionSubmitModal(false);
        }
    }, [attemptId, navigate, test, questions]);

    const handleStartSection = useCallback(async () => {
        setIsStartingSection(true);
        try {
            const { data } = await startSectionAttempt(attemptId);
            setCurrentSectionStatus('IN_PROGRESS');
            const expiresAt = new Date(data.data.sectionExpiresAt).getTime();
            setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
            toast.success(`Section started! You have ${sectionDurations[currentSectionIndex]?.duration} minutes.`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start section.');
        } finally {
            setIsStartingSection(false);
        }
    }, [attemptId, sectionDurations, currentSectionIndex]);

    const handleAutoSubmit = useCallback(async () => {
        if (isStrictSectionMode) {
            toast.info('Section time expired! Moving to next section...');
            await handleNextSection();
        } else {
            toast.info('Time expired! Submitting your assessment...');
            try {
                if (attemptId) await submitAttempt(attemptId);
            } catch { /* silent */ }
            navigate('/results');
        }
    }, [attemptId, navigate, isStrictSectionMode, handleNextSection]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    // Fetch test data on mount
    useEffect(() => {
        fetchTestData();
    }, [fetchTestData]);

    // Handle real-time interruptions
    useEffect(() => {
        if (socket && attemptId) {
            const handleReset = (data) => {
                if (data.attemptId === attemptId) {
                    setIsDisqualified(true);
                }
            };

            const handleArchive = (data) => {
                if (data.testId === id) {
                    toast.error('This assessment is no longer available.');
                    navigate('/student-dashboard');
                }
            };

            socket.on('test:attempt_reset', handleReset);
            socket.on('test:archived', handleArchive);
            socket.on('test:deleted', handleArchive);

            return () => {
                socket.off('test:attempt_reset', handleReset);
                socket.off('test:archived', handleArchive);
                socket.off('test:deleted', handleArchive);
            };
        }
    }, [id, socket, attemptId, navigate]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                toast.warning('Warning: Do not switch tabs during the exam.', { toastId: 'tab-switch' });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Mark current question as visited
    useEffect(() => {
        if (!questions.length) return;
        const q = questions[currentIdx];
        if (q) setVisited(prev => ({ ...prev, [q._id]: true }));
    }, [currentIdx, questions]);

    // Timer countdown
    useEffect(() => {
        // Don't run timer in LOBBY state
        if (isStrictSectionMode && currentSectionStatus === 'LOBBY') return;
        if (timeLeft <= 0) {
            if (!loading && attemptId) handleAutoSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, loading, attemptId, currentSectionStatus, isStrictSectionMode]);

    const currentQuestion = questions[currentIdx];
    const answeredCount = Object.keys(answers).length;
    const isTimeCritical = timeLeft < 300;
    const isTimeWarning = timeLeft < 60;

    const uniqueSections = React.useMemo(() => {
        if (!questions.length) return ['General'];
        return [...new Set(questions.map(q => q.section || 'General'))];
    }, [questions]);

    const activeSection = currentQuestion?.section || 'General';

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
                        <div className="bg-[#F8F9FD] dark:bg-transparent space-y-6">
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
        'answered':        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/50 shadow-sm dark:shadow-none',
        'marked':          'bg-amber-400 text-white shadow-md dark:shadow-none border border-amber-500 dark:border-amber-300',
        'marked-answered': 'bg-violet-600 text-white shadow-md dark:shadow-none border border-violet-700 dark:border-violet-500',
        'visited':         'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/50 shadow-sm dark:shadow-none',
        'not-visited':     'bg-slate-50 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-none',
    };

    return (
        <>
            <DisqualifiedModal 
                isOpen={isDisqualified} 
                onClose={() => navigate('/student-dashboard')} 
            />

            <SubmitModal
                isOpen={showSubmitModal}
                onClose={() => !isSubmitting && setShowSubmitModal(false)}
                onConfirm={confirmSubmit}
                isSubmitting={isSubmitting}
                answered={answeredCount}
                total={questions.length}
            />

            <SectionSubmitModal
                isOpen={showSectionSubmitModal}
                onClose={() => !isSubmitting && setShowSectionSubmitModal(false)}
                onConfirm={handleNextSection}
                isSubmitting={isSubmitting}
                answered={questions.filter(q => (q.section || 'General') === activeSection && answers[q._id]).length}
                total={questions.filter(q => (q.section || 'General') === activeSection).length}
                sectionName={activeSection}
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
                                isStrictSectionMode && currentSectionStatus === 'LOBBY'
                                    ? 'bg-slate-50 dark:bg-white/[0.03] text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/[0.06]'
                                    : isTimeWarning
                                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200 dark:shadow-none'
                                    : isTimeCritical
                                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-100 dark:border-red-800'
                                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/[0.06]'
                            }`}>
                                <FiClock size={16} className={isTimeWarning ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                                <span className="tabular-nums">{isStrictSectionMode && currentSectionStatus === 'LOBBY' ? '--:--' : formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </header>

                    {/* Section Tabs (if multiple sections exist) */}
                    {uniqueSections.length > 1 && (
                        <div className="flex items-center gap-1.5 px-4 py-2.5 sm:px-6 bg-white/80 dark:bg-white/[0.02] overflow-x-auto no-scrollbar shrink-0 backdrop-blur-xl">
                            {uniqueSections.map((sec, secIdx) => {
                                const isCompleted = isStrictSectionMode && secIdx < currentSectionIndex;
                                const isLocked = isStrictSectionMode && secIdx > currentSectionIndex;
                                const isActive = activeSection === sec;
                                const sectionQuestions = questions.filter(q => (q.section || 'General') === sec);
                                const sectionAnswered = sectionQuestions.filter(q => answers[q._id]).length;
                                return (
                                    <button 
                                        key={sec}
                                        onClick={() => {
                                            if (isStrictSectionMode) return;
                                            const firstIdx = questions.findIndex(q => (q.section || 'General') === sec);
                                            if(firstIdx !== -1) setCurrentIdx(firstIdx);
                                        }}
                                        className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap ${
                                            isActive 
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10' 
                                            : isCompleted
                                            ? 'bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 cursor-default'
                                            : isLocked
                                            ? 'bg-slate-50 dark:bg-white/[0.02] text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60'
                                            : 'bg-slate-50 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        <span className="uppercase">{sec}</span>
                                        {!isLocked && (
                                            <span className={`text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded-md ${
                                                isActive 
                                                    ? 'bg-white/20 text-white/90' 
                                                    : isCompleted 
                                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                                    : 'bg-slate-200/60 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500'
                                            }`}>{sectionAnswered}/{sectionQuestions.length}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Section Lobby (between sections) */}
                    {isStrictSectionMode && currentSectionStatus === 'LOBBY' ? (
                        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                                className="w-full max-w-lg text-center"
                            >
                                <div className="bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl border border-slate-100 dark:border-white/[0.08] rounded-[2.5rem] shadow-xl dark:shadow-none p-10">

                                    {/* Section Info */}
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">
                                        Section {currentSectionIndex + 1} of {sectionDurations?.length || 0}
                                    </p>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                        {sectionDurations?.[currentSectionIndex]?.name || 'Next Section'}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
                                        Get ready for the next section. Once you start, the timer will begin counting down. You cannot pause or go back to previous sections.
                                    </p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-4">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <FiClock size={14} className="text-indigo-500" />
                                                <span className="text-lg font-black text-slate-800 dark:text-white">{sectionDurations?.[currentSectionIndex]?.duration || 0}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Minutes</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-4">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <FiFileText size={14} className="text-violet-500" />
                                                <span className="text-lg font-black text-slate-800 dark:text-white">
                                                    {questions.filter(q => (q.section || 'General') === (sectionDurations?.[currentSectionIndex]?.name || 'General')).length}
                                                </span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Questions</p>
                                        </div>
                                    </div>

                                    {/* Completed sections summary */}
                                    {currentSectionIndex > 0 && (
                                        <div className="mb-8 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Completed Sections</p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {sectionDurations.slice(0, currentSectionIndex).map((sec, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">
                                                        <FiCheckCircle size={12} /> {sec.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Start Button */}
                                    <button
                                        onClick={handleStartSection}
                                        disabled={isStartingSection}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                                    >
                                        {isStartingSection ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Start Section'
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </main>
                    ) : (
                    <>
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
                                    className="bg-[#F8F9FD] dark:bg-transparent"
                                >
                                    {/* Question header */}
                                    <div className="flex items-center justify-between mb-7">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                                Question {isStrictSectionMode ? (questions.filter(q => (q.section || 'General') === activeSection).findIndex(q => q._id === currentQuestion._id) + 1) : (currentIdx + 1)}
                                            </span>
                                            <span className="text-xs text-slate-300 font-bold">/ {isStrictSectionMode ? questions.filter(q => (q.section || 'General') === activeSection).length : questions.length}</span>
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
                                disabled={(() => {
                                    if (isStrictSectionMode) {
                                        const sectionQs = questions.filter(q => (q.section || 'General') === activeSection);
                                        return currentQuestion?._id === sectionQs[0]?._id;
                                    }
                                    return currentIdx === 0;
                                })()}
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
                            {(() => {
                                const sectionQs = questions.filter(q => (q.section || 'General') === activeSection);
                                const lastSectionQ = sectionQs[sectionQs.length - 1];
                                const isLastInSection = currentQuestion?._id === lastSectionQ?._id;
                                const isVeryLastQ = currentIdx === questions.length - 1;
                                const isSubmitSection = isStrictSectionMode && isLastInSection;
                                const isFinish = !isStrictSectionMode && isVeryLastQ;
                                return (
                                    <button
                                        onClick={() => {
                                            if (isStrictSectionMode) {
                                                if (isLastInSection) setShowSectionSubmitModal(true);
                                                else setCurrentIdx(prev => prev + 1);
                                            } else {
                                                if (!isVeryLastQ) setCurrentIdx(prev => prev + 1);
                                                else handleSubmit();
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 min-w-[100px] justify-center ${
                                            isSubmitSection || isFinish
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                : 'bg-slate-900 hover:bg-indigo-600 text-white'
                                        }`}
                                    >
                                        {isSubmitSection ? <><FiSend size={14}/> Submit Section</> : isFinish ? <><FiSend size={14}/> Finish</> : <>Next <FiChevronRight size={18} /></>}
                                    </button>
                                );
                            })()}
                        </div>
                    </footer>
                    </>
                    )}
                </div>

                {/* Question Palette Sidebar — hidden during LOBBY */}
                <AnimatePresence>
                    {isSidebarOpen && !(isStrictSectionMode && currentSectionStatus === 'LOBBY') && (
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
                                    <h3 className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Question Palette</h3>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400 lg:hidden transition-all"
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>

                                {/* Progress bar */}
                                {(() => {
                                    const sectionQs = isStrictSectionMode ? questions.filter(q => (q.section || 'General') === activeSection) : questions;
                                    const answeredInScope = isStrictSectionMode ? sectionQs.filter(q => answers[q._id]).length : answeredCount;
                                    const totalInScope = sectionQs.length;
                                    return (
                                        <div className="flex items-center gap-3 -mt-2 mb-6">
                                            <div className="flex-1 h-2 bg-slate-50 dark:bg-white/[0.04] rounded-full overflow-hidden border border-slate-100 dark:border-white/[0.06]">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-none dark:shadow-none"
                                                    animate={{ width: `${(answeredInScope / totalInScope) * 100}%` }}
                                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-black text-slate-500 tabular-nums w-10 text-right">
                                                {answeredInScope}/{totalInScope}
                                            </span>
                                        </div>
                                    );
                                })()}

                                {/* Grid grouped by sections */}
                                <div className="max-h-[48vh] overflow-y-auto no-scrollbar p-1.5 space-y-6">
                                    {uniqueSections.filter(sec => !isStrictSectionMode || sec === activeSection).map(sec => (
                                        <div key={sec}>
                                            {uniqueSections.length > 1 && (
                                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 pl-1">
                                                    {sec}
                                                </h4>
                                            )}
                                            <div className="grid grid-cols-5 gap-3">
                                                {questions.map((q, idx) => {
                                                    if ((q.section || 'General') !== sec) return null;
                                                    const status = getQStatus(q);
                                                    const isCurrent = currentIdx === idx;
                                                    // In strict mode, only allow navigation within the current section
                                                    const isLocked = isStrictSectionMode && (q.section || 'General') !== activeSection;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => { if (!isLocked) setCurrentIdx(idx); }}
                                                            disabled={isLocked}
                                                            className={`w-full aspect-square rounded-lg flex items-center justify-center text-[15px] font-black transition-all relative ${qStatusStyles[status]} ${
                                                                isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#F8F9FD] dark:ring-offset-black z-10' : 'hover:opacity-90'
                                                            } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="px-6 py-4 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Legend</p>
                                <div className="space-y-2.5">
                                    {[
                                        { color: 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-500/50', label: 'Answered', textColor: 'text-slate-600 dark:text-slate-300' },
                                        { color: 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-500/50', label: 'Visited', textColor: 'text-slate-600 dark:text-slate-300' },
                                        { color: 'bg-amber-400', label: 'Marked for Review' },
                                        { color: 'bg-violet-600', label: 'Marked & Answered' },
                                        { color: 'bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]', label: 'Not Visited', textColor: 'text-slate-500 dark:text-slate-400' },
                                    ].map(({ color, label, textColor }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            <span className={`w-5 h-5 rounded-lg shrink-0 ${color}`} />
                                            <span className={`text-xs font-semibold ${textColor || 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit CTA */}
                            <div className="pl-5 pr-5 pt-2.5 mb-10 border-t border-slate-50 dark:border-white/[0.06]">
                                {isStrictSectionMode ? (() => {
                                    const sectionQs = questions.filter(q => (q.section || 'General') === activeSection);
                                    const lastSectionQ = sectionQs[sectionQs.length - 1];
                                    const isOnLastQ = currentQuestion?._id === lastSectionQ?._id;
                                    return (
                                        <button
                                            onClick={() => setShowSectionSubmitModal(true)}
                                            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg dark:shadow-none flex items-center justify-center gap-2 active:scale-95 ${
                                                isOnLastQ
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                            }`}
                                            disabled={!isOnLastQ}
                                        >
                                            <FiSend size={15} />
                                            Submit Section
                                        </button>
                                    );
                                })() : (
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg dark:shadow-none flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <FiSend size={15} />
                                        Submit Assessment
                                    </button>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Mobile sidebar toggle (floating) — hidden during LOBBY */}
                {!isSidebarOpen && !(isStrictSectionMode && currentSectionStatus === 'LOBBY') && (
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
