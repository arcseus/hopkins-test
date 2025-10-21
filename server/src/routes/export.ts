import { FastifyRequest, FastifyReply } from 'fastify';
import { createRequestLogger } from '../logger';
import { LocalDocumentRepository } from '../storage/document-repository';
import { MarkdownGenerator } from '../utils/markdown-generator';

/**
 * POST /api/export - Export analysis as markdown
 * 
 * This endpoint implements smart caching:
 * 1. Check if markdown file already exists
 * 2. If exists, return cached markdown
 * 3. If not, retrieve JSON data, generate markdown, cache it, and return
 * 
 * Follows Open/Closed principle - extensible for different export formats.
 */
export async function exportHandler(request: FastifyRequest, reply: FastifyReply) {
  const requestLogger = createRequestLogger(request.id);
  const { analysisId } = request.body as { analysisId: string };
  
  try {
    requestLogger.info({ analysisId }, 'Export request received');
    
    const repository = new LocalDocumentRepository();
    
    // Check if markdown already exists
    const markdownExists = await repository.markdownExists(analysisId);
    
    if (markdownExists) {
      requestLogger.info({ analysisId }, 'Returning cached markdown');
      const cachedMarkdown = await repository.getMarkdown(analysisId);
      
      return reply
        .type('text/markdown')
        .header('Content-Disposition', 'attachment; filename="vdr_summary.md"')
        .send(cachedMarkdown);
    }
    
    // Generate new markdown from JSON data
    requestLogger.info({ analysisId }, 'Generating new markdown from analysis data');
    const analysisData = await repository.getAnalysis(analysisId);
    const markdown = MarkdownGenerator.generateVDRSummary(analysisData);
    
    // Cache the generated markdown
    await repository.saveMarkdown(analysisId, markdown);
    
    requestLogger.info({ analysisId }, 'Markdown generated and cached successfully');
    
    return reply
      .type('text/markdown')
      .header('Content-Disposition', 'attachment; filename="vdr_summary.md"')
      .send(markdown);
      
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    requestLogger.error({ error: errorMessage }, 'Export request failed');
    
    return reply.code(500).send({ 
      error: 'Internal server error',
      requestId: request.id 
    });
  }
}
