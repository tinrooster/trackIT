import { contextBridge, ipcRenderer } from 'electron'
import Store from 'electron-store'

// Expose Electron Store to the renderer
const store = new Store()

contextBridge.exposeInMainWorld('electronStore', {
  getData: (key: string) => store.get(key),
  setData: (key: string, value: any) => store.set(key, value),
  deleteData: (key: string) => store.delete(key),
})

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel: string, data: any) => {
      // whitelist channels
      const validChannels = ['toMain']
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data)
      }
    },
    receive: (channel: string, func: Function) => {
      const validChannels = ['fromMain']
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
    }
  }
) 