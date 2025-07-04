import { useState, useEffect } from 'react'
import VoiceAssistant from './components/VoiceAssistant/VoiceAssistant'
import './App.css'

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
      // If Voice Assistant is open, don't use the simple mic
      return;
    }
    
    const newListeningState = !listening;
    setListening(newListeningState);
    setStatus(newListeningState ? 'listening' : 'idle');

    try {
      // Send message to content script in active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: newListeningState ? "START_LISTENING" : "STOP_LISTENING",
        });
      }
    } catch (error) {
      console.error("Error toggling listening state:", error);
      setStatus('error');
      setListening(false);
    }
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

  const toggleVoiceAssistant = () => {
    // If currently using basic mic, stop it
    if (listening) {
      toggleListening();
    }
    
    setShowVoiceAssistant(!showVoiceAssistant);
  };

  return (
    <div className="popup-card">
      {showVoiceAssistant ? (
        <VoiceAssistant />
      ) : (
        <>
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
            <button 
              className="advanced-mode-btn"
              onClick={toggleVoiceAssistant}
            >
              Advanced Assistant
            </button>
          </main>
          <footer className="popup-footer">
            <small>Powered by AI</small>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
