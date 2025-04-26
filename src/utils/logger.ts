import { toast } from 'sonner';

declare global {
  interface Window {
    electronAPI: {
      saveLogs: (filename: string, content: string) => Promise<{ success: boolean; path?: string; error?: string; }>;
    }
  }
}

class Logger {
  private logs: string[] = [];
  private context: string = '';

  constructor() {
    // Log when the logger is initialized
    console.debug('Logger initialized');
    
    // Verify electronAPI is available
    if (typeof window !== 'undefined') {
      console.debug('Window is defined');
      console.debug('electronAPI available:', !!window.electronAPI);
      console.debug('saveLogs available:', !!(window.electronAPI?.saveLogs));
    }
  }

  setContext(context: string) {
    this.context = context;
    this.log(`Context set to: ${context}`);
  }

  log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${this.context ? `[${this.context}] ` : ''}${message}`;
    this.logs.push(logEntry);
  }

  error(message: string, error?: any) {
    const errorMessage = error ? `${message}: ${error.message || error}` : message;
    this.log(`ERROR: ${errorMessage}`);
    if (error?.stack) {
      this.log(`Stack trace: ${error.stack}`);
    }
  }

  async downloadLogs() {
    try {
      // Add some debug information
      console.debug('Starting downloadLogs');
      console.debug('Current logs count:', this.logs.length);
      console.debug('electronAPI status:', !!window.electronAPI);

      if (!window.electronAPI?.saveLogs) {
        throw new Error('electronAPI.saveLogs is not available. This likely means the preload script is not properly configured.');
      }

      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `${date}_${time}_${this.context || 'app'}.log`;
      const content = this.logs.join('\n');

      console.debug('Attempting to save logs...', { filename });
      const result = await window.electronAPI.saveLogs(filename, content);

      if (result.success) {
        console.debug('Logs saved successfully at:', result.path);
        toast.success(`Logs saved to logs/${filename}`);
      } else {
        console.error('Failed to save logs:', result.error);
        toast.error(`Failed to save logs: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error in downloadLogs:', error);
      toast.error(`Error saving logs: ${error.message}`);
      
      // Log additional debug information
      console.debug('Error details:', {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        electronAPI: !!window.electronAPI,
        saveLogs: !!(window.electronAPI?.saveLogs)
      });
    }
  }
}

// Create and export a single instance
export const logger = new Logger(); 