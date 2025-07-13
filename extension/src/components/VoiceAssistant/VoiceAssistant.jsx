import { useState, useEffect, useCallback } from 'react';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, BarVisualizer, VoiceAssistantControlBar, useTrackTranscription, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import LiveKitService from '../../services/LiveKitService';
import TokenService from '../../services/TokenService';
import './VoiceAssistant.css';

// Message component to display transcribed messages
const Message = ({ type, text }) => {
  return (
    <div className={`message message-${type}`}>
      <strong>{type === 'agent' ? 'Assistant: ' : 'You: '}</strong>
      <span>{text}</span>
    </div>
  );
};

// Conversation component that displays transcribed messages
const Conversation = ({ agentTranscriptions, userTranscriptions }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const allMessages = [
      ...(agentTranscriptions?.map((t) => ({ ...t, type: 'agent' })) ?? []),
      ...(userTranscriptions?.map((t) => ({ ...t, type: 'user' })) ?? []),
    ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime);
    
    setMessages(allMessages);
  }, [agentTranscriptions, userTranscriptions]);

  return (
    <div className="conversation">
      {messages.length === 0 ? (
        <p className="no-messages">Your conversation will appear here...</p>
      ) : (
        messages.map((msg, index) => (
          <Message key={msg.id || index} type={msg.type} text={msg.text} />
        ))
      )}
    </div>
  );
};

// The main VoiceAssistant component
const VoiceAssistant = () => {
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [showForm, setShowForm] = useState(true);

  // Handle LiveKit status changes
  useEffect(() => {
    const unsubscribe = LiveKitService.onStatusChange((status, data) => {
      if (status === 'connected') {
        setConnected(true);
        setConnecting(false);
      } else if (status === 'disconnected') {
        setConnected(false);
        setConnecting(false);
      } else if (status === 'connecting') {
        setConnecting(true);
      } else if (status === 'error') {
        setConnecting(false);
        setError(data?.message || 'Connection error');
      }
    });

    return unsubscribe;
  }, []);

  // Function to handle form submission and connect to LiveKit
  const handleConnect = useCallback(async (e) => {
    e.preventDefault();
    
    if (!username.trim()) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      // First explicitly request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Keep the stream active to maintain permission
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('Microphone permission granted');
      }
      
      // Get token from backend
      const newToken = await TokenService.getToken(username);
      setToken(newToken);
      setShowForm(false);
      
      // Connect to LiveKit
      await LiveKitService.connect(newToken);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.name === 'NotAllowedError' 
        ? 'Microphone permission denied. Please allow microphone access and try again.' 
        : err.message || 'Failed to connect');
      setConnecting(false);
    }
  }, [username]);

  // Function to disconnect from LiveKit
  const handleDisconnect = useCallback(async () => {
    try {
      await LiveKitService.disconnect();
      setShowForm(true);
      setToken(null);
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }, []);

  // Handle audio start when required (browser restrictions)
  const handleStartAudio = useCallback(() => {
    LiveKitService.startAudio();
  }, []);

  // Render main component
  return (
    <div className="voice-assistant-container">
      {showForm ? (
        <div className="connect-form">
          <h2>Smart Grocery Assistant</h2>
          <p className="assistant-description">
            Your voice-enabled shopping assistant that helps you find products, compare prices, and more!
          </p>
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              {error.includes('microphone') && (
                <div className="permission-help">
                  <p>To fix this:</p>
                  <ol>
                    <li>Click the lock/site settings icon in your address bar</li>
                    <li>Find "Microphone" in the permissions list</li>
                    <li>Change the setting to "Allow"</li>
                    <li>Refresh this extension and try again</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleConnect}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              required
            />
            <button type="submit" disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect to Assistant'}
            </button>
          </form>
        </div>
      ) : token ? (
        <LiveKitRoom
          token={token}
          serverUrl={LiveKitService.LIVEKIT_URL}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={handleDisconnect}
        >
          <RoomAudioRenderer />
          <VoiceAssistantView onStartAudio={handleStartAudio} onDisconnect={handleDisconnect} />
        </LiveKitRoom>
      ) : null}
    </div>
  );
};

// The inner view component when connected to LiveKit
const VoiceAssistantView = ({ onStartAudio, onDisconnect }) => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();
  const { segments: userTranscriptions } = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  // Render the voice assistant UI when connected
  return (
    <div className="assistant-connected">
      <div className="assistant-header">
        <h3>Smart Grocery Assistant</h3>
      </div>
      
      <div className="visualizer-container">
        <BarVisualizer state={state} barCount={7} trackRef={audioTrack} />
      </div>
      
      <div className="control-section">
        <VoiceAssistantControlBar onStartAudio={onStartAudio} />
        <Conversation 
          agentTranscriptions={agentTranscriptions} 
          userTranscriptions={userTranscriptions} 
        />
      </div>
    </div>
  );
};

export default VoiceAssistant; 