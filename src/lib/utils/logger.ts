/**
 * Logger utility for controlling log output across the application
 */

// Log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5
}

// Current log level - can be set via environment variable
// Default to INFO in production, DEBUG in development
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO 
  : LogLevel.DEBUG;

// Parse log level from environment or use default
const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL 
  ? parseInt(process.env.NEXT_PUBLIC_LOG_LEVEL, 10) 
  : DEFAULT_LOG_LEVEL;

// API route logging level - more restrictive by default
const API_LOG_LEVEL = process.env.NEXT_PUBLIC_API_LOG_LEVEL
  ? parseInt(process.env.NEXT_PUBLIC_API_LOG_LEVEL, 10)
  : LogLevel.ERROR; // Only log errors by default for API routes

/**
 * Logger class with methods for different log levels
 */
class Logger {
  private context: string;
  private isApiRoute: boolean;
  
  constructor(context: string = 'App', isApiRoute: boolean = false) {
    this.context = context;
    this.isApiRoute = isApiRoute;
  }
  
  /**
   * Log error messages
   */
  error(message: string, ...args: any[]) {
    if ((this.isApiRoute && API_LOG_LEVEL >= LogLevel.ERROR) || 
        (!this.isApiRoute && LOG_LEVEL >= LogLevel.ERROR)) {
      console.error(`[ERROR][${this.context}] ${message}`, ...args);
    }
  }
  
  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]) {
    if ((this.isApiRoute && API_LOG_LEVEL >= LogLevel.WARN) || 
        (!this.isApiRoute && LOG_LEVEL >= LogLevel.WARN)) {
      console.warn(`[WARN][${this.context}] ${message}`, ...args);
    }
  }
  
  /**
   * Log info messages
   */
  info(message: string, ...args: any[]) {
    if ((this.isApiRoute && API_LOG_LEVEL >= LogLevel.INFO) || 
        (!this.isApiRoute && LOG_LEVEL >= LogLevel.INFO)) {
      console.log(`[INFO][${this.context}] ${message}`, ...args);
    }
  }
  
  /**
   * Log debug messages
   */
  debug(message: string, ...args: any[]) {
    if ((this.isApiRoute && API_LOG_LEVEL >= LogLevel.DEBUG) || 
        (!this.isApiRoute && LOG_LEVEL >= LogLevel.DEBUG)) {
      console.log(`[DEBUG][${this.context}] ${message}`, ...args);
    }
  }
  
  /**
   * Log verbose messages
   */
  verbose(message: string, ...args: any[]) {
    if ((this.isApiRoute && API_LOG_LEVEL >= LogLevel.VERBOSE) || 
        (!this.isApiRoute && LOG_LEVEL >= LogLevel.VERBOSE)) {
      console.log(`[VERBOSE][${this.context}] ${message}`, ...args);
    }
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string, isApiRoute: boolean = false): Logger {
  return new Logger(context, isApiRoute);
}

/**
 * Create a logger specifically for API routes
 */
export function createApiLogger(context: string): Logger {
  return new Logger(context, true);
}

// Default logger instance
export const logger = new Logger();

// Export default logger methods for convenience
export const { error, warn, info, debug, verbose } = logger; 