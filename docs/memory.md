# Project Memory Log

## Implementation Decisions
- **Separated refactored codebase** into `refactored_trackit` to avoid mixing with legacy code.
- **Chose TanStack Router v1+** for type-safe, file-based routing.
- **Selected MySQL** as the company-wide database for multi-user, centralized access.
- **Adopted Vite** for fast frontend development and builds.
- **Using Tauri** for secure, native desktop backend.
- **Implemented file-based routing structure** with `__root.tsx`, `index.tsx`, and feature-based route files.

## Edge Cases Handled
- Ensured no legacy code is mixed with the new refactor.
- Addressed TanStack Router linter errors by aligning file structure and route definitions.
- Fixed TypeScript linter errors for unnecessary conditionals and optional chaining.
- Resolved duplicate root route issues by properly structuring route files.
- Fixed JSX syntax errors in route component definitions.

## Problems Solved
- Resolved TanStack Router file-based routing issues by confirming version and updating route definitions.
- Cleaned up placeholder files to allow Vite project initialization.
- Clarified database choice and architecture for company-wide, multi-user access.
- Fixed TanStack Router's root route requirement by implementing proper `__root.tsx` file.
- Resolved route tree generation issues by following file-based routing conventions.
- Successfully implemented and tested basic routing with index and inventory routes.

## Approaches Rejected (and Why)
- **SQLite for company-wide DB:** Rejected due to lack of multi-user, networked support.
- **React Router:** Chose TanStack Router for better type safety and file-based routing.
- **Direct DB access from frontend:** Rejected for security and scalability reasons; all data access goes through backend APIs.
- **Single route tree file:** Rejected in favor of file-based routing for better code organization and maintainability.
- **Manual route configuration:** Opted for TanStack's file-based routing generator for better type safety and maintainability.

---

_This log will be updated as new decisions, edge cases, and solutions arise._ 