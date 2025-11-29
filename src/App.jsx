import React from 'react';
import Workspace from './components/Workspace';
import IDEPanel from './components/IDEPanel';
import Sidebar from './components/Sidebar';
import { geminiService } from './services/geminiService';

function App() {
  const [generatedCode, setGeneratedCode] = React.useState("");
  const [toonOutput, setToonOutput] = React.useState("");
  const [aiFeedback, setAiFeedback] = React.useState([]);
  const [panelWidth, setPanelWidth] = React.useState(400);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleCircuitAnalysis = async () => {
      if (!toonOutput) return;

      try {
        // Show loading state in feedback (optional, or handled by IDEPanel)
        const result = await geminiService.analyzeCircuit(JSON.parse(toonOutput));

        if (result.issues) {
          // Map API issues to feedback format
          const feedbackItems = result.issues.map(issue => ({
            type: issue.severity === 'critical' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info',
            message: issue.message,
            recommendation: issue.recommendation,
            severity: issue.severity
          }));
          setAiFeedback(feedbackItems);
        }
      } catch (error) {
        console.error("Circuit analysis failed:", error);
        setAiFeedback([{
          type: 'error',
          message: 'Failed to analyze circuit. Please check your API key and internet connection.',
          severity: 'critical'
        }]);
      }
    };

    window.addEventListener('requestCircuitAnalysis', handleCircuitAnalysis);
    return () => window.removeEventListener('requestCircuitAnalysis', handleCircuitAnalysis);
  }, [toonOutput]);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= window.innerWidth - 50) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      <Sidebar />
      <div className="flex-grow h-full relative">
        <Workspace
          onCodeChange={setGeneratedCode}
          onTOONChange={setToonOutput}
          onFeedbackChange={setAiFeedback}
        />
      </div>

      {/* Resize Handle */}
      {!isFullScreen && (
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 h-full bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors z-30 ${isResizing ? 'bg-blue-500' : ''
            }`}
        />
      )}

      <div
        className={`h-full flex-shrink-0 z-40 shadow-xl bg-white dark:bg-gray-900 ${isResizing ? '' : 'transition-all duration-300'} ${isFullScreen ? 'absolute inset-0 w-full' : ''}`}
        style={!isFullScreen ? { width: `${panelWidth}px` } : {}}
      >
        <IDEPanel
          generatedCode={generatedCode}
          toonOutput={toonOutput}
          aiFeedback={aiFeedback}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        />
      </div>
    </div>
  );
}

export default App;
