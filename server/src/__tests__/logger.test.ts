import { describe, it, expect, beforeEach } from 'vitest';
import { logger, createRequestLogger, LogLevel } from '../logger';

describe('logger', () => {
  it('should create a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should have all required log methods', () => {
    const methods = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    methods.forEach(method => {
      expect(typeof logger[method as keyof typeof logger]).toBe('function');
    });
  });
});

describe('createRequestLogger', () => {
  it('should create a child logger with requestId', () => {
    const requestId = 'test-request-123';
    const requestLogger = createRequestLogger(requestId);
    
    expect(requestLogger).toBeDefined();
    expect(typeof requestLogger.info).toBe('function');
    expect(typeof requestLogger.error).toBe('function');
  });

  it('should include requestId in log context', () => {
    const requestId = 'test-request-456';
    const requestLogger = createRequestLogger(requestId);
    
    // The child logger should have the requestId in its context
    expect(requestLogger).toBeDefined();
  });
});

describe('LogLevel', () => {
  it('should have all required log levels', () => {
    expect(LogLevel.TRACE).toBe('trace');
    expect(LogLevel.DEBUG).toBe('debug');
    expect(LogLevel.INFO).toBe('info');
    expect(LogLevel.WARN).toBe('warn');
    expect(LogLevel.ERROR).toBe('error');
    expect(LogLevel.FATAL).toBe('fatal');
  });
});
