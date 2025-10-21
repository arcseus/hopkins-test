/**
 * Concurrent processing pipeline for document analysis.
 * Handles ZIP extraction, file truncation, and prepares for LLM analysis.
 */

import { extractZipFiles, ExtractedFile } from './zip-extraction';
import { truncateFile, TruncationResult } from './file-truncation';
import { getFileExtension } from './file-types';
import { PROCESSING_LIMITS } from './constants';

export interface ProcessedFile {
  originalFile: ExtractedFile;
  truncatedContent: TruncationResult;
  fileType: string;
  processingErrors?: string[];
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
 * Processes a single file through the truncation pipeline
 */
async function processSingleFile(file: ExtractedFile): Promise<ProcessedFile> {
  const fileType = getFileExtension(file.filename);
  const processingErrors: string[] = [];

  try {
    // Extract and truncate the file content
    const truncatedContent = await truncateFile(file.buffer, fileType);
    
    return {
      originalFile: file,
      truncatedContent,
      fileType,
      processingErrors
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
      processingErrors
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
 * TODO: Next step - LLM Analysis Integration
 * 
 * The next step will be to implement concurrent LLM calls for each processed file.
 * Each file will be analyzed by an LLM to extract:
 * - Document category (financial, legal, commercial, operations, other)
 * - Key facts
 * - Red flags
 * 
 * The structure is already prepared with prepareForLLMAnalysis() function.
 * We'll need to:
 * 1. Create LLM service integration
 * 2. Implement concurrent LLM calls (respecting MAX_CONCURRENT_LLM_CALLS)
 * 3. Parse LLM responses into DocResult format
 * 4. Aggregate results into final AnalyseResponse
 */
