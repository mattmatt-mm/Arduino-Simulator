import React, { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { geminiService } from "../services/geminiService";
import AIChatBubble from "./AIChatBubble";

const IDEPanel = ({ generatedCode, toonOutput, aiFeedback, isFullScreen, onToggleFullScreen }) => {
    const [code, setCode] = useState("// Write your Arduino code here\nvoid setup() {\n  \n}\n\nvoid loop() {\n  \n}");
    const [activeTab, setActiveTab] = useState("code"); // For normal mode
    const [rightTab, setRightTab] = useState("serial"); // For split mode secondary panel
    const [copied, setCopied] = useState(false);
    const [aiStatus, setAiStatus] = useState('idle'); // idle, processing, success, error
    const [codeHistory, setCodeHistory] = useState([]);

    // Serial Monitor State
    const [serialOutput, setSerialOutput] = useState(["// Serial Monitor Initialized"]);
    const [serialInput, setSerialInput] = useState("");
    const serialEndRef = useRef(null);

    // Split View State
    // splitMode: 'none', 'vertical' (left/right), 'horizontal' (top/bottom)
    const [splitMode, setSplitMode] = useState('vertical');
    const [splitRatio, setSplitRatio] = useState(50); // Percentage
    const [isResizingSplit, setIsResizingSplit] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        if (generatedCode && generatedCode.length > 50) {
            setCode(generatedCode);
            setCodeHistory(prev => [...prev, generatedCode].slice(-10));
        }
    }, [generatedCode]);

    useEffect(() => {
        serialEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [serialOutput]);

    // Ensure default split mode in full screen
    useEffect(() => {
        if (isFullScreen && splitMode === 'none') {
            setSplitMode('vertical');
        }
    }, [isFullScreen]);

    // Split Resizing Logic
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingSplit || !panelRef.current) return;

            const panelRect = panelRef.current.getBoundingClientRect();
            let newRatio = 50;

            if (splitMode === 'vertical') {
                const relativeX = e.clientX - panelRect.left;
                newRatio = (relativeX / panelRect.width) * 100;
            } else if (splitMode === 'horizontal') {
                const relativeY = e.clientY - panelRect.top;
                newRatio = (relativeY / panelRect.height) * 100;
            }

            if (newRatio > 20 && newRatio < 80) {
                setSplitRatio(newRatio);
            }
        };

        const handleMouseUp = () => {
            setIsResizingSplit(false);
        };

        if (isResizingSplit) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingSplit, splitMode]);

    const toggleSplitMode = () => {
        if (splitMode === 'none') setSplitMode('vertical');
        else if (splitMode === 'vertical') setSplitMode('horizontal');
        else setSplitMode('none');
    };

    const handleEditorChange = (value) => {
        setCode(value);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAiModify = async (prompt) => {
        if (!prompt.trim()) return;
        setAiStatus('processing');
        try {
            setCodeHistory(prev => [...prev, code].slice(-10));
            let circuitContext = null;
            try {
                if (toonOutput) {
                    circuitContext = JSON.parse(toonOutput);
                }
            } catch (e) {
                console.error("Failed to parse TOON output", e);
            }
            const modifiedCode = await geminiService.modifyCode(code, prompt, circuitContext);
            setCode(modifiedCode);
            setAiStatus('success');
            setTimeout(() => setAiStatus('idle'), 2000);
        } catch (error) {
            console.error('AI modification error:', error);
            alert(`Failed to modify code: ${error.message}`);
            setAiStatus('error');
            setTimeout(() => setAiStatus('idle'), 2000);
        }
    };

    const handleUndo = () => {
        if (codeHistory.length > 0) {
            const previousCode = codeHistory[codeHistory.length - 1];
            setCode(previousCode);
            setCodeHistory(prev => prev.slice(0, -1));
        }
    };

    const handleSerialSend = () => {
        if (!serialInput.trim()) return;
        const cmd = serialInput.trim();
        setSerialOutput(prev => [...prev, `> ${cmd}`, `[Simulated] Received: ${cmd}`]);
        setSerialInput("");
    };

    const handleOpenSettings = () => {
        window.dispatchEvent(new CustomEvent('openSettings'));
    };

    const renderCodeEditor = () => (
        <div className="flex flex-col h-full bg-[#1e1e1e] relative">
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
                        padding: { top: 10, bottom: 60 } // Add padding for bubble
                    }}
                />
            </div>
            {/* AI Chat Bubble Overlay */}
            <div className="absolute bottom-4 left-0 right-0 z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    <AIChatBubble onSend={handleAiModify} status={aiStatus} />
                </div>
            </div>
        </div>
    );

    const renderSerialMonitor = () => (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm">
            <div className="flex-1 p-4 overflow-auto space-y-1">
                {serialOutput.map((line, i) => (
                    <div key={i} className="break-all hover:bg-[#2d2d2d] px-1 rounded">{line}</div>
                ))}
                <div ref={serialEndRef} />
            </div>
            <div className="p-2 border-t border-gray-700 flex gap-2 bg-[#1e1e1e]">
                <input
                    type="text"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSerialSend()}
                    placeholder="Send command..."
                    className="flex-1 bg-[#2d2d2d] border border-gray-600 text-white px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button
                    onClick={handleSerialSend}
                    className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded"
                >
                    Send
                </button>
            </div>
        </div>
    );

    const renderDebugPanel = () => (
        <div className="h-full p-4 overflow-auto space-y-4 bg-gray-50 dark:bg-gray-900">
            <div className="mb-2">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('requestCircuitAnalysis'))}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-all"
                >
                    Run Circuit Analysis
                </button>
            </div>

            {/* Connection Log */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Connection Log
                </div>
                <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 font-medium">Source</th>
                                <th className="px-4 py-2 font-medium">Pin</th>
                                <th className="px-4 py-2 font-medium">Target</th>
                                <th className="px-4 py-2 font-medium">Pin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(() => {
                                try {
                                    const data = toonOutput ? JSON.parse(toonOutput) : { connections: [] };
                                    if (!data.connections || data.connections.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-3 text-center text-gray-500 italic">
                                                    No connections
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return data.connections.map((conn, i) => {
                                        const sourceNode = data.nodes.find(n => n.id === conn.source);
                                        const targetNode = data.nodes.find(n => n.id === conn.target);
                                        return (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                                    {sourceNode ? (sourceNode.label || sourceNode.type) : conn.source}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300 font-mono">
                                                    {conn.sourcePin}
                                                </td>
                                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                                    {targetNode ? (targetNode.label || targetNode.type) : conn.target}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-300 font-mono">
                                                    {conn.targetPin}
                                                </td>
                                            </tr>
                                        );
                                    });
                                } catch (e) {
                                    return <tr><td colSpan="4" className="px-4 py-3 text-center text-red-500">Error parsing data</td></tr>;
                                }
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modern Debug Messages */}
            <div className="space-y-3">
                {aiFeedback && aiFeedback.length > 0 ? (
                    aiFeedback.map((item, index) => {
                        const isError = item.type === "error" || item.severity === "critical";
                        const isWarning = item.type === "warning" || item.severity === "warning";

                        // Styles based on severity
                        const cardBg = isError ? "bg-red-50 dark:bg-[#3f1a1a]" : isWarning ? "bg-yellow-50 dark:bg-[#3f3a1a]" : "bg-blue-50 dark:bg-[#1a2f3f]";
                        const titleColor = isError ? "text-red-700 dark:text-red-400" : isWarning ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400";
                        const iconColor = isError ? "text-red-500" : isWarning ? "text-orange-500" : "text-blue-500";

                        return (
                            <div key={index} className={`p-4 rounded-xl ${cardBg} border border-transparent hover:border-opacity-50 transition-all`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 relative flex h-3 w-3 ${iconColor}`}>
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`}></span>
                                        <span className={`relative inline-flex rounded-full h-3 w-3 bg-current`}></span>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${titleColor} mb-1`}>
                                            {isError ? "Critical Issue" : isWarning ? "Incorrect Connection" : "Info"}
                                        </h4>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                            {item.message}
                                        </p>
                                        {item.recommendation && (
                                            <p className="text-xs mt-2 text-gray-600 dark:text-gray-400 italic">
                                                Tip: {item.recommendation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-500 mt-4">No issues detected</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleFullScreen}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>

                    {isFullScreen ? (
                        /* Full Screen Header Layout */
                        <div className="flex items-center gap-4">
                            {/* Left Panel Tabs (Code) */}
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm`}
                                >
                                    Code
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

                            {/* Right Panel Tabs */}
                            {splitMode !== 'none' && (
                                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                    {['serial', 'debug'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setRightTab(tab)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${rightTab === tab
                                                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                                }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Normal Mode Tabs */
                        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                            {['code', 'serial', 'debug'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === tab
                                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Settings Button */}
                    <button
                        onClick={handleOpenSettings}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Settings (API Key)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    {isFullScreen && (
                        <button
                            onClick={toggleSplitMode}
                            className={`p-2 rounded-lg transition-colors ${splitMode !== 'none' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title={`Split View: ${splitMode === 'none' ? 'Off' : splitMode === 'vertical' ? 'Vertical' : 'Horizontal'}`}
                        >
                            {splitMode === 'horizontal' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                            )}
                        </button>
                    )}
                    <button onClick={handleUndo} className="p-2 text-gray-500 hover:text-gray-700" title="Undo">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button onClick={handleCopy} className="p-2 text-blue-600 hover:text-blue-700" title="Copy">
                        {copied ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative" ref={panelRef}>
                {isFullScreen && splitMode !== 'none' ? (
                    <div className={`flex h-full w-full relative ${splitMode === 'horizontal' ? 'flex-col' : 'flex-row'}`}>
                        {/* First Panel (Code) */}
                        <div
                            style={splitMode === 'horizontal' ? { height: `${splitRatio}%` } : { width: `${splitRatio}%` }}
                            className="overflow-hidden"
                        >
                            {renderCodeEditor()}
                        </div>

                        {/* Resizer Handle */}
                        <div
                            onMouseDown={() => setIsResizingSplit(true)}
                            className={`
                                z-10 transition-colors hover:bg-blue-500
                                ${splitMode === 'horizontal'
                                    ? 'h-1 w-full cursor-row-resize bg-gray-600'
                                    : 'w-1 h-full cursor-col-resize bg-gray-600'
                                }
                                ${isResizingSplit ? 'bg-blue-500' : ''}
                            `}
                        />

                        {/* Second Panel */}
                        <div
                            style={splitMode === 'horizontal' ? { height: `${100 - splitRatio}%` } : { width: `${100 - splitRatio}%` }}
                            className="overflow-hidden"
                        >
                            {rightTab === 'serial' ? renderSerialMonitor() : renderDebugPanel()}
                        </div>
                    </div>
                ) : (
                    /* Normal Mode or Full Screen Single View */
                    <div className="h-full">
                        {activeTab === 'code' && renderCodeEditor()}
                        {activeTab === 'serial' && renderSerialMonitor()}
                        {activeTab === 'debug' && renderDebugPanel()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IDEPanel;
