"""
Main server file for the Smart Grocery Assistant
"""

import os
import uuid
from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse
from dotenv import load_dotenv
from web_automation import router as web_automation_router
import uvicorn
from livekit import api
from livekit.api import LiveKitAPI, ListRoomsRequest
from typing import Optional

# Load environment variables
load_dotenv()

# Create the FastAPI app
app = FastAPI(title="Smart Grocery Assistant API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the web automation router
app.include_router(web_automation_router, tags=["Web Automation"])

# LiveKit token server functionality
async def generate_room_name():
    """Generate a unique room name"""
    name = "grocery-room-" + str(uuid.uuid4())[:8]
    rooms = await get_rooms()
    while name in rooms:
        name = "grocery-room-" + str(uuid.uuid4())[:8]
    return name

async def get_rooms():
    """Get a list of all LiveKit rooms"""
    livekit_api = LiveKitAPI()
    rooms = await livekit_api.room.list_rooms(ListRoomsRequest())
    await livekit_api.aclose()
    return [room.name for room in rooms.rooms]

@app.get("/getToken", response_class=PlainTextResponse, tags=["LiveKit"])
async def get_token(name: str = Query("grocery-shopper", description="User name/identity"), 
                   room: Optional[str] = Query(None, description="Room name (optional)")):
    """
    Generate a LiveKit token for a user to join a room
    
    - **name**: The user's name/identity
    - **room**: Optional room name, if not provided a new room will be generated
    """
    if not room:
        room = await generate_room_name()
    
    # Create the access token with the API key and secret from env vars
    token = api.AccessToken(
        os.getenv("LIVEKIT_API_KEY"), 
        os.getenv("LIVEKIT_API_SECRET")
    )
    
    # Configure the token with user identity and permissions
    token.with_identity(name)
    token.with_name(name)
    token.with_grants(
        api.VideoGrants(
            room_join=True,
            room=room,
            can_publish=True,
            can_subscribe=True
        )
    )
    
    # Return the token as a JWT
    return token.to_jwt()

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Smart Grocery Assistant API"}

@app.get("/", response_class=HTMLResponse, tags=["System"])
async def root():
    """Root endpoint with basic instructions"""
    return """
    <html>
        <body>
            <h1>Smart Grocery Assistant API</h1>
            <h2>Available Endpoints:</h2>
            <ul>
                <li><strong>GET /getToken</strong> - Generate LiveKit tokens</li>
                <li><strong>GET /web-automation/decide</strong> - Web automation decision endpoint</li>
                <li><strong>GET /web-automation/sessions/{session_id}</strong> - Get automation session details</li>
                <li><strong>GET /health</strong> - Health check endpoint</li>
            </ul>
            <p>Example: <code>/getToken?name=username&room=roomname</code></p>
        </body>
    </html>
    """

if __name__ == "__main__":
    # Get port from environment or default to 5001
    port = int(os.getenv("PORT", 5001))
    print(f"Starting API server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 