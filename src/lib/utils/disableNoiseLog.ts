/**
 * Utility to intercept and filter noisy console messages
 * This reduces console noise for specific repeated messages
 */

type InterceptType = 'log' | 'info' | 'warn' | 'error';

const originalConsoleMethods = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// Patterns to filter from console logs
const noisePatterns = [
  /\[Fast Refresh\] rebuilding/,
  /WebSocket connection to .* failed/,
  /Download the React DevTools/,
  /No current parameters found/,
  /SimulatorPage\.useEffect\.tickInterval/
];

/**
 * Setup console intercepts to filter out noisy messages
 */
export function setupConsoleFilters() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  const interceptConsole = (type: InterceptType) => {
    console[type] = (...args: any[]) => {
      // Check if the first argument is a string that matches any noise pattern
      if (typeof args[0] === 'string' && noisePatterns.some(pattern => pattern.test(args[0]))) {
        // Skip logging noisy messages
        return;
      }
      
      // Call the original method for non-matching messages
      originalConsoleMethods[type](...args);
    };
  };

  // Intercept all console methods
  interceptConsole('log');
  interceptConsole('info');
  interceptConsole('warn');
  interceptConsole('error');
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  console.log = originalConsoleMethods.log;
  console.info = originalConsoleMethods.info;
  console.warn = originalConsoleMethods.warn;
  console.error = originalConsoleMethods.error;
} 