// LiveKit service to handle connections and token management
import { Room, RoomEvent } from 'livekit-client';

// Use environment variables if available, otherwise use defaults
const DEFAULT_LIVEKIT_URL = 'ws://localhost:7880';

class LiveKitService {
  constructor() {
    this.room = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.statusCallbacks = [];
    this.LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || DEFAULT_LIVEKIT_URL;
    this.microphoneStream = null;
  }

  // Initialize the room with options
  initRoom() {
    if (this.room) return this.room;

    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioEnabled: true
    });

    // Set up event listeners
    this.room
      .on(RoomEvent.Connected, this.handleConnected.bind(this))
      .on(RoomEvent.Disconnected, this.handleDisconnected.bind(this))
      .on(RoomEvent.AudioPlaybackStatusChanged, this.handleAudioPlaybackStatusChanged.bind(this))
      .on(RoomEvent.MediaDevicesError, this.handleMediaDevicesError.bind(this));

    return this.room;
  }

  // Request microphone permissions explicitly
  async requestMicrophonePermission() {
    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      this.updateStatus('permission-error', error);
      throw error;
    }
  }

  // Connect to a LiveKit room
  async connect(token) {
    if (this.isConnected || this.isConnecting) return;
    
    this.isConnecting = true;
    this.updateStatus('connecting');
    
    try {
      // Ensure we have microphone permissions
      if (!this.microphoneStream) {
        await this.requestMicrophonePermission();
      }
      
      const room = this.initRoom();
      
      // Pre-warm connection for faster connect time
      room.prepareConnection(this.LIVEKIT_URL, token);
      
      // Connect to the room
      await room.connect(this.LIVEKIT_URL, token);
      
      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      
      console.log('Connected to LiveKit room:', room.name);
      this.isConnected = true;
      this.isConnecting = false;
      this.updateStatus('connected');
      
      return room;
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      this.isConnecting = false;
      this.updateStatus('error', error);
      throw error;
    }
  }

  // Disconnect from the room
  async disconnect() {
    if (!this.room || !this.isConnected) return;
    
    try {
      await this.room.disconnect();
      this.isConnected = false;
      this.updateStatus("disconnected");
      console.log("Disconnected from LiveKit room");

      // Release microphone stream if it exists
      if (this.microphoneStream) {
        this.microphoneStream.getTracks().forEach((track) => track.stop());
        this.microphoneStream = null;
      }
    } catch (error) {
      console.error('Error disconnecting from LiveKit room:', error);
      throw error;
    }
  }

  // Handle connection success
  handleConnected() {
    this.isConnected = true;
    this.updateStatus('connected');
  }

  // Handle disconnection
  handleDisconnected() {
    this.isConnected = false;
    this.updateStatus('disconnected');
  }

  // Handle audio playback status changes
  handleAudioPlaybackStatusChanged() {
    if (this.room && !this.room.canPlaybackAudio) {
      this.updateStatus('audio-blocked');
    }
  }

  // Handle media device errors
  handleMediaDevicesError(error) {
    console.error('Media devices error:', error);
    this.updateStatus('media-error', error);
  }

  // Start audio playback (must be called from user interaction)
  async startAudio() {
    if (!this.room) return;
    
    try {
      await this.room.startAudio();
      this.updateStatus('audio-enabled');
    } catch (error) {
      console.error('Failed to start audio:', error);
      this.updateStatus('audio-error', error);
    }
  }

  // Register status callback
  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  // Update status and notify callbacks
  updateStatus(status, data) {
    this.statusCallbacks.forEach(callback => callback(status, data));
  }
}

// Export a singleton instance
export default new LiveKitService(); 