/**
 * Service to handle LiveKit token generation
 */
class TokenService {
  constructor() {
    // Default to demo server if no server is specified
    this.apiUrl = process.env.LIVEKIT_API_URL || 'https://api.livekit-server.com';
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
   * @param {string} roomName - The room name
   * @param {string} participantName - The participant name
   * @returns {Promise<string>} The LiveKit token
   */
  async getToken(roomName, participantName) {
    try {
      // In a real implementation, this would call your backend API
      const response = await fetch(`${this.apiUrl}/getToken?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(participantName)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }
      
      const token = await response.text();
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  /**
   * For development/testing, you can use this method to get a demo token
   * This should be replaced with a real token in production
   * @returns {string} A demo token
   */
  getDemoToken() {
    // This is just a placeholder - in a real app, you would get a token from your server
    console.warn('Using demo token - this should not be used in production');
    return 'your-demo-token-here';
  }
}

// Create a singleton instance
const tokenService = new TokenService();
export default tokenService; 