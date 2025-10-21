/**
 * API communication types for client-server interaction.
 * These types define the contracts for HTTP communication with the backend.
 * 
 * These are application-specific types that depend on the domain types,
 * following the Dependency Rule where application concerns depend on domain concerns.
 */

import type { DocumentResult, AnalysisAggregate } from './domain';

/**
 * Complete response from the /api/analyse endpoint.
 * Contains all analysis results, aggregations, and metadata.
 */
export interface AnalyseResponse {
  /** Array of analyzed documents with their findings */
  docs: DocumentResult[];
  /** Aggregated statistics across all categories */
  aggregate: AnalysisAggregate;
  /** AI-generated summary text of the analysis */
  summaryText: string;
  /** Any errors encountered during processing */
  errors: string[];
  /** Unique identifier for this analysis session */
  analysisId: string;
}

/**
 * Request payload for the /api/export endpoint.
 * Simple request structure for exporting analysis results.
 */
export interface ExportRequest {
  /** The analysis ID to export */
  analysisId: string;
}

/**
 * Error response structure for API failures.
 * Standardized error format across all endpoints.
 */
export interface ApiError {
  /** Human-readable error message */
  error: string;
  /** Machine-readable error code */
  code?: string;
  /** Additional error details for debugging */
  details?: Record<string, unknown>;
  /** Request ID for correlation with server logs */
  requestId: string;
}

/**
 * File upload validation error types.
 * Specific error types for file upload failures.
 */
export interface FileValidationError extends ApiError {
  code: 'FILE_SIZE_ERROR' | 'FILE_TYPE_ERROR' | 'NO_FILE_ERROR' | 'FILE_VALIDATION_ERROR' | 'UNSUPPORTED_FILE_TYPE_ERROR' | 'MULTIPART_ERROR';
}
