# Web Automation for Smart Grocery Assistant

This document explains the web automation implementation for the Smart Grocery Assistant extension.

## Architecture Overview

The web automation system follows the "Observe-Decide-Act" loop pattern:

1. **Observe**: The extension scans the current webpage and creates a simplified representation of interactive elements.
2. **Decide**: The backend LLM analyzes the page representation and user's goal to determine the next action.
3. **Act**: The extension executes the action on the webpage.

## Components

### Client-Side (Extension)

- **content.js**: Injects into grocery websites and handles DOM observation and manipulation.
  - Observes the page and creates a simplified representation of interactive elements
  - Executes actions like clicking, typing, and scrolling
  - Maintains a registry of elements with unique agent-ids

- **background.js**: Coordinates communication between content script, popup, and backend.
  - Manages automation sessions
  - Handles message passing between components
  - Communicates with backend API

- **WebAutomationService.js**: Service for the React components to interact with web automation.
  - Provides methods for executing tasks, observing pages, and executing individual actions
  - Manages task state and callbacks

- **WebAutomation.jsx**: React component for the web automation UI.
  - Provides interface for users to enter tasks and see results
  - Shows task status and results

### Server-Side

- **web_automation.py**: FastAPI router for web automation endpoints.
  - `/web-automation/decide`: Endpoint for deciding the next action based on page state
  - `/web-automation/sessions/{session_id}`: Endpoint for managing automation sessions

- **agents.py**: LiveKit agent implementation with web automation tools.
  - `web_automation`: Function tool for executing web automation tasks
  - `decide_web_action`: Function tool for deciding the next action

- **prompts.py**: Contains the prompt templates for the LLM.
  - `WEB_AUTOMATION_PROMPT`: Prompt for the LLM to decide the next action

## Communication Flow

1. User enters a task in the WebAutomation component
2. WebAutomationService sends the task to background.js
3. background.js observes the current page using content.js
4. background.js sends the page data and task to the backend
5. Backend uses the LLM to decide the next action
6. background.js receives the action and sends it to content.js for execution
7. content.js executes the action and reports the result
8. The loop continues until the task is complete or fails

## Action Types

The system supports the following action types:

- **click**: Click on an element identified by agent-id
- **type**: Type text into an input element
- **scroll**: Scroll the page in a specified direction
- **stop**: End the automation task

## Element Registry

The content script maintains a registry of interactive elements on the page, each with a unique agent-id. This allows the backend to reference specific elements without needing complex CSS selectors or XPaths.

## Error Handling

The system includes error handling at multiple levels:

- Content script: Catches and reports errors during action execution
- Background script: Manages timeouts and retries
- Backend: Validates LLM responses and handles edge cases

## Usage

1. Open the extension popup
2. Switch to the "Web Automation" tab
3. Enter a task (e.g., "search for organic milk")
4. Click "Execute" to start the automation
5. Watch as the extension navigates the website to complete your task

## Development

To extend the web automation capabilities:

1. Add new action types in content.js
2. Update the WEB_AUTOMATION_PROMPT to include the new actions
3. Implement any necessary backend logic

## Future Improvements

- Add support for more complex actions like drag-and-drop
- Implement visual feedback during automation (e.g., highlight elements)
- Add support for conditional actions and branching
- Improve error recovery strategies 