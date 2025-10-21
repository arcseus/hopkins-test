import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeLLM, validateLLMService, DEFAULT_LLM_CONFIG } from '../llm';

// Mock OpenAI
const mockCreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}));

describe('LLM Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('invokeLLM', () => {
    it('should make successful LLM call with default config', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Test response from LLM'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await invokeLLM('Test prompt');

      expect(result).toBe('Test response from LLM');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0,
        max_tokens: 700,
        response_format: { type: 'json_object' }
      });
    });

    it('should use custom configuration when provided', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Custom config response'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const customConfig = {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 2000,
        responseFormat: 'text' as const
      };

      await invokeLLM('Test prompt', customConfig);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.5,
        max_tokens: 2000
        // No response_format when responseFormat is 'text'
      });
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(invokeLLM('Test prompt')).rejects.toThrow('OPENAI_API_KEY environment variable is not set');
    });

    it('should throw error when LLM returns empty response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(invokeLLM('Test prompt')).rejects.toThrow('LLM returned empty response');
    });

    it('should handle API errors with specific messages', async () => {
      mockCreate.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(invokeLLM('Test prompt')).rejects.toThrow('OpenAI API rate limit exceeded. Please try again later.');
    });

    it('should enable JSON mode by default', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '{"result": "test"}'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      await invokeLLM('Test prompt');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0,
        max_tokens: 700,
        response_format: { type: 'json_object' }
      });
    });
  });

  describe('validateLLMService', () => {
    it('should return true when service is properly configured', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Hello'
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await validateLLMService();
      expect(result).toBe(true);
    });

    it('should return false when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await validateLLMService();
      expect(result).toBe(false);
    });

    it('should return false when LLM call fails', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const result = await validateLLMService();
      expect(result).toBe(false);
    });
  });

  describe('DEFAULT_LLM_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_LLM_CONFIG).toEqual({
        model: 'gpt-4.1-mini',
        temperature: 0,
        maxTokens: 700,
        responseFormat: 'json'
      });
    });
  });
});
