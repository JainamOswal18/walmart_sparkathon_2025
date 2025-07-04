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
    console.log("VoiceAssistant state:", state);
    console.log("Agent transcriptions:", agentTranscriptions);
    console.log("User transcriptions:", userTranscriptions);
    
    const allMessages = [
      ...(agentTranscriptions?.map((t) => ({ ...t, type: "assistant" })) ?? []),
      ...(userTranscriptions?.map((t) => ({ ...t, type: "user" })) ?? []),
    ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime);
    setMessages(allMessages);
  }, [agentTranscriptions, userTranscriptions, state]);

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
  const [serverUrl, setServerUrl] = useState(process.env.LIVEKIT_URL || 'wss://demo.livekit.cloud');
  const [roomName, setRoomName] = useState(process.env.LIVEKIT_ROOM_NAME || 'grocery-assistant');
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  useEffect(() => {
    const connectToLiveKit = async () => {
      try {
        setIsConnecting(true);
        
        // Generate a token for your LiveKit server (ai-grocery-shopper-6zlhdx27.livekit.cloud)
        // This token is manually generated for the specific server and room
        // Identity: grocery-user-[timestamp]
        // Room: grocery-assistant
        // Permissions: can publish/subscribe audio
        
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTIwOTA1MDgsImlzcyI6IkFQSVAxaXVJUWw0ZUZRSkoiLCJuYmYiOjE3MjA1NTQxMDgsInN1YiI6Imdyb2Nlcnktdm9pY2UtdXNlci0xMjM0NTYiLCJ2aWRlbyI6eyJjYW5QdWJsaXNoIjp0cnVlLCJjYW5QdWJsaXNoRGF0YSI6dHJ1ZSwiY2FuU3Vic2NyaWJlIjp0cnVlLCJyb29tIjoiZ3JvY2VyeS1hc3Npc3RhbnQiLCJyb29tSm9pbiI6dHJ1ZX19.u25hGJU77xZDxo8jRK1JMPpWQQxfARENRVQUFFTECQU";
        
        console.log("Connecting to LiveKit server:", serverUrl);
        console.log("Room name:", roomName);
        
        setToken(token);
        setConnectionAttempted(true);
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
      console.log("Unmounting VoiceAssistant, disconnecting from LiveKit");
      livekitService.disconnect();
    };
  }, [serverUrl, roomName]);

  const handleRoomDisconnected = () => {
    console.log("Room disconnected");
    // Don't immediately close, give user a chance to see what happened
  };

  const handleRoomError = (error) => {
    console.error("Room error:", error);
    setError(`Connection error: ${error.message || 'Unknown error'}`);
  };

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
      
      {token && connectionAttempted ? (
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connect={true}
          video={false}
          audio={true}
          onDisconnected={handleRoomDisconnected}
          onError={handleRoomError}
          // Add debug data
          data-room-name={roomName}
          data-connection-attempted={connectionAttempted.toString()}
        >
          <RoomAudioRenderer />
          <VoiceAssistantContent />
        </LiveKitRoom>
      ) : (
        <div className="voice-assistant-error">
          <p>Failed to initialize connection. Please try again.</p>
          <button onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant; 