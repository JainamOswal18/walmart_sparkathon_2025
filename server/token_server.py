import os
import uuid
from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from livekit import api
from livekit.api import LiveKitAPI, ListRoomsRequest

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

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

@app.route("/getToken")
async def get_token():
    """Generate a LiveKit token for a user to join a room"""
    name = request.args.get("name", "grocery-shopper")
    room = request.args.get("room", None)
    
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

@app.route("/health")
def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "service": "LiveKit Token Server"}

@app.route("/")
def root():
    """Root endpoint with basic instructions"""
    return """
    <html>
        <body>
            <h1>Smart Grocery Assistant Token Server</h1>
            <p>Use the /getToken endpoint to generate LiveKit tokens.</p>
            <p>Example: <code>/getToken?name=username&room=roomname</code></p>
        </body>
    </html>
    """

if __name__ == "__main__":
    # Get port from environment or default to 5001
    port = int(os.getenv("PORT", 5001))
    print(f"Starting token server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True) 