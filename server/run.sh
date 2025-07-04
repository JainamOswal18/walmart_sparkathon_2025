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

# Function to start the token server
start_token_server() {
    echo "Starting token server..."
    python token_server.py &
    TOKEN_SERVER_PID=$!
    echo "Token server started with PID: $TOKEN_SERVER_PID"
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
    if [ ! -z "$TOKEN_SERVER_PID" ]; then
        kill $TOKEN_SERVER_PID
        echo "Token server stopped"
    fi
    if [ ! -z "$AGENT_PID" ]; then
        kill $AGENT_PID
        echo "Agent stopped"
    fi
    exit 0
}

trap cleanup SIGINT

# Start services
start_token_server
start_agent

echo "All services are running. Press Ctrl+C to stop."

# Keep script running
wait 