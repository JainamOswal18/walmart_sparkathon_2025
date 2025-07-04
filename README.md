# Smart Grocery Assistant Chrome Extension (MVP)

## Overview

**Smart Grocery Assistant** is a Chrome extension that enables users to control online grocery shopping websites (like Walmart and Instacart) using voice commands. This MVP demonstrates the core workflow: voice input, AI service interaction (placeholder), and basic DOM manipulation on supported grocery sites.

---

## Features

- **Automatic Activation:**
  - Content script is injected automatically on Walmart and Instacart domains.
- **Voice Input:**
  - Modern popup with a button to start/stop listening for voice commands.
  - Uses the user's microphone to record audio.
- **AI Service Integration (Placeholder):**
  - Sends recorded audio to a placeholder AI service endpoint.
  - Expects a JSON response with a `command`, `parameters`, and an `audio_response_url`.
- **Website DOM Interaction:**
  - Executes basic actions (e.g., search, add to cart) using placeholder selectors.
- **Voice Output:**
  - Plays back the assistant's audio reply from a provided URL.
- **Futuristic UI/UX:**
  - Popup features a dark glassmorphism card, neon purple and blue accents, soft glow effects, and smooth state animations for a high-tech, professional look.

---

## Modern Popup UI/UX Design

- **Color Palette:**
  - Dark gradient background (`#0D0D19` to `#121223`)
  - Neon purple (`#7E3CFB`) and soft blue (`#5C73E6`) accents
  - Light gray/white text (`#E0E0E0`)
  - Glassmorphism card with blur and transparency
- **Design Features:**
  - Neon glow and animated button for voice input
  - Animated status text for listening, processing, and error states
  - Minimalist, readable layout with generous spacing
  - Subtle transitions and hover effects for all interactive elements
- **Implementation:**
  - All popup UI styles are in `extension/popup.css`.
  - State changes (listening, processing, error, idle) are reflected visually via CSS classes managed in `extension/popup.js`.

---

## File Structure

```
extension/
  ├── manifest.json         # Chrome extension manifest (Manifest V3)
  ├── popup.html            # Popup UI (modern, glassmorphism design)
  ├── popup.js              # Handles popup logic, state, and messaging
  ├── popup.css             # All popup UI/UX styles (futuristic, animated)
  ├── background.js         # Handles API calls to the AI service
  ├── content.js            # Injected into grocery sites, handles voice, AI, and DOM actions
  ├── icon16.png            # Extension icon (16x16)
  ├── icon48.png            # Extension icon (48x48)
  ├── icon128.png           # Extension icon (128x128)
README.md                   # This documentation
```

---

## Setup & Installation

1. **Clone or Download the Repository**
   - Place all files in a single directory, preserving the `extension/` folder structure.

2. **(Optional) Add/Replace Icons**
   - For best results, use your own `icon16.png`, `icon48.png`, and `icon128.png` in the `extension/` directory. These are referenced in `manifest.json`.

3. **Load the Extension in Chrome**
   1. Open Chrome and go to `chrome://extensions/`.
   2. Enable **Developer mode** (toggle in the top right).
   3. Click **Load unpacked** and select the `extension/` directory.
   4. The "Smart Grocery Assistant" extension should now appear in your extensions list.

4. **Usage**
   - Navigate to [walmart.com](https://www.walmart.com) or [instacart.com](https://www.instacart.com).
   - Click the extension icon and use the popup to start/stop voice listening.
   - The extension will record your voice, send it to the placeholder AI service, and attempt to perform actions on the page based on the AI's response.
   - The popup UI will visually indicate listening, processing, and error states with animated effects.

---

## Notes & Customization

- **AI Service Endpoint:**
  - The extension uses a placeholder endpoint (`https://your-ai-service.com/process_audio`). Replace this with your actual AI service URL in `background.js`.
- **DOM Selectors:**
  - The content script uses placeholder selectors (e.g., `#search-input`, `.add-to-cart-button`). Update these to match the actual structure of your target grocery sites for full functionality.
- **Permissions:**
  - The extension requests microphone access and host permissions for Walmart and Instacart domains.
- **No Real AI Logic:**
  - This MVP only demonstrates the communication flow. The AI service must be implemented separately.
- **No Advanced Error Handling:**
  - The code is intentionally simple for MVP purposes.
- **UI/UX Customization:**
  - All popup UI styles are in `popup.css`. You can further customize colors, animations, and layout there.

---

## Further Improvements
- Add more robust UI/UX for voice interaction.
- Support more grocery sites and commands.
- Implement real AI service and authentication.
- Improve DOM selector logic for reliability.

---

## License
MIT
