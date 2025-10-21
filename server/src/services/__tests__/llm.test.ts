import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeLLM, analyzeDocumentWithJSONGuard, validateLLMService, DEFAULT_LLM_CONFIG } from '../llm';

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
        max_tokens: 500,
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

      await invokeLLM('Test prompt', null, customConfig);

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
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });
    });
  });

  describe('analyzeDocumentWithJSONGuard', () => {
    it('should return valid JSON on first attempt', async () => {
      const validDocResult = {
        doc: 'test-document.pdf',
        category: 'financial',
        facts: ['Document contains financial statements', 'Revenue figures are present'],
        red_flags: ['Missing audit opinion']
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify(validDocResult)
          }
        }]
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await analyzeDocumentWithJSONGuard('Test document');

      expect(result).toBe(JSON.stringify(validDocResult));
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry once on invalid JSON', async () => {
      const invalidResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      const validDocResult = {
        doc: 'test-document.pdf',
        category: 'legal',
        facts: ['Contract terms are present', 'Legal obligations defined'],
        red_flags: []
      };

      const validResponse = {
        choices: [{
          message: {
            content: JSON.stringify(validDocResult)
          }
        }]
      };

      mockCreate
        .mockResolvedValueOnce(invalidResponse)
        .mockResolvedValueOnce(validResponse);

      const result = await analyzeDocumentWithJSONGuard('Test document');

      expect(result).toBe(JSON.stringify(validDocResult));
      expect(mockCreate).toHaveBeenCalledTimes(2);
      
      // Check retry call includes original user message, assistant message, and correction prompt
      const retryCall = mockCreate.mock.calls[1][0];
      expect(retryCall.messages).toHaveLength(4);
      expect(retryCall.messages[1].role).toBe('user');
      expect(retryCall.messages[2].role).toBe('assistant');
      expect(retryCall.messages[2].content).toBe('Invalid JSON response');
      expect(retryCall.messages[3].content).toBe('Your last output was invalid JSON. Return only valid JSON matching the schema, no prose.');
    });

    it('should throw error if both attempts return invalid JSON', async () => {
      const invalidResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      mockCreate.mockResolvedValue(invalidResponse);

      await expect(analyzeDocumentWithJSONGuard('Test document')).rejects.toThrow('LLM returned invalid JSON after retry');
      expect(mockCreate).toHaveBeenCalledTimes(2);
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
        maxTokens: 500,
        responseFormat: 'json'
      });
    });
  });
});
