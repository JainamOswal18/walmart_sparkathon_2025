# LiveKit Integration in Smart Grocery Assistant Extension

This document provides instructions for setting up the LiveKit integration in the Smart Grocery Assistant Chrome extension.

## Environment Setup

Create a `.env` file in the root of the extension directory with the following variables:

```
# LiveKit server URL (already configured for you)
VITE_LIVEKIT_URL=wss://ai-grocery-shopper-6zlhdx27.livekit.cloud

# Backend API URL (points to your token server)
VITE_BACKEND_API_URL=http://localhost:5001
```

## Backend Requirements

The extension relies on a token server running in the `server` directory. This server provides:

1. **Token Generation**: An endpoint at `/getToken` that creates LiveKit tokens
2. **LiveKit Agent**: The voice assistant powered by Google's Gemini AI model

### Starting the Backend

1. Navigate to the `server` directory
2. Make the run script executable: `chmod +x run.sh`
3. Start both services: `./run.sh`

Alternatively, you can start the token server directly with: `python token_server.py`

## Features

The LiveKit integration provides:

1. Real-time voice communication with the AI assistant
2. Audio transcription and visualization
3. Conversation history display
4. Audio playback of AI responses

## Components

- `VoiceAssistant`: Main component that handles the LiveKit integration
- `LiveKitService`: Service for managing LiveKit room connections
- `TokenService`: Service for obtaining authentication tokens

## Usage

The extension provides two modes:

1. **Basic Mode**: Simple microphone button for quick voice commands
2. **Advanced Mode**: Full LiveKit integration with conversation history and visualization

To use the advanced mode, click the "Advanced Assistant" button in the extension popup.

## Development

To develop and test the LiveKit integration:

1. Install dependencies: `npm install`
2. Ensure the backend token server is running
3. Start the development server: `npm run dev`
4. Build the extension: `npm run build`

## Troubleshooting

If you encounter issues with the LiveKit connection:

1. Check that your token server is running on port 5001
2. Verify that your LiveKit URL is correctly set in the `.env` file
3. Check the browser console for any error messages
4. Test the token server directly with a browser request to: `http://localhost:5001/getToken?name=test-user` 