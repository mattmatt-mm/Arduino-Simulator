import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIChatBubble = ({ onSend, status = 'idle' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef(null);

    // Reset to idle after success
    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                setIsExpanded(false);
                setInputValue("");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Auto-focus input when expanded
    useEffect(() => {
        if (isExpanded && status === 'idle') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isExpanded, status]);

    const handleSubmit = () => {
        if (inputValue.trim()) {
            onSend(inputValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Animation Variants
    const containerVariants = {
        idle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "rgba(255, 255, 255, 0.1)", // Glass effect base
            transition: { type: "spring", stiffness: 500, damping: 30 }
        },
        expanded: {
            width: 320, // Or "100%" if constrained by parent
            height: 56,
            borderRadius: 28,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            transition: { type: "spring", stiffness: 500, damping: 30 }
        },
        thinking: {
            width: 140,
            height: 48,
            borderRadius: 24,
            backgroundColor: "rgba(59, 130, 246, 0.2)", // Blue tint
            transition: { type: "spring", stiffness: 500, damping: 30 }
        },
        success: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "rgba(34, 197, 94, 0.2)", // Green tint
            transition: { type: "spring", stiffness: 500, damping: 30 }
        }
    };

    // Determine current visual state
    let currentState = 'idle';
    if (status === 'processing') currentState = 'thinking';
    else if (status === 'success') currentState = 'success';
    else if (isExpanded) currentState = 'expanded';

    return (
        <div className="flex justify-center items-center w-full py-2">
            <motion.div
                layout
                initial="idle"
                animate={currentState}
                variants={containerVariants}
                onClick={() => !isExpanded && status === 'idle' && setIsExpanded(true)}
                className={`
                    relative flex items-center justify-center overflow-hidden
                    backdrop-blur-md border border-white/20 shadow-lg
                    ${currentState === 'idle' ? 'cursor-pointer hover:bg-white/20' : ''}
                `}
            >
                <AnimatePresence mode="wait">
                    {currentState === 'idle' && (
                        <motion.div
                            key="icon"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="text-white"
                        >
                            {/* Brain Icon */}
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </motion.div>
                    )}

                    {currentState === 'expanded' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center w-full px-4 gap-2"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask AI to modify code..."
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 text-sm"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmit();
                                }}
                                disabled={!inputValue.trim()}
                                className="p-1.5 rounded-full bg-blue-500/80 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </motion.div>
                    )}

                    {currentState === 'thinking' && (
                        <motion.div
                            key="thinking"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2 text-blue-200 text-sm font-medium"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-blue-200 border-t-transparent rounded-full"
                            />
                            Thinking...
                        </motion.div>
                    )}

                    {currentState === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="text-green-400"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AIChatBubble;
