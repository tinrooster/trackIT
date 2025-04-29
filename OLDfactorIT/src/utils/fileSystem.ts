import { app } from '@electron/remote';
import * as path from 'path';
import * as fs from 'fs';

export function saveFile(filename: string, content: string): { success: boolean; error?: string } {
  try {
    // Get the app's root directory
    const appRoot = app.getAppPath();
    const logsDir = path.join(appRoot, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logPath = path.join(logsDir, filename);
    fs.writeFileSync(logPath, content, 'utf8');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save file:', error);
    return { success: false, error: error.message };
  }
} 