import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { getArchivedTests, restoreTest, permanentDeleteTest } from '../../api/testApi';
import { FiRotateCcw, FiTrash2, FiInbox, FiClock, FiFileText, FiBookmark } from 'react-icons/fi';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CardSkeleton } from '../../components/common/Skeleton';

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
};

const ArchivePage = () => {
    const queryClient = useQueryClient();
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'warning',
        onConfirm: () => {}
    });

    const { data: archivedTests = [], isLoading: loading } = useQuery({
        queryKey: ['archived-tests'],
        queryFn: () => getArchivedTests().then(r => r.data.data),
        onError: () => toast.error("Failed to fetch archive"),
    });

    const handleRestore = async (id) => {
        try {
            await restoreTest(id);
            toast.success("Test restored to dashboard");
            queryClient.invalidateQueries({ queryKey: ['archived-tests'] });
            queryClient.invalidateQueries({ queryKey: ['instructor-tests'] });
        } catch {
            toast.error("Failed to restore test");
        }
    };

    const handlePermanentDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Permanent Delete",
            message: "CRITICAL: This will permanently delete the test and all associated student results. This cannot be undone. Proceed?",
            confirmText: "Delete Permanently",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await permanentDeleteTest(id);
                    toast.success("Test permanently deleted");
                    queryClient.invalidateQueries({ queryKey: ['archived-tests'] });
                } catch {
                    toast.error("Failed to delete test");
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-black p-4 sm:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center">
                            <FiBookmark size={20} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                Archive Repository
                            </h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Shadowed Assessments
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-3 pl-0.5">
                        Restore soft-deleted assessments to the dashboard, or permanently clean them up.
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CardSkeleton /><CardSkeleton /><CardSkeleton />
                    </div>
                ) : archivedTests.length === 0 ? (
                    <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[40px] border-2 border-dashed border-slate-100 dark:border-white/5 p-10 sm:p-20 text-center">
                        <FiInbox size={48} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Archive is Empty</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                            Assessments you delete will appear here before permanent removal.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {archivedTests.map((test) => (
                                <motion.div
                                    key={test._id}
                                    variants={cardVariants}
                                    layout
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none dark:shadow-none hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-500 group relative overflow-hidden"
                                >
                                    {/* Card Top */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                                            <FiFileText size={22} />
                                        </div>
                                        {/* Always-visible actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRestore(test._id)}
                                                className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                                title="Restore to Dashboard"
                                            >
                                                <FiRotateCcw size={15} />
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(test._id)}
                                                className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                                                title="Permanently Delete"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Test Info */}
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 truncate leading-snug">{test.title}</h3>
                                    {test.description && (
                                        <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2">{test.description}</p>
                                    )}

                                    {/* Meta */}
                                    <div className="space-y-2.5 mt-5 pt-5 border-t border-slate-50 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            <FiClock size={12} className="shrink-0" />
                                            <span>Archived {new Date(test.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-slate-50 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                {test.totalMarks} Marks
                                            </span>
                                            <span className="px-3 py-1 bg-slate-50 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                {test.duration} Min
                                            </span>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ml-auto ${
                                                test.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-white/10 text-slate-400'
                                            }`}>
                                                {test.status}
                                            </span>
                                        </div>
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
