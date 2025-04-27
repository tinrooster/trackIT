export interface LogEntry {
  timestamp: string;
  action: string;
  details: Record<string, any>;
  status: 'success' | 'error';
} 