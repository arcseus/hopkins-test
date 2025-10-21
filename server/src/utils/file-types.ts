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
 * Validates file buffer using hybrid detection approach
 * 1. Try file-type for secure content-based detection (binary files)
 * 2. Fall back to extension-based detection (text files like CSV/TXT)
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
    // First, try content-based detection with file-type
    const detected = await fileTypeFromBuffer(buffer);
    
    if (detected?.ext) {
      // Content-based detection succeeded
      const ext = detected.ext;
      const mime = detected.mime || '';
      const isSupported = SUPPORTED_FILE_TYPES.includes(ext as SupportedFileType);
      
      return {
        isValid: isSupported,
        extension: ext,
        mimeType: mime,
        isSupported,
        detected: {
          ext: detected.ext,
          mime: detected.mime
        }
      };
    } else {
      // Content-based detection failed, try extension-based fallback
      const extension = getFileExtension(filename);
      const isSupported = SUPPORTED_FILE_TYPES.includes(extension as SupportedFileType);
      
      // For text-based files, validate they contain readable content
      if (isSupported && (extension === 'csv' || extension === 'txt')) {
        const isValidText = validateTextContent(buffer);
        return {
          isValid: isValidText,
          extension,
          mimeType: getMimeTypeForExtension(extension),
          isSupported: isValidText,
          detected: {
            ext: undefined,
            mime: undefined
          }
        };
      }
      
      return {
        isValid: isSupported,
        extension,
        mimeType: getMimeTypeForExtension(extension),
        isSupported,
        detected: {
          ext: undefined,
          mime: undefined
        }
      };
    }
  } catch (error) {
    // If file-type fails completely, try extension-based fallback
    const extension = getFileExtension(filename);
    const isSupported = SUPPORTED_FILE_TYPES.includes(extension as SupportedFileType);
    
    return {
      isValid: isSupported,
      extension,
      mimeType: getMimeTypeForExtension(extension),
      isSupported,
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

/**
 * Validates that buffer contains readable text content
 * Used for CSV and TXT files when content-based detection fails
 */
function validateTextContent(buffer: Buffer): boolean {
  try {
    // Check if buffer contains readable text (not binary)
    const text = buffer.toString('utf8');
    
    // Basic validation: check for null bytes
    if (text.includes('\0')) return false;
    
    // Check if it's mostly printable characters (more lenient)
    const nonPrintableChars = text.replace(/[\x20-\x7E\s\n\r\t]/g, '').length;
    const totalChars = text.length;
    
    // Allow up to 20% non-printable characters (for encoding issues and special chars)
    return totalChars === 0 || (nonPrintableChars / totalChars) < 0.2;
  } catch {
    return false;
  }
}

/**
 * Gets MIME type for file extension (fallback when content detection fails)
 */
function getMimeTypeForExtension(extension: string): string {
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'txt': 'text/plain'
  };
  
  return mimeMap[extension] || 'application/octet-stream';
}
