import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Save, Edit3, HelpCircle } from 'lucide-react';
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
            
            // Safety check for callback to prevent JS errors triggering the catch block
            if (onSuccess) onSuccess();
            else if (onSaved) onSaved();
            
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
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <HelpCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {initialData ? 'Edit Question' : 'Add New Question'}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {initialData ? 'Update Assessment Item' : 'Manual Assessment Entry'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Prompt</label>
                            <textarea 
                                placeholder="Enter your question here..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-all"
                                value={newQuestion.questionText}
                                onChange={e => setNewQuestion({...newQuestion, questionText: e.target.value})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {newQuestion.options.map((opt, i) => {
                                const isCorrectOpt = (opt === newQuestion.correctAnswer && opt !== '') || 
                                    (newQuestion.correctAnswer && String.fromCharCode(65 + i) === newQuestion.correctAnswer.toString().trim().toUpperCase());
                                return (
                                <div key={i} className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between group">
                                        Option {String.fromCharCode(65 + i)}
                                        <button 
                                            type="button"
                                            onClick={() => setNewQuestion({...newQuestion, correctAnswer: opt})}
                                            className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${isCorrectOpt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                        >
                                            {isCorrectOpt ? 'CORRECT' : 'MARK AS CORRECT'}
                                        </button>
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder={`Choice ${i+1}`}
                                        className={`w-full bg-slate-50 border rounded-2xl p-4 text-slate-700 text-sm font-medium outline-none transition-all ${isCorrectOpt ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-slate-100 focus:border-indigo-500'}`}
                                        value={opt}
                                        onChange={e => {
                                            const newOpts = [...newQuestion.options];
                                            newOpts[i] = e.target.value;
                                            
                                            // Optional: If user updates the text of the currently strictly-matched correct answer, sync it
                                            let newCorrect = newQuestion.correctAnswer;
                                            if (newQuestion.correctAnswer === opt) {
                                                newCorrect = e.target.value;
                                            }
                                            
                                            setNewQuestion({...newQuestion, options: newOpts, correctAnswer: newCorrect});
                                        }}
                                        required
                                    />
                                </div>
                                );
                            })}
                        </div>

                        <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Marks</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        className="w-20 bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newQuestion.marks}
                                        onChange={e => setNewQuestion({...newQuestion, marks: parseInt(e.target.value) || 1})}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="px-8 py-4 rounded-2xl text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 flex items-center gap-2 transition-all disabled:opacity-70"
                                >
                                    {isSaving ? 'Saving...' : (
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
