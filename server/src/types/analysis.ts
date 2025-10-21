/**
 * Core domain types for the document analysis pipeline.
 * These types define the contracts between different layers of the system.
 */

export type DocumentCategory = 'financial' | 'legal' | 'commercial' | 'operations' | 'other';

export interface DocResult {
  doc: string;
  category: DocumentCategory;
  facts: string[];
  red_flags: string[];
}

export interface AggregateCounts {
  facts: number;
  red_flags: number;
}

export interface Aggregate {
  financial: AggregateCounts;
  legal: AggregateCounts;
  operations: AggregateCounts;
  commercial: AggregateCounts;
  other: AggregateCounts;
}

export interface AnalyseResponse {
  docs: DocResult[];
  aggregate: Aggregate;
  summaryText: string;
  errors: string[];
}

/**
 * Internal processing types for the pipeline
 */
export interface ExtractedFile {
  filename: string;
  extension: string;
  buffer: Buffer;
  size: number;
}

export interface ProcessedDocument {
  filename: string;
  category: DocumentCategory;
  text: string;
  metadata: {
    originalSize: number;
    extractedLength: number;
  };
}

export interface ExtractionResult {
  success: boolean;
  text: string;
  error?: string;
  metadata?: {
    originalSize: number;
    extractedLength: number;
  };
}
