#!/bin/bash

# Check if Python and required packages are installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 to continue."
    exit 1
fi

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check for required environment variables
if [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
    echo "Error: LIVEKIT_API_KEY and LIVEKIT_API_SECRET environment variables must be set."
    echo "Please create a .env file in the server directory with these variables."
    exit 1
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "Warning: GOOGLE_API_KEY environment variable is not set."
    echo "Web automation features may not work properly."
fi

# Function to start the FastAPI server
start_api_server() {
    echo "Starting API server..."
    python main.py &
    API_SERVER_PID=$!
    echo "API server started with PID: $API_SERVER_PID"
}

# Function to start the agent
start_agent() {
    echo "Starting LiveKit agent..."
    python agents.py dev&
    AGENT_PID=$!
    echo "Agent started with PID: $AGENT_PID"
}

# Handle Ctrl+C to clean up processes
cleanup() {
    echo "Stopping services..."
    if [ ! -z "$API_SERVER_PID" ]; then
        kill $API_SERVER_PID
        echo "API server stopped"
    fi
    if [ ! -z "$AGENT_PID" ]; then
        kill $AGENT_PID
        echo "Agent stopped"
    fi
    exit 0
}

trap cleanup SIGINT

# Start services
start_api_server
start_agent

echo "All services are running. Press Ctrl+C to stop."

# Keep script running
wait 