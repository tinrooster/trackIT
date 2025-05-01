# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
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