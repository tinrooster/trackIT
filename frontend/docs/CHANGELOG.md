# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete architectural redesign to fix "Maximum call stack size exceeded" errors:
  - Created static store system (staticStore.ts) for application state management
  - Implemented operation queue with circuit breaker pattern (operationQueue.ts)
  - Built safe storage service with deferred backend synchronization (safeStorageService.ts)
  - Added comprehensive error handling with detailed error codes
  - Implemented proper timeouts and retry mechanisms
  - Added graceful offline mode handling with auto-reconnection
  - Decoupled UI rendering from backend operations
  - Added circuit breaker pattern to prevent cascading failures

### Changed
- Completely rewrote settings components to use the new architecture
- Enhanced error handling throughout the application
- Improved performance by decoupling UI from backend operations
- Limited recursion depth in location path calculation
- Improved cleanup for periodic operations
- Migrated all modules to ESM (`export`/`import` syntax) for compatibility with Vite and modern tooling.
- Removed all duplicate `.js` files where a `.tsx` or `.ts` version exists.
- Standardized all component and service exports:
  - Default exports for components imported as `import X from ...`
  - Named exports for `import { X } from ... }`
- Fixed all import/export errors related to module system mismatches.
- Ensured all route and component files use a single, consistent file extension and export style.

### Fixed
- Fixed "Maximum call stack size exceeded" errors in Locations and Projects settings tabs
- Fixed infinite loop issues caused by React useEffect dependencies
- Resolved circular dependencies between modules
- Fixed offline mode detection and handling
- Improved error states and loading indicators
- Enhanced accessibility of settings components

- Resolved duplicate command definitions in Rust backend
  - Removed duplicate command implementations from `main.rs`
  - Properly imported commands from `commands.rs` module
  - Fixed command handler registration

- Fixed Prisma client integration
  - Added proper Prisma client generation in build script
  - Updated Prisma client dependencies
  - Added binary for Prisma code generation

- Fixed Tauri plugin compatibility issues
  - Updated tauri-plugin-log to use v1 branch for Tauri 1.x compatibility
  - Resolved dependency conflicts with webkit2gtk

- Added basic route configuration in `refactored_trackit/src/main.tsx` to resolve blank page and router errors
  - Created root route and index route
  - Added welcome page component
  - Properly configured route tree for TanStack Router

- Removed import of `./routeTree.gen` and updated router initialization in `refactored_trackit/src/main.tsx` to resolve server start error
  - Commented out the import statement
  - Removed routeTree from router configuration
  - Server can now start without the generated route tree file

### Changed
- Moved documentation to `docs/` directory
  - Consolidated all markdown documentation files
  - Established central location for project documentation

### Added
- Created CHANGELOG.md to track all project changes

For older changes, please refer to the git commit history.

## How to Update This Changelog

When making changes to the project:
1. Add an entry under the [Unreleased] section
2. Use the following categories as needed:
   - Added (for new features)
   - Changed (for changes in existing functionality)
   - Deprecated (for soon-to-be removed features)
   - Removed (for now removed features)
   - Fixed (for any bug fixes)
   - Security (in case of vulnerabilities)
3. When releasing a new version:
   - Create a new version section
   - Move [Unreleased] changes under the new version
   - Add the release date 