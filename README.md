# Smart Grocery Assistant

A voice-controlled browser extension that helps users with online grocery shopping using LiveKit for real-time communication and AI-powered assistance.

## Overview

This project consists of two main components:

1. **Chrome Extension (React)**: A browser extension that provides a voice interface for users to interact with online grocery shopping websites.
2. **Server (Python)**: A LiveKit Agents-powered backend that processes voice commands and provides AI assistance.

## Features

- Voice-controlled grocery shopping assistant
- Real-time communication using LiveKit
- AI-powered assistance using Google Gemini
- Search for products, add items to cart, and answer questions
- Works with popular grocery websites like Walmart and Instacart

## Prerequisites

- Node.js 16+ for the extension
- Python 3.9+ for the server
- LiveKit account (Cloud or self-hosted)
- Google Gemini API key (or other supported AI provider)

## Setup

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=your_livekit_url
GOOGLE_API_KEY=your_google_api_key
```

### Server Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start the token API:

```bash
python token_api.py
```

5. In a separate terminal, start the agent:

```bash
python agents.py
```

### Extension Setup

1. Navigate to the extension directory:

```bash
cd extension
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following variables:

```
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_URL=http://localhost:5000
LIVEKIT_ROOM_NAME=grocery-assistant
```

4. Build the extension:

```bash
npm run build
```

5. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Usage

1. Navigate to a supported grocery website (e.g., Walmart, Instacart)
2. Click on the extension icon to open the popup
3. Click the "Start Listening" button to activate the voice assistant
4. Speak your commands or questions, such as:
   - "Search for milk"
   - "Add bananas to my cart"
   - "How much is this product?"
   - "Find organic vegetables"

## Architecture

### Extension Components

- **App.jsx**: Main extension popup interface
- **VoiceAssistant**: Component for voice interaction using LiveKit
- **LiveKitService.js**: Manages LiveKit room connections
- **TokenService.js**: Handles authentication with LiveKit

### Server Components

- **token_api.py**: API for generating LiveKit tokens
- **agents.py**: LiveKit Agents implementation with Google Gemini
- **prompts.py**: Instructions and prompts for the AI assistant

## Integration with LiveKit

This project uses LiveKit for real-time communication between the extension and the server:

1. The extension connects to a LiveKit room using the token from the API
2. The server runs a LiveKit Agent that joins the same room
3. Audio is streamed in real-time between the extension and server
4. The agent processes the audio, performs AI operations, and responds

## Troubleshooting

- **Token Generation Issues**: Ensure your LiveKit API key and secret are correct
- **Connection Problems**: Check that your LiveKit URL is accessible
- **Microphone Access**: Make sure to grant microphone permissions to the extension
- **AI Responses**: Verify your Google API key is valid and has access to Gemini models

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [LiveKit](https://livekit.io/) for real-time communication
- [Google Gemini](https://ai.google.dev/) for AI capabilities
