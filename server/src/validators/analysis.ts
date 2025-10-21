import { z } from 'zod';
import { DocResult, AnalyseResponse } from '../types/analysis';

/**
 * Zod schemas for runtime validation of analysis data.
 * These schemas enforce the business rules defined in the spec.
 */

export const DocumentCategorySchema = z.enum(['financial', 'legal', 'commercial', 'operations', 'other']);

export const DocResultSchema = z.object({
  doc: z.string().min(1, 'Document name is required'),
  category: DocumentCategorySchema,
  facts: z.array(z.string().max(300, 'Fact too long')).max(5, 'Too many facts'),
  red_flags: z.array(z.string().max(300, 'Red flag too long')).max(5, 'Too many red flags')
});

export const AggregateCountsSchema = z.object({
  facts: z.number().int().min(0),
  red_flags: z.number().int().min(0)
});

export const AggregateSchema = z.object({
  financial: AggregateCountsSchema,
  legal: AggregateCountsSchema,
  operations: AggregateCountsSchema,
  commercial: AggregateCountsSchema,
  other: AggregateCountsSchema
});

export const AnalyseResponseSchema = z.object({
  docs: z.array(DocResultSchema),
  aggregate: AggregateSchema,
  summaryText: z.string(),
  errors: z.array(z.string())
});

/**
 * Validation helpers
 */
export function validateDocResult(data: unknown): DocResult {
  return DocResultSchema.parse(data);
}

export function validateAnalyseResponse(data: unknown): AnalyseResponse {
  return AnalyseResponseSchema.parse(data);
}
