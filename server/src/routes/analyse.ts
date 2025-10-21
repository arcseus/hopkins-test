import { FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../logger';
import { validateMultipartUpload, getValidatedFile } from '../middleware/upload';
import { processZipFile } from '../utils/processing-pipeline';
import { DocResult, AnalyseResponse } from '../types/analysis';
import { LocalDocumentRepository } from '../storage/document-repository';
import { getSummaryText } from '../services/summary';
import {
  FileSizeError,
  FileTypeError,
  NoFileError,
  FileValidationError,
  UnsupportedFileTypeError,
  MultipartError
} from '../errors/validation';

/**
 * POST /api/analyse - Document analysis endpoint
 * 
 * This endpoint will handle the full analysis pipeline:
 * 1. File upload validation
 * 2. ZIP extraction
 * 3. Text extraction from documents
 * 4. Document categorization
 * 5. LLM analysis
 * 6. Results aggregation
 * 7. Response with analysisId
 */
export async function analyseHandler(request: FastifyRequest, reply: FastifyReply) {
  const requestLogger = createRequestLogger(request.id);
  
  try {
    requestLogger.info('Analysis request received');
    
    // 1. Validate multipart upload using middleware
    await validateMultipartUpload(request, reply);
    
    // 2. Get validated file data
    const validatedFile = getValidatedFile(request);
    
    requestLogger.info({ 
      filename: validatedFile.filename, 
      size: validatedFile.size 
    }, 'ZIP file validated successfully');
    
    // Step 3: Extract ZIP file buffer
    const zipBuffer = await streamToBuffer(validatedFile.file);
    
    // Step 4: Process ZIP file through the pipeline
    requestLogger.info('Starting ZIP processing pipeline');
    const processingResult = await processZipFile(zipBuffer);
    
    requestLogger.info({
      totalFiles: processingResult.totalFiles,
      successfulFiles: processingResult.successfulFiles,
      failedFiles: processingResult.failedFiles,
      processingTime: processingResult.totalProcessingTime
    }, 'ZIP processing completed');

    // Step 5: Build response from LLM analysis results
    const docs: DocResult[] = [];
    const aggregate = {
      financial: { facts: 0, red_flags: 0 },
      legal: { facts: 0, red_flags: 0 },
      operations: { facts: 0, red_flags: 0 },
      commercial: { facts: 0, red_flags: 0 },
      other: { facts: 0, red_flags: 0 }
    };

    // Process LLM analysis results
    requestLogger.info({ 
      totalFiles: processingResult.processedFiles.length,
      filesWithLLM: processingResult.processedFiles.filter(f => f.llmAnalysis).length
    }, 'Processing LLM analysis results');
    
    for (const file of processingResult.processedFiles) {
      if (file.llmAnalysis) {
        try {
          const docResult: DocResult = JSON.parse(file.llmAnalysis);
          docs.push(docResult);
          
          // Aggregate counts
          aggregate[docResult.category].facts += docResult.facts.length;
          aggregate[docResult.category].red_flags += docResult.red_flags.length;
        } catch (error) {
          requestLogger.warn({ 
            filename: file.originalFile.filename,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'Failed to parse LLM analysis result');
        }
      } else {
        requestLogger.warn({ 
          filename: file.originalFile.filename,
          hasLLMErrors: !!file.llmErrors
        }, 'No LLM analysis result found');
      }
    }

    // Generate LLM summary
    let summaryText: string;
    try {
      summaryText = await getSummaryText(docs);
      requestLogger.info({ 
        summaryLength: summaryText.length,
        wordCount: summaryText.trim().split(/\s+/).length
      }, 'LLM summary generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      requestLogger.warn({ error: errorMessage }, 'LLM summary generation failed, using fallback');
      summaryText = `Successfully analyzed ${docs.length} documents. Found ${Object.values(aggregate).reduce((sum, cat) => sum + cat.facts, 0)} facts and ${Object.values(aggregate).reduce((sum, cat) => sum + cat.red_flags, 0)} red flags.`;
    }

    const response: AnalyseResponse = {
      docs,
      aggregate,
      summaryText,
      errors: processingResult.processingErrors
    };

    // Persist analysis results
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const repository = new LocalDocumentRepository();
    await repository.saveAnalysis(analysisId, response);

    requestLogger.info({ 
      analysisId,
      docsCount: docs.length,
      totalFacts: Object.values(aggregate).reduce((sum, cat) => sum + cat.facts, 0),
      totalRedFlags: Object.values(aggregate).reduce((sum, cat) => sum + cat.red_flags, 0)
    }, 'Analysis pipeline completed and persisted');
    
    return reply.send({ ...response, analysisId });
    
  } catch (error) {
    // Handle validation errors with proper HTTP status codes
    if (error instanceof FileSizeError || 
        error instanceof FileTypeError || 
        error instanceof NoFileError ||
        error instanceof FileValidationError ||
        error instanceof UnsupportedFileTypeError) {
      requestLogger.warn({ 
        error: error.message, 
        code: error.code,
        details: error.details 
      }, 'File validation failed');
      
      return reply.code(error.statusCode).send({
        error: error.message,
        code: error.code,
        details: error.details,
        requestId: request.id
      });
    }

    // Handle multipart parsing errors
    if (error instanceof Error && error.message.includes('multipart')) {
      const multipartError = new MultipartError(
        'Invalid multipart request format',
        { originalError: error.message }
      );
      
      requestLogger.warn({ 
        error: multipartError.message,
        code: multipartError.code,
        details: multipartError.details 
      }, 'Multipart parsing failed');
      
      return reply.code(multipartError.statusCode).send({
        error: multipartError.message,
        code: multipartError.code,
        details: multipartError.details,
        requestId: request.id
      });
    }

    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    requestLogger.error({ error: errorMessage }, 'Analysis request failed');
    
    return reply.code(500).send({ 
      error: 'Internal server error',
      requestId: request.id 
    });
  }
}

/**
 * Helper function to convert stream to buffer
 */
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}
