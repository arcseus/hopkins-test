import { FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../logger';
import { PROCESSING_LIMITS } from '../utils/constants';

// Extend FastifyRequest to include multipart types
interface MultipartFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
  size: number;
}

interface MultipartRequest extends FastifyRequest {
  file(): Promise<MultipartFile | undefined>;
}

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
    
    // 1. Validate multipart upload
    const data = await (request as any).file();
    
    if (!data) {
      requestLogger.warn('No file provided');
      return reply.code(400).send({ 
        error: 'No file provided',
        requestId: request.id 
      });
    }
    
    // 2. Validate file size
    if (data.size > PROCESSING_LIMITS.MAX_FILE_SIZE) {
      requestLogger.warn({ 
        size: data.size, 
        limit: PROCESSING_LIMITS.MAX_FILE_SIZE 
      }, 'File too large');
      return reply.code(400).send({ 
        error: 'File too large',
        maxSize: `${PROCESSING_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        requestId: request.id 
      });
    }
    
    // 3. Validate file type (must be ZIP)
    const filename = data.filename || '';
    if (!filename.toLowerCase().endsWith('.zip')) {
      requestLogger.warn({ filename }, 'Invalid file type');
      return reply.code(400).send({ 
        error: 'Only ZIP files are supported',
        requestId: request.id 
      });
    }
    
    requestLogger.info({ 
      filename, 
      size: data.size 
    }, 'ZIP file validated');
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    requestLogger.error({ error: errorMessage }, 'Analysis request failed');
    
    return reply.code(500).send({ 
      error: 'Internal server error',
      requestId: request.id 
    });
  }
}
