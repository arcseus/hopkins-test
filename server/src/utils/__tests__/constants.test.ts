import { describe, it, expect } from 'vitest';
import { PROCESSING_LIMITS, SUPPORTED_FILE_TYPES, LLM_CONFIG, TIMEOUTS } from '../constants';

describe('PROCESSING_LIMITS', () => {
  it('should have correct file size limit', () => {
    expect(PROCESSING_LIMITS.MAX_FILE_SIZE).toBe(25 * 1024 * 1024);
  });

  it('should have correct file count limits', () => {
    expect(PROCESSING_LIMITS.MAX_FILES).toBe(50);
    expect(PROCESSING_LIMITS.MAX_PROCESSED_FILES).toBe(20);
  });

  it('should have correct text length limit', () => {
    expect(PROCESSING_LIMITS.MAX_TEXT_LENGTH).toBe(15000);
  });

  it('should have correct concurrent limit', () => {
    expect(PROCESSING_LIMITS.MAX_CONCURRENT_LLM_CALLS).toBe(10);
  });
});

describe('SUPPORTED_FILE_TYPES', () => {
  it('should include all required file types', () => {
    expect(SUPPORTED_FILE_TYPES).toContain('.pdf');
    expect(SUPPORTED_FILE_TYPES).toContain('.docx');
    expect(SUPPORTED_FILE_TYPES).toContain('.xlsx');
    expect(SUPPORTED_FILE_TYPES).toContain('.csv');
    expect(SUPPORTED_FILE_TYPES).toContain('.txt');
  });

  it('should have exactly 5 file types', () => {
    expect(SUPPORTED_FILE_TYPES).toHaveLength(5);
  });
});

describe('LLM_CONFIG', () => {
  it('should have correct temperature', () => {
    expect(LLM_CONFIG.TEMPERATURE).toBe(0);
  });

  it('should have correct token limits', () => {
    expect(LLM_CONFIG.MAX_TOKENS_DOC).toBe(700);
    expect(LLM_CONFIG.MAX_TOKENS_SUMMARY).toBe(500);
  });

  it('should have correct retry attempts', () => {
    expect(LLM_CONFIG.RETRY_ATTEMPTS).toBe(1);
  });
});

describe('TIMEOUTS', () => {
  it('should have correct timeout values', () => {
    expect(TIMEOUTS.PER_DOCUMENT).toBe(30000);
    expect(TIMEOUTS.SUMMARY).toBe(20000);
    expect(TIMEOUTS.TOTAL).toBe(180000);
  });

  it('should have reasonable timeout relationships', () => {
    expect(TIMEOUTS.PER_DOCUMENT).toBeGreaterThan(0);
    expect(TIMEOUTS.SUMMARY).toBeGreaterThan(0);
    expect(TIMEOUTS.TOTAL).toBeGreaterThan(TIMEOUTS.PER_DOCUMENT);
    expect(TIMEOUTS.TOTAL).toBeGreaterThan(TIMEOUTS.SUMMARY);
  });
});
