import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import DashboardPreview from './components/DashboardPreview';
import SetupGuide from './components/SetupGuide';
import QuickActions from './components/QuickActions';
import { parseCSV } from './utils/csvParser';
import { analyzeData, refineDesign } from './utils/claudeApi';
import { Sparkles, Download } from 'lucide-react';

function App() {
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [messages, setMessages] = useState([]);
  const [dashboardSpec, setDashboardSpec] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleFileUpload = async (text, name) => {
    setFileName(name);
    const parsed = parseCSV(text);
    setCsvData(parsed);
    
    // Auto-analyze
    setIsAnalyzing(true);
    try {
      const result = await analyzeData(parsed);
      setDashboardSpec(result.dashboardSpec);
      setMessages([{
        role: 'assistant',
        content: result.message
      }]);
    } catch (error) {
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I encountered an error analyzing your data. Please try again.'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (message) => {
    const newMessages = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);
    setIsAnalyzing(true);

    try {
      const result = await refineDesign(dashboardSpec, message, newMessages);
      setDashboardSpec(result.dashboardSpec);
      setMessages([...newMessages, {
        role: 'assistant',
        content: result.message
      }]);
    } catch (error) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I could not process your request. Please try again.'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportDashboardSpec = () => {
    const dataStr = JSON.stringify(dashboardSpec, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-spec.json';
    link.click();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {!csvData ? (
          <FileUpload 
            onFileUpload={handleFileUpload}
            fileName={fileName}
            rowCount={csvData?.rowCount || 0}
            columnCount={csvData?.columnCount || 0}
          />
        ) : (
          <>
            <header className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                    Power BI AI Builder
                  </h1>
                  <p className="text-gray-600 mt-1">Your intelligent dashboard assistant</p>
                </div>
                {dashboardSpec && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSetupGuide(!showSetupGuide)}
                      className="btn-primary"
                    >
                      {showSetupGuide ? 'Hide' : 'Show'} Setup Guide
                    </button>
                    <button
                      onClick={exportDashboardSpec}
                      className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Export
                    </button>
                  </div>
                )}
              </div>
              <FileUpload 
                onFileUpload={handleFileUpload}
                fileName={fileName}
                rowCount={csvData?.rowCount || 0}
                columnCount={csvData?.columnCount || 0}
              />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isAnalyzing}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                />
                {showSetupGuide && (
                  <SetupGuide
                    dashboardSpec={dashboardSpec}
                    csvData={csvData}
                    fileName={fileName}
                  />
                )}
              </div>

              <div className="space-y-6">
                <DashboardPreview
                  dashboardSpec={dashboardSpec}
                  csvData={csvData}
                />
                <QuickActions onAction={handleSendMessage} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;