// content.js - Injected into grocery sites, handles voice, AI, and DOM actions

let mediaRecorder = null;
let audioChunks = [];
let isListening = false;

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "START_LISTENING") {
    startListening();
  } else if (msg.action === "STOP_LISTENING") {
    stopListening();
  }
});

// Start recording audio from the user's microphone
async function startListening() {
  if (isListening) return;
  isListening = true;
  chrome.runtime.sendMessage({ statusUpdate: "Listening..." });
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.onstop = handleAudioStop;
    mediaRecorder.start();
  } catch (err) {
    chrome.runtime.sendMessage({ statusUpdate: "Mic access denied" });
    isListening = false;
  }
}

// Stop recording and process the audio
function stopListening() {
  if (!isListening || !mediaRecorder) return;
  isListening = false;
  mediaRecorder.stop();
  chrome.runtime.sendMessage({ statusUpdate: "Processing..." });
}

// Handle the audio after recording stops
function handleAudioStop() {
  const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  // Send audio to background for AI processing
  chrome.runtime.sendMessage(
    {
      type: "PROCESS_AUDIO",
      audioData: audioBlob,
    },
    (response) => {
      if (response && response.success && response.data) {
        handleAIResponse(response.data);
      } else {
        chrome.runtime.sendMessage({ statusUpdate: "AI service error" });
      }
    }
  );
}

// Handle the AI service response
function handleAIResponse(data) {
  const { command, parameters, audio_response_url } = data;
  // Perform DOM actions based on command
  if (command === "search_product") {
    // Example: Fill search bar and trigger search
    // TODO: Replace '#search-input' and search trigger with actual selectors
    const searchInput = document.querySelector("#search-input");
    if (searchInput && parameters && parameters.item) {
      searchInput.value = parameters.item;
      // Optionally trigger search button
      const searchBtn = document.querySelector("#search-btn"); // Placeholder
      if (searchBtn) searchBtn.click();
    }
  } else if (command === "add_to_cart") {
    // Example: Find product and click 'Add to Cart'
    // TODO: Replace '.add-to-cart-button' and item matching with actual selectors
    const buttons = document.querySelectorAll(".add-to-cart-button");
    // Optionally, match by item name if provided
    if (parameters && parameters.item) {
      for (const btn of buttons) {
        // Placeholder: check if button is near the item name
        if (
          btn
            .closest(".product")
            ?.textContent?.toLowerCase()
            .includes(parameters.item.toLowerCase())
        ) {
          btn.click();
          break;
        }
      }
    } else if (buttons.length > 0) {
      buttons[0].click();
    }
  }
  // Play the assistant's audio reply
  if (audio_response_url) {
    playAudioResponse(audio_response_url);
  }
  chrome.runtime.sendMessage({ statusUpdate: "Idle" });
}

// Play audio from a URL
function playAudioResponse(url) {
  const audio = new Audio(url);
  audio.play();
}
