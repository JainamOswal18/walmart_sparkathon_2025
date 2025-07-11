import { useState } from 'react';
import VoiceAssistant from './components/VoiceAssistant/VoiceAssistant';
import WebAutomation from './components/WebAutomation/WebAutomation';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('voice');
  
  return (
    <div className="popup-card">
      <div className="app-tabs">
        <button 
          className={`tab-button ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          Voice Assistant
        </button>
        <button 
          className={`tab-button ${activeTab === 'web' ? 'active' : ''}`}
          onClick={() => setActiveTab('web')}
        >
          Web Automation
        </button>
      </div>
      
      {activeTab === 'voice' ? (
        <VoiceAssistant />
      ) : (
        <div className="web-automation-tab">
          <h2>Web Automation Tools</h2>
          <p>Use these tools to automate tasks on grocery websites</p>
          <WebAutomation />
        </div>
      )}
    </div>
  );
}

export default App;
