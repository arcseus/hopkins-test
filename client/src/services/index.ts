/**
 * Barrel export for all service modules.
 * 
 * This provides a clean public API for service layer components,
 * following the Dependency Inversion Principle by abstracting service
 * implementations behind stable interfaces.
 */

export { DocumentAnalysisApiClient, type ApiConfig } from './api-client';
