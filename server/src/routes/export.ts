import { FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../logger';
import { LocalDocumentRepository } from '../storage/document-repository';

/**
 * POST /api/export - Export analysis as JSON
 * 
 * This endpoint retrieves analysis data by analysisId from the persistence layer.
 * Follows Open/Closed principle - extensible for different export formats.
 */
export async function exportHandler(request: FastifyRequest, reply: FastifyReply) {
  const requestLogger = createRequestLogger(request.id);
  const { analysisId } = request.body as { analysisId: string };
  
  try {
    requestLogger.info({ analysisId }, 'Export request received');
    
    // Retrieve analysis data from persistence layer
    const repository = new LocalDocumentRepository();
    const analysisData = await repository.getAnalysis(analysisId);
    
    requestLogger.info({ analysisId }, 'Analysis data retrieved successfully');
    
    return reply.send(analysisData);
      
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    requestLogger.error({ error: errorMessage }, 'Export request failed');
    
    return reply.code(500).send({ 
      error: 'Internal server error',
      requestId: request.id 
    });
  }
}
