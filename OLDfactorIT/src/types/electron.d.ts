interface ElectronAPI {
  sendMessage: (channel: string, data: any) => void;
  onMessage: (callback: (data: any) => void) => void;
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {}; 