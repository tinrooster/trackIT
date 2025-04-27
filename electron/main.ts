import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import * as fsPromises from 'fs/promises';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  console.log('Creating window with preload script...');
  console.log('Dev server URL:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
  console.log('Vite name:', MAIN_WINDOW_VITE_NAME);
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    }
  });

  // In development, load from localhost
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the index.html file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up IPC handlers
  ipcMain.on('toMain', (event, data) => {
    // Handle messages from renderer
    console.log('Received in main:', data);
    
    // Example of sending a response back
    if (mainWindow) {
      mainWindow.webContents.send('fromMain', { 
        response: `Processed: ${data}` 
      });
    }
  });

  // Log when the window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded, checking preload...');
    mainWindow?.webContents.executeJavaScript('console.log("electronAPI available:", !!window.electronAPI)');
  });

  // Handle file system operations
  ipcMain.handle('save-logs', async (_event, { filename, content }) => {
    try {
      const logsDir = path.join(app.getAppPath(), 'logs');
      await fsPromises.mkdir(logsDir, { recursive: true });
      const filePath = path.join(logsDir, filename);
      await fsPromises.writeFile(filePath, content, 'utf-8');
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Error saving logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log('Setting up IPC handlers...');
  createWindow();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 