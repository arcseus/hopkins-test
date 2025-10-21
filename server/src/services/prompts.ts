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
export function loadDocumentAnalysisSystemPrompt(): string {
  return loadPrompt('document_analysis_system.txt');
}

/**
 * Loads the user prompt template for document analysis
 * 
 * @returns The user prompt template
 */
export function loadDocumentAnalysisUserPromptTemplate(): string {
  return loadPrompt('document_analysis_user.txt');
}

/**
 * Builds a user prompt with structured document data
 * 
 * @param filename - Document filename
 * @param category - Document category
 * @param text - Document text content
 * @returns Complete user prompt ready for LLM
 */
export function buildStructuredDocumentAnalysisUserPrompt(filename: string, category: string, text: string): string {
  const template = loadDocumentAnalysisUserPromptTemplate();
  return template
    .replace('{{filename}}', filename)
    .replace('{{category}}', category)
    .replace('{{text}}', text);
}
