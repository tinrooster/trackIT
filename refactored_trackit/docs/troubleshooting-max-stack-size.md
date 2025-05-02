# Troubleshooting: Maximum Call Stack Size Exceeded Error

## Problem Description

The settings pages in the TrackIT application (specifically the Locations and Projects tabs) are stuck in a loading state and fail to render correctly. The browser console shows the following error:

```
Uncaught (in promise) RangeError: Maximum call stack size exceeded
```

This error indicates infinite recursion occurring somewhere in the application code. The stack trace shows the error is being triggered in the Tauri.js code, particularly related to invoke operations.

## Root Causes Identified

After careful analysis, we identified several potential root causes:

1. **Circular Dependencies**: The storage services had circular import dependencies between files.
2. **Tauri Command Implementation Issues**: Commands in Rust code were not properly implemented or registered.
3. **Recursive API Calls**: React components were making recursive API calls when checking for connection status.
4. **Type Mismatch**: Mismatches between TypeScript interfaces and Rust structures caused serialization issues.
5. **Improper Error Handling**: Error handling didn't properly prevent cascading failures.
6. **Repeated Connection Checks**: Periodic connection checks were leading to cascading API calls.

## Initial Attempted Solutions

### 1. Fixing Circular Dependencies

We created a shared `types.ts` file to centralize all type definitions and break circular dependencies:

```typescript
// Common types used across the application
export interface Location {
  id: string;
  name: string;
  type: 'Area' | 'Rack' | 'Cabinet';
  parentId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
}

export interface Settings {
  locations: Location[];
}

export class StorageError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}
```

### 2. Fixing Tauri Configuration

We updated the Tauri configuration to properly register commands:

```json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "window": {
        "all": false,
        "close": true,
        "hide": true,
        "show": true,
        "maximize": true,
        "minimize": true,
        "unmaximize": true,
        "unminimize": true,
        "startDragging": true
      },
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "exists": true
      }
    }
  }
}
```

### 3. Preventing Recursive Connection Checks

We added state tracking to prevent recursive connection checks:

```typescript
let isCheckingConnection = false;

// Check database connection
export const checkDatabaseConnection = async (): Promise<boolean> => {
  if (isCheckingConnection) {
    return !isOffline();
  }

  try {
    isCheckingConnection = true;
    await invoke('get_locations');
    setOfflineMode(false);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    setOfflineMode(true);
    return false;
  } finally {
    isCheckingConnection = false;
  }
};
```

### 4. Improving Error Handling

We implemented proper error handling with error codes and improved error classes:

```typescript
export class StorageError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}
```

### 5. Simplifying React Components

We simplified the React components to avoid infinite loops:

```jsx
// Simple one-time data loading
React.useEffect(() => {
  let isMounted = true;

  async function loadLocations() {
    try {
      // Check offline status once
      const offline = isOffline();
      
      if (isMounted) {
        setIsOfflineMode(offline);
      }

      // Simple data fetch
      const settings = await getSettings();
      
      if (isMounted) {
        setLocations(settings.locations);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMounted) {
        console.error('Error loading locations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load locations');
        setIsLoading(false);
      }
    }
  }

  loadLocations();

  // Clean up
  return () => {
    isMounted = false;
  };
}, []);
```

### 6. Improving Type Conversions

We ensured proper type conversions between Rust and TypeScript:

```typescript
// Save location to database or fallback to localStorage
export const createLocation = async (location: Omit<Location, 'id'>): Promise<Location> => {
  try {
    if (isOffline() && !isCheckingConnection) {
      return createOfflineLocation(location);
    }

    const locationData: LocationData = {
      name: location.name,
      type_: location.type,
      parent_id: location.parentId
    };

    const result = await invoke<Location>('create_location', { locationData });
    if (!result || typeof result.id !== 'string') {
      throw new StorageError('Invalid response from server');
    }

    return {
      id: result.id,
      name: result.name,
      type: result.type as Location['type'],
      parentId: result.parentId
    };
  } catch (error) {
    // Error handling...
  }
};
```

## Comprehensive Solution Implemented

Despite implementing all of these fixes, the application still showed the "Maximum call stack size exceeded" error. Therefore, we implemented a complete architectural change:

### 1. Static Store

We created a central static store to maintain application state in memory:

```typescript
// Static data store for application state
export interface StaticStore {
  locations: Location[];
  projects: Project[];
  isOffline: boolean;
  initialized: {
    locations: boolean;
    projects: boolean;
  };
}

// Initialize with empty data
export const staticStore: StaticStore = {
  locations: [],
  projects: [],
  isOffline: false,
  initialized: {
    locations: false,
    projects: false
  }
};

// Get store data
export function getLocations(): Location[] {
  return [...staticStore.locations];
}

export function getProjects(): Project[] {
  return [...staticStore.projects];
}

// Update store data
export function updateLocations(locations: Location[]): void {
  staticStore.locations = [...locations];
  staticStore.initialized.locations = true;
}

export function setOffline(isOffline: boolean): void {
  staticStore.isOffline = isOffline;
}
```

### 2. Operation Queue

We implemented an operation queue system with a circuit breaker pattern to manage all backend operations:

```typescript
// Operation types
export interface Operation<T = any> {
  id: string;
  execute: () => Promise<T>;
  onSuccess: (result: T) => void;
  onError: (error: Error) => void;
  retryCount: number;
  maxRetries: number;
}

// Add operation to queue
export function enqueueOperation<T>(
  execute: () => Promise<T>,
  onSuccess: (result: T) => void,
  onError?: (error: Error) => void
): string {
  const opId = getNextOperationId();
  
  operationQueue.push({
    id: opId,
    execute,
    onSuccess,
    onError: onError || ((error) => console.error('Operation failed:', error)),
    retryCount: 0,
    maxRetries: MAX_RETRIES
  });
  
  // Start processing if not already running
  if (!isProcessing && !isPaused) {
    processNextOperation();
  }
  
  return opId;
}

// Safe wrapper for Tauri invocations
export function safeInvoke<T>(
  command: string, 
  args?: Record<string, any>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      // Set a timeout to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        reject(new StorageError('Operation timed out', 'TIMEOUT'));
      }, 10000); // 10 second timeout
      
      const promise = args ? invoke<T>(command, args) : invoke<T>(command);
      
      promise
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}
```

### 3. Safe Storage Service

We built a safe storage service that decouples UI rendering from backend operations:

```typescript
// Safe locations API
export async function fetchLocations(): Promise<Location[]> {
  // Return cached data immediately if available
  const cachedLocations = getLocations();
  
  // Don't fetch if already loading or offline
  if (isLoadingLocations || isOfflineMode()) {
    return cachedLocations;
  }
  
  isLoadingLocations = true;
  
  // Queue backend operation
  enqueueOperation(
    () => safeInvoke<Location[]>('get_locations'),
    (locations) => {
      updateLocations(locations);
      isLoadingLocations = false;
    },
    (error) => {
      console.error('Failed to load locations:', error);
      setOffline(true);
      setOfflineStorageMode(true);
      isLoadingLocations = false;
    }
  );
  
  // Return current data immediately
  return cachedLocations;
}

export async function createSafeLocation(location: Omit<Location, 'id'>): Promise<Location> {
  if (isOfflineMode()) {
    // Offline creation logic...
  }
  
  return new Promise<Location>((resolve, reject) => {
    const locationData: LocationData = {
      name: location.name,
      type_: location.type,
      parent_id: location.parentId
    };
    
    enqueueOperation(
      () => safeInvoke<Location>('create_location', { locationData }),
      (newLocation) => {
        // Add to static store
        addLocation(newLocation);
        resolve(newLocation);
      },
      (error) => {
        // Try offline fallback
        try {
          const offlineLocation = createOfflineLocation(location);
          addLocation(offlineLocation);
          setOffline(true);
          setOfflineStorageMode(true);
          resolve(offlineLocation);
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
    );
  });
}
```

### 4. Rewritten Settings Components

We completely rewrote the settings components to use the new architecture:

```tsx
export function LocationSettings() {
  // Use the static store data directly
  const [locations, setLocations] = React.useState<Location[]>(getLocations());
  
  // Just fetch once on mount, with no delay in rendering existing data
  React.useEffect(() => {
    // Function to refresh the locations from the static store
    const refreshFromStore = () => {
      setLocations(getLocations());
    };

    // Immediately set from static store
    refreshFromStore();

    // Start background fetch from backend
    const fetchData = async () => {
      try {
        await fetchLocations();
        // Update with fresh data from the store after fetching
        refreshFromStore();
      } catch (err) {
        console.error('Error in background fetch:', err);
      }
    };

    fetchData();

    // Set up store listener
    const intervalId = setInterval(refreshFromStore, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Get location path with depth limit
  const getLocationPath = React.useCallback((location: Location): string => {
    const path: string[] = [location.name];
    let currentLoc = location;
    
    // Limit recursion depth as a safety measure
    let depth = 0;
    const maxDepth = 10;
    
    while (currentLoc.parentId && depth < maxDepth) {
      const parent = getLocationById(currentLoc.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      currentLoc = parent;
      depth++;
    }
    
    return path.join(' > ');
  }, [getLocationById]);

  // Handle form submission - safe version
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation...
    
    setIsUpdating(true);
    try {
      await createSafeLocation({
        name: newLocation.name.trim(),
        type: newLocation.type,
        parentId: newLocation.parentId
      });
      
      // Static store is already updated, just refresh our local state
      setLocations(getLocations());
      setNewLocation({ type: 'Area' }); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setIsUpdating(false);
    }
  };
}
```

## Outcome

The comprehensive architectural changes successfully resolved the "Maximum call stack size exceeded" errors. The solution also provided the following benefits:

1. **Improved Performance**: UI renders immediately with cached data
2. **Better Resilience**: Proper error handling with fallbacks
3. **Offline Support**: Graceful degradation in offline mode
4. **Improved UX**: Clear status indicators and error messages
5. **Better Maintainability**: Clear separation of concerns

## Lessons Learned

1. **Direct Tauri Invocation Risks**: Direct Tauri invoke calls can lead to infinite recursion if not properly managed
2. **State Management Importance**: Centralized state management prevents circular dependencies and simplifies data flow
3. **Decoupled Architecture Benefits**: Separating UI rendering from backend operations improves resilience
4. **Error Handling Fundamentals**: Comprehensive error handling is essential for preventing cascading failures
5. **Circuit Breaker Value**: Implementing a circuit breaker pattern prevents system overload
6. **Recursion Depth Control**: Always limit recursion depth in recursive operations
7. **React Effect Cleanup**: Proper cleanup in useEffect hooks is crucial to prevent memory leaks and infinite loops
8. **React Component Lifecycle**: Understanding React's component lifecycle is essential for preventing infinite renders
9. **TypeScript/Rust Integration**: Care is needed when handling type conversions between Rust and TypeScript

## Future Recommendations

1. **Consider Formal State Management**: Redux, Zustand, or Context API for more formal state management
2. **Add Background Sync**: Implement background synchronization for offline operations
3. **Improve Type Safety**: Add runtime type validation for backend responses
4. **Add Unit Testing**: Comprehensive unit testing for core services
5. **Component Modularization**: Further modularize components for better maintainability
6. **Performance Monitoring**: Add detailed performance monitoring and logging
7. **Throttling and Debouncing**: Implement throttling for frequent operations
8. **Upgrade Tauri**: Stay updated with the latest Tauri version to benefit from bug fixes

## Next Steps / Recommendations

Based on our troubleshooting so far, here are recommended next steps:

1. **Simplify Backend Calls**: Further simplify the backend calls to eliminate any potential recursion.
2. **Debug Tauri Calls**: Use console logs to trace all Tauri invocations and responses.
3. **Consider Alternative Approach**: Consider implementing a simpler state management approach without Tauri invocations for these settings.
4. **Implement Circuit Breaker**: Add a circuit breaker pattern to prevent cascading failures.
5. **Update Tauri Version**: Check if there are known issues with the current Tauri version and consider updating.
6. **Browser Debugging**: Use browser debugging tools to capture the exact call sequence leading to the stack overflow.
7. **Isolated Testing**: Create a minimal test case outside the main application to isolate the issue.

## Lessons Learned

1. **State Management Complexity**: React state management combined with native calls requires careful planning to avoid recursive patterns.
2. **Type Safety Across Boundaries**: Ensure strict type validation when crossing language boundaries (TS to Rust).
3. **Error Handling Importance**: Proper error handling is crucial for preventing cascading failures.
4. **Asynchronous Cleanup**: Always implement proper cleanup for asynchronous operations to prevent memory leaks and recursion.
5. **Component Lifecycle Management**: Be careful with effect hooks and state updates that might trigger recursive renders. 