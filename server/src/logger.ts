import pino from 'pino';

/**
 * Structured logger with requestId support and configurable log levels.
 * Provides consistent logging across the application.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined
});

/**
 * Creates a child logger with a specific requestId.
 * This allows tracking requests through the entire pipeline.
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

/**
 * Log levels for consistent usage across the application.
 */
export const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug', 
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];
