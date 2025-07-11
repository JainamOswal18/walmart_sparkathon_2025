import { useState, useEffect, useCallback } from 'react';
import WebAutomationService from '../../services/WebAutomationService';
import './WebAutomation.css';

/**
 * WebAutomation component that provides UI for web automation tasks
 */
const WebAutomation = ({ onTaskComplete }) => {
  const [task, setTask] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  // Update active task status
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentTask = WebAutomationService.getActiveTask();
      if (currentTask) {
        setActiveTask(currentTask);
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  // Execute a web automation task
  const executeTask = useCallback(async () => {
    if (!task.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const taskResult = await WebAutomationService.executeTask(task);
      setResult(taskResult);
      
      if (onTaskComplete) {
        onTaskComplete(taskResult);
      }
    } catch (err) {
      console.error('Web automation error:', err);
      setError(err.message || 'Failed to execute task');
    } finally {
      setIsExecuting(false);
    }
  }, [task, isExecuting, onTaskComplete]);

  // Cancel the current task
  const cancelTask = useCallback(async () => {
    try {
      await WebAutomationService.cancelTask();
      setIsExecuting(false);
    } catch (err) {
      console.error('Error canceling task:', err);
    }
  }, []);

  // Observe the current page
  const observePage = useCallback(async () => {
    try {
      setIsExecuting(true);
      const pageData = await WebAutomationService.observePage();
      setResult({ pageData });
    } catch (err) {
      console.error('Error observing page:', err);
      setError(err.message || 'Failed to observe page');
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return (
    <div className="web-automation-container">
      <h3>Web Automation</h3>
      
      <div className="task-input">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task (e.g., search for organic milk)"
          disabled={isExecuting}
        />
        <button 
          onClick={executeTask} 
          disabled={isExecuting || !task.trim()}
        >
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
        
        {isExecuting && (
          <button 
            onClick={cancelTask}
            className="cancel-button"
          >
            Cancel
          </button>
        )}
        
        <button 
          onClick={observePage}
          disabled={isExecuting}
          className="observe-button"
        >
          Observe Page
        </button>
      </div>
      
      {activeTask && activeTask.status === 'pending' && (
        <div className="task-status">
          <p>Executing: {activeTask.description}</p>
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="result-container">
          <h4>Task Result</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default WebAutomation; 