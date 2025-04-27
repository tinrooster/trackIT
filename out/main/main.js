"use strict";
const electron = require("electron");
const path = require("path");
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
  console.log("Dev server URL:", void 0);
  console.log("Vite name:", void 0);
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });
  {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  electron.ipcMain.on("toMain", (event, data) => {
    console.log("Received in main:", data);
    if (mainWindow) {
      mainWindow.webContents.send("fromMain", {
        response: `Processed: ${data}`
      });
    }
  });
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Window loaded, checking preload...");
    mainWindow?.webContents.executeJavaScript('console.log("electronAPI available:", !!window.electronAPI)');
  });
  electron.ipcMain.handle("save-logs", async (_event, { filename, content }) => {
    try {
      const logsDir = path.join(electron.app.getAppPath(), "logs");
      await fsPromises__namespace.mkdir(logsDir, { recursive: true });
      const filePath = path.join(logsDir, filename);
      await fsPromises__namespace.writeFile(filePath, content, "utf-8");
      return { success: true, path: filePath };
    } catch (error) {
      console.error("Error saving logs:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  });
};
electron.app.whenReady().then(() => {
  console.log("Setting up IPC handlers...");
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
