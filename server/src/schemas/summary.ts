import { z } from 'zod';

export const SummaryStringSchema = z
  .string()
  .refine((text) => {
    const wordCount = text.trim().split(/\s+/).length;
    return wordCount >= 300 && wordCount <= 400;
  }, 'Summary must be between 300 and 400 words');
