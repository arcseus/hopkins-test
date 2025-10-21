import Fastify from 'fastify';
import { logger, createRequestLogger } from './logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main application entry point.
 * Sets up Fastify server with structured logging and basic routing.
 */
export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      } : undefined
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => uuidv4()
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    try {
      const requestLogger = createRequestLogger(request.id);
      requestLogger.info('Health check requested');
      
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        requestId: request.id 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const requestLogger = createRequestLogger(request.id);
      requestLogger.error({ error: errorMessage }, 'Health check failed');
      
      return reply.code(500).send({ 
        error: 'Internal server error',
        requestId: request.id 
      });
    }
  });

  // Analyse endpoint stub
  fastify.post('/api/analyse', async (request, reply) => {
    try {
      const requestLogger = createRequestLogger(request.id);
      requestLogger.info('Analysis request received');
      
      // TODO: Implement full analysis pipeline
      return {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const requestLogger = createRequestLogger(request.id);
      requestLogger.error({ error: errorMessage }, 'Analysis request failed');
      
      return reply.code(500).send({ 
        error: 'Internal server error',
        requestId: request.id 
      });
    }
  });

  return fastify;
}

/**
 * Start the server
 */
async function start() {
  try {
    const server = await createServer();
    
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    logger.info(`Server listening on http://${host}:${port}`);
    logger.info('Available endpoints:');
    logger.info('  GET  /health - Health check');
    logger.info('  POST /api/analyse - Document analysis');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage }, 'Failed to start server');
    throw error;
  }
}

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });

  // Start the server
  start();
}
