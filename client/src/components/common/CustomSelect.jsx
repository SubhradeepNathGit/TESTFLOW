import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select Option", 
    label,
    className = "",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
            {label && (
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            
            <div className="relative">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl border-white/5 shadow-none border-2 px-5 py-3.5 rounded-2xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 outline-none flex items-center justify-between transition-all group ${
                        isOpen 
                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20' 
                        : 'border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <span className={!selectedOption ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-[#0A0A0B]/95 dark:backdrop-blur-2xl border border-slate-100 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-none p-2 overflow-hidden"
                        >
                            <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                                            value === option.value
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {option.icon && (
                                                <div className={`p-1.5 rounded-lg ${value === option.value ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-black text-slate-400 dark:text-slate-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}>
                                                    <option.icon className="w-4 h-4" />
                                                </div>
                                            )}
                                            <span className="font-bold">{option.label}</span>
                                        </div>
                                        {value === option.value && (
                                            <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {options.length === 0 && (
                                    <div className="py-8 text-center text-slate-400 text-xs font-bold italic">
                                        No options available
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CustomSelect;
