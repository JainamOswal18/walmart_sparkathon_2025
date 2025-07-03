# Smart Grocery Assistant - React Extension

A voice-controlled browser extension that serves as a smart assistant to streamline the online grocery shopping experience. This extension is built with React, Vite, and LiveKit.

## Features

- Voice-activated control for online grocery shopping
- Modern UI with glassmorphism design
- Real-time status indicators
- Seamless integration with grocery websites
- LiveKit integration for real-time voice communication with AI assistant

## Development

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- LiveKit server (for voice assistant functionality)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
VITE_LIVEKIT_URL=wss://your-livekit-server.com
VITE_LIVEKIT_API_URL=https://your-api-server.com
```

4. Start the development server:

```bash
npm run dev
```

### Building the Extension

To build the extension for production:

```bash
npm run build
```

This will create a `dist` directory with the extension files.

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `dist` directory

## LiveKit Integration

This extension uses LiveKit for real-time voice communication with the AI assistant. LiveKit is a WebRTC platform that provides real-time audio and video capabilities.

### How it Works

1. When the user clicks the microphone button, the extension connects to a LiveKit room
2. The user's voice is sent to the LiveKit server, which processes it using the AI assistant
3. The AI assistant responds with audio, which is played back to the user
4. Transcriptions of both the user and assistant are displayed in the UI

### Configuration

To configure LiveKit, you need to:

1. Set up a LiveKit server (or use LiveKit Cloud)
2. Generate tokens for authentication
3. Update the `.env` file with your LiveKit server URL and API URL

## Project Structure

- `public/` - Static files (manifest.json, background.js, content.js)
- `src/` - React source code
  - `components/` - React components
    - `VoiceAssistant/` - LiveKit voice assistant components
  - `services/` - Service modules
    - `LiveKitService.js` - LiveKit connection management
    - `TokenService.js` - Token generation for LiveKit
  - `App.jsx` - Main React component
  - `App.css` - Styles for the extension
  - `main.jsx` - Entry point for React

## Technologies Used

- React - UI library
- Vite - Build tool
- LiveKit - Real-time audio communication
- Chrome Extension API - Browser integration
