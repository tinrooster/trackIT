import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
//  root: 'refactored_trackit',
  plugins: [
    react(),
    TanStackRouterVite(),
  ],
  server: {
    host: true, // Listen on all local IPs
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['react-dom/client']
  }
}) 