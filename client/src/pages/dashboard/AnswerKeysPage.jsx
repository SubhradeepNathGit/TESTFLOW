import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, UploadCloud, Trash2, ExternalLink, X, CheckCircle, File } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { getAnswerKeys, uploadAnswerKey, deleteAnswerKey } from '../../api/answerKeyApi';
import { getAssetUrl } from '../../utils/assets';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Skeleton, { CardSkeleton } from '../../components/common/Skeleton';

// Upload Modal
const UploadModal = ({ isOpen, onClose, onUploaded }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!title.trim() || !file) {
            return toast.warning('Title and PDF file are required');
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('pdfFile', file);

        setIsUploading(true);
        try {
            await uploadAnswerKey(formData);
            toast.success('Answer Key uploaded successfully');
            onUploaded();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload answer key');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        className="relative w-full max-w-md bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-3xl rounded-[28px] border border-slate-200/60 dark:border-white/[0.08] shadow-2xl dark:shadow-none p-6 lg:p-8"
                    >
                        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors">
                            <X size={18} strokeWidth={1.5} />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center mb-4">
                                <UploadCloud size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Upload Answer Key</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload a PDF document to help students verify their answers.</p>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Midterm Physics Key"
                                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] focus:border-slate-400 dark:focus:border-white/20 outline-none bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white text-sm transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Short description..."
                                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] focus:border-slate-400 dark:focus:border-white/20 outline-none bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white text-sm transition-all"
                                />
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-slate-400 dark:border-white/20 bg-slate-50 dark:bg-white/[0.04]' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]'}`}
                            >
                                <FileText size={28} strokeWidth={1.2} className={`mx-auto mb-3 ${file ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`} />
                                <p className={`text-sm font-semibold ${file ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {file ? file.name : 'Click to select PDF document'}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">Only .pdf format</p>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isUploading || !title || !file}
                                className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98] mt-2"
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-900 dark:border-slate-400/30 dark:border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Upload PDF"
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// Main Component
const AnswerKeysPage = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'warning',
        onConfirm: () => {}
    });

    const isManager = user?.role === 'instructor' || user?.role === 'owner';

    const { data: answerKeys = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['answer-keys'],
        queryFn: () => getAnswerKeys().then(r => r.data.data),
        onError: () => toast.error("Failed to load answer keys")
    });

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => queryClient.invalidateQueries({ queryKey: ['answer-keys'] });

        socket.on('answerKey:updated', handleUpdate);
        socket.on('answerKey:archived', handleUpdate);
        socket.on('answerKey:restored', handleUpdate);
        socket.on('answerKey:deleted', handleUpdate);

        return () => {
            socket.off('answerKey:updated', handleUpdate);
            socket.off('answerKey:archived', handleUpdate);
            socket.off('answerKey:restored', handleUpdate);
            socket.off('answerKey:deleted', handleUpdate);
        };
    }, [socket, queryClient]);

    const handleArchive = async (id) => {
        setConfirmModal({
            isOpen: true,
            title: "Archive Answer Key",
            message: "Archiving this answer key will hide it from students. You can restore it later from the Archive repository.",
            confirmText: "Archive",
            type: "warning",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await deleteAnswerKey(id);
                    toast.success("Moved to archive");
                    queryClient.invalidateQueries({ queryKey: ['answer-keys'] });
                } catch {
                    toast.error("Failed to archive");
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-black p-4 sm:p-6 lg:p-10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-white dark:bg-[#0A0A0A] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center">
                            <FileText size={20} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Answer Keys</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review official answers for recent assessments.</p>
                        </div>
                    </div>

                    {isManager && (
                        <button
                            onClick={() => setModalOpen(true)}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] flex items-center gap-2"
                        >
                            <UploadCloud size={16} strokeWidth={2} />
                            Upload Key
                        </button>
                    )}
                </div>

                {/* List */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <CardSkeleton key={i} className="h-48 rounded-[24px]" />
                        ))}
                    </div>
                ) : answerKeys.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[#0A0A0A] rounded-[24px] border border-slate-200/60 dark:border-white/[0.06] p-16 text-center"
                    >
                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 dark:border-white/[0.06]">
                            <CheckCircle size={24} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">No Answer Keys Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                            {isManager
                                ? "You haven't uploaded any answer keys for your students."
                                : "Instructors haven't posted any answer keys here yet."}
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {answerKeys.map((item, idx) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white dark:bg-[#0A0A0A] p-6 rounded-[24px] border border-slate-200/80 border-b-4 border-b-slate-200/80 dark:border-white/[0.06] dark:border-b-white/[0.06] shadow-sm hover:shadow-md dark:shadow-none flex flex-col hover:bg-slate-50/40 dark:hover:bg-white/[0.02] transition-all"
                            >
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                                        <File size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug truncate">{item.title}</h3>
                                        {item.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                                    <a
                                        href={getAssetUrl(item.pdfUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        View PDF <ExternalLink size={14} strokeWidth={1.8} className="text-slate-400 dark:text-slate-500" />
                                    </a>
                                    {isManager && (
                                        <button
                                            onClick={() => handleArchive(item._id)}
                                            className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                            title="Archive"
                                        >
                                            <Trash2 size={16} strokeWidth={1.8} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <UploadModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onUploaded={refetch}
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
        </div>
    );
};

export default AnswerKeysPage;
