import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: 'index.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  // Make environment variables available in your app
  define: {
    'process.env.VITE_LIVEKIT_URL': JSON.stringify(
      process.env.VITE_LIVEKIT_URL
    ),
    'process.env.VITE_BACKEND_API_URL': JSON.stringify(
      process.env.VITE_BACKEND_API_URL
    ),
    'process.env.VITE_LIVEKIT_API_KEY': JSON.stringify(
      process.env.VITE_LIVEKIT_API_KEY
    ),
    'process.env.VITE_LIVEKIT_API_SECRET': JSON.stringify(
      process.env.VITE_LIVEKIT_API_SECRET
    ),
  },
})
