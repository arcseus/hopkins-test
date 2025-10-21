/**
 * Concurrent processing pipeline for document analysis.
 * Handles ZIP extraction, file truncation, LLM analysis with retry logic.
 */

import { extractZipFiles, ExtractedFile } from './zip-extraction';
import { truncateFile, TruncationResult } from './file-truncation';
import { getFileExtension } from './file-types';
import { PROCESSING_LIMITS } from './constants';
import { analyzeDocumentWithJSONGuard } from '../services/llm';
import { withRetry } from './retry';
import { classifyDocument } from './category-classifier';
import { buildStructuredDocumentAnalysisUserPrompt } from '../services/prompts';

export interface ProcessedFile {
  originalFile: ExtractedFile;
  truncatedContent: TruncationResult;
  fileType: string;
  processingErrors?: string[];
  llmAnalysis?: string; // JSON response from LLM
  llmErrors?: string[];
}

export interface ProcessingResult {
  processedFiles: ProcessedFile[];
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  processingErrors: string[];
  totalProcessingTime: number;
}

/**
 * Processes a single file through the truncation and LLM analysis pipeline
 */
async function processSingleFile(file: ExtractedFile): Promise<ProcessedFile> {
  const currentFilename = file.filename;
  const fileType = getFileExtension(currentFilename);
  const processingErrors: string[] = [];
  const llmErrors: string[] = [];

  try {
    // Step 1: Extract and truncate the file content
    const truncatedContent = await truncateFile(file.buffer, fileType);
    
    // Step 2: Classify document category (pre-LLM classification)
    const category = classifyDocument(currentFilename, truncatedContent.text.substring(0, 300));
    
    // Step 3: LLM Analysis with retry logic
    let llmAnalysis: string | undefined;
    try {
      // Build structured prompt with filename, category, and content
      const analysisInput = buildStructuredDocumentAnalysisUserPrompt(
        currentFilename,
        category,
        truncatedContent.text
      );
        
      // Call LLM with retry logic and JSON guard
      llmAnalysis = await withRetry(
        () => analyzeDocumentWithJSONGuard(analysisInput),
        { maxAttempts: 5 }
      );
      
    } catch (llmError) {
      const errorMessage = llmError instanceof Error ? llmError.message : 'Unknown LLM error';
      llmErrors.push(`LLM analysis failed for ${file.filename}: ${errorMessage}`);
    }
    
    return {
      originalFile: file,
      truncatedContent,
      fileType,
      processingErrors,
      llmAnalysis,
      llmErrors: llmErrors.length > 0 ? llmErrors : undefined
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    processingErrors.push(`Failed to process ${file.filename}: ${errorMessage}`);
    
    // Return a failed result but don't throw - we want to process other files
    return {
      originalFile: file,
      truncatedContent: {
        text: '',
        truncated: false,
        originalLength: 0
      },
      fileType,
      processingErrors,
      llmErrors: llmErrors.length > 0 ? llmErrors : undefined
    };
  }
}

/**
 * Main processing pipeline that extracts ZIP and processes files concurrently
 */
export async function processZipFile(zipBuffer: Buffer): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  try {
    // Step 1: Extract files from ZIP
    const extractionResult = await extractZipFiles(zipBuffer);
    
    if (extractionResult.files.length === 0) {
      return {
        processedFiles: [],
        totalFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        processingErrors: ['No valid files found in ZIP archive'],
        totalProcessingTime: Date.now() - startTime
      };
    }

    // Step 2: Process files concurrently (up to MAX_CONCURRENT_LLM_CALLS limit)
    const concurrencyLimit = PROCESSING_LIMITS.MAX_CONCURRENT_LLM_CALLS;
    const files = extractionResult.files;
    const processedFiles: ProcessedFile[] = [];
    const processingErrors: string[] = [...extractionResult.errors];

    // Process files in batches to respect concurrency limits
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(file => processSingleFile(file));
      const batchResults = await Promise.all(batchPromises);
      
      processedFiles.push(...batchResults);
    }

    // Step 3: Analyze results
    const successfulFiles = processedFiles.filter(f => !f.processingErrors || f.processingErrors.length === 0);
    const failedFiles = processedFiles.filter(f => f.processingErrors && f.processingErrors.length > 0);
    
    // Collect all processing errors
    processedFiles.forEach(file => {
      if (file.processingErrors && file.processingErrors.length > 0) {
        processingErrors.push(...file.processingErrors);
      }
    });

    const totalProcessingTime = Date.now() - startTime;

    return {
      processedFiles,
      totalFiles: files.length,
      successfulFiles: successfulFiles.length,
      failedFiles: failedFiles.length,
      processingErrors,
      totalProcessingTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    
    return {
      processedFiles: [],
      totalFiles: 0,
      successfulFiles: 0,
      failedFiles: 0,
      processingErrors: [`Processing pipeline failed: ${errorMessage}`],
      totalProcessingTime: Date.now() - startTime
    };
  }
}

/**
 * Prepares processed files for LLM analysis
 * This function will be called for each file in the next step
 */
export function prepareForLLMAnalysis(processedFile: ProcessedFile): {
  filename: string;
  content: string;
  fileType: string;
  metadata: {
    originalSize: number;
    truncated: boolean;
    processingErrors?: string[];
  };
} {
  return {
    filename: processedFile.originalFile.filename,
    content: processedFile.truncatedContent.text,
    fileType: processedFile.fileType,
    metadata: {
      originalSize: processedFile.originalFile.size,
      truncated: processedFile.truncatedContent.truncated,
      processingErrors: processedFile.processingErrors
    }
  };
}

/**
 * LLM Analysis Integration - COMPLETED
 * 
 * The pipeline now includes:
 * ✅ LLM service integration with retry logic (max 5 retries)
 * ✅ Concurrent LLM calls (respecting MAX_CONCURRENT_LLM_CALLS)
 * ✅ Exponential backoff with jitter for retry delays
 * ✅ Intelligent retry logic (rate limits, timeouts vs permanent failures)
 * ✅ Error handling and logging for LLM failures
 * 
 * Next steps:
 * - Parse LLM responses into DocResult format
 * - Aggregate results into final AnalyseResponse
 * - Implement response validation and error handling
 */
