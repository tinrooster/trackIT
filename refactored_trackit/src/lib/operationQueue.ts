import { invoke } from '@tauri-apps/api/tauri';
import { setOffline } from './staticStore';
import { StorageError } from './types';

// Operation types
export interface Operation<T = any> {
  id: string;
  execute: () => Promise<T>;
  onSuccess: (result: T) => void;
  onError: (error: Error) => void;
  retryCount: number;
  maxRetries: number;
}

// Queue state
let isProcessing = false;
let isPaused = false;
const MAX_RETRIES = 3;
const PROCESSING_DELAY = 100;
const operationQueue: Operation[] = [];

// Circuit breaker pattern
let failureCount = 0;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_TIMEOUT = 5000;

// Create a unique ID for operations
let operationCounter = 0;
function getNextOperationId(): string {
  return `op_${Date.now()}_${operationCounter++}`;
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

// Cancel an operation
export function cancelOperation(id: string): boolean {
  const index = operationQueue.findIndex(op => op.id === id);
  if (index >= 0) {
    operationQueue.splice(index, 1);
    return true;
  }
  return false;
}

// Check circuit breaker
function isCircuitOpen(): boolean {
  return failureCount >= FAILURE_THRESHOLD;
}

// Reset circuit breaker
function resetCircuitBreaker(): void {
  console.log('Circuit breaker reset');
  failureCount = 0;
  isPaused = false;
  processNextOperation();
}

// Trip circuit breaker
function tripCircuitBreaker(): void {
  console.warn('Circuit breaker tripped - pausing operations');
  isPaused = true;
  setOffline(true);
  
  // Auto-reset after timeout
  setTimeout(resetCircuitBreaker, CIRCUIT_RESET_TIMEOUT);
}

// Process next operation in queue
function processNextOperation(): void {
  if (operationQueue.length === 0 || isProcessing || isPaused) {
    isProcessing = false;
    return;
  }
  
  if (isCircuitOpen()) {
    isPaused = true;
    setTimeout(resetCircuitBreaker, CIRCUIT_RESET_TIMEOUT);
    return;
  }
  
  isProcessing = true;
  const operation = operationQueue.shift();
  
  if (!operation) {
    isProcessing = false;
    return;
  }
  
  try {
    operation.execute()
      .then(result => {
        // Success - reset failure counter
        failureCount = Math.max(0, failureCount - 1);
        operation.onSuccess(result);
      })
      .catch(error => {
        // Track failures for circuit breaker
        failureCount++;
        console.error(`Operation ${operation.id} failed (attempt ${operation.retryCount + 1}):`, error);
        
        // Check if we should retry
        if (operation.retryCount < operation.maxRetries) {
          console.log(`Retrying operation ${operation.id} (attempt ${operation.retryCount + 1})`);
          // Re-queue with incremented retry count
          operationQueue.unshift({
            ...operation,
            retryCount: operation.retryCount + 1
          });
        } else {
          // Max retries reached, call error handler
          operation.onError(error instanceof Error ? error : new StorageError(String(error)));
        }
        
        // Check if circuit breaker should trip
        if (isCircuitOpen()) {
          tripCircuitBreaker();
        }
      })
      .finally(() => {
        // After a delay, process the next operation
        setTimeout(() => {
          isProcessing = false;
          processNextOperation();
        }, PROCESSING_DELAY);
      });
  } catch (error) {
    failureCount++;
    console.error('Error executing operation:', error);
    operation.onError(error instanceof Error ? error : new StorageError(String(error)));
    
    if (isCircuitOpen()) {
      tripCircuitBreaker();
    }
    
    // Continue with next operation after a delay
    setTimeout(() => {
      isProcessing = false;
      processNextOperation();
    }, PROCESSING_DELAY);
  }
}

// Safe wrapper for Tauri invocations
export function safeInvoke<T>(
  command: string, 
  args?: Record<string, any>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      // Wrap the invoke in a try-catch
      const promise = args ? invoke<T>(command, args) : invoke<T>(command);
      
      // Set a timeout to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        reject(new StorageError('Operation timed out', 'TIMEOUT'));
      }, 10000); // 10 second timeout
      
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