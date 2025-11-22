import React from 'react';
import Workspace from './components/Workspace';
import IDEPanel from './components/IDEPanel';
import Sidebar from './components/Sidebar';

function App() {
  const [generatedCode, setGeneratedCode] = React.useState("");
  const [toonOutput, setToonOutput] = React.useState("");
  const [aiFeedback, setAiFeedback] = React.useState([]);
  const [panelWidth, setPanelWidth] = React.useState(400);
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-grow h-full relative">
        <Workspace
          onCodeChange={setGeneratedCode}
          onTOONChange={setToonOutput}
          onFeedbackChange={setAiFeedback}
        />
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 h-full bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors z-30 ${isResizing ? 'bg-blue-500' : ''
          }`}
      />

      <div className="h-full flex-shrink-0 z-20 shadow-xl" style={{ width: `${panelWidth}px` }}>
        <IDEPanel
          generatedCode={generatedCode}
          toonOutput={toonOutput}
          aiFeedback={aiFeedback}
        />
      </div>
    </div>
  );
}

export default App;
