import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { geminiService } from "../services/geminiService";

const IDEPanel = ({ generatedCode, toonOutput, aiFeedback }) => {
    const [code, setCode] = useState("// Write your Arduino code here\nvoid setup() {\n  \n}\n\nvoid loop() {\n  \n}");
    const [activeTab, setActiveTab] = useState("code");
    const [copied, setCopied] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [codeHistory, setCodeHistory] = useState([]);

    useEffect(() => {
        if (generatedCode && generatedCode.length > 50) {
            setCode(generatedCode);
            // Save to history when new code is generated
            setCodeHistory(prev => [...prev, generatedCode].slice(-10)); // Keep last 10
        }
    }, [generatedCode]);

    const handleEditorChange = (value) => {
        setCode(value);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAiModify = async () => {
        if (!aiPrompt.trim()) return;

        setIsAiProcessing(true);

        try {
            // Save current code to history before modification
            setCodeHistory(prev => [...prev, code].slice(-10));

            const modifiedCode = await geminiService.modifyCode(code, aiPrompt);

            setCode(modifiedCode);
            setAiPrompt("");

        } catch (error) {
            console.error('AI modification error:', error);
            alert(`Failed to modify code: ${error.message}\n\nPlease check:\n1. Your API key is valid\n2. You have API quota remaining\n3. Your internet connection is working`);
            // Restore from history on error
            if (codeHistory.length > 0) {
                setCode(codeHistory[codeHistory.length - 1]);
                setCodeHistory(prev => prev.slice(0, -1));
            }
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleUndo = () => {
        if (codeHistory.length > 0) {
            const previousCode = codeHistory[codeHistory.length - 1];
            setCode(previousCode);
            setCodeHistory(prev => prev.slice(0, -1));
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Arduino IDE</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openSettings'))}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Settings"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    {codeHistory.length > 0 && (
                        <button
                            onClick={handleUndo}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors flex items-center gap-1.5"
                            title="Undo last change"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Undo
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5"
                    >
                        {copied ? (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Code
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                    onClick={() => setActiveTab("code")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === "code"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                >
                    Code
                    {activeTab === "code" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("toon")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === "toon"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                >
                    Log
                    {activeTab === "toon" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("feedback")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === "feedback"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                >
                    Debug
                    {aiFeedback && aiFeedback.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                            {aiFeedback.length}
                        </span>
                    )}
                    {activeTab === "feedback" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === "code" && (
                    <>
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                defaultLanguage="cpp"
                                theme="vs-dark"
                                value={code}
                                onChange={handleEditorChange}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>

                        {/* AI Chat Input */}
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                            <div className="flex items-center gap-2">
                                <div className="relative group">
                                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                                        <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                            <p className="font-semibold mb-1">AI Code Assistant</p>
                                            <p className="text-gray-300 dark:text-gray-400">Ask AI to modify your code with natural language</p>
                                            <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1">Example: "add LED blink on pin 13"</p>
                                            <div className="absolute top-full left-4 -mt-1">
                                                <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAiModify()}
                                    placeholder="Ask AI to modify your code"
                                    disabled={isAiProcessing}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    onClick={handleAiModify}
                                    disabled={isAiProcessing || !aiPrompt.trim()}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isAiProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Send
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "toon" && (
                    <div className="h-full p-4 overflow-auto bg-gray-50 dark:bg-gray-900">
                        <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {toonOutput || "// Log output will appear here"}
                        </pre>
                    </div>
                )}

                {activeTab === "feedback" && (
                    <div className="h-full p-4 overflow-auto space-y-3">
                        <div className="mb-4">
                            <button
                                onClick={async () => {
                                    setIsAiProcessing(true);
                                    try {
                                        // Get current TOON data from parent or context if available, 
                                        // but here we might need to pass it down or trigger an event.
                                        // For now, we'll dispatch an event to request analysis
                                        window.dispatchEvent(new CustomEvent('requestCircuitAnalysis'));
                                    } catch (error) {
                                        console.error(error);
                                    } finally {
                                        setIsAiProcessing(false);
                                    }
                                }}
                                disabled={isAiProcessing}
                                className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-md flex items-center justify-center gap-2 transition-all"
                            >
                                {isAiProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Analyzing Circuit...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Advanced AI Analysis
                                    </>
                                )}
                            </button>
                        </div>

                        {aiFeedback && aiFeedback.length > 0 ? (
                            aiFeedback.map((item, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg border-l-4 ${item.type === "error" || item.severity === "critical"
                                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                        : item.type === "warning" || item.severity === "warning"
                                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                                            : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span
                                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${item.type === "error" || item.severity === "critical"
                                                ? "bg-red-500 text-white"
                                                : item.type === "warning" || item.severity === "warning"
                                                    ? "bg-yellow-500 text-white"
                                                    : "bg-blue-500 text-white"
                                                }`}
                                        >
                                            {item.type === "error" || item.severity === "critical" ? "!" : item.type === "warning" || item.severity === "warning" ? "⚠" : "i"}
                                        </span>
                                        <div className="flex-1">
                                            <p
                                                className={`text-sm font-medium ${item.type === "error" || item.severity === "critical"
                                                    ? "text-red-800 dark:text-red-200"
                                                    : item.type === "warning" || item.severity === "warning"
                                                        ? "text-yellow-800 dark:text-yellow-200"
                                                        : "text-blue-800 dark:text-blue-200"
                                                    }`}
                                            >
                                                {item.message}
                                            </p>
                                            {item.recommendation && (
                                                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                                                    💡 {item.recommendation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <svg
                                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <p className="font-medium">No issues detected</p>
                                <p className="text-sm mt-1">Run Advanced Analysis for deep check</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IDEPanel;
