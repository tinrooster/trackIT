"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const Store = require("electron-store");
const { initialize, enable } = require("@electron/remote/main");
Store.initRenderer();
initialize();
const currentDir = __dirname;
const PRELOAD_PATH = path.join(currentDir, "preload.js");
console.log("Starting main process...");
console.log("Current directory:", process.cwd());
console.log("Current dir:", currentDir);
console.log("Preload path:", PRELOAD_PATH);
console.log("Preload exists:", fs.existsSync(PRELOAD_PATH));
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
let mainWindow = null;
const storeConfig = {
  clearInvalidConfig: true,
  accessPropertiesByDotNotation: true,
  cwd: app.getPath("userData")
};
const dataStore = new Store({
  ...storeConfig,
  name: "trackIT-data",
  defaults: {
    "inventoryItems": [],
    "inventory-categories": [],
    "inventory-units": [],
    "inventory-locations": [],
    "inventory-suppliers": [],
    "inventory-projects": [],
    "inventory-templates": [],
    "inventory-general-settings": {},
    "inventory-history": [],
    "users": []
  }
});
new Store({
  ...storeConfig,
  name: "trackIT-settings",
  defaults: {
    defaultSettings: {},
    cabinets: []
  }
});
new Store({
  ...storeConfig,
  name: "trackIT-logs",
  defaults: {
    systemLogs: []
  }
});
function createWindow() {
  console.log("Creating window...");
  console.log("Using preload script at:", PRELOAD_PATH);
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: PRELOAD_PATH,
      webSecurity: false
      // Temporarily disable for development
    }
  });
  enable(mainWindow.webContents);
  console.log("Loading dev server URL:", VITE_DEV_SERVER_URL);
  mainWindow.loadURL(VITE_DEV_SERVER_URL);
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Window loaded");
    mainWindow == null ? void 0 : mainWindow.webContents.executeJavaScript(`
      console.log('Window APIs:', {
        electronStore: !!window.electronStore,
        electronAPI: !!window.electronAPI,
        fileSystem: !!window.fileSystem,
        api: !!window.api,
        store: !!window.store
      });
      console.log('Window object keys:', Object.keys(window));
    `);
  });
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
    setTimeout(() => {
      console.log("Retrying to load dev server...");
      mainWindow == null ? void 0 : mainWindow.loadURL(VITE_DEV_SERVER_URL);
    }, 1e3);
  });
  ipcMain.handle("save-logs", async (event, { filename, content }) => {
    try {
      const logsDir = path.join(app.getPath("userData"), "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const filePath = path.join(logsDir, filename);
      fs.writeFileSync(filePath, content);
      return { success: true, filePath };
    } catch (error) {
      console.error("Error saving logs:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
}
app.whenReady().then(() => {
  console.log("App ready, creating window...");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  ipcMain.handle("electron-store-get", (_event, key) => {
    return dataStore.get(key);
  });
  ipcMain.handle("electron-store-set", (_event, [key, value]) => {
    dataStore.set(key, value);
    return true;
  });
  ipcMain.handle("electron-store-delete", (_event, key) => {
    dataStore.delete(key);
    return true;
  });
  ipcMain.handle("electron-store-clear", () => {
    dataStore.clear();
    return true;
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
