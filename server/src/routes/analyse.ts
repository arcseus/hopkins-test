import { FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../logger';
import { validateMultipartUpload, getValidatedFile } from '../middleware/upload';
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
    
    // TODO: Implement ZIP extraction and analysis pipeline
    const analysisId = 'stub-analysis-id';
    
    const response = {
      analysisId,
      docs: [],
      aggregate: {
        financial: { facts: 0, red_flags: 0 },
        legal: { facts: 0, red_flags: 0 },
        operations: { facts: 0, red_flags: 0 },
        commercial: { facts: 0, red_flags: 0 },
        other: { facts: 0, red_flags: 0 }
      },
      summaryText: '',
      errors: []
    };
    
    requestLogger.info({ analysisId }, 'Analysis completed');
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
