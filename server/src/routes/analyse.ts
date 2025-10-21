import { FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../logger';
import { validateMultipartUpload, getValidatedFile } from '../middleware/upload';
import { processZipFile } from '../utils/processing-pipeline';
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

    // Step 5: Prepare response (LLM analysis will be added next)
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = {
      analysisId,
      docs: [], // TODO: Will be populated by LLM analysis
      aggregate: {
        financial: { facts: 0, red_flags: 0 },
        legal: { facts: 0, red_flags: 0 },
        operations: { facts: 0, red_flags: 0 },
        commercial: { facts: 0, red_flags: 0 },
        other: { facts: 0, red_flags: 0 }
      },
      summaryText: `Processed ${processingResult.successfulFiles} files successfully. LLM analysis integration coming next.`,
      errors: processingResult.processingErrors
    };

    requestLogger.info({ 
      analysisId,
      processedFiles: processingResult.successfulFiles 
    }, 'Analysis pipeline completed (truncation phase)');
    
    return reply.send(response);
    
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
