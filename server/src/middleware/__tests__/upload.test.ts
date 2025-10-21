import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateMultipartUpload, 
  getValidatedFile, 
  validateExtractedFiles 
} from '../upload';
import { 
  FileSizeError, 
  FileTypeError, 
  NoFileError, 
  FileValidationError,
  UnsupportedFileTypeError 
} from '../../errors/validation';
import { PROCESSING_LIMITS } from '../../utils/constants';

// Mock the file-type validation
vi.mock('../../utils/file-types', () => ({
  validateFileBuffer: vi.fn(),
  isSupportedFileType: vi.fn()
}));

import { validateFileBuffer } from '../../utils/file-types';

describe('Upload Middleware', () => {
  describe('validateMultipartUpload', () => {
    const mockRequest = {
      id: 'test-request-id'
    } as any;

    const mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should throw NoFileError when no file is provided', async () => {
      // Mock request.file() to return undefined
      const requestWithNoFile = {
        ...mockRequest,
        file: vi.fn().mockResolvedValue(undefined)
      };

      await expect(validateMultipartUpload(requestWithNoFile, mockReply))
        .rejects.toThrow(NoFileError);
    });

    it('should throw FileSizeError when file is too large', async () => {
      const largeFile = {
        filename: 'large.zip',
        size: PROCESSING_LIMITS.MAX_FILE_SIZE + 1,
        mimetype: 'application/zip',
        encoding: '7bit',
        file: {} as any
      };

      const requestWithLargeFile = {
        ...mockRequest,
        file: vi.fn().mockResolvedValue(largeFile)
      };

      await expect(validateMultipartUpload(requestWithLargeFile, mockReply))
        .rejects.toThrow(FileSizeError);
    });

    it('should throw FileTypeError for non-ZIP files', async () => {
      const nonZipFile = {
        filename: 'document.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        encoding: '7bit',
        file: {} as any
      };

      const requestWithNonZip = {
        ...mockRequest,
        file: vi.fn().mockResolvedValue(nonZipFile)
      };

      await expect(validateMultipartUpload(requestWithNonZip, mockReply))
        .rejects.toThrow(FileTypeError);
    });

    it('should throw FileValidationError for empty files', async () => {
      const emptyFile = {
        filename: 'empty.zip',
        size: 0,
        mimetype: 'application/zip',
        encoding: '7bit',
        file: {} as any
      };

      const requestWithEmptyFile = {
        ...mockRequest,
        file: vi.fn().mockResolvedValue(emptyFile)
      };

      await expect(validateMultipartUpload(requestWithEmptyFile, mockReply))
        .rejects.toThrow(FileValidationError);
    });

    it('should validate and store file data for valid ZIP', async () => {
      const validZipFile = {
        filename: 'documents.zip',
        size: 1024,
        mimetype: 'application/zip',
        encoding: '7bit',
        file: {} as any
      };

      const requestWithValidZip = {
        ...mockRequest,
        file: vi.fn().mockResolvedValue(validZipFile)
      };

      const result = await validateMultipartUpload(requestWithValidZip, mockReply);

      expect(result).toEqual(validZipFile);
      expect(requestWithValidZip.validatedFile).toEqual({
        filename: 'documents.zip',
        size: 1024,
        mimetype: 'application/zip',
        encoding: '7bit',
        file: {} as any
      });
    });

    it('should handle case-insensitive ZIP extensions', async () => {
      const zipWithCaps = {
        filename: 'DOCUMENTS.ZIP',
        size: 1024,
        mimetype: 'application/zip',
        encoding: '7bit',
        file: {} as any
      };

      const requestWithCapsZip = {
        ...mockRequest,
        file: vi.fn().mockResolvedValue(zipWithCaps)
      };

      const result = await validateMultipartUpload(requestWithCapsZip, mockReply);

      expect(result).toEqual(zipWithCaps);
    });
  });

  describe('getValidatedFile', () => {
    it('should return validated file data from request', () => {
      const mockFile = {
        filename: 'test.zip',
        size: 1024,
        mimetype: 'application/zip',
        encoding: '7bit',
        file: {} as any
      };

      const request = {
        validatedFile: mockFile
      } as any;

      const result = getValidatedFile(request);
      expect(result).toEqual(mockFile);
    });
  });

  describe('validateExtractedFiles', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should throw error when no files are provided', async () => {
      await expect(validateExtractedFiles([]))
        .rejects.toThrow(FileValidationError);
    });

    it('should throw error when too many files are provided', async () => {
      const tooManyFiles = Array.from({ length: PROCESSING_LIMITS.MAX_FILES + 1 }, (_, i) => ({
        filename: `file${i}.pdf`,
        buffer: Buffer.from('content'),
        mimetype: 'application/pdf'
      }));

      await expect(validateExtractedFiles(tooManyFiles))
        .rejects.toThrow(FileValidationError);
    });

    it('should validate supported files successfully', async () => {
      const supportedFiles = [
        { filename: 'doc1.pdf', buffer: Buffer.from('pdf content'), mimetype: 'application/pdf' },
        { filename: 'doc2.docx', buffer: Buffer.from('docx content'), mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ];

      vi.mocked(validateFileBuffer)
        .mockResolvedValueOnce({ isValid: true, extension: 'pdf', mimeType: 'application/pdf', isSupported: true, detected: { ext: 'pdf', mime: 'application/pdf' } })
        .mockResolvedValueOnce({ isValid: true, extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', isSupported: true, detected: { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });

      await expect(validateExtractedFiles(supportedFiles)).resolves.not.toThrow();
    });

    it('should throw error for unsupported files', async () => {
      const unsupportedFiles = [
        { filename: 'malicious.exe', buffer: Buffer.from('executable content'), mimetype: 'application/x-msdownload' }
      ];

      vi.mocked(validateFileBuffer)
        .mockResolvedValue({ isValid: false, extension: 'exe', mimeType: 'application/x-msdownload', isSupported: false, detected: { ext: 'exe', mime: 'application/x-msdownload' } });

      await expect(validateExtractedFiles(unsupportedFiles))
        .rejects.toThrow(UnsupportedFileTypeError);
    });

    it('should handle file validation errors gracefully', async () => {
      const filesWithErrors = [
        { filename: 'corrupted.pdf', buffer: Buffer.from('corrupted content'), mimetype: 'application/pdf' }
      ];

      vi.mocked(validateFileBuffer)
        .mockRejectedValue(new Error('Validation failed'));

      // Should not throw, but log warnings
      await expect(validateExtractedFiles(filesWithErrors)).resolves.not.toThrow();
    });

    it('should handle files that cannot be detected', async () => {
      const undetectableFiles = [
        { filename: 'unknown.txt', buffer: Buffer.from('unknown content'), mimetype: 'text/plain' }
      ];

      vi.mocked(validateFileBuffer)
        .mockResolvedValue({ isValid: false, extension: '', mimeType: '', isSupported: false, detected: { ext: undefined, mime: undefined } });

      // Should not throw, but log warnings
      await expect(validateExtractedFiles(undetectableFiles)).resolves.not.toThrow();
    });

    it('should validate mixed supported and unsupported files', async () => {
      const mixedFiles = [
        { filename: 'valid.pdf', buffer: Buffer.from('pdf content'), mimetype: 'application/pdf' },
        { filename: 'invalid.exe', buffer: Buffer.from('executable content'), mimetype: 'application/x-msdownload' }
      ];

      vi.mocked(validateFileBuffer)
        .mockResolvedValueOnce({ isValid: true, extension: 'pdf', mimeType: 'application/pdf', isSupported: true, detected: { ext: 'pdf', mime: 'application/pdf' } })
        .mockResolvedValueOnce({ isValid: false, extension: 'exe', mimeType: 'application/x-msdownload', isSupported: false, detected: { ext: 'exe', mime: 'application/x-msdownload' } });

      await expect(validateExtractedFiles(mixedFiles))
        .rejects.toThrow(UnsupportedFileTypeError);
    });

    it('should handle files at the limit', async () => {
      const filesAtLimit = Array.from({ length: PROCESSING_LIMITS.MAX_FILES }, (_, i) => ({
        filename: `file${i}.pdf`,
        buffer: Buffer.from('content'),
        mimetype: 'application/pdf'
      }));

      vi.mocked(validateFileBuffer)
        .mockResolvedValue({ isValid: true, extension: 'pdf', mimeType: 'application/pdf', isSupported: true, detected: { ext: 'pdf', mime: 'application/pdf' } });

      await expect(validateExtractedFiles(filesAtLimit)).resolves.not.toThrow();
    });
  });
});
