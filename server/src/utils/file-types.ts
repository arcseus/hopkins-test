/**
 * File type validation utilities using file-type for secure detection
 * Defines supported file types and validation logic for document processing
 */

import { fileTypeFromBuffer } from 'file-type';

// Supported file types for document processing
export const SUPPORTED_FILE_TYPES = [
  'pdf',   // PDF documents
  'docx',  // Microsoft Word documents
  'xlsx',  // Microsoft Excel spreadsheets
  'csv',   // Comma-separated values
  'txt'    // Plain text files
] as const;

export type SupportedFileType = typeof SUPPORTED_FILE_TYPES[number];

/**
 * Validates file buffer using file-type for secure detection
 * This is the recommended approach as it detects true file type from content
 */
export async function validateFileBuffer(buffer: Buffer, filename: string): Promise<{
  isValid: boolean;
  extension: string;
  mimeType: string;
  isSupported: boolean;
  detected: {
    ext: string | undefined;
    mime: string | undefined;
  };
}> {
  try {
    const detected = await fileTypeFromBuffer(buffer);
    const ext = detected?.ext || '';
    const mime = detected?.mime || '';
    
    const isSupported = SUPPORTED_FILE_TYPES.includes(ext as SupportedFileType);
    
    return {
      isValid: isSupported,
      extension: ext,
      mimeType: mime,
      isSupported,
      detected: {
        ext: detected?.ext,
        mime: detected?.mime
      }
    };
  } catch (error) {
    // If file-type fails to detect, treat as unsupported
    return {
      isValid: false,
      extension: '',
      mimeType: '',
      isSupported: false,
      detected: {
        ext: undefined,
        mime: undefined
      }
    };
  }
}

/**
 * Gets the file extension from a filename (for fallback validation)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

/**
 * Validates if a file extension is supported (filename-based fallback)
 */
export function isSupportedFileType(filename: string): boolean {
  const extension = getFileExtension(filename);
  return SUPPORTED_FILE_TYPES.includes(extension as SupportedFileType);
}
