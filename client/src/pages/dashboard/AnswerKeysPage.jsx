import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiUploadCloud, FiTrash2, FiExternalLink, FiX, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { getAnswerKeys, uploadAnswerKey, deleteAnswerKey } from '../../api/answerKeyApi';

/* ─────────────────────────────────────────
   Upload Modal (Instructors Only)
───────────────────────────────────────── */
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
                    className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl p-6 lg:p-8"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <FiX size={20} />
                    </button>
                    
                    <div className="mb-6">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                            <FiUploadCloud size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Upload Answer Key</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Upload a PDF document to help students verify their answers.</p>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Midterm Physics Key"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description..."
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                            />
                        </div>
                        
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'}`}
                        >
                            <FiFileText size={32} className={`mx-auto mb-3 ${file ? 'text-indigo-600' : 'text-slate-300'}`} />
                            <p className={`text-sm font-bold ${file ? 'text-indigo-700' : 'text-slate-600'}`}>
                                {file ? file.name : 'Click to select PDF document'}
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-1">Only .pdf format is supported</p>
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

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
const AnswerKeysPage = () => {
    const { user } = useContext(AuthContext);
    const [answerKeys, setAnswerKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const isManager = user?.role === 'instructor' || user?.role === 'owner';

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const { data } = await getAnswerKeys();
            setAnswerKeys(data.data || []);
        } catch {
            toast.error('Failed to automatically load answer keys');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this answer key?")) return;
        try {
            await deleteAnswerKey(id);
            toast.success("Deleted successfully");
            fetchKeys();
        } catch {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                <FiFileText size={20} />
                            </div>
                            Answer Keys
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Review official answers for recent assessments.</p>
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

                {/* ── List ── */}
                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : answerKeys.length === 0 ? (
                    <div className="bg-white p-16 rounded-[32px] border border-slate-100 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <FiCheckCircle size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No Answer Keys Yet</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                            {isManager 
                                ? "You haven't uploaded any answer keys for your students."
                                : "Instructors haven't posted any answer keys here yet."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {answerKeys.map((item, idx) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                                        <FiFileText size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-sm font-bold text-slate-800 leading-snug break-words">{item.title}</h3>
                                        {item.description && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                        )}
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{new Date(item.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                                    <a
                                        href={`http://localhost:3006/${item.pdfUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        View PDF <FiExternalLink size={12} />
                                    </a>
                                    {isManager && (
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors shrink-0"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={16} />
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
                    onUploaded={fetchKeys} 
                />
            </div>
        </div>
    );
};

export default AnswerKeysPage;
