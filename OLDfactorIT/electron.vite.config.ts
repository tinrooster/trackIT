import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: 'electron/main.ts'
      },
      rollupOptions: {
        external: ['electron-squirrel-startup']
      }
    }
  },
  preload: {
    build: {
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