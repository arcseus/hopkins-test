/**
 * Business rules and constants for the analysis pipeline.
 * These values are derived from the spec requirements.
 */

export const PROCESSING_LIMITS = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_FILES: 50,
  MAX_PROCESSED_FILES: 20,
  MAX_TEXT_LENGTH: 15000,
  MAX_CONCURRENT_LLM_CALLS: 10
} as const;

export const SUPPORTED_FILE_TYPES = [
  '.pdf',
  '.docx', 
  '.xlsx',
  '.csv',
  '.txt'
] as const;

export const LLM_CONFIG = {
  TEMPERATURE: 0,
  MAX_TOKENS_DOC: 700,
  MAX_TOKENS_SUMMARY: 500,
  RETRY_ATTEMPTS: 1
} as const;

export const TIMEOUTS = {
  PER_DOCUMENT: 30000,    // 30 seconds
  SUMMARY: 20000,          // 20 seconds  
  TOTAL: 180000           // 3 minutes
} as const;
