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
from prompts import WELCOME_MESSAGE, INSTRUCTIONS
import rag
import os

load_dotenv()

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=INSTRUCTIONS)
    
    @function_tool(
        name="faq_lookup",
        description=(
            "Use this when the user asks a question about how the grocery assistant works. "
            "Input is the question string; output should be the grounded answer."
        ),
    )
    async def faq_lookup(
        self, context: RunContext, question: str
    ) -> dict[str, str]:
        """Return the best answer from the FAQ RAG chain."""
        answer = await context.loop.run_in_executor(None, rag.answer, question)
        return {"answer": answer}    
        
    
    # Add your functions here with @function_tool decorator when needed
    # Example:
    # @function_tool()
    # async def your_function_name(
    #     self,
    #     context: RunContext,
    #     param: str,
    # ) -> dict[str, Any]:
    #     """Description of your function.
    #     
    #     Args:
    #         param: Description of the parameter.
    #     """
    #     return {"result": "your_result"}

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