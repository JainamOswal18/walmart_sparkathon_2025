import { Room, ConnectionState, RoomEvent, ConnectionQuality } from 'livekit-client';

class LiveKitService {
  constructor() {
    this.room = null;
    this.token = null;
    this.serverUrl = process.env.LIVEKIT_URL || 'wss://demo.livekit.cloud';
    this.onStateChange = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.isConnecting = false;
  }

  /**
   * Initialize the LiveKit room
   * @returns {Room} The LiveKit room instance
   */
  initRoom() {
    if (this.room) {
      return this.room;
    }

    console.log('Initializing LiveKit room');
    
    this.room = new Room({
      // Automatically manage subscribed video quality
      adaptiveStream: true,
      
      // Optimize publishing bandwidth and CPU for published tracks
      dynacast: true,
      
      // Audio only for our grocery assistant
      videoCaptureDefaults: {
        resolution: { width: 0, height: 0 },
      },
      
      // Add additional options for better reliability
      reconnectPolicy: {
        maxAttempts: 10,
        maxRetryDelay: 10000,
      },
    });

    // Set up event listeners
    this.room.on(RoomEvent.Connected, () => {
      if (this.onStateChange) {
        this.onStateChange('connected');
      }
      console.log('Connected to LiveKit room:', this.room.name);
      console.log('Local participant:', this.room.localParticipant.identity);
      console.log('Remote participants:', this.room.participants.size);
      this.connectionAttempts = 0;
      this.isConnecting = false;
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      if (this.onStateChange) {
        this.onStateChange('disconnected');
      }
      console.log('Disconnected from LiveKit room, reason:', reason);
      this.isConnecting = false;
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      if (this.onStateChange) {
        this.onStateChange('reconnecting');
      }
      console.log('Reconnecting to LiveKit room');
      this.isConnecting = true;
    });

    this.room.on(RoomEvent.Reconnected, () => {
      if (this.onStateChange) {
        this.onStateChange('connected');
      }
      console.log('Reconnected to LiveKit room');
      this.isConnecting = false;
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity, participant.metadata);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant.isLocal) {
        console.log(`Local connection quality changed: ${ConnectionQuality[quality]}`);
      }
    });

    this.room.on(RoomEvent.MediaDevicesError, (error) => {
      console.error('Media device error:', error);
      if (this.onStateChange) {
        this.onStateChange('error');
      }
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log(`Subscribed to ${track.kind} track from ${participant.identity}`);
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log(`Unsubscribed from ${track.kind} track from ${participant.identity}`);
    });

    return this.room;
  }

  /**
   * Connect to a LiveKit room
   * @param {string} url - The LiveKit server URL (defaults to environment variable)
   * @param {string} token - The LiveKit token
   * @param {function} onStateChange - Callback for room state changes
   * @returns {Promise<void>}
   */
  async connect(url = this.serverUrl, token, onStateChange = null) {
    if (this.isConnecting) {
      console.log('Already connecting to LiveKit, ignoring duplicate request');
      return;
    }
    
    this.isConnecting = true;
    this.serverUrl = url;
    this.token = token;
    this.onStateChange = onStateChange;

    console.log(`Connecting to LiveKit server: ${url}`);
    
    const room = this.initRoom();
    
    try {
      if (this.onStateChange) {
        this.onStateChange('connecting');
      }
      
      // Pre-warm connection for faster connect
      room.prepareConnection(url, token);
      
      // Connect to the room
      await room.connect(url, token, {
        autoSubscribe: true,
      });
      
      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      
      console.log('Successfully connected to LiveKit room');
      
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      this.isConnecting = false;
      
      // Attempt reconnection if within limits
      this.connectionAttempts++;
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Retrying connection (attempt ${this.connectionAttempts})`);
        // Wait before retrying
        setTimeout(() => this.connect(url, token, onStateChange), 2000);
        return;
      }
      
      if (this.onStateChange) {
        this.onStateChange('error');
      }
      throw error;
    }
  }

  /**
   * Disconnect from the LiveKit room
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.room) {
      // Disable microphone before disconnecting
      try {
        await this.room.localParticipant.setMicrophoneEnabled(false);
      } catch (error) {
        console.warn('Error disabling microphone:', error);
      }
      
      console.log('Disconnecting from LiveKit room');
      await this.room.disconnect();
      this.room = null;
      this.isConnecting = false;
    }
  }

  /**
   * Toggle microphone state
   * @returns {Promise<boolean>} The new microphone state
   */
  async toggleMicrophone() {
    if (!this.room || !this.room.localParticipant) {
      return false;
    }
    
    const enabled = !this.room.localParticipant.isMicrophoneEnabled;
    await this.room.localParticipant.setMicrophoneEnabled(enabled);
    console.log(`Microphone ${enabled ? 'enabled' : 'disabled'}`);
    return enabled;
  }

  /**
   * Get the current room state
   * @returns {string} The room state
   */
  getState() {
    if (!this.room) {
      return 'disconnected';
    }
    
    return ConnectionState[this.room.state];
  }

  /**
   * Check if the room is connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.room && this.room.state === ConnectionState.Connected;
  }
}

// Create a singleton instance
const livekitService = new LiveKitService();
export default livekitService; 