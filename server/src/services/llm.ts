/**
 * LLM service for document analysis using OpenAI
 * Provides a clean interface for making LLM calls with proper error handling
 */

import OpenAI from 'openai';

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

/**
 * Invokes the LLM for document analysis using the configured prompts
 * 
 * @param documentData - The document content to analyze
 * @param config - Optional configuration override
 * @returns Promise<string> - The LLM analysis response in JSON format
 * @throws Error if LLM call fails
 */
export async function analyzeDocument(
  documentData: string,
  config: Partial<LLMConfig> = {}
): Promise<string> {
  const { buildAnalysisPrompts } = await import('./prompts');
  const { systemPrompt, userPrompt } = buildAnalysisPrompts(documentData);
  
  // Use system prompt as the first message
  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt
    },
    {
      role: 'user' as const,
      content: userPrompt
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
