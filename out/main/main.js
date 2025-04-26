"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fsPromises__namespace = /* @__PURE__ */ _interopNamespaceDefault(fsPromises);
if (require("electron-squirrel-startup")) {
  electron.app.quit();
}
let mainWindow = null;
const createWindow = () => {
  console.log("Creating window with preload script...");
  const preloadPath = path.join(__dirname, "preload.js");
  console.log("Preload script path:", preloadPath);
  console.log("Preload script exists:", fs.existsSync(preloadPath));
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: false
      // Disable sandbox to ensure preload script works
    }
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Window loaded, checking preload...");
    mainWindow?.webContents.executeJavaScript('console.log("electronAPI available:", !!window.electronAPI)');
  });
};
electron.app.on("ready", () => {
  console.log("Setting up IPC handlers...");
  electron.ipcMain.handle("save-logs", async (_event, { filename, content }) => {
    console.log("Received save-logs request:", { filename });
    try {
      const logsDir = path.join(electron.app.getAppPath(), "logs");
      console.log("Creating logs directory:", logsDir);
      await fsPromises__namespace.mkdir(logsDir, { recursive: true });
      const filePath = path.join(logsDir, filename);
      console.log("Saving logs to:", filePath);
      await fsPromises__namespace.writeFile(filePath, content, "utf-8");
      console.log("Logs saved successfully");
      return { success: true, path: filePath };
    } catch (error) {
      console.error("Error saving logs:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  });
  createWindow();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
