import { useState, useEffect } from 'react'
import './App.css'
import VoiceAssistant from './components/VoiceAssistant'

function App() {
  const [status, setStatus] = useState('idle');
  const [listening, setListening] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  useEffect(() => {
    // Listen for status updates from content script
    const handleMessage = (msg) => {
      if (msg.statusUpdate) {
        if (msg.statusUpdate === "Listening...") {
          setStatus('listening');
          setListening(true);
        } else if (msg.statusUpdate === "Processing...") {
          setStatus('processing');
          setListening(false);
        } else if (msg.statusUpdate === "Mic access denied") {
          setStatus('error');
          setListening(false);
        } else {
          setStatus('idle');
          setListening(false);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const toggleListening = async () => {
    if (showVoiceAssistant) {
      setShowVoiceAssistant(false);
      return;
    }
    
    setShowVoiceAssistant(true);
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Mic access denied';
      default:
        return 'Idle';
    }
  };

  const getButtonText = () => {
    return listening ? '🛑 Stop Listening' : '🎤 Start Listening';
  };

  return (
    <div className="popup-card">
      <header className="popup-header">
        <h1 className="popup-title">Smart Grocery Assistant</h1>
      </header>
      <main className="popup-main">
        <button 
          id="voice-btn" 
          className={`voice-btn ${listening ? 'listening' : ''}`}
          onClick={toggleListening}
        >
          {getButtonText()}
        </button>
        <span 
          id="status" 
          className={`status-text ${status}`}
        >
          {getStatusText()}
        </span>
      </main>
      <footer className="popup-footer">
        <small>Powered by AI</small>
      </footer>
      
      {showVoiceAssistant && (
        <div className="voice-assistant-overlay">
          <VoiceAssistant onClose={() => setShowVoiceAssistant(false)} />
        </div>
      )}
    </div>
  )
}

export default App
