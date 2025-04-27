// import Store from 'electron-store';
import { toast } from "sonner";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogType = 'system' | 'audit' | 'performance' | 'security';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  type: LogType;
  message: string;
  details?: any;
  component?: string;
}

interface LogSettings {
  enabled: boolean;
  consoleOutput: boolean;
  toastNotifications: boolean;
  logLevels: Record<LogLevel, boolean>;
  logTypes: Record<LogType, boolean>;
  maxEntries: number;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private settings: LogSettings = {
    enabled: true,
    consoleOutput: true,
    toastNotifications: false,
    logLevels: {
      debug: true,
      info: true,
      warn: true,
      error: true
    },
    logTypes: {
      system: true,
      audit: true,
      performance: true,
      security: true
    },
    maxEntries: 1000
  };

  private constructor() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('logSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public getSettings(): LogSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<LogSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('logSettings', JSON.stringify(this.settings));
  }

  public log(
    level: LogLevel,
    type: LogType,
    message: string,
    details?: any,
    component?: string
  ): void {
    if (!this.settings.enabled) return;
    if (!this.settings.logLevels[level]) return;
    if (!this.settings.logTypes[type]) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      type,
      message,
      details,
      component
    };

    this.logs.push(entry);

    // Maintain max entries
    if (this.logs.length > this.settings.maxEntries) {
      this.logs = this.logs.slice(-this.settings.maxEntries);
    }

    // Console output
    if (this.settings.consoleOutput) {
      const logMethod = level === 'error' ? 'error' : 
                       level === 'warn' ? 'warn' : 
                       level === 'info' ? 'info' : 'log';
      
      console[logMethod](`[${type.toUpperCase()}] ${message}`, details || '');
    }

    // Toast notifications for errors and warnings
    if (this.settings.toastNotifications && (level === 'error' || level === 'warn')) {
      const toastMessage = level === 'error' ? toast.error : toast.warning;
      toastMessage(message, {
        description: details ? JSON.stringify(details) : undefined
      });
    }
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  // Convenience methods
  public debug(type: LogType, message: string, details?: any, component?: string): void {
    this.log('debug', type, message, details, component);
  }

  public info(type: LogType, message: string, details?: any, component?: string): void {
    this.log('info', type, message, details, component);
  }

  public warn(type: LogType, message: string, details?: any, component?: string): void {
    this.log('warn', type, message, details, component);
  }

  public error(type: LogType, message: string, details?: any, component?: string): void {
    this.log('error', type, message, details, component);
  }
}

export const logger = Logger.getInstance();

const MAX_LOGS = 1000;
const RECENT_LOGS_LIMIT = 50;

// Initialize electron-store for logs
// const store = new Store({
//   name: 'trackIT-logs',
//   defaults: {
//     systemLogs: []
//   }
// });

const STORAGE_KEY = 'systemLogs';

// Fallback: use in-memory logs only
let fallbackLogs: LogEntry[] = [];

function getStoredLogs(): LogEntry[] {
  // try {
  //   const logs = store.get(STORAGE_KEY) as LogEntry[];
  //   return logs || [];
  // } catch (error) {
  //   console.error('Failed to read logs from storage:', error);
  //   return [];
  // }
  return fallbackLogs;
}

function storeLogs(logs: LogEntry[]) {
  // try {
  //   const trimmedLogs = logs.slice(-MAX_LOGS);
  //   store.set(STORAGE_KEY, trimmedLogs);
  // } catch (error) {
  //   console.error('Failed to store logs:', error);
  // }
  fallbackLogs = logs.slice(-MAX_LOGS);
}

export function logAction(action: string, details?: Record<string, any>, status: 'success' | 'error' = 'success') {
  const entry: LogEntry = {
    timestamp: new Date(),
    level: 'info', // Default to info, or make this a parameter if needed
    type: 'audit', // Default to audit, or make this a parameter if needed
    message: action,
    details: { ...(details || {}), status },
    // component: can be added if needed
  };
  addLogEntry(entry);
}

export function addLogEntry(entry: LogEntry) {
  const logs = getStoredLogs();
  logs.push(entry);
  storeLogs(logs);
}

export function getLogs(): LogEntry[] {
  return getStoredLogs();
}

export function getRecentLogs(limit: number = RECENT_LOGS_LIMIT): LogEntry[] {
  const logs = getStoredLogs();
  return logs.slice(-limit);
}

export function clearLogs() {
  storeLogs([]);
} 