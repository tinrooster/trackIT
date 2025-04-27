"use strict";
const electron = require("electron");
console.log("Preload script starting...");
electron.contextBridge.exposeInMainWorld(
  "electron",
  {
    sendMessage: (channel, data) => {
      const validChannels = ["toMain"];
      if (validChannels.includes(channel)) {
        electron.ipcRenderer.send(channel, data);
      }
    },
    onMessage: (callback) => {
      electron.ipcRenderer.on("fromMain", (event, data) => callback(data));
    }
  }
);
try {
  console.log("Setting up electronAPI bridge...");
  electron.contextBridge.exposeInMainWorld(
    "electronAPI",
    {
      saveLogs: async (filename, content) => {
        console.log("saveLogs called with filename:", filename);
        try {
          const result = await electron.ipcRenderer.invoke("save-logs", { filename, content });
          console.log("saveLogs result:", result);
          return result;
        } catch (error) {
          console.error("Error in saveLogs:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
          };
        }
      }
    }
  );
  console.log("electronAPI bridge setup complete");
} catch (error) {
  console.error("Failed to set up electronAPI bridge:", error);
}
