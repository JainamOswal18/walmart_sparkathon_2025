# Product Requirements Document: Smart Grocery Assistant

## 1. Overview
- **1.1. Project Goal:** To build a voice-controlled browser extension that serves as a smart assistant to streamline the online grocery shopping experience. The assistant will handle tasks, answer questions, and provide proactive support to reduce user friction and cognitive load.
- **1.2. Problem Statement:** Online grocery shopping can be inefficient, complex, and inaccessible for many users, including busy professionals, the elderly, and individuals with disabilities. This project aims to create a seamless, hands-free, and intelligent interface to solve these challenges.
- **1.3. Target Audience:**
    - Busy individuals and families seeking to optimize their time.
    - Elderly users who may find navigating complex web interfaces challenging.
    - Users with physical disabilities or impairments that make mouse and keyboard use difficult.

## 2. System Architecture & Core Technologies
- **2.1. Frontend:** A browser extension with a React.js UI.
- **2.2. Backend:** A FastAPI server to manage business logic and orchestration.
- **2.3. Real-time Communication:** LiveKit will be used for persistent, low-latency, bi-directional audio streaming and data exchange between the browser extension and the backend.
- **2.4. AI & Language Pipeline:**
    - **Speech-to-Text (STT):** A real-time transcription service to convert user's spoken audio into text.
    - **Natural Language Understanding (NLU):** LangChain framework with a Gemini-family Large Language Model (LLM) to determine user intent and extract key entities.
    - **Text-to-Speech (TTS):** A conversational AI model from Gemini or Groq to generate natural, human-like voice responses.
- **2.5. Web Automation:** Playwright or Selenium will be used to programmatically interact with the grocery website's DOM to perform actions on behalf of the user.
- **2.6. Memory & Intelligence (RAG):**
    - A Retrieval-Augmented Generation (RAG) system built with LangChain and a FAISS vector store.
    - This will provide the assistant with a knowledge base for answering questions, including FAQs and the user's personal shopping history.
- **2.7. Database:** Supabase or a local SQLite database to store user session data, preferences, and purchase history.

## 3. Detailed Feature Requirements

### Feature 1: Voice-Activated Control & Session Management
- **REQ-1.1:** The extension UI must feature a clear and intuitive button or visual cue to initiate and end a voice session.
- **REQ-1.2:** The UI must visually indicate the assistant's current state: `Idle`, `Listening`, `Processing` (thinking), and `Speaking`.
- **REQ-1.3:** Upon activation, the extension must establish a stable, persistent connection to the backend using the LiveKit SDK. This connection should support real-time, bi-directional audio streaming.
- **REQ-1.4:** The audio stream from the user's microphone must be captured and sent to the backend continuously as long as the session is active.

### Feature 2: Intent-Driven Conversational Flow
- **REQ-2.1:** The backend will process the incoming audio stream via the STT service to get a live text transcript.
- **REQ-2.2:** The LangChain NLU agent, powered by Gemini, will analyze the transcript in real-time to determine user intent as either an `ACTION` or a `QUESTION`. The final intent is decided when the user pauses.
- **REQ-2.3:** The system must be able to distinguish between commands that require website manipulation (e.g., "add milk to cart") and informational queries (e.g., "are there any new offers on coffee?").

### Feature 3: Action Execution Path
- **REQ-3.1:** For `ACTION` intents, the NLU must extract all relevant entities, such as the product name ("milk"), quantity ("1 litre"), brand, and the specific action (add, remove, search, update).
- **REQ-3.2 (Immediate Feedback):** Upon identifying an `ACTION` intent, the system must immediately generate and stream back a short, confirmatory voice message (e.g., "Okay, adding milk to your cart...").
- **REQ-3.3 (Asynchronous Task Execution):** While the user hears the confirmation, the backend must trigger an asynchronous task to control the web automation agent (Playwright).
- **REQ-3.4:** The Playwright agent must navigate the live grocery website, locate the correct DOM elements, and perform the requested action (e.g., type in search, click a button). The agent must include error handling for UI changes or missing elements.
- **REQ-3.5 (Final Confirmation):** Once the Playwright agent confirms successful completion of the task, a final, short success message (e.g., "Done!") will be sent to the user as voice.

### Feature 4: Question Answering Path (RAG)
- **REQ-4.1:** For `QUESTION` intents, the user's query will be sent to the RAG pipeline.
- **REQ-4.2 (Optional Feedback):** The system may provide an optional, intermediate voice response like "Let me check..." to manage user expectation while retrieving information.
- **REQ-4.3:** The RAG system will query the FAISS vector store to find the most relevant information from its knowledge base.
- **REQ-4.4:** The knowledge base must be populated with:
    - General grocery and product FAQs.
    - The user's personal shopping history, including previously purchased items and brands.
- **REQ-4.5:** The context retrieved from FAISS will be passed to the LLM (Gemini) to generate a concise, accurate, and natural-language answer.
- **REQ-4.6:** The generated text answer will be converted to speech using the TTS service and streamed back to the user.

### Feature 5: Personalization and Memory
- **REQ-5.1:** A database (Supabase/SQLite) must be implemented to store user-specific data.
- **REQ-5.2:** The system must record and store the user's purchase history to answer questions like "What brand of pasta did I buy last month?".
- **REQ-5.3:** The system should allow for storing user preferences (e.g., "default to organic products") to personalize future actions and recommendations.

## 4. Non-Functional Requirements
- **4.1. Performance:**
    - **NFR-1.1:** End-to-end latency for the `ACTION` path (from user finishing speaking to hearing initial confirmation) must be under 2 seconds.
    - **NFR-1.2:** Response time for the `QUESTION` path (from user finishing speaking to start of spoken answer) should be under 5 seconds for typical queries.
- **4.2. Reliability:**
    - **NFR-2.1:** The LiveKit connection should be resilient and attempt to auto-reconnect if dropped.
    - **NFR-2.2:** The Playwright automation scripts must be designed defensively with robust selectors and error-handling logic to accommodate minor changes in the target website's layout.
- **4.3. Usability & Accessibility:**
    - **NFR-3.1:** The primary mode of interaction shall be voice to ensure accessibility for users with motor impairments.
    - **NFR-3.2:** The voice responses generated by the system must be clear, natural-sounding, and easy to understand.
