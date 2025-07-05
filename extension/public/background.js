// background.js - Service worker for the Smart Grocery Assistant extension

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
  }
}); 