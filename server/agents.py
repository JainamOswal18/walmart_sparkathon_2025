from __future__ import annotations
from livekit.agents import (
    AgentSession,
    Agent,
    JobContext,
    WorkerOptions,
    cli,
    function_tool,
    RunContext
)
from livekit.plugins import google, silero
from dotenv import load_dotenv
from prompts import WELCOME_MESSAGE, INSTRUCTIONS
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class GroceryAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=INSTRUCTIONS)
    
    @function_tool
    async def search_product(
        self,
        context: RunContext,
        item: str,
    ) -> dict:
        """Search for a product in the grocery store.
        
        Args:
            item: The name of the product to search for.
        """
        logger.info(f"Searching for product: {item}")
        return {"success": True, "message": f"Searching for {item}"}
    
    @function_tool
    async def add_to_cart(
        self,
        context: RunContext,
        item: str,
        quantity: int = 1,
    ) -> dict:
        """Add a product to the shopping cart.
        
        Args:
            item: The name of the product to add.
            quantity: The quantity to add (default: 1).
        """
        logger.info(f"Adding to cart: {quantity} x {item}")
        return {"success": True, "message": f"Added {quantity} x {item} to cart"}

async def entrypoint(ctx: JobContext):
    # Connect to the room
    await ctx.connect()
    
    # Create the agent session
    session = AgentSession(
        # Use Google's realtime model for voice interaction
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.5-flash-preview-native-audio-dialog",
            voice="Puck",
            temperature=0.8,
            instructions=INSTRUCTIONS,
        ),
        # Add VAD for better voice detection
        vad=silero.VAD.load(),
    )
    
    # Start the session with the assistant
    await session.start(
        room=ctx.room,
        agent=GroceryAssistant()
    )
    
    # Send the welcome message
    await session.generate_reply(instructions=f"Greet the user with this message: {WELCOME_MESSAGE}")
    
    # Log that the agent is ready
    logger.info(f"Agent ready in room: {ctx.room.name}")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))