/**
 * Custom error types for validation failures
 * Provides structured error handling with specific error codes and messages
 */

export class ValidationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string, statusCode: number = 400, details?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class FileValidationError extends ValidationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FILE_VALIDATION_ERROR', 400, details);
  }
}

export class FileSizeError extends FileValidationError {
  constructor(actualSize: number, maxSize: number) {
    super(
      `File size ${actualSize} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      {
        actualSize,
        maxSize,
        maxSizeMB: Math.round(maxSize / (1024 * 1024))
      }
    );
  }
}

export class FileTypeError extends FileValidationError {
  constructor(filename: string, allowedTypes: string[] = ['.zip']) {
    super(
      `File type not supported. Only ${allowedTypes.join(', ')} files are allowed`,
      {
        filename,
        allowedTypes,
        detectedExtension: filename.toLowerCase().split('.').pop()
      }
    );
  }
}

export class UnsupportedFileTypeError extends FileValidationError {
  constructor(filename: string, supportedTypes: string[] = ['.pdf', '.docx', '.xlsx', '.csv', '.txt']) {
    super(
      `Unsupported file type. Only ${supportedTypes.join(', ')} files are supported`,
      {
        filename,
        supportedTypes,
        detectedExtension: filename.toLowerCase().split('.').pop()
      }
    );
  }
}

export class MultipartError extends ValidationError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'MULTIPART_ERROR', 400, details);
  }
}

export class NoFileError extends MultipartError {
  constructor() {
    super('No file provided in request', {
      required: true,
      fieldName: 'file'
    });
  }
}
