import { describe, it, expect, vi } from 'vitest';
import { 
  validateFileBuffer, 
  getFileExtension, 
  isSupportedFileType,
  SUPPORTED_FILE_TYPES 
} from '../file-types';

// Mock file-type library
vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn()
}));

import { fileTypeFromBuffer } from 'file-type';

describe('File Type Validation', () => {
  describe('validateFileBuffer', () => {
    it('should validate supported PDF file', async () => {
      const mockBuffer = Buffer.from('PDF content');
      const mockFilename = 'document.pdf';
      
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'pdf',
        mime: 'application/pdf'
      });

      const result = await validateFileBuffer(mockBuffer, mockFilename);

      expect(result).toEqual({
        isValid: true,
        extension: 'pdf',
        mimeType: 'application/pdf',
        isSupported: true,
        detected: {
          ext: 'pdf',
          mime: 'application/pdf'
        }
      });
    });

    it('should validate supported DOCX file', async () => {
      const mockBuffer = Buffer.from('DOCX content');
      const mockFilename = 'document.docx';
      
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'docx',
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await validateFileBuffer(mockBuffer, mockFilename);

      expect(result.isValid).toBe(true);
      expect(result.extension).toBe('docx');
      expect(result.isSupported).toBe(true);
    });

    it('should reject unsupported file type', async () => {
      const mockBuffer = Buffer.from('Executable content');
      const mockFilename = 'malicious.exe';
      
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/x-msdownload'
      });

      const result = await validateFileBuffer(mockBuffer, mockFilename);

      expect(result.isValid).toBe(false);
      expect(result.extension).toBe('exe');
      expect(result.isSupported).toBe(false);
    });

    it('should handle file-type detection failure with fallback to extension', async () => {
      const mockBuffer = Buffer.from('Unknown content');
      const mockFilename = 'unknown.txt';
      
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      const result = await validateFileBuffer(mockBuffer, mockFilename);

      // With hybrid approach, it falls back to extension detection
      expect(result.isValid).toBe(true); // txt is supported and contains valid text
      expect(result.extension).toBe('txt');
      expect(result.isSupported).toBe(true);
      expect(result.detected.ext).toBeUndefined(); // No content-based detection
    });

    it('should handle file-type library error with fallback to extension', async () => {
      const mockBuffer = Buffer.from('Corrupted content');
      const mockFilename = 'corrupted.pdf';
      
      vi.mocked(fileTypeFromBuffer).mockRejectedValue(new Error('Detection failed'));

      const result = await validateFileBuffer(mockBuffer, mockFilename);

      // With hybrid approach, it falls back to extension detection
      expect(result.isValid).toBe(true); // pdf is supported
      expect(result.extension).toBe('pdf');
      expect(result.isSupported).toBe(true);
    });

    it('should fail when both content detection and extension are unsupported', async () => {
      const mockBuffer = Buffer.from('Binary content');
      const mockFilename = 'malicious.exe';
      
      vi.mocked(fileTypeFromBuffer).mockRejectedValue(new Error('Detection failed'));

      const result = await validateFileBuffer(mockBuffer, mockFilename);

      // Extension-based fallback should reject unsupported files
      expect(result.isValid).toBe(false);
      expect(result.extension).toBe('exe');
      expect(result.isSupported).toBe(false);
    });

    it('should validate all supported file types', async () => {
      const supportedTypes = ['pdf', 'docx', 'xlsx', 'csv', 'txt'];
      
      for (const type of supportedTypes) {
        vi.mocked(fileTypeFromBuffer).mockResolvedValue({
          ext: type,
          mime: `application/${type}`
        });

        const result = await validateFileBuffer(Buffer.from('content'), `file.${type}`);
        
        expect(result.isValid).toBe(true);
        expect(result.extension).toBe(type);
        expect(result.isSupported).toBe(true);
      }
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('spreadsheet.xlsx')).toBe('xlsx');
      expect(getFileExtension('data.csv')).toBe('csv');
    });

    it('should handle filenames without extensions', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('file')).toBe('');
    });

    it('should handle multiple dots in filename', () => {
      expect(getFileExtension('document.backup.pdf')).toBe('pdf');
      expect(getFileExtension('file.v1.2.xlsx')).toBe('xlsx');
    });

    it('should be case insensitive', () => {
      expect(getFileExtension('Document.PDF')).toBe('pdf');
      expect(getFileExtension('SPREADSHEET.XLSX')).toBe('xlsx');
    });
  });

  describe('isSupportedFileType', () => {
    it('should return true for supported file types', () => {
      expect(isSupportedFileType('document.pdf')).toBe(true);
      expect(isSupportedFileType('spreadsheet.xlsx')).toBe(true);
      expect(isSupportedFileType('data.csv')).toBe(true);
      expect(isSupportedFileType('text.txt')).toBe(true);
      expect(isSupportedFileType('document.docx')).toBe(true);
    });

    it('should return false for unsupported file types', () => {
      expect(isSupportedFileType('image.jpg')).toBe(false);
      expect(isSupportedFileType('executable.exe')).toBe(false);
      expect(isSupportedFileType('archive.zip')).toBe(false);
      expect(isSupportedFileType('video.mp4')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isSupportedFileType('Document.PDF')).toBe(true);
      expect(isSupportedFileType('SPREADSHEET.XLSX')).toBe(true);
      expect(isSupportedFileType('Image.JPG')).toBe(false);
    });

    it('should handle filenames without extensions', () => {
      expect(isSupportedFileType('README')).toBe(false);
      expect(isSupportedFileType('file')).toBe(false);
    });
  });

  describe('SUPPORTED_FILE_TYPES constant', () => {
    it('should contain all expected file types', () => {
      expect(SUPPORTED_FILE_TYPES).toEqual(['pdf', 'docx', 'xlsx', 'csv', 'txt']);
    });

    it('should have correct length', () => {
      expect(SUPPORTED_FILE_TYPES).toHaveLength(5);
    });
  });
});
