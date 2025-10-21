/**
 * Core domain types for document analysis.
 * These types represent the business entities and their relationships.
 * 
 * Following the Dependency Rule: these are the most stable, high-level abstractions
 * that define the core business logic without depending on external frameworks.
 */

/**
 * Document categories used for classification in the analysis pipeline.
 * These represent the business domains that documents can belong to.
 */
export type DocumentCategory = 'financial' | 'legal' | 'commercial' | 'operations' | 'other';

/**
 * Represents the result of analyzing a single document.
 * This is the core business entity that encapsulates all analysis findings.
 */
export interface DocumentResult {
  /** The name/identifier of the analyzed document */
  doc: string;
  /** The category this document was classified into */
  category: DocumentCategory;
  /** Key facts extracted from the document (1-5 items) */
  facts: string[];
  /** Potential red flags identified in the document (0-5 items) */
  red_flags: string[];
}

/**
 * Aggregated counts for facts and red flags within a category.
 * Used for statistical analysis and reporting.
 */
export interface CategoryCounts {
  /** Number of facts found in this category */
  facts: number;
  /** Number of red flags found in this category */
  red_flags: number;
}

/**
 * Complete aggregation of all document categories.
 * Provides a comprehensive view of the analysis results across all domains.
 */
export interface AnalysisAggregate {
  financial: CategoryCounts;
  legal: CategoryCounts;
  operations: CategoryCounts;
  commercial: CategoryCounts;
  other: CategoryCounts;
}
