# Logging System Implementation Guide

## Overview

This project uses a **centralized, extensible logging system** for all application logging, troubleshooting, and audit needs. The system is designed for both development and production, supporting multiple log levels, log types, and a modern, interactive UI for viewing and filtering logs.

---

## 1. Logger API

### Location
- **Source:** `src/lib/logging.ts`

### Main Export
- `logger`: Singleton instance of the `Logger` class.

### Log Entry Type

```ts
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;   // 'debug' | 'info' | 'warn' | 'error'
  type: LogType;     // 'system' | 'audit' | 'performance' | 'security'
  message: string;
  details?: any;
  component?: string;
}
```

### Log Levels
- `debug`, `info`, `warn`, `error`

### Log Types
- `system`, `audit`, `performance`, `security`

---

## 2. Usage

### Logging an Event

```ts
import { logger } from '@/lib/logging';

// Info log (e.g., for audit trail)
logger.info('audit', 'User checked out item', { itemId, userId }, 'CheckoutPage');

// Error log
logger.error('system', 'Failed to save item', { error }, 'InventoryForm');

// Debug log
logger.debug('performance', 'Render time', { ms: 123 }, 'InventoryTable');
```

- **type:** Use `'audit'` for user actions, `'system'` for system events, etc.
- **message:** Short, human-readable description.
- **details:** Any structured data (object, string, etc.).
- **component:** (Optional) Name of the React component or module.

---

## 3. Log Storage & Settings

- Logs are stored in-memory (per session) in the `Logger` singleton.
- Log settings (enabled, console output, toast notifications, etc.) are persisted in `localStorage` under the key `logSettings`.
- Maximum number of logs is configurable (default: 1000).

---

## 4. Log Viewing UI

### Component
- **Location:** `src/components/settings/SystemLogs.tsx`
- **Usage:** `<SystemLogs />`

#### Features
- Search/filter logs by keyword, level, and type.
- Color-coded badges for log level/type.
- Scrollable, modern UI.
- Optionally, clear logs from the UI.

#### Do **not** pass logs as a prop; the component fetches logs from the logger singleton.

---

## 5. Removing Legacy Logging

- All legacy logging functions (`logAction`, `addLogEntry`, `getLogs`, `getRecentLogs`, `clearLogs`) have been removed.
- All log calls must use the new `logger` API.
- All log viewers must use the new `SystemLogs` component.

---

## 6. Extending the Logger

- To add new log types or levels, update the `LogLevel` and `LogType` unions in `src/lib/logging.ts`.
- To persist logs across sessions, implement storage in the `Logger` class.
- To add new UI features (e.g., export, advanced filtering), extend `SystemLogs.tsx`.

---

## 7. Example Migration

**Old:**
```ts
await logAction({
  action: 'ITEM_CHECKOUT',
  details: { itemId, userId },
  status: 'success'
});
```

**New:**
```ts
logger.info('audit', 'ITEM_CHECKOUT', { itemId, userId }, 'CheckoutPage');
```

---

## 8. Best Practices

- Use the correct log level and type for each event.
- Include as much context as possible in `details`.
- Use the `component` field for easier debugging.
- Regularly review logs in the System Logs UI during development and troubleshooting.

---

**End of Logging System Documentation**
*(Not yet added to project documentation files. Ready for future reference or inclusion.)* 