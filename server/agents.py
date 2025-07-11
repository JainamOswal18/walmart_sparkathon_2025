from __future__ import annotations
from livekit.agents import (
    AgentSession,
    Agent,
    JobContext,
    WorkerOptions,
    cli,
    llm,
    function_tool,
    RunContext
)
from livekit.plugins import google
from dotenv import load_dotenv
from prompts import WELCOME_MESSAGE, INSTRUCTIONS, WEB_AUTOMATION_PROMPT
import os
from typing import Any, Dict, List, Optional
import json

load_dotenv()

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=INSTRUCTIONS)
    
    @function_tool()
    async def web_automation(
        self,
        context: RunContext,
        task: str,
    ) -> dict[str, Any]:
        """Execute a web automation task on the current page.
        
        This tool allows the agent to interact with the webpage that the user is currently viewing.
        It can perform actions like clicking buttons, typing text, searching for products, etc.
        
        Args:
            task: A clear description of what needs to be done on the webpage, e.g., "search for organic milk"
        """
        # Log the task
        print(f"Web automation task received: {task}")
        
        try:
            # Send the task to the client extension
            result = await context.send_data_to_client({
                "type": "web_automation",
                "task": task
            })
            
            # Wait for response from client
            response = await context.wait_for_data_from_client("web_automation_result", timeout=60)
            
            if not response or "error" in response:
                error_message = response.get("error", "Unknown error occurred") if response else "No response received"
                return {
                    "success": False,
                    "error": error_message
                }
            
            return {
                "success": True,
                "message": response.get("message", "Task completed"),
                "result": response.get("result", {})
            }
        except Exception as e:
            print(f"Error in web automation: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @function_tool()
    async def decide_web_action(
        self,
        context: RunContext,
        page_data: dict,
        user_goal: str,
    ) -> dict[str, Any]:
        """Analyze the current webpage and decide what action to take next based on the user's goal.
        
        Args:
            page_data: JSON representation of the current webpage with interactive elements
            user_goal: The user's goal or task to accomplish
        """
        try:
            # Format the prompt for the LLM
            prompt = WEB_AUTOMATION_PROMPT.format(
                user_goal=user_goal,
                page_data=json.dumps(page_data, indent=2)
            )
            
            # Use the LLM to decide the next action
            llm_response = await context.llm.generate_text(prompt)
            
            # Parse the LLM response to extract the action
            try:
                action_json = json.loads(llm_response)
                
                # Validate the action format
                if "action" not in action_json:
                    return {
                        "success": False,
                        "error": "Invalid action format: missing 'action' field",
                        "raw_response": llm_response
                    }
                
                return {
                    "success": True,
                    "action": action_json.get("action"),
                    "parameters": action_json.get("parameters", {}),
                    "reason": action_json.get("reason", ""),
                    "status": action_json.get("status", "in_progress")
                }
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "error": "Failed to parse LLM response as JSON",
                    "raw_response": llm_response
                }
        except Exception as e:
            print(f"Error in decide_web_action: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

async def entrypoint(ctx: JobContext):
    await ctx.connect()
    
    # Create the session with the realtime model
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.5-flash-preview-native-audio-dialog",
            voice="Puck",
            temperature=0.8,
            instructions=INSTRUCTIONS,
            # Use only AUDIO modality for now due to API issues with multiple modalities
            # Text can be handled through LiveKit's built-in transcription
        )
    )
    
    # Start the session with the assistant
    await session.start(
        room=ctx.room,
        agent=Assistant()
    )
    
    # Send the welcome message through the realtime model
    await session.generate_reply(instructions=f"Greet the user with this message: {WELCOME_MESSAGE}")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))