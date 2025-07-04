// Service to handle token acquisition from backend
const API_ENDPOINT = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5001';

class TokenService {
  constructor() {
    this.apiEndpoint = API_ENDPOINT;
  }

  /**
   * Set the API endpoint URL
   * @param {string} url - The backend API URL
   */
  setApiEndpoint(url) {
    this.apiEndpoint = url;
  }

  /**
   * Get a LiveKit token for a user
   * @param {string} username - The user's name/identity
   * @param {string} roomName - Optional room name, if not provided a new room will be generated
   * @returns {Promise<string>} - The JWT token
   */
  async getToken(username, roomName = null) {
    try {
      let url = `${this.apiEndpoint}/getToken?name=${encodeURIComponent(username)}`;
      
      if (roomName) {
        url += `&room=${encodeURIComponent(roomName)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
      }
      
      const token = await response.text();
      return token;
    } catch (error) {
      console.error('Error getting LiveKit token:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new TokenService(); 