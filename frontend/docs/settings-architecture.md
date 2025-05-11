# Settings Architecture

## Current Implementation

The settings functionality now uses a completely redesigned architecture to address previous performance and stability issues:

### Core Components

1. **Static Store (`staticStore.ts`)**
   - Serves as a central in-memory data store for application state
   - Provides getter and setter methods for locations, projects, and other settings
   - Maintains initialization status to prevent duplicate loading
   - Handles offline mode state

2. **Operation Queue (`operationQueue.ts`)**
   - Implements a controlled queue for all backend operations
   - Provides circuit breaker pattern to prevent cascading failures
   - Handles retries with exponential backoff
   - Sets timeouts to prevent hanging operations
   - Manages online/offline transitions

3. **Safe Storage Service (`safeStorageService.ts`)**
   - Provides a consistent API for data operations
   - Returns cached data immediately while fetching from backend
   - Transparently handles offline mode with localStorage fallback
   - Uses the operation queue for all backend communication
   - Provides proper error handling with descriptive error codes

### Settings Components

The settings components (`LocationSettings.tsx` and `ProjectSettings.tsx`) have been completely rewritten to:

1. Use the static store for data access
2. Render immediately with cached data
3. Trigger background data refresh without blocking UI
4. Handle form submissions through the safe storage service
5. Implement proper error handling with error boundaries
6. Provide clear status indicators for offline mode and operations
7. Limit recursion depth in tree traversal operations
8. Implement proper cleanup for all subscriptions and timers

### Key Benefits

- **Performance**: UI renders immediately with cached data
- **Stability**: No more stack overflow errors or infinite loops
- **Resilience**: Graceful handling of offline scenarios
- **Maintainability**: Clear separation of concerns
- **Error Handling**: Consistent error management with useful messages
- **User Experience**: Responsive UI with clear status indicators

## Route Structure

The settings page is still organized into several tabs:
- List Management
- Users
- Storage Cabinet Management
- Data Management

Each tab uses components from the `src/components/settings/` directory.

## Usage Pattern

```tsx
// Example usage in a component
import { getLocations, isOfflineMode } from '../../lib/staticStore';
import { fetchLocations, createSafeLocation } from '../../lib/safeStorageService';

function MyComponent() {
  // Initialize with data from static store
  const [locations, setLocations] = useState(getLocations());
  
  useEffect(() => {
    // Refresh from static store immediately
    const refreshFromStore = () => {
      setLocations(getLocations());
    };
    
    // Set up a listener for store updates
    const intervalId = setInterval(refreshFromStore, 1000);
    
    // Trigger background fetch that will update the store
    fetchLocations().catch(console.error);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Rest of the component...
}
```

## Migration Notes

The previous version had issues with:
1. Circular dependencies between services
2. Direct Tauri invocations leading to infinite recursion
3. Improper effect cleanup causing memory leaks
4. Ineffective error handling

The new architecture resolves these issues by centralizing state management and decoupling UI rendering from backend operations.

For any new settings components, follow the pattern established in `LocationSettings.tsx` and `ProjectSettings.tsx`.

## Future Improvements

- Consider implementing a proper state management system like Redux or Zustand
- Add data synchronization when transitioning from offline to online
- Implement more granular change detection to reduce re-renders
- Add data validation middleware

## Data Management Tab

The Data Management tab has been added to the active settings page with the following functionality:

- **Import & Export:** Allows importing and exporting inventory data and configuration
- **Backup & Restore:** Creates complete backups of the system that can be restored later

This tab was initially developed for the Next.js version but has been incorporated into the current active settings page.

## Toast Notifications

The settings page uses the `sonner` toast library for notifications. Note that when using this library:

- Use the method style API (`toast.success()`, `toast.error()`) rather than object style
- This helps avoid TypeScript errors with the toast implementation

## Deprecated Implementation

There was a partial migration to a Next.js App Router structure that was not completed. This deprecated implementation:

- Used Next.js App Router structure
- File-based routing (`app/settings/page.tsx`)
- "use client" directive at the top of components
- Component naming based on file paths

The deprecated version has been moved to `src/deprecated/settings/page.tsx` for reference.

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