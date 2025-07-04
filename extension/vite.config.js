import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "index.html",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  define: {
    // LiveKit server URL - WebSocket URL for LiveKit connection
    "process.env.LIVEKIT_URL": JSON.stringify("wss://demo.livekit.cloud"),

    // Room name for the grocery assistant
    "process.env.LIVEKIT_ROOM_NAME": JSON.stringify("grocery-assistant"),
  },
});
