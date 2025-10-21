/**
 * Retry utility for handling transient failures with exponential backoff
 * Specifically designed for LLM API calls with intelligent retry logic
 */

/**
 * Determines if an error is worth retrying
 * 
 * @param error - The error to evaluate
 * @returns True if the error should trigger a retry
 */
export function shouldRetry(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  
  // Retry on rate limits and temporary issues
  if (errorMessage.includes('rate limit') || 
      errorMessage.includes('quota') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('temporary') ||
      errorMessage.includes('service unavailable')) {
    return true;
  }
  
  // Don't retry on permanent failures
  if (errorMessage.includes('invalid api key') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('bad request')) {
    return false;
  }
  
  // Default to retry for unknown errors (conservative approach)
  return true;
}

/**
 * Calculates exponential backoff delay with jitter
 * 
 * @param attempt - Current attempt number (0-based)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @param maxDelay - Maximum delay in milliseconds (default: 30000ms)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number, 
  baseDelay: number = 1000, 
  maxDelay: number = 30000
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter (±25% random variation)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delayWithJitter = exponentialDelay + jitter;
  
  // Cap at maxDelay
  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Sleeps for the specified number of milliseconds
 * 
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetryFn?: (error: Error) => boolean;
}

/**
 * Default retry configuration for LLM calls
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  shouldRetryFn: shouldRetry
};

/**
 * Executes a function with retry logic and exponential backoff
 * 
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Promise with the result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;
  
  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if we should retry this error
      const shouldRetryError = finalConfig.shouldRetryFn 
        ? finalConfig.shouldRetryFn(lastError)
        : shouldRetry(lastError);
      
      if (!shouldRetryError || attempt === finalConfig.maxAttempts - 1) {
        throw lastError;
      }
      
      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, finalConfig.baseDelay, finalConfig.maxDelay);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}
