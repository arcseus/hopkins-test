/**
 * ZIP extraction utilities for processing uploaded ZIP files.
 * Extracts files from ZIP archives and validates them for processing.
 */

import * as yauzl from 'yauzl';
import { validateExtractedFiles } from '../middleware/upload';
import { validateFileBuffer } from './file-types';
import { PROCESSING_LIMITS } from './constants';

export interface ExtractedFile {
  filename: string;
  buffer: Buffer;
  mimetype?: string;
  size: number;
}

export interface ExtractionResult {
  files: ExtractedFile[];
  totalFiles: number;
  totalSize: number;
  errors: string[];
}

/**
 * Extracts all files from a ZIP archive buffer
 * Validates file types and applies processing limits
 */
export async function extractZipFiles(zipBuffer: Buffer): Promise<ExtractionResult> {
  return new Promise((resolve, reject) => {
    const files: ExtractedFile[] = [];
    const errors: string[] = [];
    let totalSize = 0;
    let processedFiles = 0;

    yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(new Error(`ZIP extraction failed: ${err.message}`));
        return;
      }

      if (!zipfile) {
        reject(new Error('Invalid ZIP file'));
        return;
      }

      zipfile.readEntry();
      
      zipfile.on('entry', (entry) => {
        // Skip directories and hidden files
        if (entry.fileName.endsWith('/') || entry.fileName.startsWith('.')) {
          zipfile.readEntry();
          return;
        }

        // Check file size limit
        if (entry.uncompressedSize > PROCESSING_LIMITS.MAX_FILE_SIZE) {
          errors.push(`File ${entry.fileName} exceeds size limit (${entry.uncompressedSize} bytes)`);
          zipfile.readEntry();
          return;
        }

        // Check total file count limit
        if (processedFiles >= PROCESSING_LIMITS.MAX_FILES) {
          errors.push(`Too many files in ZIP (limit: ${PROCESSING_LIMITS.MAX_FILES})`);
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) {
            errors.push(`Failed to read ${entry.fileName}: ${err.message}`);
            zipfile.readEntry();
            return;
          }

          if (!readStream) {
            errors.push(`No read stream for ${entry.fileName}`);
            zipfile.readEntry();
            return;
          }

          const chunks: Buffer[] = [];
          
          readStream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          readStream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            totalSize += buffer.length;
            processedFiles++;

            files.push({
              filename: entry.fileName,
              buffer,
              size: buffer.length
            });

            zipfile.readEntry();
          });

          readStream.on('error', (err) => {
            errors.push(`Error reading ${entry.fileName}: ${err.message}`);
            zipfile.readEntry();
          });
        });
      });

      zipfile.on('end', async () => {
        try {
          // Validate extracted files
          await validateExtractedFiles(files);
          
          resolve({
            files,
            totalFiles: files.length,
            totalSize,
            errors
          });
        } catch (validationError) {
          reject(validationError);
        }
      });

      zipfile.on('error', (err) => {
        reject(new Error(`ZIP processing error: ${err.message}`));
      });
    });
  });
}

/**
 * Validates a single extracted file for processing
 */
export async function validateExtractedFile(file: ExtractedFile): Promise<{
  isValid: boolean;
  fileType?: string;
  error?: string;
}> {
  try {
    const validation = await validateFileBuffer(file.buffer, file.filename);
    
    return {
      isValid: validation.isSupported,
      fileType: validation.extension,
      error: validation.isSupported ? undefined : `Unsupported file type: ${validation.extension}`
    };
  } catch (error) {
    return {
      isValid: false,
      error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
