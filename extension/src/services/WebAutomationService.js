// WebAutomationService.js - Service for handling web automation tasks

class WebAutomationService {
  constructor() {
    this.activeTask = null;
    this.taskCallbacks = new Map();
  }

  /**
   * Execute a web automation task on the current page
   * @param {string} task - The task description to execute
   * @returns {Promise<Object>} - Result of the task execution
   */
  async executeTask(task) {
    if (!task) {
      throw new Error('No task provided');
    }

    // Generate a unique ID for this task
    const taskId = Date.now().toString();
    
    // Store the task
    this.activeTask = {
      id: taskId,
      description: task,
      status: 'pending',
      startTime: Date.now()
    };
    
    // Send the task to the background script
    return new Promise((resolve, reject) => {
      // Store the callbacks for this task
      this.taskCallbacks.set(taskId, { resolve, reject });
      
      chrome.runtime.sendMessage({
        action: 'WEB_AUTOMATION',
        task: task
      }, (response) => {
        // Check for chrome runtime errors
        if (chrome.runtime.lastError) {
          this.activeTask.status = 'error';
          this.activeTask.error = chrome.runtime.lastError.message;
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        // Process the response
        if (response.success) {
          this.activeTask.status = 'completed';
          this.activeTask.result = response.session;
          this.activeTask.endTime = Date.now();
          resolve(response.session);
        } else {
          this.activeTask.status = 'error';
          this.activeTask.error = response.error;
          this.activeTask.endTime = Date.now();
          reject(new Error(response.error));
        }
        
        // Clean up the callback
        this.taskCallbacks.delete(taskId);
      });
    });
  }
  
  /**
   * Observe the current page state
   * @returns {Promise<Object>} - The page state data
   */
  async observePage() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'OBSERVE_PAGE'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          resolve(response.pageData);
        } else {
          reject(new Error(response.error || 'Failed to observe page'));
        }
      });
    });
  }
  
  /**
   * Execute a single action on the page
   * @param {string} command - The command to execute
   * @param {Object} parameters - Command parameters
   * @returns {Promise<Object>} - Result of the action
   */
  async executeAction(command, parameters) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'EXECUTE_ACTION',
        command: command,
        parameters: parameters
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response.error || `Failed to execute ${command}`));
        }
      });
    });
  }
  
  /**
   * Send data directly to the backend
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The data to send
   * @returns {Promise<Object>} - The response from the backend
   */
  async sendToBackend(endpoint, data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        target: 'backend',
        endpoint: endpoint,
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }
  
  /**
   * Get the current active task status
   * @returns {Object|null} - The active task or null if no task is active
   */
  getActiveTask() {
    return this.activeTask;
  }
  
  /**
   * Cancel the current active task
   * @returns {Promise<boolean>} - Whether the task was successfully canceled
   */
  async cancelTask() {
    if (!this.activeTask || this.activeTask.status !== 'pending') {
      return false;
    }
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'CANCEL_AUTOMATION'
      }, (response) => {
        if (response && response.success) {
          this.activeTask.status = 'canceled';
          this.activeTask.endTime = Date.now();
          
          // Reject any pending promises
          const callback = this.taskCallbacks.get(this.activeTask.id);
          if (callback) {
            callback.reject(new Error('Task canceled by user'));
            this.taskCallbacks.delete(this.activeTask.id);
          }
          
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
}

// Export a singleton instance
export default new WebAutomationService(); 