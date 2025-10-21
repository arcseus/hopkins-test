/**
 * Validation utilities for client-side data validation.
 * 
 * These utilities provide runtime validation for API responses and user inputs,
 * ensuring type safety and data integrity. They implement the Guard pattern
 * to validate data before processing.
 */

import type { DocumentResult, AnalysisAggregate, DocumentCategory } from '../types';

/**
 * Validates that a string is a valid document category.
 * 
 * @param category - The category string to validate
 * @returns True if the category is valid, false otherwise
 */
export function isValidDocumentCategory(category: string): category is DocumentCategory {
  return ['financial', 'legal', 'commercial', 'operations', 'other'].includes(category);
}

/**
 * Validates a document result object.
 * 
 * @param doc - The document result to validate
 * @returns True if the document result is valid, false otherwise
 */
export function isValidDocumentResult(doc: unknown): doc is DocumentResult {
  if (!doc || typeof doc !== 'object') {
    return false;
  }

  const d = doc as Record<string, unknown>;

  return (
    typeof d.doc === 'string' &&
    d.doc.length > 0 &&
    isValidDocumentCategory(d.category as string) &&
    Array.isArray(d.facts) &&
    d.facts.every(fact => typeof fact === 'string' && fact.length > 0) &&
    d.facts.length >= 1 &&
    d.facts.length <= 5 &&
    Array.isArray(d.red_flags) &&
    d.red_flags.every(flag => typeof flag === 'string' && flag.length > 0) &&
    d.red_flags.length >= 0 &&
    d.red_flags.length <= 5
  );
}

/**
 * Validates an analysis aggregate object.
 * 
 * @param aggregate - The aggregate to validate
 * @returns True if the aggregate is valid, false otherwise
 */
export function isValidAnalysisAggregate(aggregate: unknown): aggregate is AnalysisAggregate {
  if (!aggregate || typeof aggregate !== 'object') {
    return false;
  }

  const a = aggregate as Record<string, unknown>;
  const categories = ['financial', 'legal', 'operations', 'commercial', 'other'];

  return categories.every(category => {
    const cat = a[category];
    return (
      cat &&
      typeof cat === 'object' &&
      typeof (cat as Record<string, unknown>).facts === 'number' &&
      typeof (cat as Record<string, unknown>).red_flags === 'number'
    );
  });
}

/**
 * Validates file upload constraints.
 * 
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum file size in bytes (default: 50MB)
 * @returns Validation result with success flag and error message
 */
export function validateFileUpload(file: File, maxSizeBytes: number = 50 * 1024 * 1024): {
  isValid: boolean;
  error?: string;
} {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSizeBytes / 1024 / 1024)}MB)` 
    };
  }

  if (!file.name.toLowerCase().endsWith('.zip')) {
    return { isValid: false, error: 'Only ZIP files are supported' };
  }

  return { isValid: true };
}
