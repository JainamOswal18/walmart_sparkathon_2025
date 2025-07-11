// background.js - Service worker for the Smart Grocery Assistant extension

// Configuration
const API_ENDPOINT = 'http://localhost:5001'; // Default backend URL

// State management
let activeTabId = null;
let activeSession = null;
let pendingTasks = [];

// Listen for installation events
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Smart Grocery Assistant installed');
  } else if (details.reason === 'update') {
    console.log('Smart Grocery Assistant updated');
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Keep the service worker alive for async operations
  if (message.keepAlive) {
    sendResponse({ status: 'alive' });
    return;
  }
  
  // Track the active tab
  if (sender.tab && sender.tab.active) {
    activeTabId = sender.tab.id;
  }
  
  // Handle specific message types
  if (message.action === 'WEB_AUTOMATION') {
    handleWebAutomation(message.task, sender, sendResponse);
    return true; // Keep the message channel open for async response
  } else if (message.action === 'OBSERVE_PAGE') {
    observeCurrentPage(sendResponse);
    return true; // Keep the message channel open for async response
  } else if (message.action === 'EXECUTE_ACTION') {
    executeAction(message.command, message.parameters, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  // Forward messages from content script to popup or vice versa
  if (message.target === 'popup') {
    chrome.runtime.sendMessage(message).catch(err => {
      console.log('Error forwarding message to popup:', err);
    });
  } else if (message.target === 'content') {
    // Forward to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(err => {
          console.log('Error forwarding message to content script:', err);
        });
      }
    });
  } else if (message.target === 'backend') {
    // Forward to backend server
    sendToBackend(message.endpoint, message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

/**
 * Handle web automation tasks from the backend
 */
async function handleWebAutomation(task, sender, sendResponse) {
  try {
    console.log('Received web automation task:', task);
    
    // Start a new automation session
    activeSession = {
      id: Date.now().toString(),
      task: task,
      status: 'in_progress',
      steps: [],
      startTime: Date.now()
    };
    
    // Get the current page state
    const pageData = await observeCurrentPage();
    
    // Send the task and page data to the backend for decision
    const decision = await sendToBackend('/web-automation/decide', {
      task: task,
      pageData: pageData
    });
    
    if (!decision || decision.error) {
      throw new Error(decision?.error || 'Failed to get decision from backend');
    }
    
    // Execute the action from the decision
    const result = await executeAction(decision.action, decision.parameters);
    
    // Record the step
    activeSession.steps.push({
      action: decision.action,
      parameters: decision.parameters,
      result: result,
      timestamp: Date.now()
    });
    
    // Check if task is complete
    if (decision.status === 'completed') {
      activeSession.status = 'completed';
      activeSession.endTime = Date.now();
      sendResponse({ 
        success: true, 
        message: 'Task completed successfully', 
        session: activeSession 
      });
    } else {
      // Continue the observe-decide-act loop
      continueAutomationLoop(task, sendResponse);
    }
  } catch (error) {
    console.error('Web automation error:', error);
    if (activeSession) {
      activeSession.status = 'error';
      activeSession.error = error.message;
      activeSession.endTime = Date.now();
    }
    sendResponse({ 
      success: false, 
      error: error.message, 
      session: activeSession 
    });
  }
}

/**
 * Continue the observe-decide-act loop until task completion
 */
async function continueAutomationLoop(task, sendResponse) {
  try {
    // Set a maximum number of steps to prevent infinite loops
    const MAX_STEPS = 20;
    
    while (activeSession.status === 'in_progress' && activeSession.steps.length < MAX_STEPS) {
      // Wait a moment for page to update after last action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the updated page state
      const pageData = await observeCurrentPage();
      
      // Send the updated page state to the backend for next decision
      const decision = await sendToBackend('/web-automation/decide', {
        task: task,
        pageData: pageData,
        sessionId: activeSession.id,
        stepCount: activeSession.steps.length
      });
      
      if (!decision || decision.error) {
        throw new Error(decision?.error || 'Failed to get decision from backend');
      }
      
      // Check if task is complete
      if (decision.status === 'completed' || decision.action === 'stop') {
        activeSession.status = 'completed';
        activeSession.endTime = Date.now();
        sendResponse({ 
          success: true, 
          message: decision.message || 'Task completed successfully', 
          session: activeSession 
        });
        return;
      }
      
      // Execute the next action
      const result = await executeAction(decision.action, decision.parameters);
      
      // Record the step
      activeSession.steps.push({
        action: decision.action,
        parameters: decision.parameters,
        result: result,
        timestamp: Date.now()
      });
    }
    
    // If we reached the maximum steps, consider it a timeout
    if (activeSession.steps.length >= MAX_STEPS) {
      activeSession.status = 'timeout';
      activeSession.endTime = Date.now();
      sendResponse({ 
        success: false, 
        error: 'Task timed out - too many steps', 
        session: activeSession 
      });
    }
  } catch (error) {
    console.error('Automation loop error:', error);
    activeSession.status = 'error';
    activeSession.error = error.message;
    activeSession.endTime = Date.now();
    sendResponse({ 
      success: false, 
      error: error.message, 
      session: activeSession 
    });
  }
}

/**
 * Observe the current active page
 */
async function observeCurrentPage(sendResponse = null) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        const error = 'No active tab found';
        if (sendResponse) sendResponse({ success: false, error });
        reject(new Error(error));
        return;
      }
      
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: "OBSERVE_PAGE" });
        if (response.success) {
          if (sendResponse) sendResponse({ success: true, pageData: response.pageData });
          resolve(response.pageData);
        } else {
          if (sendResponse) sendResponse({ success: false, error: response.error });
          reject(new Error(response.error));
        }
      } catch (error) {
        const errorMsg = `Failed to observe page: ${error.message}`;
        if (sendResponse) sendResponse({ success: false, error: errorMsg });
        reject(new Error(errorMsg));
      }
    });
  });
}

/**
 * Execute an action on the current active page
 */
async function executeAction(command, parameters, sendResponse = null) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        const error = 'No active tab found';
        if (sendResponse) sendResponse({ success: false, error });
        reject(new Error(error));
        return;
      }
      
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { 
          action: "EXECUTE_COMMAND", 
          command: command, 
          parameters: parameters 
        });
        
        if (response.success) {
          if (sendResponse) sendResponse({ success: true, result: response.result });
          resolve(response.result);
        } else {
          if (sendResponse) sendResponse({ success: false, error: response.error });
          reject(new Error(response.error));
        }
      } catch (error) {
        const errorMsg = `Failed to execute action: ${error.message}`;
        if (sendResponse) sendResponse({ success: false, error: errorMsg });
        reject(new Error(errorMsg));
      }
    });
  });
}

/**
 * Send data to the backend server
 */
async function sendToBackend(endpoint, data) {
  try {
    const url = `${API_ENDPOINT}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Backend communication error:', error);
    throw error;
  }
} 