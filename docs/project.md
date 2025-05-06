# Project Technical Blueprint

## Core Architecture Decisions
- **Frontend:** React (with TypeScript), Vite, TanStack Router (file-based routing)
- **Backend:** Tauri (Rust) for desktop, REST API for server/cloud
- **State Management:** TanStack Query, React Context
- **Styling:** Tailwind CSS, Shadcn UI components
- **Routing:** File-based with TanStack Router v5
- **Data Fetching:** TanStack Query
- **Database:** MySQL (centralized, company-wide)

## Tech Stack Details
- **React 19** for UI
- **Vite 6** for fast builds and HMR
- **TanStack Router v5** for type-safe, file-based routing
  - File-based route structure:
    - `src/routes/__root.tsx` - Base layout and outlet
    - `src/routes/index.tsx` - Landing page
    - `src/routes/inventory.tsx` - Inventory management
    - Generated route tree via `routeTree.gen.ts`
- **TanStack Query** for server state
- **Tailwind CSS** for utility-first styling
- **Tauri** for secure, native desktop backend
- **MySQL** for persistent, multi-user data

## Project Structure
- **src/**
  - **routes/** - File-based routing components
  - **components/** - Reusable UI components
  - **lib/** - Utility functions and shared logic
  - **services/** - API and external service integrations
  - **hooks/** - Custom React hooks
  - **contexts/** - React context providers
  - **types/** - TypeScript type definitions

## API Patterns
- RESTful endpoints for CRUD operations on assets, users, projects, etc.
- Example endpoints:
  - `GET /api/assets`
  - `POST /api/assets`
  - `PUT /api/assets/:id`
  - `DELETE /api/assets/:id`
- Auth endpoints for login, roles, and permissions
- All API calls use HTTPS and JWT-based authentication

## Database Schema Overview
- **Asset**: id, name, type, serial, barcode, location_id, status, assigned_to, project_id, purchase_date, warranty, ...
- **User**: id, name, role, contact_info, ...
- **Location**: id, name, type (secure/general), parent_location, ...
- **Project**: id, name, description, start_date, end_date, status, ...
- **Transaction**: id, asset_id, user_id, action, date, notes, project_id, ...
- **Maintenance**: id, asset_id, date, description, cost, performed_by, ...
- **Consumable**: id, name, quantity, reorder_level, ...
- **Tag**: id, name, description, color, ...
- **AssetTag**: asset_id, tag_id, user_id, date_applied, ...

## Current Implementation Status
- ✅ Project structure and build setup
- ✅ TanStack Router integration with file-based routing
- ✅ Basic route implementation (root, index, inventory)
- ⏳ Component library integration
- ⏳ Authentication system
- ⏳ API integration
- ⏳ Database setup and migrations
- ⏳ Desktop app shell (Tauri)

---

## [YYYY-MM-DD] Note: Vite/React blank page and createRoot error fix
- Fixed blank page and createRoot export error by:
  - Correcting TanStack Router plugin import in vite.config.ts
  - Removing optimizeDeps exclude for react-dom/client
  - Ensuring React 18.2.0 is used everywhere
  - Restarting Vite on a new port if needed
- App now loads and runs as expected

_This document will be updated as the project evolves. See `