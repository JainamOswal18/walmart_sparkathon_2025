// Handles popup button and status with modern UI state classes

document.addEventListener("DOMContentLoaded", () => {
  const voiceBtn = document.getElementById("voice-btn");
  const statusSpan = document.getElementById("status");
  let listening = false;

  function setState(state) {
    // Remove all state classes
    voiceBtn.classList.remove("listening");
    statusSpan.classList.remove("listening", "processing", "error");
    // Add relevant state classes and update text
    if (state === "listening") {
      voiceBtn.classList.add("listening");
      statusSpan.classList.add("listening");
      statusSpan.textContent = "Listening...";
      voiceBtn.textContent = "🛑 Stop Listening";
    } else if (state === "processing") {
      statusSpan.classList.add("processing");
      statusSpan.textContent = "Processing...";
      voiceBtn.textContent = "🎤 Start Listening";
    } else if (state === "error") {
      statusSpan.classList.add("error");
      statusSpan.textContent = "Mic access denied";
      voiceBtn.textContent = "🎤 Start Listening";
    } else {
      // Idle/default
      statusSpan.textContent = "Idle";
      voiceBtn.textContent = "🎤 Start Listening";
    }
  }

  voiceBtn.addEventListener("click", async () => {
    // Toggle listening state
    listening = !listening;
    setState(listening ? "listening" : "idle");
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
      if (msg.statusUpdate === "Listening...") setState("listening");
      else if (msg.statusUpdate === "Processing...") setState("processing");
      else if (msg.statusUpdate === "Mic access denied") setState("error");
      else setState("idle");
    }
  });

  // Set initial state
  setState("idle");
});
