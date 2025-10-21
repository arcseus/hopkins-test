import { describe, it, expect } from 'vitest';
import { truncateTXT } from '../file-truncation';

describe('File Truncation - Core Functionality', () => {
  describe('Text Normalization', () => {
    it('should normalize text with various whitespace issues', async () => {
      const messyText = 'Hello   world\r\n\n\n\nThis is a test\t\twith tabs';
      const result = await truncateTXT(Buffer.from(messyText));
      
      expect(result.text).toBe('Hello world\n\nThis is a test with tabs');
      expect(result.truncated).toBe(false);
    });

    it('should strip NUL characters', async () => {
      const textWithNuls = 'Hello\u0000world\u0000test';
      const result = await truncateTXT(Buffer.from(textWithNuls));
      
      expect(result.text).toBe('Helloworldtest');
    });

    it('should convert Windows line endings to Unix', async () => {
      const windowsText = 'Line 1\r\nLine 2\r\nLine 3';
      const result = await truncateTXT(Buffer.from(windowsText));
      
      expect(result.text).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should collapse multiple spaces and tabs', async () => {
      const spacedText = 'Word1    Word2\t\tWord3   \t  Word4';
      const result = await truncateTXT(Buffer.from(spacedText));
      
      expect(result.text).toBe('Word1 Word2 Word3 Word4');
    });

    it('should limit consecutive blank lines to 2', async () => {
      const multiBlankText = 'Line 1\n\n\n\n\nLine 2';
      const result = await truncateTXT(Buffer.from(multiBlankText));
      
      expect(result.text).toBe('Line 1\n\nLine 2');
    });

    it('should trim leading and trailing whitespace', async () => {
      const paddedText = '   \n  Content here  \n  ';
      const result = await truncateTXT(Buffer.from(paddedText));
      
      expect(result.text).toBe('Content here');
    });
  });

  describe('Text Truncation', () => {
    it('should not truncate text within limits', async () => {
      const shortText = 'This is a short text';
      const result = await truncateTXT(Buffer.from(shortText));
      
      expect(result.text).toBe('This is a short text');
      expect(result.truncated).toBe(false);
      expect(result.originalLength).toBe(shortText.length);
    });

    it('should truncate text exceeding limits with word boundary preservation', async () => {
      const longText = 'A '.repeat(10000) + 'final word';
      const result = await truncateTXT(Buffer.from(longText));
      
      expect(result.text.length).toBeLessThanOrEqual(15000);
      expect(result.text).toMatch(/\.\.\.$/);
      expect(result.truncated).toBe(true);
    });

    it('should preserve word boundaries when truncating', async () => {
      // Create a very long text that will definitely be truncated
      const longText = 'Word '.repeat(20000); // This will be much longer than 15000 chars
      const result = await truncateTXT(Buffer.from(longText));
      
      expect(result.text).not.toMatch(/Word$/); // Should not cut mid-word
      expect(result.text).toMatch(/\.\.\.$/);
      expect(result.truncated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', async () => {
      const result = await truncateTXT(Buffer.from(''));

      expect(result.text).toBe('');
      expect(result.truncated).toBe(false);
      expect(result.originalLength).toBe(0);
    });

    it('should handle files with only whitespace', async () => {
      const whitespaceText = '   \n\n\t\t   ';
      const result = await truncateTXT(Buffer.from(whitespaceText));

      expect(result.text).toBe('');
      expect(result.truncated).toBe(false);
    });

    it('should handle very long text that needs truncation', async () => {
      const veryLongText = 'A '.repeat(20000) + 'final word';
      const result = await truncateTXT(Buffer.from(veryLongText));

      expect(result.text.length).toBeLessThanOrEqual(15000);
      expect(result.truncated).toBe(true);
      expect(result.originalLength).toBe(veryLongText.length);
    });

    it('should handle UTF-8 text correctly', async () => {
      const utf8Text = 'Hello 世界 🌍';
      const result = await truncateTXT(Buffer.from(utf8Text, 'utf-8'));

      expect(result.text).toBe('Hello 世界 🌍');
      expect(result.truncated).toBe(false);
    });
  });

  describe('Truncation Logic', () => {
    it('should truncate exactly at limit when no word boundary found', async () => {
      const text = 'A'.repeat(15001); // Exactly one character over limit
      const result = await truncateTXT(Buffer.from(text));

      expect(result.text.length).toBe(15000);
      expect(result.text).toMatch(/\.\.\.$/);
      expect(result.truncated).toBe(true);
    });

    it('should find word boundary when available', async () => {
      const text = 'Word1 Word2 Word3 ' + 'A'.repeat(14990);
      const result = await truncateTXT(Buffer.from(text));

      expect(result.text.length).toBeLessThanOrEqual(15000);
      expect(result.text).toMatch(/Word3/); // Should include complete words
      expect(result.text).toMatch(/\.\.\.$/);
      expect(result.truncated).toBe(true);
    });

    it('should handle text with no spaces', async () => {
      const text = 'A'.repeat(20000);
      const result = await truncateTXT(Buffer.from(text));

      expect(result.text.length).toBe(15000);
      expect(result.text).toMatch(/\.\.\.$/);
      expect(result.truncated).toBe(true);
    });
  });
});
