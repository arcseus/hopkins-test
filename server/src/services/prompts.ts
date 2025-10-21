/**
 * Prompt service for loading and managing LLM prompts
 * Handles system and user prompts for document analysis
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Loads a prompt file from the prompts directory
 * 
 * @param filename - Name of the prompt file
 * @returns The prompt content as a string
 * @throws Error if file cannot be read
 */
export function loadPrompt(filename: string): string {
  try {
    const promptPath = join(__dirname, '..', 'prompts', filename);
    const content = readFileSync(promptPath, 'utf-8');
    return content.trim();
  } catch (error) {
    throw new Error(`Failed to load prompt file '${filename}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Loads the system prompt for document analysis
 * 
 * @returns The system prompt content
 */
export function loadSystemPrompt(): string {
  return loadPrompt('document_analysis_system.txt');
}

/**
 * Loads the user prompt template for document analysis
 * 
 * @returns The user prompt template
 */
export function loadUserPromptTemplate(): string {
  return loadPrompt('document_analysis_user.txt');
}

/**
 * Builds a complete user prompt by combining the template with document data
 * 
 * @param documentData - The document content to analyze
 * @returns Complete user prompt ready for LLM
 */
export function buildUserPrompt(documentData: string): string {
  const template = loadUserPromptTemplate();
  return `${template}\n\n${documentData}`;
}

/**
 * Builds a complete prompt pair for document analysis
 * 
 * @param documentData - The document content to analyze
 * @returns Object containing system and user prompts
 */
export function buildAnalysisPrompts(documentData: string): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: loadSystemPrompt(),
    userPrompt: buildUserPrompt(documentData)
  };
}
