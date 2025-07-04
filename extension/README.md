# Smart Grocery Assistant - React Extension

A voice-controlled browser extension that serves as a smart assistant to streamline the online grocery shopping experience. This extension is built with React and Vite.

## Features

- Voice-activated control for online grocery shopping
- Modern UI with glassmorphism design
- Real-time status indicators
- Seamless integration with grocery websites

## Development

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

### Building the Extension

To build the extension for production:

```bash
npm run build
```

This will create a `dist` directory with the extension files.

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `dist` directory

## Project Structure

- `public/` - Static files (manifest.json, background.js, content.js)
- `src/` - React source code
  - `App.jsx` - Main React component
  - `App.css` - Styles for the extension
  - `main.jsx` - Entry point for React

## Technologies Used

- React - UI library
- Vite - Build tool
- Chrome Extension API - Browser integration
