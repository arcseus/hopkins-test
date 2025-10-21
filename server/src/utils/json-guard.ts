/**
 * JSON Guard utility for validating LLM responses using Zod schemas
 * Provides type-safe validation for structured LLM outputs
 */

import { z, ZodError, ZodSchema } from 'zod';

/**
 * JSON Guard error for invalid responses
 * Thrown when LLM returns invalid JSON or schema validation fails
 */
export class InvalidJSONError extends Error {
  constructor(message: string, public originalResponse: string, public zodError?: ZodError) {
    super(message);
    this.name = 'InvalidJSONError';
  }
}

/**
 * Validates JSON string using Zod schema
 * 
 * @param jsonString - String to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result with parsed and validated data if valid
 */
export function validateJSONWithZod<T>(
  jsonString: string, 
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; zodError?: ZodError } {
  try {
    // First, parse as JSON
    const parsed = JSON.parse(jsonString);
    
    // Then validate with Zod schema
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { 
        success: false, 
        error: `Schema validation failed: ${result.error.message}`,
        zodError: result.error
      };
    }
  } catch (jsonError) {
    return {
      success: false,
      error: `Invalid JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown parsing error'}`
    };
  }
}
