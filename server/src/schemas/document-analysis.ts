/**
 * Zod schemas for document analysis validation
 * Centralized schema definitions for type-safe validation across the application
 */

import { z } from 'zod';
import { DocumentCategory } from '../types/analysis';

/**
 * Zod schema for validating document analysis responses
 * Ensures the LLM response matches the expected structure and constraints
 * 
 * This schema validates the DocResult structure returned by the LLM,
 * ensuring all required fields are present and meet business rules:
 * - Document name must not be empty
 * - Category must be one of the valid enum values
 * - Facts array must contain 1-5 non-empty strings
 * - Red flags array must contain 0-5 non-empty strings
 */
export const DocResultSchema = z.object({
  doc: z.string().min(1, 'Document name must not be empty'),
  category: z.enum(['financial', 'legal', 'commercial', 'operations', 'other'] as const),
  facts: z.array(z.string().min(1, 'Fact must not be empty')).min(1, 'At least one fact is required').max(5, 'Maximum 5 facts allowed'),
  red_flags: z.array(z.string().min(1, 'Red flag must not be empty')).min(0, 'Red flags are optional').max(5, 'Maximum 5 red flags allowed')
});

/**
 * Type inference from the Zod schema
 * This ensures the schema and TypeScript types stay in sync
 */
export type DocResultFromSchema = z.infer<typeof DocResultSchema>;
