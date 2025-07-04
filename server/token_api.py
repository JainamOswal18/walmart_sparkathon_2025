from flask import Flask, request, jsonify
from flask_cors import CORS
from livekit.api import AccessToken, VideoGrants
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Get LiveKit API credentials from environment variables
# For demo.livekit.cloud, you can use the test credentials
API_KEY = os.environ.get('LIVEKIT_API_KEY', 'devkey')
API_SECRET = os.environ.get('LIVEKIT_API_SECRET', 'secret')

@app.route('/api/getToken', methods=['GET'])
def get_token():
    """Generate a LiveKit token for a participant to join a room"""
    try:
        room_name = request.args.get('room', 'grocery-assistant')
        participant_name = request.args.get('name', f'user-{request.remote_addr}')
        
        print(f"Generating token for room: {room_name}, participant: {participant_name}")
        
        # Create a new access token
        token = AccessToken(API_KEY, API_SECRET)
        
        # Set the identity and name on the token
        token.with_identity(participant_name)
        token.with_name(participant_name)
        
        # Grant permissions for the room
        grant = VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True
        )
        token.with_grants(grant)
        
        # Generate the JWT token
        jwt_token = token.to_jwt()
        
        print(f"Token generated successfully for {participant_name}")
        return jsonify({"token": jwt_token})
    
    except Exception as e:
        print(f"Error generating token: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    print(f"Starting token server on {host}:{port}")
    app.run(host=host, port=port, debug=True) 