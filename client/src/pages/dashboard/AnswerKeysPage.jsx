import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiUploadCloud, FiTrash2, FiExternalLink, FiX, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAnswerKeys, uploadAnswerKey, deleteAnswerKey } from '../../api/answerKeyApi';
import { getAssetUrl } from '../../utils/assets';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-md bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl rounded-[24px] shadow-2xl p-6 lg:p-8"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <FiX size={20} />
                    </button>

                    <div className="mb-6">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                            <FiUploadCloud size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload Answer Key</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Upload a PDF document to help students verify their answers.</p>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Midterm Physics Key"
                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description..."
                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm"
                            />
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-black/50'}`}
                        >
                            <FiFileText size={32} className={`mx-auto mb-3 ${file ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`} />
                            <p className={`text-sm font-bold ${file ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                {file ? file.name : 'Click to select PDF document'}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Only .pdf format is supported</p>
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
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {isUploading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Upload PDF"
                            )}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Main Component
const AnswerKeysPage = () => {
    const { user } = useContext(AuthContext);
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3 leading-none">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                                <FiFileText size={20} />
                            </div>
                            Answer Keys
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Review official answers for recent assessments.</p>
                    </div>

                    {isManager && (
                        <button
                            onClick={() => setModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
                        >
                            <FiUploadCloud size={18} />
                            Upload Key
                        </button>
                    )}
                </div>

                {/* List */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-white/[0.03] h-48 rounded-[24px] animate-pulse border border-slate-100 dark:border-white/5" />
                        ))}
                    </div>
                ) : answerKeys.length === 0 ? (
                    <div className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-16 rounded-[32px] border border-slate-100 dark:border-white/5 text-center shadow-none dark:shadow-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        <div className="w-20 h-20 bg-slate-50 dark:bg-black rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/5">
                            <FiCheckCircle size={32} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Answer Keys Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm mx-auto font-medium">
                            {isManager
                                ? "You haven't uploaded any answer keys for your students."
                                : "Instructors haven't posted any answer keys here yet."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {answerKeys.map((item, idx) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-none flex flex-col hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                                        <FiFileText size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug break-words">{item.title}</h3>
                                        {item.description && (
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 font-medium">{item.description}</p>
                                        )}
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-4 flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between gap-3">
                                    <a
                                        href={getAssetUrl(item.pdfUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-slate-900 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                                    >
                                        View PDF <FiExternalLink size={14} />
                                    </a>
                                    {isManager && (
                                        <button
                                            onClick={() => handleArchive(item._id)}
                                            className="p-3 text-slate-400 dark:text-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                                            title="Archive"
                                        >
                                            <FiTrash2 size={18} />
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
