/**
 * Barrel export for all type definitions.
 * 
 * This follows the Dependency Inversion Principle by providing a clean,
 * stable interface for type imports. Consumers depend on this abstraction
 * rather than concrete file paths, making the system more maintainable.
 */

// Domain types - core business entities
export type {
  DocumentCategory,
  DocumentResult,
  CategoryCounts,
  AnalysisAggregate
} from './domain';

// API types - communication contracts
export type {
  AnalyseResponse,
  ExportRequest,
  ApiError,
  FileValidationError
} from './api';
