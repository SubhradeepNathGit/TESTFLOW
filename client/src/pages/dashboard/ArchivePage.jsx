import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { getArchivedTests, restoreTest, permanentDeleteTest } from '../../api/testApi';
import { getArchivedAnswerKeys, restoreAnswerKey, permanentDeleteAnswerKey } from '../../api/answerKeyApi';
import { FiRotateCcw, FiTrash2, FiInbox, FiClock, FiFileText, FiBookmark, FiKey } from 'react-icons/fi';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CardSkeleton } from '../../components/common/Skeleton';
import { useSocket } from '../../context/SocketContext';

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
};

const ArchivePage = () => {
    const queryClient = useQueryClient();
    const socket = useSocket();
    const [activeTab, setActiveTab] = useState('tests'); // 'tests' or 'keys'
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'warning',
        onConfirm: () => {}
    });

    // Queries
    const { data: archivedTests = [], isLoading: loadingTests } = useQuery({
        queryKey: ['archived-tests'],
        queryFn: () => getArchivedTests().then(r => r.data.data),
        onError: () => toast.error("Failed to fetch archived tests"),
    });

    const { data: archivedKeys = [], isLoading: loadingKeys } = useQuery({
        queryKey: ['archived-keys'],
        queryFn: () => getArchivedAnswerKeys().then(r => r.data.data),
        onError: () => toast.error("Failed to fetch archived answer keys"),
    });

    useEffect(() => {
        if (!socket) return;

        const refreshTests = () => {
            queryClient.invalidateQueries({ queryKey: ['archived-tests'] });
            queryClient.invalidateQueries({ queryKey: ['instructor-tests'] });
        };

        const refreshKeys = () => {
            queryClient.invalidateQueries({ queryKey: ['archived-keys'] });
            queryClient.invalidateQueries({ queryKey: ['answer-keys'] });
        };

        socket.on('test:archived', refreshTests);
        socket.on('test:published', refreshTests);
        
        socket.on('answerKey:archived', refreshKeys);
        socket.on('answerKey:restored', refreshKeys);
        socket.on('answerKey:deleted', refreshKeys);
        socket.on('answerKey:updated', refreshKeys);

        return () => {
            socket.off('test:archived', refreshTests);
            socket.off('test:published', refreshTests);
            socket.off('answerKey:archived', refreshKeys);
            socket.off('answerKey:restored', refreshKeys);
            socket.off('answerKey:deleted', refreshKeys);
            socket.off('answerKey:updated', refreshKeys);
        };
    }, [socket, queryClient]);

    const handleRestoreTest = async (id) => {
        try {
            await restoreTest(id);
            toast.success("Test restored to dashboard");
            queryClient.invalidateQueries({ queryKey: ['archived-tests'] });
            queryClient.invalidateQueries({ queryKey: ['instructor-tests'] });
        } catch { toast.error("Failed to restore test"); }
    };

    const handlePermanentDeleteTest = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Permanent Delete Test",
            message: "CRITICAL: This will permanently delete the test and all associated student results. This cannot be undone. Proceed?",
            confirmText: "Delete Permanently",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await permanentDeleteTest(id);
                    toast.success("Test permanently deleted");
                    queryClient.invalidateQueries({ queryKey: ['archived-tests'] });
                } catch { toast.error("Failed to delete test"); }
            }
        });
    };

    const handleRestoreKey = async (id) => {
        try {
            await restoreAnswerKey(id);
            toast.success("Answer Key restored");
            queryClient.invalidateQueries({ queryKey: ['archived-keys'] });
            queryClient.invalidateQueries({ queryKey: ['answer-keys'] });
        } catch { toast.error("Failed to restore answer key"); }
    };

    const handlePermanentDeleteKey = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Permanent Delete Key",
            message: "This will permanently delete the answer key PDF. This action cannot be undone. Proceed?",
            confirmText: "Delete Permanently",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await permanentDeleteAnswerKey(id);
                    toast.success("Answer Key permanently deleted");
                    queryClient.invalidateQueries({ queryKey: ['archived-keys'] });
                } catch { toast.error("Failed to delete answer key"); }
            }
        });
    };

    const loading = activeTab === 'tests' ? loadingTests : loadingKeys;
    const currentItems = activeTab === 'tests' ? archivedTests : archivedKeys;

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-black p-4 sm:p-6 lg:p-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <FiBookmark size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                Archive Repository
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5">
                                Shadowed Assets
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 dark:bg-white/[0.03] p-1.5 rounded-[20px] border border-slate-200/50 dark:border-white/5">
                        <button 
                            onClick={() => setActiveTab('tests')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'tests' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <FiFileText size={14} /> Assessments ({archivedTests.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('keys')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'keys' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <FiKey size={14} /> Answer Keys ({archivedKeys.length})
                        </button>
                    </div>
                </div>

                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-10 max-w-2xl">
                    Restore soft-deleted {activeTab === 'tests' ? 'assessments' : 'answer keys'} to the dashboard, or permanently purge them from the system.
                </p>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CardSkeleton /><CardSkeleton /><CardSkeleton />
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[40px] border-2 border-dashed border-slate-100 dark:border-white/5 p-16 sm:p-24 text-center group hover:border-amber-500/20 transition-all duration-700">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
                            <FiInbox size={32} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Archived {activeTab === 'tests' ? 'Tests' : 'Keys'}</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                            Deleted {activeTab === 'tests' ? 'assessments' : 'documents'} will appear here for final review before permanent removal.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {currentItems.map((item) => (
                                <motion.div
                                    key={item._id}
                                    variants={cardVariants}
                                    layout
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none hover:border-amber-100 dark:hover:border-amber-500/30 transition-all duration-500 group relative overflow-hidden"
                                >
                                    {/* Card Top */}
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${activeTab === 'tests' ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'}`}>
                                            {activeTab === 'tests' ? <FiFileText size={24} /> : <FiKey size={24} />}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => activeTab === 'tests' ? handleRestoreTest(item._id) : handleRestoreKey(item._id)}
                                                className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100/50"
                                                title="Restore"
                                            >
                                                <FiRotateCcw size={16} />
                                            </button>
                                            <button
                                                onClick={() => activeTab === 'tests' ? handlePermanentDeleteTest(item._id) : handlePermanentDeleteKey(item._id)}
                                                className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-100/50"
                                                title="Delete Permanently"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 truncate leading-snug">{item.title}</h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-6 line-clamp-2 leading-relaxed">
                                        {item.description || "No description provided."}
                                    </p>

                                    {/* Meta */}
                                    <div className="space-y-3 mt-6 pt-6 border-t border-slate-50 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <FiClock size={12} className="shrink-0" />
                                            <span>Archived {new Date(item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        
                                        {activeTab === 'tests' && (
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-slate-50 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                    {item.totalMarks} Marks
                                                </span>
                                                <span className="px-3 py-1 bg-slate-50 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                    {item.duration} Min
                                                </span>
                                            </div>
                                        )}
                                        
                                        {activeTab === 'keys' && item.uploadedBy && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <span className="px-3 py-1 bg-slate-50 dark:bg-white/10 rounded-full">
                                                    Uploaded by {item.uploadedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

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

export default ArchivePage;
