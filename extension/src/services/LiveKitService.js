import { Room } from 'livekit-client';

class LiveKitService {
  constructor() {
    this.room = null;
    this.token = null;
    this.serverUrl = null;
    this.onStateChange = null;
  }

  /**
   * Initialize the LiveKit room
   * @returns {Room} The LiveKit room instance
   */
  initRoom() {
    if (this.room) {
      return this.room;
    }

    this.room = new Room({
      // Automatically manage subscribed video quality
      adaptiveStream: true,
      
      // Optimize publishing bandwidth and CPU for published tracks
      dynacast: true,
      
      // Audio only for our grocery assistant
      videoCaptureDefaults: {
        resolution: { width: 0, height: 0 },
      },
    });

    // Set up event listeners
    this.room.on('connected', () => {
      if (this.onStateChange) {
        this.onStateChange('connected');
      }
      console.log('Connected to LiveKit room:', this.room.name);
    });

    this.room.on('disconnected', () => {
      if (this.onStateChange) {
        this.onStateChange('disconnected');
      }
      console.log('Disconnected from LiveKit room');
    });

    this.room.on('reconnecting', () => {
      if (this.onStateChange) {
        this.onStateChange('reconnecting');
      }
      console.log('Reconnecting to LiveKit room');
    });

    this.room.on('reconnected', () => {
      if (this.onStateChange) {
        this.onStateChange('connected');
      }
      console.log('Reconnected to LiveKit room');
    });

    return this.room;
  }

  /**
   * Connect to a LiveKit room
   * @param {string} url - The LiveKit server URL
   * @param {string} token - The LiveKit token
   * @param {function} onStateChange - Callback for room state changes
   * @returns {Promise<void>}
   */
  async connect(url, token, onStateChange = null) {
    this.serverUrl = url;
    this.token = token;
    this.onStateChange = onStateChange;

    const room = this.initRoom();
    
    try {
      if (this.onStateChange) {
        this.onStateChange('connecting');
      }
      
      // Pre-warm connection for faster connect
      room.prepareConnection(url, token);
      
      // Connect to the room
      await room.connect(url, token);
      
      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
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
      await this.room.disconnect();
      this.room = null;
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
    
    return this.room.state;
  }
}

// Create a singleton instance
const livekitService = new LiveKitService();
export default livekitService; 