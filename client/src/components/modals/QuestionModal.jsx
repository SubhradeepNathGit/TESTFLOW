import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { addQuestion, updateQuestion } from '../../api/testApi';

const QuestionModal = ({ isOpen, onClose, testId, onSuccess, initialData }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1
    });

    useEffect(() => {
        if (initialData) {
            setNewQuestion({
                questionText: initialData.questionText || '',
                options: initialData.options || ['', '', '', ''],
                correctAnswer: initialData.correctAnswer || '',
                marks: initialData.marks || 1
            });
        } else {
            setNewQuestion({
                questionText: '',
                options: ['', '', '', ''],
                correctAnswer: '',
                marks: 1
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newQuestion.questionText) return toast.error("Please enter the question text");
        if (!newQuestion.correctAnswer) return toast.error("Please select the correct answer");
        if (newQuestion.options.some(opt => !opt)) return toast.error("Please fill all options");

        try {
            setIsSaving(true);
            if (initialData?._id) {
                await updateQuestion(initialData._id, newQuestion);
                toast.success("Question updated successfully!");
            } else {
                await addQuestion(testId, newQuestion);
                toast.success("Question added successfully!");
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Operation failed");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl border border-slate-100 dark:border-white/[0.08] rounded-[2.5rem] shadow-2xl dark:shadow-none overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg dark:shadow-none">
                                <HelpCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                    {initialData ? 'Edit Question' : 'Add New Question'}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    {initialData ? 'Update Assessment Item' : 'Manual Assessment Entry'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent hover:border-slate-100 dark:hover:border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Question Text */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                Question Prompt
                            </label>
                            <textarea
                                placeholder="Enter your question here..."
                                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] rounded-2xl p-4 text-slate-700 dark:text-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 min-h-[100px] transition-all placeholder-slate-400 dark:placeholder-slate-600"
                                value={newQuestion.questionText}
                                onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                                required
                            />
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {newQuestion.options.map((opt, i) => {
                                const isCorrectOpt = (opt === newQuestion.correctAnswer && opt !== '') ||
                                    (newQuestion.correctAnswer && String.fromCharCode(65 + i) === newQuestion.correctAnswer.toString().trim().toUpperCase());
                                return (
                                    <div key={i} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex justify-between group">
                                            Option {String.fromCharCode(65 + i)}
                                            <button
                                                type="button"
                                                onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: opt })}
                                                className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${isCorrectOpt
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20'
                                                }`}
                                            >
                                                {isCorrectOpt ? 'CORRECT' : 'MARK AS CORRECT'}
                                            </button>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={`Choice ${i + 1}`}
                                            className={`w-full bg-slate-50 dark:bg-white/[0.04] border rounded-2xl p-4 text-slate-700 dark:text-slate-200 text-sm font-medium outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 ${isCorrectOpt
                                                ? 'border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/10'
                                                : 'border-slate-100 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-500/70'
                                            }`}
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...newQuestion.options];
                                                newOpts[i] = e.target.value;
                                                let newCorrect = newQuestion.correctAnswer;
                                                if (newQuestion.correctAnswer === opt) {
                                                    newCorrect = e.target.value;
                                                }
                                                setNewQuestion({ ...newQuestion, options: newOpts, correctAnswer: newCorrect });
                                            }}
                                            required
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                        Assigned Marks
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-20 bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] rounded-xl p-3 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all"
                                        value={newQuestion.marks}
                                        onChange={e => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-8 py-4 rounded-2xl text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl dark:shadow-none flex items-center gap-2 transition-all disabled:opacity-70 active:scale-95"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {initialData ? 'UPDATE QUESTION' : 'SAVE QUESTION'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default QuestionModal;
