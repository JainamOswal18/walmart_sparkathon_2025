# Smart Grocery Assistant Server

This directory contains the server components for the Smart Grocery Assistant:

1. **LiveKit Agent**: Handles voice interactions and AI responses
2. **Token Server**: Generates authentication tokens for LiveKit connections

## Setup

1. Make sure you have Python 3.8+ installed
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Ensure the `.env` file contains:
   ```
   LIVEKIT_URL=wss://ai-grocery-shopper-6zlhdx27.livekit.cloud
   LIVEKIT_API_KEY=APIp3UBJzE3kMsr
   LIVEKIT_API_SECRET=vK6toNBE3VPb3NuvVBdaM9u3TY506kQZngf32sxkKTc
   GOOGLE_API_KEY=AIzaSyD0enjnHywip_qf2BoygzQErM5Dz2W-c_g
   ```

## Running the Server

### Option 1: Use the run script (recommended)

```bash
chmod +x run.sh
./run.sh
```

This will start both the token server and the agent in the background.

### Option 2: Start components separately

1. Start the token server:
   ```
   python token_server.py
   ```
   This will run on port 5001 by default.

2. Start the agent in a separate terminal:
   ```
   python agents.py
   ```

## Token Server Endpoints

- **GET /** - Basic HTML instructions
- **GET /health** - Health check endpoint
- **GET /getToken** - Generate a LiveKit token
  - Query Parameters:
    - `name` (optional): User's identity (default: "grocery-shopper")
    - `room` (optional): Room name (default: auto-generated)

## Agent

The LiveKit agent uses the Google Gemini model for voice interactions. It responds to user queries and provides assistance with grocery shopping tasks.

## Integration with the Extension

The extension connects to the token server to get a LiveKit token, then uses that token to establish a WebRTC connection to the LiveKit cloud service. The agent runs in the LiveKit room and handles the AI conversation.

## Troubleshooting

- If you encounter connection issues, make sure your LiveKit API credentials are correct in the `.env` file.
- Check that the token server is running and accessible at http://localhost:5001
- To restart both services, press Ctrl+C in the terminal where the run script is running, then start it again. 