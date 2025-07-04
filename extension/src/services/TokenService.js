/**
 * Service to handle LiveKit token generation
 */
class TokenService {
  constructor() {
    // Get API URL from environment variables
    this.apiUrl = process.env.LIVEKIT_API_URL || 'http://localhost:5000';
    this.roomName = process.env.LIVEKIT_ROOM_NAME || 'grocery-assistant';
  }

  /**
   * Set the API URL for token generation
   * @param {string} url - The API URL
   */
  setApiUrl(url) {
    this.apiUrl = url;
  }

  /**
   * Get a LiveKit token for a room
   * @param {string} roomName - The room name (defaults to grocery-assistant)
   * @param {string} participantName - The participant name
   * @returns {Promise<string>} The LiveKit token
   */
  async getToken(roomName = this.roomName, participantName) {
    try {
      // Validate parameters
      if (!participantName) {
        participantName = `user-${Date.now()}`;
      }
      
      console.log(`Requesting token for ${participantName} in room ${roomName}`);
      
      // Make request to token API
      const response = await fetch(
        `${this.apiUrl}/api/getToken?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(participantName)}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get token: ${response.status} - ${errorText}`);
      }
      
      // Parse the JSON response
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Token not found in response');
      }
      
      console.log(`Token obtained for ${participantName} in room ${roomName}`);
      return data.token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  /**
   * For development/testing, you can use this method to get a demo token
   * @param {string} roomName - The room name
   * @param {string} participantName - The participant name
   * @returns {Promise<string>} A demo token
   */
  async getDemoToken(roomName = this.roomName, participantName = `user-${Date.now()}`) {
    console.warn('Using demo token - this should not be used in production');
    
    // For development, try to use the real token API first
    try {
      return await this.getToken(roomName, participantName);
    } catch (error) {
      console.warn('Failed to get real token, using placeholder:', error);
      // Return a placeholder token - this won't work with a real LiveKit server
      return 'demo-token-placeholder';
    }
  }
}

// Create a singleton instance
const tokenService = new TokenService();
export default tokenService; 