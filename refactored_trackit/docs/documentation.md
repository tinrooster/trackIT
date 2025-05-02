# TrackIT Inventory App Documentation

## Overview
TrackIT is an inventory management system for TV Engineering and IT departments, supporting asset tracking, project management, secure storage, and reporting. The app is designed for desktop (Tauri), PWA/mobile, and in-house/cloud deployment.

## Key Features
- Asset tracking with unique IDs/barcodes
- Check-in/check-out with user and project association
- Location management (secure storage vs. general inventory)
- User management and role-based access
- Maintenance logs and scheduling
- Consumables tracking and reorder alerts
- Audit trail for all actions
- Advanced search, filter, and reporting
- Project tracking and asset assignment
- User asset tagging and updates
- Barcode/QR code scanning (PWA/mobile)
- Bulk import/export
- Notifications and alerts
- API access for integration

## Entity/Data Model
- Asset
- User
- Location
- Project
- Transaction
- Maintenance
- Consumable
- Tag
- AssetTag

*(Detailed schema to be added)*

## Security & Access Control
- Role-based access (admin, engineer, IT staff, etc.)
- Restricted actions for secure storage
- Audit logging of all changes
- Authentication and authorization
- Data encryption and secure connections (HTTPS)

*(Implementation details to be added)*

## Reporting
- Project-based asset and usage reports
- Inventory and location reports
- User activity and asset tagging reports
- Custom and scheduled reports

*(Report templates and examples to be added)*

## Project Structure
```
trackIT/
  src/
    app/                # App-specific logic (features)
    components/         # Reusable UI components
    contexts/          # React contexts for state management
    hooks/             # Custom React hooks
    lib/               # Utility libraries
    routes/            # Route components and configurations
      __root.tsx       # Root layout and configuration
      index.tsx        # Home page route
      assets.tsx       # Asset management routes
      inventory.tsx    # Inventory management routes
    types/             # TypeScript types/interfaces
    utils/             # Utility functions
    router.ts         # Centralized router configuration
    main.tsx          # Application entry point
  public/             # Static assets
  tauri/              # Tauri backend (Rust)
    src/
      main.rs         # Tauri main process
    tauri.conf.json   # Tauri config
  docs/               # Documentation
  README.md
  package.json
```

## Routing Structure
The application uses TanStack Router for type-safe routing with the following structure:
- `/` - Home page with navigation to main features
- `/inventory` - Inventory management interface
- `/assets` - Asset tracking and management
- `/api/assets` - API endpoints for asset operations

## Setup & Deployment
*(Instructions for local, in-house, and cloud deployment to be added)*

## Changelog
1. Initial documentation framework created.
2. Initial commit of OLDfactorIT directory and all project files. Remote repository set to [https://github.com/tinrooster/trackIT](https://github.com/tinrooster/trackIT) and code pushed to main branch. (by ach@tinrooster.com)
3. OLDfactorIT folder removed from repository and added to .gitignore to prevent tracking. (by ach@tinrooster.com, 2024-06-09)
4. Removed the import of './routeTree.gen' and updated router initialization in refactored_trackit/src/main.tsx to avoid referencing a missing generated file, resolving a server start error. (2024-06-09)
5. Consolidated router configuration into a single source of truth in src/router.ts and updated main.tsx to use the new configuration. (2024-06-09)
6. Implemented TanStack Router with proper route configuration and type safety:
   - Created root layout with navigation
   - Added home page with feature navigation
   - Implemented inventory and asset management routes
   - Added 404 handling with NotFound component
7. Added React Query integration for data fetching and state management
8. Implemented responsive UI with Tailwind CSS
9. Added proper TypeScript configurations and type definitions 