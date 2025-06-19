// Handles popup button and status

document.addEventListener("DOMContentLoaded", () => {
  const voiceBtn = document.getElementById("voice-btn");
  const statusSpan = document.getElementById("status");
  let listening = false;

  voiceBtn.addEventListener("click", async () => {
    // Toggle listening state
    listening = !listening;
    statusSpan.textContent = listening ? "Listening..." : "Idle";
    voiceBtn.textContent = listening
      ? "🛑 Stop Listening"
      : "🎤 Start Listening";

    // Send message to content script in active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: listening ? "START_LISTENING" : "STOP_LISTENING",
      });
    }
  });

  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.statusUpdate) {
      statusSpan.textContent = msg.statusUpdate;
    }
  });
});
