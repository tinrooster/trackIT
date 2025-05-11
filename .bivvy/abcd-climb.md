---
id: abcd
type: feature
description: Admin UI and backend for creating, editing, and reordering locations, projects, etc.
---
## Product Requirements Document

### Overview
Admins must be able to create, edit, and reorder locations, projects, and other entities via a secure UI.

### Functional Requirements
- List, create, edit, and reorder locations and projects.
- Backend API endpoints for CRUD and reorder.
- UI forms and drag-and-drop reordering.
- Admin-only access.

### Technical Requirements
- Use upsertEntity and reorderEntities utilities.
- Secure endpoints.
- React frontend with state management.

### Acceptance Criteria
- Admin can add/edit/reorder entities from the UI.
- Changes are reflected in the database.
- Only admins can access these features.