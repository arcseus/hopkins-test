import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  loadPrompt, 
  loadDocumentAnalysisSystemPrompt, 
  loadDocumentAnalysisUserPromptTemplate, 
  buildStructuredDocumentAnalysisUserPrompt
} from '../prompts';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn()
}));

// Mock path module
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/'))
}));

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Prompt Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadPrompt', () => {
    it('should load prompt file successfully', () => {
      const mockContent = 'Test prompt content';
      vi.mocked(readFileSync).mockReturnValue(mockContent);
      vi.mocked(join).mockReturnValue('src/prompts/test.txt');

      const result = loadPrompt('test.txt');

      expect(result).toBe(mockContent);
      expect(join).toHaveBeenCalledWith(expect.any(String), '..', 'prompts', 'test.txt');
      expect(readFileSync).toHaveBeenCalledWith('src/prompts/test.txt', 'utf-8');
    });

    it('should throw error when file cannot be read', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });
      vi.mocked(join).mockReturnValue('src/prompts/missing.txt');

      expect(() => loadPrompt('missing.txt')).toThrow('Failed to load prompt file \'missing.txt\': File not found');
    });

    it('should trim whitespace from loaded content', () => {
      const mockContent = '  \n  Test prompt content  \n  ';
      vi.mocked(readFileSync).mockReturnValue(mockContent);
      vi.mocked(join).mockReturnValue('src/prompts/test.txt');

      const result = loadPrompt('test.txt');

      expect(result).toBe('Test prompt content');
    });
  });

  describe('loadSystemPrompt', () => {
    it('should load system prompt file', () => {
      const mockContent = 'System prompt content';
      vi.mocked(readFileSync).mockReturnValue(mockContent);
      vi.mocked(join).mockReturnValue('src/prompts/document_analysis_system.txt');

      const result = loadDocumentAnalysisSystemPrompt();

      expect(result).toBe(mockContent);
      expect(join).toHaveBeenCalledWith(expect.any(String), '..', 'prompts', 'document_analysis_system.txt');
    });
  });

  describe('loadDocumentAnalysisUserPromptTemplate', () => {
    it('should load user prompt template file', () => {
      const mockContent = 'User prompt template';
      vi.mocked(readFileSync).mockReturnValue(mockContent);
      vi.mocked(join).mockReturnValue('src/prompts/document_analysis_user.txt');

      const result = loadDocumentAnalysisUserPromptTemplate();

      expect(result).toBe(mockContent);
      expect(join).toHaveBeenCalledWith(expect.any(String), '..', 'prompts', 'document_analysis_user.txt');
    });
  });

  describe('buildStructuredDocumentAnalysisUserPrompt', () => {
    it('should build structured prompt with template variables', () => {
      const mockTemplate = 'Document meta:\n- filename: {{filename}}\n- category: {{category}}\n\nDocument text (truncated):\n{{text}}';
      const filename = 'test-document.pdf';
      const category = 'financial';
      const text = 'This is the document content.';
      
      vi.mocked(readFileSync).mockReturnValue(mockTemplate);
      vi.mocked(join).mockReturnValue('src/prompts/document_analysis_user.txt');

      const result = buildStructuredDocumentAnalysisUserPrompt(filename, category, text);

      expect(result).toBe('Document meta:\n- filename: test-document.pdf\n- category: financial\n\nDocument text (truncated):\nThis is the document content.');
    });

    it('should handle special characters in template variables', () => {
      const mockTemplate = '{{filename}} - {{category}} - {{text}}';
      const filename = 'file with spaces & symbols.pdf';
      const category = 'legal/contract';
      const text = 'Content with "quotes" and \'apostrophes\'.';
      
      vi.mocked(readFileSync).mockReturnValue(mockTemplate);
      vi.mocked(join).mockReturnValue('src/prompts/document_analysis_user.txt');

      const result = buildStructuredDocumentAnalysisUserPrompt(filename, category, text);

      expect(result).toBe('file with spaces & symbols.pdf - legal/contract - Content with "quotes" and \'apostrophes\'.');
    });
  });

});
