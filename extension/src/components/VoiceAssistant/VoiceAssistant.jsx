import { useState, useEffect } from 'react';
import { 
  useVoiceAssistant, 
  BarVisualizer, 
  VoiceAssistantControlBar,
  useTrackTranscription,
  useLocalParticipant,
  LiveKitRoom,
  RoomAudioRenderer
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import './VoiceAssistant.css';
import livekitService from '../../services/LiveKitService';
import tokenService from '../../services/TokenService';

// Message component for displaying transcriptions
const Message = ({ type, text }) => {
  return (
    <div className="message">
      <strong className={`message-${type}`}>
        {type === "assistant" ? "Assistant: " : "You: "}
      </strong>
      <span className="message-text">{text}</span>
    </div>
  );
};

const VoiceAssistantContent = () => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();
  const { segments: userTranscriptions } = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const allMessages = [
      ...(agentTranscriptions?.map((t) => ({ ...t, type: "assistant" })) ?? []),
      ...(userTranscriptions?.map((t) => ({ ...t, type: "user" })) ?? []),
    ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime);
    setMessages(allMessages);
  }, [agentTranscriptions, userTranscriptions]);

  return (
    <div className="voice-assistant-content">
      <div className="visualizer-container">
        <BarVisualizer state={state} barCount={7} trackRef={audioTrack} />
      </div>
      <div className="control-section">
        <VoiceAssistantControlBar />
        <div className="conversation">
          {messages.map((msg, index) => (
            <Message key={msg.id || index} type={msg.type} text={msg.text} />
          ))}
        </div>
      </div>
    </div>
  );
};

const VoiceAssistant = ({ onClose }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [serverUrl, setServerUrl] = useState(process.env.LIVEKIT_API_URL || 'wss://your-livekit-server.com');

  useEffect(() => {
    const connectToLiveKit = async () => {
      try {
        setIsConnecting(true);
        // In a real implementation, you would get a token from your server
        // For demo purposes, we're using a hardcoded token
        const token = await tokenService.getToken('grocery-assistant', 'user-' + Date.now());
        setToken(token);
      } catch (error) {
        console.error('Error connecting to LiveKit:', error);
        setError('Failed to connect to voice assistant. Please try again.');
      } finally {
        setIsConnecting(false);
      }
    };

    connectToLiveKit();

    return () => {
      // Disconnect when component unmounts
      livekitService.disconnect();
    };
  }, []);

  if (isConnecting) {
    return (
      <div className="voice-assistant-container">
        <div className="voice-assistant-loading">
          <div className="loading-spinner"></div>
          <p>Connecting to voice assistant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="voice-assistant-container">
        <div className="voice-assistant-error">
          <p>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-assistant-container">
      <div className="voice-assistant-header">
        <h2>Smart Grocery Assistant</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {token ? (
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connect={true}
          video={false}
          audio={true}
          onDisconnected={onClose}
        >
          <RoomAudioRenderer />
          <VoiceAssistantContent />
        </LiveKitRoom>
      ) : null}
    </div>
  );
};

export default VoiceAssistant; 