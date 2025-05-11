# Settings Architecture

## Current Implementation

The current settings functionality uses a traditional React application structure with React Router, not Next.js:

- Uses standard React with React Router
- Explicit route definitions in `App.tsx`
- Traditional component file organization in `/pages` directory
- Component imports/exports follow a conventional React pattern
- Route configuration is centralized rather than file-path based

The main settings page is located at `src/pages/SettingsPage.tsx` and is loaded when users navigate to the `/settings` route.

## Deprecated Implementation

There was a partial migration to a Next.js App Router structure that was not completed. This deprecated implementation:

- Used Next.js App Router structure
- File-based routing (`app/settings/page.tsx`)
- "use client" directive at the top of components
- Component naming based on file paths

The deprecated version has been moved to `src/deprecated/settings/page.tsx` for reference.

## Data Management Tab

The Data Management tab has been added to the active settings page with the following functionality:

- **Import & Export:** Allows importing and exporting inventory data and configuration
- **Backup & Restore:** Creates complete backups of the system that can be restored later

This tab was initially developed for the Next.js version but has been incorporated into the current active settings page.

## Toast Notifications

The settings page uses the `sonner` toast library for notifications. Note that when using this library:

- Use the method style API (`toast.success()`, `toast.error()`) rather than object style
- This helps avoid TypeScript errors with the toast implementation

## Future Development

When continuing development of the settings functionality:

1. Decide whether to complete the migration to Next.js App Router or continue with the current React Router approach
2. If migrating to Next.js, reference the deprecated implementation for architecture guidance
3. Ensure toast notifications use the correct API style for the chosen toast library

## Component Structure

The settings page is organized into several tabs:
- List Management
- Users
- Storage Cabinet Management
- Data Management

Each tab uses components from the `src/components/settings/` directory. 

