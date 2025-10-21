import { readFileSync } from 'fs';
import { join } from 'path';
import { invokeLLM } from './llm';
import { SummaryStringSchema } from '../schemas/summary';
import { withRetry } from '../utils/retry';
import { logger } from '../logger';

/**
 * Loads the summary system prompt from file
 */
export function loadSummarySystemPrompt(): string {
  const promptPath = join(__dirname, '../prompts/summary_system.txt');
  return readFileSync(promptPath, 'utf-8');
}

/**
 * Loads the summary user prompt template from file
 */
export function loadSummaryUserPromptTemplate(): string {
  const promptPath = join(__dirname, '../prompts/summary_user.txt');
  return readFileSync(promptPath, 'utf-8');
}

/**
 * Builds the summary user prompt with analysis data
 */
export function buildSummaryUserPrompt(docs: any[]): string {
  const template = loadSummaryUserPromptTemplate();
  return template.replace('{{json_array}}', JSON.stringify(docs, null, 2));
}

/**
 * Generates summary text using LLM with retry logic and validation
 */
export async function getSummaryText(docs: any[]): Promise<string> {
  const systemPrompt = loadSummarySystemPrompt();
  const userPrompt = buildSummaryUserPrompt(docs);
  
  let result = await invokeLLM(userPrompt, systemPrompt, {
    responseFormat: 'text',
    maxTokens: 700,
    temperature: 0
  });
  
  let validation = SummaryStringSchema.safeParse(result);
  if (validation.success) {
    return validation.data;
  }
  
  // Retry with correction prompt - build conversation context
  const retryPrompt = `Your previous response was too long or short. Please provide exactly 300-400 words. Return only the summary text, no additional words or formatting.`;
  
  // Create conversation with context
  const conversationPrompt = `${userPrompt}\n\nAssistant: ${result}\n\nUser: ${retryPrompt}`;
  
  // This is a bootleg implementation of what I implemented for doc Analysis because it's not in the spec but I believe it holds value even in this form.
  result = await invokeLLM(conversationPrompt, systemPrompt, {
    responseFormat: 'text',
    maxTokens: 700,
    temperature: 0
  });
  
  validation = SummaryStringSchema.safeParse(result);
  if (!validation.success) {
    // Log fallback and return as-is
    logger.warn({ 
      wordCount: result.trim().split(/\s+/).length,
      reason: 'Summary validation failed after retry, returning as-is'
    }, 'Summary fallback: returned invalid length');
    return result;
  }
  
  return validation.data;
}
