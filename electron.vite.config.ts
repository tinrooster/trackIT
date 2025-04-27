import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      lib: {
        entry: 'electron/main.ts'
      },
      rollupOptions: {
        external: ['electron-squirrel-startup']
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'MAIN_WINDOW_VITE_DEV_SERVER_URL': JSON.stringify(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL),
      'MAIN_WINDOW_VITE_NAME': JSON.stringify(process.env.MAIN_WINDOW_VITE_NAME)
    }
  },
  preload: {
    build: {
      outDir: 'out/preload',
      lib: {
        entry: 'electron/preload.ts'
      },
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          index: path.join(__dirname, 'index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [react()]
  }
}) 