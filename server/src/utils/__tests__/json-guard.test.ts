import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  validateJSONWithZod,
  InvalidJSONError 
} from '../json-guard';

describe('JSON Guard Utility', () => {
  describe('validateJSONWithZod', () => {
    it('should return success for valid JSON with matching schema', () => {
      const schema = z.object({ key: z.string() });
      const result = validateJSONWithZod('{"key": "value"}', schema);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ key: 'value' });
      }
    });

    it('should return failure for invalid JSON', () => {
      const schema = z.object({ key: z.string() });
      const result = validateJSONWithZod('{key: "value"}', schema);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid JSON');
      }
    });

    it('should return failure for schema validation error', () => {
      const schema = z.object({ key: z.string() });
      const result = validateJSONWithZod('{"key": 123}', schema);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Schema validation failed');
        expect(result.zodError).toBeDefined();
      }
    });

    it('should return failure for missing required fields', () => {
      const schema = z.object({ 
        name: z.string(), 
        age: z.number() 
      });
      const result = validateJSONWithZod('{"name": "John"}', schema);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Schema validation failed');
        expect(result.zodError).toBeDefined();
      }
    });

    it('should return success for complex nested schema', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number()
        }),
        tags: z.array(z.string())
      });
      
      const result = validateJSONWithZod('{"user": {"name": "John", "age": 30}, "tags": ["admin", "user"]}', schema);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          user: { name: 'John', age: 30 },
          tags: ['admin', 'user']
        });
      }
    });
  });

  describe('InvalidJSONError', () => {
    it('should create error with message and original response', () => {
      const error = new InvalidJSONError('Test error', 'original response');
      
      expect(error.message).toBe('Test error');
      expect(error.originalResponse).toBe('original response');
      expect(error.name).toBe('InvalidJSONError');
    });

    it('should create error with Zod error', () => {
      const zodError = new z.ZodError([]);
      const error = new InvalidJSONError('Test error', 'original response', zodError);
      
      expect(error.message).toBe('Test error');
      expect(error.originalResponse).toBe('original response');
      expect(error.zodError).toBe(zodError);
      expect(error.name).toBe('InvalidJSONError');
    });
  });
});