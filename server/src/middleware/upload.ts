import { FastifyRequest, FastifyReply } from 'fastify';
import { PROCESSING_LIMITS } from '../utils/constants';
import { 
  FileSizeError, 
  FileTypeError, 
  NoFileError, 
  FileValidationError,
  UnsupportedFileTypeError,
  MultipartError 
} from '../errors/validation';
import { isSupportedFileType, validateFileBuffer } from '../utils/file-types';

/**
 * Multipart file upload validation middleware
 * Validates file size, type, and presence according to business rules
 */
export async function validateMultipartUpload(request: FastifyRequest, reply: FastifyReply) {
  // 1. Check if request has multipart data
  const data = await (request as any).file();
  
  if (!data) {
    throw new NoFileError();
  }

  // 2. Validate file size
  if (data.size > PROCESSING_LIMITS.MAX_FILE_SIZE) {
    throw new FileSizeError(data.size, PROCESSING_LIMITS.MAX_FILE_SIZE);
  }

  // 3. Validate file type (must be ZIP)
  const filename = data.filename || '';
  if (!filename.toLowerCase().endsWith('.zip')) {
    throw new FileTypeError(filename);
  }

  // 4. Additional validation: check if file is empty
  if (data.size === 0) {
    throw new FileValidationError('File is empty', {
      filename,
      size: data.size
    });
  }

  // 5. Store validated file data in request for downstream processing
  (request as any).validatedFile = {
    filename: data.filename,
    size: data.size,
    mimetype: data.mimetype,
    encoding: data.encoding,
    file: data.file
  };

  return data;
}

/**
 * Helper function to extract validated file data from request
 */
export function getValidatedFile(request: FastifyRequest) {
  return (request as any).validatedFile;
}

/**
 * Validates extracted files from ZIP archive using secure buffer detection
 * Checks file types and formats according to supported document types
 */
export async function validateExtractedFiles(files: Array<{ 
  filename: string; 
  buffer: Buffer; 
  mimetype?: string 
}>): Promise<void> {
  if (!files || files.length === 0) {
    throw new FileValidationError('No files found in ZIP archive', {
      fileCount: 0
    });
  }

  // Check file count limit
  if (files.length > PROCESSING_LIMITS.MAX_FILES) {
    throw new FileValidationError(
      `Too many files in ZIP archive. Maximum ${PROCESSING_LIMITS.MAX_FILES} files allowed`,
      {
        fileCount: files.length,
        maxFiles: PROCESSING_LIMITS.MAX_FILES
      }
    );
  }

  // Validate each file using secure buffer detection
  const unsupportedFiles: string[] = [];
  const detectionErrors: string[] = [];

  for (const file of files) {
    try {
      const validation = await validateFileBuffer(file.buffer, file.filename);
      
      if (!validation.isSupported) {
        unsupportedFiles.push(file.filename);
      }
      
      // Log detection details for debugging
      if (!validation.detected.ext) {
        detectionErrors.push(`${file.filename} (could not detect file type)`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      detectionErrors.push(`${file.filename} (validation error: ${errorMessage})`);
    }
  }

  // Only throw errors for explicitly unsupported files (not undetectable ones)
  const explicitlyUnsupported = unsupportedFiles.filter(filename => {
    const ext = filename.toLowerCase().split('.').pop();
    return ext && !['pdf', 'docx', 'xlsx', 'csv', 'txt'].includes(ext);
  });

  if (explicitlyUnsupported.length > 0) {
    throw new UnsupportedFileTypeError(
      explicitlyUnsupported[0],
      ['pdf', 'docx', 'xlsx', 'csv', 'txt']
    );
  }

  // Log warnings for detection issues (non-blocking)
  if (detectionErrors.length > 0) {
    console.warn('File type detection issues:', detectionErrors);
  }
}
