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
process.env.NODE_ENV === "development";
const createWindow = () => {
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL || "http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.executeJavaScript('console.log("electronAPI available:", !!window.electronAPI)');
  });
  console.log("MAIN __dirname:", __dirname);
  console.log("Preload path:", path.join(__dirname, "../preload/preload.js"));
  const fs = require("fs");
  console.log("Preload exists:", fs.existsSync(path.join(__dirname, "../preload/preload.js")));
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
