import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import { createServer } from '../index';

describe('Server', () => {
  let server: Fastify.FastifyInstance;

  beforeEach(async () => {
    server = await createServer();
    // Use a different port for testing to avoid conflicts
    await server.listen({ port: 0, host: '127.0.0.1' });
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });
    });

    it('should include requestId in response', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      const body = response.json();
      expect(body.requestId).toBeDefined();
      expect(typeof body.requestId).toBe('string');
      expect(body.requestId.length).toBeGreaterThan(0);
    });

    it('should return valid timestamp', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      const body = response.json();
      const timestamp = new Date(body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('POST /api/analyse', () => {
    it('should return analysis response structure', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/analyse',
        payload: {}
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      
      expect(body).toHaveProperty('docs');
      expect(body).toHaveProperty('aggregate');
      expect(body).toHaveProperty('summaryText');
      expect(body).toHaveProperty('errors');
      
      expect(Array.isArray(body.docs)).toBe(true);
      expect(Array.isArray(body.errors)).toBe(true);
      expect(typeof body.summaryText).toBe('string');
    });

    it('should return empty aggregate structure', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/analyse',
        payload: {}
      });

      const body = response.json();
      const { aggregate } = body;
      
      expect(aggregate).toHaveProperty('financial');
      expect(aggregate).toHaveProperty('legal');
      expect(aggregate).toHaveProperty('operations');
      expect(aggregate).toHaveProperty('commercial');
      expect(aggregate).toHaveProperty('other');
      
      // Check that all categories have the expected structure
      Object.values(aggregate).forEach(category => {
        expect(category).toHaveProperty('facts');
        expect(category).toHaveProperty('red_flags');
        expect(typeof category.facts).toBe('number');
        expect(typeof category.red_flags).toBe('number');
      });
    });

    it('should return empty arrays for docs and errors', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/analyse',
        payload: {}
      });

      const body = response.json();
      expect(body.docs).toEqual([]);
      expect(body.errors).toEqual([]);
      expect(body.summaryText).toBe('');
    });
  });

  describe('Error handling', () => {
    it('should handle server creation errors gracefully', async () => {
      // This test ensures the server can be created without throwing
      expect(server).toBeDefined();
      expect(typeof server.inject).toBe('function');
    });
  });
});
