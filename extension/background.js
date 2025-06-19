// background.js - Handles API calls to the AI service

const AI_SERVICE_ENDPOINT = "https://your-ai-service.com/process_audio"; // Placeholder

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROCESS_AUDIO") {
    // message.audioData: ArrayBuffer or Blob
    // Send audio data to AI service
    fetch(AI_SERVICE_ENDPOINT, {
      method: "POST",
      body: message.audioData,
      headers: {
        // Set appropriate headers if needed
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // data: { command, parameters, audio_response_url }
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.toString() });
      });
    // Indicate async response
    return true;
  }
});
