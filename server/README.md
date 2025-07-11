# Smart Grocery Assistant Server

This directory contains the server-side components for the Smart Grocery Assistant.

## Architecture

The server consists of two main components:

1. **FastAPI Server** (main.py): Handles all API requests, including:
   - LiveKit token generation
   - Web automation decision making
   - Health checks and other utilities

2. **LiveKit Agent** (agents.py): Handles voice interactions using LiveKit's agent framework.

## Setup

1. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Create a `.env` file with the following environment variables:
```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
GOOGLE_API_KEY=your_google_api_key
```

## Running the Server

Use the provided script to start all services:
```bash
./run.sh
```

This will start:
- The FastAPI server on port 5001
- The LiveKit agent

## API Endpoints

### LiveKit Token Generation

- **GET /getToken**: Generate a LiveKit token for a user to join a room
  - Query parameters:
    - `name`: User's name/identity (default: "grocery-shopper")
    - `room`: (Optional) Room name, if not provided a new room will be generated

### Web Automation

- **POST /web-automation/decide**: Decide on the next action to take based on the current page state and user task
- **GET /web-automation/sessions/{session_id}**: Get details of a specific automation session
- **DELETE /web-automation/sessions/{session_id}**: Delete a specific automation session

### System

- **GET /health**: Health check endpoint
- **GET /**: Root endpoint with basic instructions

## Development

### Adding New Features

1. For web automation features, modify `web_automation.py`
2. For voice assistant features, modify `agents.py`
3. For new API endpoints, add them to `main.py`

### Testing

To test the API endpoints, you can use curl or a tool like Postman:

```bash
# Test the health endpoint
curl http://localhost:5001/health

# Generate a LiveKit token
curl http://localhost:5001/getToken?name=testuser
``` 