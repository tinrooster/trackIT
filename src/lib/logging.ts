import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  action: string;
  details: Record<string, any>;
  status: 'success' | 'error';
}

const STORAGE_KEY = 'system_logs';
const MAX_LOGS = 1000;

function getStoredLogs(): LogEntry[] {
  try {
    const storedLogs = localStorage.getItem(STORAGE_KEY);
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (error) {
    console.error('Failed to read logs from storage:', error);
    return [];
  }
}

function storeLogs(logs: LogEntry[]) {
  try {
    // Keep only the most recent logs up to MAX_LOGS
    const trimmedLogs = logs.slice(-MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Failed to store logs:', error);
  }
}

export async function logAction({ 
  action, 
  details, 
  status 
}: Omit<LogEntry, 'timestamp'>): Promise<void> {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    status,
  };

  const currentLogs = getStoredLogs();
  const updatedLogs = [...currentLogs, logEntry];
  storeLogs(updatedLogs);

  // Also log to console for debugging
  console.log(`[${status.toUpperCase()}] ${action}:`, details);
}

export async function getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
  const logs = getStoredLogs();
  return logs.slice(-limit).reverse(); // Return most recent logs first
}

export async function clearLogs(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
} 