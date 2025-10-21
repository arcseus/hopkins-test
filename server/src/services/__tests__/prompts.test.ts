import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  loadPrompt, 
  loadSystemPrompt, 
  loadUserPromptTemplate, 
  buildUserPrompt, 
  buildAnalysisPrompts 
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

      const result = loadSystemPrompt();

      expect(result).toBe(mockContent);
      expect(join).toHaveBeenCalledWith(expect.any(String), '..', 'prompts', 'document_analysis_system.txt');
    });
  });

  describe('loadUserPromptTemplate', () => {
    it('should load user prompt template file', () => {
      const mockContent = 'User prompt template';
      vi.mocked(readFileSync).mockReturnValue(mockContent);
      vi.mocked(join).mockReturnValue('src/prompts/document_analysis_user.txt');

      const result = loadUserPromptTemplate();

      expect(result).toBe(mockContent);
      expect(join).toHaveBeenCalledWith(expect.any(String), '..', 'prompts', 'document_analysis_user.txt');
    });
  });

  describe('buildUserPrompt', () => {
    it('should combine template with document data', () => {
      const mockTemplate = 'Please analyze the following documents:';
      const documentData = 'Document content here';
      
      vi.mocked(readFileSync).mockReturnValue(mockTemplate);
      vi.mocked(join).mockReturnValue('src/prompts/document_analysis_user.txt');

      const result = buildUserPrompt(documentData);

      expect(result).toBe(`${mockTemplate}\n\n${documentData}`);
    });
  });

  describe('buildAnalysisPrompts', () => {
    it('should build complete prompt pair', () => {
      const mockSystemPrompt = 'System prompt content';
      const mockUserTemplate = 'User template content:';
      const documentData = 'Document content';
      
      vi.mocked(readFileSync)
        .mockReturnValueOnce(mockSystemPrompt)  // First call for system prompt
        .mockReturnValueOnce(mockUserTemplate); // Second call for user template
      vi.mocked(join)
        .mockReturnValueOnce('src/prompts/document_analysis_system.txt')
        .mockReturnValueOnce('src/prompts/document_analysis_user.txt');

      const result = buildAnalysisPrompts(documentData);

      expect(result).toEqual({
        systemPrompt: mockSystemPrompt,
        userPrompt: `${mockUserTemplate}\n\n${documentData}`
      });
    });
  });
});
