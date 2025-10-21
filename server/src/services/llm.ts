/**
 * LLM service for document analysis using OpenAI
 * Provides a clean interface for making LLM calls with proper error handling
 */

import OpenAI from 'openai';
import { InvalidJSONError, validateJSONWithZod } from '../utils/json-guard';
import { DocResultSchema } from '../schemas/document-analysis';

// Initialize OpenAI client (lazy initialization for testing)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Configuration for LLM calls
 */
export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: 'text' | 'json';
}

/**
 * Default LLM configuration
 */
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  model: 'gpt-4.1-mini', // Cost-effective model for document analysis
  temperature: 0,       // Zero temperature for deterministic, factual responses
  maxTokens: 700,       // Standard limit for document analysis calls
  responseFormat: 'json'  // JSON mode enabled by default for structured responses
};

/**
 * Invokes the LLM for document analysis with JSON guard and retry
 * 
 * @param documentData - The document content to analyze
 * @param config - Optional configuration override
 * @returns Promise<string> - The LLM analysis response in valid JSON format
 * @throws Error if LLM call fails or JSON is invalid after retry
 */
export async function analyzeDocumentWithJSONGuard(
  documentData: string,
  config: Partial<LLMConfig> = {}
): Promise<string> {
  const { loadDocumentAnalysisSystemPrompt } = await import('./prompts');
  const systemPrompt = loadDocumentAnalysisSystemPrompt();
  
  // Use system prompt as the first message
  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt
    },
    {
      role: 'user' as const,
      content: documentData
    }
  ];
  
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    // Merge provided config with defaults
    const finalConfig = { ...DEFAULT_LLM_CONFIG, ...config };
    
    // Make the LLM call
    const client = getOpenAIClient();
    const requestConfig: any = {
      model: finalConfig.model,
      messages,
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens
    };

    // Add JSON mode if requested
    if (finalConfig.responseFormat === 'json') {
      requestConfig.response_format = { type: 'json_object' };
    }

    const response = await client.chat.completions.create(requestConfig);
    
    // Extract and validate the response content
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('LLM returned empty response');
    }
    
    // Validate JSON with Zod schema
    const validation = validateJSONWithZod(content, DocResultSchema);
    if (validation.success) {
      return content;
    }
    
    // JSON is invalid, retry once with correction prompt
    // Include the original conversation context to maintain continuity
    const retryMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: documentData
      },
      {
        role: 'assistant' as const,
        content: content
      },
      {
        role: 'user' as const,
        content: 'Your last output was invalid JSON. Return only valid JSON matching the schema, no prose.'
      }
    ];
    
    const retryResponse = await client.chat.completions.create({
      ...requestConfig,
      messages: retryMessages
    });
    
    const retryContent = retryResponse.choices[0]?.message?.content;
    
    if (!retryContent) {
      throw new Error('LLM returned empty response on retry');
    }
    
    // Validate retry response with Zod schema
    const retryValidation = validateJSONWithZod(retryContent, DocResultSchema);
    if (retryValidation.success) {
      return retryContent;
    }
    
    // Both attempts failed
    throw new InvalidJSONError(
      `LLM returned invalid JSON after retry. Original: ${validation.error}, Retry: ${retryValidation.error}`,
      content
    );
    
  } catch (error) {
    // Enhanced error handling for different failure scenarios
    if (error instanceof InvalidJSONError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
      if (error.message.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      }
      if (error.message.includes('model')) {
        throw new Error('OpenAI model is not available or invalid');
      }
    }
    
    // Re-throw with context
    throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates that the LLM service is properly configured
 * 
 * @returns Promise<boolean> - True if service is ready
 */
export async function validateLLMService(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return false;
    }
    
    // Test with a simple prompt to verify connectivity
    await invokeLLM('Hello', { maxTokens: 10 });
    return true;
    
  } catch {
    return false;
  }
}

/**
 * Invokes the LLM with the provided prompt and configuration
 * 
 * @param prompt - The prompt to send to the LLM
 * @param config - Optional configuration override
 * @returns Promise<string> - The LLM response
 * @throws Error if LLM call fails
 */
export async function invokeLLM(
    prompt: string, 
    config: Partial<LLMConfig> = {}
  ): Promise<string> {
    try {
      // Merge provided config with defaults
      const finalConfig = { ...DEFAULT_LLM_CONFIG, ...config };
      
      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      
      // Make the LLM call
      const client = getOpenAIClient();
      const requestConfig: any = {
        model: finalConfig.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.maxTokens
      };
  
      // Add JSON mode if requested
      if (finalConfig.responseFormat === 'json') {
        requestConfig.response_format = { type: 'json_object' };
      }
  
      const response = await client.chat.completions.create(requestConfig);
      
      // Extract and return the response content
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('LLM returned empty response');
      }
      
      return content;
      
    } catch (error) {
      // Enhanced error handling for different failure scenarios
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key is invalid or missing');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing.');
        }
        if (error.message.includes('model')) {
          throw new Error('OpenAI model is not available or invalid');
        }
      }
      
      // Re-throw with context
      throw new Error(`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }