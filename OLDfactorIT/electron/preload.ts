import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script starting...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    sendMessage: (channel: string, data: any) => {
      // whitelist channels
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    onMessage: (callback: (data: any) => void) => {
      ipcRenderer.on('fromMain', (event, data) => callback(data));
    }
  }
);

// Expose file system functionality
contextBridge.exposeInMainWorld(
  'fileSystem',
  {
    saveLogs: async (filename: string, content: string) => {
      try {
        const result = await ipcRenderer.invoke('save-logs', { filename, content });
        return result;
      } catch (error) {
        console.error('Error in saveLogs:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }
  }
);

// Expose protected methods that allow the renderer process to use
// specific electron APIs without exposing the entire API surface
try {
  console.log('Setting up electronAPI bridge...');
  
  contextBridge.exposeInMainWorld(
    'electronAPI',
    {
      saveLogs: async (filename: string, content: string) => {
        console.log('saveLogs called with filename:', filename);
        try {
          const result = await ipcRenderer.invoke('save-logs', { filename, content });
          console.log('saveLogs result:', result);
          return result;
        } catch (error) {
          console.error('Error in saveLogs:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    }
  );
  
  console.log('electronAPI bridge setup complete');
} catch (error) {
  console.error('Failed to set up electronAPI bridge:', error);
} 