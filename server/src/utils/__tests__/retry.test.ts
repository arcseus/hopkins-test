import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  shouldRetry, 
  calculateBackoffDelay, 
  sleep, 
  withRetry, 
  DEFAULT_RETRY_CONFIG 
} from '../retry';

describe('Retry Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('shouldRetry', () => {
    it('should retry on rate limit errors', () => {
      expect(shouldRetry(new Error('rate limit exceeded'))).toBe(true);
      expect(shouldRetry(new Error('Rate limit exceeded'))).toBe(true);
    });

    it('should retry on quota errors', () => {
      expect(shouldRetry(new Error('quota exceeded'))).toBe(true);
      expect(shouldRetry(new Error('Quota exceeded'))).toBe(true);
    });

    it('should retry on timeout errors', () => {
      expect(shouldRetry(new Error('timeout occurred'))).toBe(true);
      expect(shouldRetry(new Error('Network timeout'))).toBe(true);
    });

    it('should retry on temporary errors', () => {
      expect(shouldRetry(new Error('service temporarily unavailable'))).toBe(true);
      expect(shouldRetry(new Error('Temporary failure'))).toBe(true);
    });

    it('should not retry on authentication errors', () => {
      expect(shouldRetry(new Error('invalid api key'))).toBe(false);
      expect(shouldRetry(new Error('Authentication failed'))).toBe(false);
      expect(shouldRetry(new Error('Unauthorized'))).toBe(false);
    });

    it('should not retry on permanent errors', () => {
      expect(shouldRetry(new Error('not found'))).toBe(false);
      expect(shouldRetry(new Error('Bad request'))).toBe(false);
      expect(shouldRetry(new Error('Forbidden'))).toBe(false);
    });

    it('should retry on unknown errors (conservative approach)', () => {
      expect(shouldRetry(new Error('Unknown error'))).toBe(true);
      expect(shouldRetry(new Error('Something went wrong'))).toBe(true);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = calculateBackoffDelay(0, 1000, 10000);
      const delay2 = calculateBackoffDelay(1, 1000, 10000);
      const delay3 = calculateBackoffDelay(2, 1000, 10000);

      expect(delay1).toBeGreaterThan(0);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should respect max delay', () => {
      const delay = calculateBackoffDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should include jitter', () => {
      const delays = Array.from({ length: 10 }, () => calculateBackoffDelay(1, 1000, 10000));
      const uniqueDelays = new Set(delays);
      
      // Should have some variation due to jitter
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn, { maxAttempts: 3 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('invalid api key'));
      
      await expect(withRetry(mockFn)).rejects.toThrow('invalid api key');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('rate limit exceeded'));
      
      await expect(withRetry(mockFn, { maxAttempts: 3 })).rejects.toThrow('rate limit exceeded');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use custom shouldRetry function', async () => {
      const customShouldRetry = vi.fn().mockReturnValue(false);
      const mockFn = vi.fn().mockRejectedValue(new Error('test error'));
      
      await expect(withRetry(mockFn, { shouldRetryFn: customShouldRetry })).rejects.toThrow('test error');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(customShouldRetry).toHaveBeenCalledWith(new Error('test error'));
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RETRY_CONFIG).toEqual({
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        shouldRetryFn: shouldRetry
      });
    });
  });
});
