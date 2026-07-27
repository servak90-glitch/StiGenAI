
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env files from root directory
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || "AIzaSyBpzTvqq2Jr-hFGTPKcEw-gn3n2CkDoTzs"

  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer', 'os'],
        globals: {
          Buffer: true,
        },
      }),
    ],
    define: {
      // Defines 'process.env.API_KEY' as a string literal during build.
      // This replaces usage in code with the actual string value.
      'process.env.API_KEY': JSON.stringify(apiKey),
      
      // Also polyfill 'process.env' object to prevent "process is not defined" errors
      // in libraries that might access it loosely.
      'process.env': {
        NODE_ENV: JSON.stringify(mode || 'production')
      }
    }
  }
})
