/**
 * API client service for communicating with the backend.
 * 
 * This service provides two core functions:
 * 1. analyseDocuments - Uploads ZIP file and receives JSON analysis results
 * 2. downloadMarkdown - Downloads analysis results as markdown file
 * 
 * Following the Single Responsibility Principle, this service is solely
 * responsible for HTTP communication with the backend.
 */

import type { AnalyseResponse, ExportRequest, ApiError } from '../types';

/**
 * Configuration for the API client.
 */
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * HTTP client for document analysis API.
 * 
 * Provides two essential methods for document analysis workflow:
 * - JSON response for analysis results
 * - File download for markdown export
 */
export class DocumentAnalysisApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout ?? 180000; // 3 minute default timeout
  }

  /**
   * Analyzes uploaded documents and returns JSON results.
   * 
   * @param file - The ZIP file containing documents to analyze
   * @returns Promise resolving to analysis results as JSON
   * @throws {Error} When the request fails or returns an error
   */
  async analyseDocuments(file: File): Promise<AnalyseResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.makeJsonRequest('/api/analyse', {
      method: 'POST',
      body: formData,
    });

    return response as AnalyseResponse;
  }

  /**
   * Downloads analysis results as a markdown file.
   * 
   * @param request - Export request containing analysis ID
   * @returns Promise resolving to Blob for file download
   * @throws {Error} When the request fails or returns an error
   */
  async downloadMarkdown(request: ExportRequest): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(error.error || 'Export request failed');
    }

    return response.blob();
  }

  /**
   * Makes a JSON request with proper error handling and timeout.
   * 
   * @param endpoint - The API endpoint to call
   * @param options - Fetch options for the request
   * @returns Promise resolving to the JSON response data
   * @throws {Error} When the request fails
   */
  private async makeJsonRequest(endpoint: string, options: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }
}
