// Type declaration for the window interface
declare global {
  interface Window {
    electron: {
      sendMessage: (channel: string, data: any) => void;
      onMessage: (callback: (data: any) => void) => void;
    };
  }
}

// Send message to the main process
export const sendToMain = (data: any) => {
  window.electron.sendMessage('toMain', data);
};

// Listen for messages from the main process
export const listenToMain = (callback: (data: any) => void) => {
  window.electron.onMessage(callback);
}; 