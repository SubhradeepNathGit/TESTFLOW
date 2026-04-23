import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
    getTests, uploadPdfTest, publishTest, getTestStats, createTest, addQuestion, getTest,
    archiveTest, deleteQuestion, updateQuestion 
} from '../../api/testApi';
import { resetAttempt } from '../../api/attemptApi';
import { useSocket } from '../../context/SocketContext';
import { FiUploadCloud, FiPlus, FiTrendingUp, FiUsers, FiFileText, FiActivity, FiCheckCircle, FiRefreshCw, FiList, FiEdit3, FiSave, FiX, FiCheck } from 'react-icons/fi';
import { Send, Trash2, Edit, Trash, Loader2 } from 'lucide-react';
import QuestionModal from '../../components/modals/QuestionModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const InstructorDashboard = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false); // kept for upload/create spinner
    const [isUploading, setIsUploading] = useState(false);
    const [stats, setStats] = useState(null);
    const [selectedTestId, setSelectedTestId] = useState(null);
    const [newTest, setNewTest] = useState({ title: '', description: '', duration: 60, pdfFile: null });
    const [creationMode, setCreationMode] = useState('pdf'); // 'pdf' or 'manual'
    const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'questions'
    const [selectedTestQuestions, setSelectedTestQuestions] = useState([]);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [publishingId, setPublishingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'warning',
        onConfirm: () => {}
    });

    // useQuery for tests list
    const { data: tests = [], isLoading: testsLoading, refetch: refetchTests } = useQuery({
        queryKey: ['instructor-tests'],
        queryFn: () => getTests().then(r => r.data.data),
        onError: () => toast.error("Failed to load assessments"),
    });

    useEffect(() => {
        if (!socket) return;

        const handleAttemptStarted = (data) => {
            if (selectedTestId === data.testId) {
                fetchFullTestDetails(data.testId);
            }
        };

        const handleAttemptSubmitted = (data) => {
            if (selectedTestId === data.testId) {
                fetchFullTestDetails(data.testId);
            }
            refetchTests();
        };

        const handleTestUpdated = (data) => {
            refetchTests();
            if (selectedTestId === data.testId || data.testId === "REFRESH") {
                fetchFullTestDetails(selectedTestId);
            }
        };

        socket.on('test:attempt_started', handleAttemptStarted);
        socket.on('test:attempt_submitted', handleAttemptSubmitted);
        socket.on('test:updated', handleTestUpdated);
        socket.on('test:published', refetchTests);
        socket.on('test:archived', refetchTests);

        return () => {
            socket.off('test:attempt_started', handleAttemptStarted);
            socket.off('test:attempt_submitted', handleAttemptSubmitted);
            socket.off('test:updated', handleTestUpdated);
            socket.off('test:published', refetchTests);
            socket.off('test:archived', refetchTests);
        };
    }, [socket, selectedTestId, refetchTests]);

    const handleCreateTest = async (e) => {
        e.preventDefault();
        
        if (creationMode === 'pdf') {
            if (!newTest.pdfFile) return toast.error("Please select a PDF file");
            setIsUploading(true);
            const formData = new FormData();
            formData.append('title', newTest.title);
            formData.append('description', newTest.description);
            formData.append('duration', newTest.duration);
            formData.append('pdfFile', newTest.pdfFile);
            try {
                const { data } = await uploadPdfTest(formData);
                toast.success(`Parsed ${data.data.questionCount} questions from PDF!`);
                setNewTest({ title: '', description: '', duration: 60, pdfFile: null });
                refetchTests();
            } catch (err) {
                toast.error(err.response?.data?.message || "Upload failed. Check PDF format.");
            } finally { setIsUploading(false); }
        } else {
            // Manual Mode
            setIsUploading(true);
            try {
                const { data } = await createTest({
                    title: newTest.title,
                    description: newTest.description,
                    duration: newTest.duration
                });
                toast.success("Manual test created! Now add some questions.");
                setNewTest({ title: '', description: '', duration: 60, pdfFile: null });
                refetchTests();
                // Auto-select the new test and switch to questions tab
                await fetchFullTestDetails(data.data._id);
                setActiveTab('questions');
            } catch (err) {
                toast.error(err.response?.data?.message || "Creation failed.");
            } finally { setIsUploading(false); }
        }
    };

    const fetchFullTestDetails = async (testId) => {
        try {
            const { data: statsData } = await getTestStats(testId);
            setStats(statsData.data);
            
            const { data: testData } = await getTest(testId);
            setSelectedTestQuestions(testData.data.questions || []);
            setSelectedTestId(testId);
            // Removed tab reset to stats to keep user focus
        } catch { toast.error("Failed to fetch details"); }
    };

    const handleArchiveTest = async (testId) => {
        setConfirmModal({
            isOpen: true,
            title: "Archive Assessment",
            message: "Archiving this test will hide it from the main dashboard. You can restore it later from the Archive repository.",
            confirmText: "Archive",
            type: "warning",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await archiveTest(testId);
                    toast.success("Test archived");
                    if (selectedTestId === testId) setSelectedTestId(null);
                    refetchTests();
                } catch { toast.error("Failed to archive test"); }
            }
        });
    };

    const handleDeleteQuestion = async (qId) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Question",
            message: "Are you sure you want to delete this question? This action cannot be undone.",
            confirmText: "Delete",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await deleteQuestion(qId);
                    toast.success("Question deleted");
                    fetchFullTestDetails(selectedTestId);
                } catch { toast.error("Failed to delete question"); }
            }
        });
    };

    const handleEditQuestionBtn = (question) => {
        setEditingQuestion(question);
        setIsQuestionModalOpen(true);
    };

    const handlePublish = async (testId) => {
        setConfirmModal({
            isOpen: true,
            title: "Publish Assessment",
            message: "ARE YOU SURE?\n\nPublishing will make this assessment LIVE for all students. This action cannot be undone easily.",
            confirmText: "Publish",
            type: "warning",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setPublishingId(testId);
                try {
                    await publishTest(testId);
                    toast.success("Assessment is now LIVE!");
                    refetchTests();
                } catch (err) { 
                    toast.error(err.response?.data?.message || "Failed to publish"); 
                } finally {
                    setPublishingId(null);
                }
            }
        });
    };

    const fetchStats = (testId) => {
        fetchFullTestDetails(testId);
    };

    const handleResetAttempt = async (attemptId) => {
        setConfirmModal({
            isOpen: true,
            title: "Reset Attempt",
            message: "Reset this student's attempt? The current score will be lost and the student will be able to retake the test.",
            confirmText: "Reset Attempt",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await resetAttempt(attemptId);
                    toast.success("Attempt reset. Student can retake the test.");
                    if (selectedTestId) fetchStats(selectedTestId);
                } catch { toast.error("Failed to reset attempt"); }
            }
        });
    };

    if (testsLoading) return <div className="p-8 font-sans flex items-center justify-center h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Instructor Panel</h1>
                        <p className="text-slate-500 font-medium mt-1">Design precision assessments and monitor academic integrity.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Panel */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Test Creation Card */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                     Create Test 
                                </h2>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setCreationMode('pdf')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${creationMode === 'pdf' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        PDF
                                    </button>
                                    <button 
                                        onClick={() => setCreationMode('manual')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${creationMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Manual
                                    </button>
                                </div>
                            </div>
                            
                            <form onSubmit={handleCreateTest} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Test Identity</label>
                                    <input type="text" placeholder="e.g. Advanced Mathematics Final" required
                                        className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-100"
                                        value={newTest.title}
                                        onChange={e => setNewTest({ ...newTest, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                                        <div className="relative">
                                            <input type="number" placeholder="60" required
                                                className="w-full bg-slate-50 rounded-2xl p-4 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-100"
                                                value={newTest.duration}
                                                onChange={e => setNewTest({ ...newTest, duration: e.target.value })}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Min</span>
                                        </div>
                                    </div>

                                    {creationMode === 'pdf' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Source</label>
                                            <div className="relative">
                                                <input type="file" accept=".pdf" id="pdf-upload" className="hidden"
                                                    onChange={e => setNewTest({ ...newTest, pdfFile: e.target.files[0] })}
                                                />
                                                <label htmlFor="pdf-upload"
                                                    className="w-full h-[54px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-4 text-xs font-bold text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors truncate">
                                                    {newTest.pdfFile ? newTest.pdfFile.name : 'MCQ PDF'}
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button type="submit" disabled={isUploading}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 mt-2">
                                    {isUploading ? 'Processing...' : (
                                        creationMode === 'pdf' ? <><FiUploadCloud size={18} /> GENERATE FROM PDF</> : <><FiUploadCloud size={18}/> INITIALIZE TEST</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Tests List */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-5">Assessments ({tests.length})</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {tests.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-slate-400 text-sm font-semibold">No assessments yet.</p>
                                        <p className="text-xs text-slate-300 mt-1">Upload a PDF or create manually.</p>
                                    </div>
                                ) : tests.map(test => (
                                    <div key={test._id}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedTestId === test._id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/70 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                                        onClick={() => fetchStats(test._id)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate leading-snug">{test.title}</p>
                                                <p className="text-xs font-medium text-slate-400 mt-1">
                                                    {test.duration} min · <span className="font-bold text-slate-500">{test.totalMarks}</span> marks
                                                </p>
                                                <span className={`inline-block mt-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${
                                                    test.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                    {test.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleArchiveTest(test._id); }}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl border border-transparent hover:border-rose-100"
                                                    title="Archive Test"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                                {test.status !== 'Published' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handlePublish(test._id); }}
                                                        disabled={publishingId === test._id}
                                                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Publish Test"
                                                    >
                                                        {publishingId === test._id ? (
                                                            <Loader2 size={15} className="animate-spin" />
                                                        ) : (
                                                            <Send size={15} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Stats */}
                    <div className="lg:col-span-2">
                        {selectedTestId ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{stats?.testTitle || "Test Details"}</h2>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                                        <button 
                                            onClick={() => setActiveTab('stats')}
                                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <FiTrendingUp className="w-4 h-4" /> Performance
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('questions')}
                                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'questions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <FiList className="w-4 h-4" /> Questions ({selectedTestQuestions.length})
                                        </button>
                                    </div>
                                </div>

                                {activeTab === 'stats' ? (
                                    <div className="space-y-8">
                                        {/* KPI Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Score</p>
                                                <div className="flex items-end gap-2">
                                                    <p className="text-3xl font-black text-slate-900">{stats?.averageScore || 0}</p>
                                                    <FiTrendingUp className="text-emerald-500 mb-1" />
                                                </div>
                                            </div>
                                            <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Participants</p>
                                                <p className="text-3xl font-black text-slate-900">{stats?.completedStudentCount || 0}<span className="text-slate-400 text-lg font-bold"> / {stats?.enrolledStudents || 0}</span></p>
                                            </div>
                                            <div className="bg-slate-900 p-7 rounded-[28px] text-white shadow-xl shadow-slate-200">
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Completion Rate</p>
                                                <p className="text-3xl font-black">
                                                    {stats?.completionRate || 0}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Performance Table */}
                                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="p-7 border-b border-slate-50 flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-slate-800">Student Attempts</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-slate-50/60 text-left">
                                                            {['Student', 'Score', 'Status', 'Submitted At', 'Actions'].map(h => (
                                                                <th key={h} className="px-7 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {(!stats || stats.performance.length === 0) ? (
                                                            <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-medium italic">No attempts recorded for this assessment.</td></tr>
                                                        ) : stats.performance.map((p, i) => (
                                                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                                <td className="px-7 py-5">
                                                                    <p className="font-bold text-slate-700">{p.studentName}</p>
                                                                    <p className="text-xs text-slate-400">{p.studentRoll || p.studentEmail}</p>
                                                                </td>
                                                                <td className="px-7 py-5">
                                                                    <span className="font-black text-slate-900 text-xl">{p.score}</span>
                                                                    <span className="text-xs text-slate-400 ml-1 font-bold">PTS</span>
                                                                </td>
                                                                <td className="px-7 py-5">
                                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                                                                        {p.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-7 py-5 text-sm text-slate-400 font-medium">
                                                                    {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : '—'}
                                                                </td>
                                                                <td className="px-7 py-5">
                                                                    <button onClick={() => handleResetAttempt(p.attemptId)}
                                                                        className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm">
                                                                        <FiRefreshCw size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Question List Header */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Question Bank</h3>
                                                <p className="text-xs text-slate-400 font-medium">Manage and refine individual assessment items.</p>
                                            </div>
                                            {tests.find(t => t._id === selectedTestId)?.status !== 'Published' && (
                                                <button 
                                                    onClick={() => { setEditingQuestion(null); setIsQuestionModalOpen(true); }}
                                                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                                >
                                                    <FiPlus /> ADD QUESTION
                                                </button>
                                            )}
                                        </div>


                                        {/* Question List Display */}
                                        <div className="space-y-4">
                                            {selectedTestQuestions.length === 0 ? (
                                                <div className="p-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px]">
                                                    <p className="text-slate-400 font-bold mb-2 text-sm uppercase tracking-widest">Question Bank Empty</p>
                                                    <p className="text-xs text-slate-400 max-w-[200px] mx-auto">This assessment doesn't have any items yet. Start by adding a manual question or importing via PDF.</p>
                                                </div>
                                            ) : selectedTestQuestions.map((q, idx) => {
                                                const correctIdx = q.options.findIndex((opt, i) => 
                                                    opt === q.correctAnswer || 
                                                    String.fromCharCode(65 + i) === q?.correctAnswer?.trim()?.toUpperCase()
                                                );
                                                const correctLabel = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : '?';
                                                const correctText = correctIdx >= 0 ? q.options[correctIdx] : q.correctAnswer;
                                                return (
                                                <div key={idx} className="group bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all">
                                                    {/* Question header row */}
                                                    <div className="flex gap-4 items-start mb-5">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 text-sm shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-800 leading-relaxed text-sm">{q.questionText}</p>
                                                        </div>
                                                        {/* Actions — always visible unless published */}
                                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                                            <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full uppercase mr-1">
                                                                {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                                                            </span>
                                                            {tests.find(t => t._id === selectedTestId)?.status !== 'Published' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleEditQuestionBtn(q)}
                                                                        className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                                                        title="Edit Question"
                                                                    >
                                                                        <Edit size={14} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteQuestion(q._id)}
                                                                        className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                                                                        title="Delete Question"
                                                                    >
                                                                        <Trash size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Options grid */}
                                                    <div className="grid grid-cols-2 gap-3 mb-4 pl-14">
                                                        {q.options.map((opt, i) => {
                                                            const isCorrectOpt = i === correctIdx;
                                                            return (
                                                            <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-colors ${
                                                                isCorrectOpt
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                    : 'bg-slate-50 border-slate-100 text-slate-500'
                                                            }`}>
                                                                <span className={`w-5 h-5 flex items-center justify-center rounded-lg text-[9px] font-black shrink-0 ${
                                                                    isCorrectOpt ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                                                                }`}>
                                                                    {String.fromCharCode(65 + i)}
                                                                </span>
                                                                <span className="truncate">{opt}</span>
                                                                {isCorrectOpt && <FiCheck className="shrink-0 ml-auto text-emerald-600" size={12} />}
                                                            </div>
                                                            );
                                                        })}
                                                    </div>


                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[500px] bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-20 text-center">
                                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
                                    <FiActivity size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Intelligence Dashboard</h3>
                                <p className="text-slate-400 text-sm font-medium max-w-xs leading-relaxed">Select any assessment from the repository to view deep analytics and manage its structural components.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modal Components */}
            <QuestionModal 
                isOpen={isQuestionModalOpen} 
                onClose={() => setIsQuestionModalOpen(false)} 
                testId={selectedTestId}
                initialData={editingQuestion}
                onSuccess={() => fetchFullTestDetails(selectedTestId)}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </div>
    );
};

export default InstructorDashboard;
