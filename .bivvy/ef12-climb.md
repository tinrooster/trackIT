---
id: ef12
type: feature
description: Fix and enhance the offline-to-SQL sync mechanism for settings, projects, and locations. Ensure all create, read, edit, and delete (CRUD) operations sync reliably between localStorage and the SQL database, with robust logging and tests. Implement a solid offline fallback and automatic re-sync when the connection is restored.
---
## Product Requirements Document

### Overview
Fix and enhance the offline-to-SQL sync mechanism for settings, projects, and locations. Ensure all CRUD operations sync reliably between localStorage and the SQL database, with robust logging and tests. Implement a solid offline fallback and automatic re-sync when the connection is restored.

### Functional Requirements
- Ensure all CRUD operations for settings, projects, and locations sync reliably to SQL.
- If offline, changes are stored in localStorage and retried until successful.
- Add comprehensive logging for all sync attempts, successes, and failures.
- Implement tests to verify correct behavior, including offline/online transitions.
- Provide clear user feedback if the app is offline or syncing.

### Technical Requirements
- MySQL server must be running and accessible.
- Prisma schema and .env must be correct.
- Identify and review the current offline/localStorage and sync logic.
- No new dependencies unless required for logging or testing.
- Must not break existing functionality.

### Acceptance Criteria
- All CRUD operations are reflected in SQL when online.
- Offline changes are synced automatically when connection is restored.
- Logs capture all sync events and errors.
- Tests pass for all major and edge-case scenarios.

### Relevant Files
- prisma/schema.prisma
- .env
- frontend/src/lib/operationQueue.ts
- frontend/src/components/settings/LocationSettings.tsx
- frontend/src/components/settings/ProjectSettings.tsx
- Any backend sync utilities
- Logging implementation (backend, Tauri, or Node.js)
- Test files for sync logic

### User Flow
1. User creates/edits/deletes a setting, project, or location.
2. If online, operation is performed on SQL and logged.
3. If offline, operation is stored locally and retried until successful.
4. When connection is restored, pending changes are synced and logged.
5. User receives feedback on sync status.

### Testing
- Unit and integration tests for all sync operations.
- Simulate offline/online transitions and verify correct sync and logging.
- Test error handling and user feedback. 