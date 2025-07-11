"""
Web Automation API - Handles decision making for web automation tasks
"""

import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from prompts import WEB_AUTOMATION_PROMPT
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Google API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

genai.configure(api_key=GOOGLE_API_KEY)

# Create the router
router = APIRouter()

# Define models
class WebAutomationRequest(BaseModel):
    task: str
    pageData: Dict[str, Any]
    sessionId: Optional[str] = None
    stepCount: Optional[int] = 0

class WebAutomationResponse(BaseModel):
    action: str
    parameters: Dict[str, Any]
    reason: str
    status: str

# In-memory storage for session data
sessions = {}

@router.post("/web-automation/decide")
async def decide_action(request: WebAutomationRequest) -> Dict[str, Any]:
    """
    Decide on the next action to take based on the current page state and user task
    """
    try:
        # Store session data if provided
        if request.sessionId:
            if request.sessionId not in sessions:
                sessions[request.sessionId] = {
                    "task": request.task,
                    "steps": []
                }
            
            # Add the current page state to the session
            sessions[request.sessionId]["steps"].append({
                "stepCount": request.stepCount,
                "pageData": request.pageData
            })
        
        # Format the prompt for the LLM
        prompt = WEB_AUTOMATION_PROMPT.format(
            user_goal=request.task,
            page_data=json.dumps(request.pageData, indent=2)
        )
        
        # Call the LLM to decide on the next action
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Failed to get response from LLM")
        
        # Parse the LLM response
        try:
            action_json = json.loads(response.text)
            
            # Validate the action format
            if "action" not in action_json:
                return {
                    "error": "Invalid action format: missing 'action' field",
                    "raw_response": response.text
                }
            
            # Store the decision in the session
            if request.sessionId and request.sessionId in sessions:
                sessions[request.sessionId]["steps"][-1]["decision"] = action_json
            
            return {
                "action": action_json.get("action"),
                "parameters": action_json.get("parameters", {}),
                "reason": action_json.get("reason", ""),
                "status": action_json.get("status", "in_progress")
            }
        except json.JSONDecodeError:
            return {
                "error": "Failed to parse LLM response as JSON",
                "raw_response": response.text
            }
    except Exception as e:
        print(f"Error in decide_action: {str(e)}")
        return {"error": str(e)}

@router.get("/web-automation/sessions/{session_id}")
async def get_session(session_id: str) -> Dict[str, Any]:
    """
    Get the details of a specific automation session
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return sessions[session_id]

@router.delete("/web-automation/sessions/{session_id}")
async def delete_session(session_id: str) -> Dict[str, Any]:
    """
    Delete a specific automation session
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = sessions.pop(session_id)
    return {"message": "Session deleted", "session_id": session_id} 