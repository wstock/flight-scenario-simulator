"use client";

/**
 * This module provides a way to track errors that occur in the application
 * even when console filtering is enabled. It keeps a record of errors that can
 * be retrieved and analyzed later.
 */

// Maximum number of errors to keep track of
const MAX_TRACKED_ERRORS = 50;

// Store for tracked errors
export const errorLog: {
  timestamp: Date;
  message: string;
  details?: any;
}[] = [];

// Original console.error method
let originalConsoleError: typeof console.error | null = null;

/**
 * Sets up interception of console.error
 */
export function setupErrorTracking() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Save original method if not already saved
  if (!originalConsoleError) {
    originalConsoleError = console.error;
  }
  
  // Replace console.error with tracking version
  console.error = function trackingConsoleError(...args: any[]) {
    // Add to error log
    const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
    errorLog.push({
      timestamp: new Date(),
      message: message,
      details: args.length > 1 ? args.slice(1) : undefined
    });
    
    // Trim error log if it gets too long
    if (errorLog.length > MAX_TRACKED_ERRORS) {
      errorLog.shift();
    }
    
    // Call original method
    if (originalConsoleError) {
      originalConsoleError.apply(console, args);
    }
  };
}

/**
 * Restores the original console.error method
 */
export function restoreConsoleError() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  if (originalConsoleError) {
    console.error = originalConsoleError;
    originalConsoleError = null;
  }
}

/**
 * Gets all tracked errors
 */
export function getTrackedErrors() {
  return [...errorLog];
}

/**
 * Clears all tracked errors
 */
export function clearTrackedErrors() {
  errorLog.length = 0;
} 