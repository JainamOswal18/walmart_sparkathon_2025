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
    "process.env.VITE_LIVEKIT_URL": JSON.stringify(
      process.env.LIVEKIT_API_URL || "wss://demo.livekit.cloud"
    ),
    "process.env.VITE_LIVEKIT_API_URL": JSON.stringify(
      process.env.LIVEKIT_API_URL || "https://your-api-server.com"
    ),
  },
});
