import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { orchestrator } from '../orchestration/orchestrator';
import { logger } from '../monitoring/logger';

const CompletionRequestSchema = z.object({
  prompt: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  model: z.string().optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'cohere', 'auto']).optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),
  maxCost: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function registerRoutes(server: FastifyInstance) {
  // Health check endpoint
  server.get('/health', async (request, reply) => {
    try {
      const health = await orchestrator.healthCheck();
      const allHealthy = Object.values(health).some((h) => h);

      return reply.status(allHealthy ? 200 : 503).send({
        status: allHealthy ? 'healthy' : 'unhealthy',
        providers: health,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Health check failed:', error);
      return reply.status(503).send({
        status: 'unhealthy',
        error: error.message,
      });
    }
  });

  // Completion endpoint
  server.post('/v1/completions', async (request, reply) => {
    try {
      const validatedRequest = CompletionRequestSchema.parse(request.body);

      if (!validatedRequest.prompt && !validatedRequest.messages) {
        return reply.status(400).send({
          error: 'Either prompt or messages must be provided',
        });
      }

      const response = await orchestrator.complete(validatedRequest);

      return reply.status(200).send(response);
    } catch (error: any) {
      logger.error('Completion request failed:', error);

      if (error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Invalid request format',
          details: error.errors,
        });
      }

      if (error.code === 'BUDGET_EXCEEDED') {
        return reply.status(429).send({
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }

      return reply.status(500).send({
        error: error.message || 'Internal server error',
        code: error.code || 'UNKNOWN_ERROR',
      });
    }
  });

  // Metrics endpoint
  server.get('/v1/metrics', async (request, reply) => {
    try {
      const metrics = orchestrator.getMetrics();
      return reply.status(200).send(metrics);
    } catch (error: any) {
      logger.error('Failed to retrieve metrics:', error);
      return reply.status(500).send({
        error: 'Failed to retrieve metrics',
      });
    }
  });

  // Provider list endpoint
  server.get('/v1/providers', async (request, reply) => {
    try {
      const health = await orchestrator.healthCheck();
      const providers = Object.entries(health).map(([name, healthy]) => ({
        name,
        enabled: true,
        healthy,
      }));

      return reply.status(200).send({ providers });
    } catch (error: any) {
      logger.error('Failed to retrieve providers:', error);
      return reply.status(500).send({
        error: 'Failed to retrieve providers',
      });
    }
  });

  // Root endpoint
  server.get('/', async (request, reply) => {
    return reply.status(200).send({
      name: 'AI API Orchestration Hub',
      version: '1.0.0',
      description: 'A centralized platform for orchestrating multiple AI API services',
      endpoints: {
        health: 'GET /health',
        completion: 'POST /v1/completions',
        metrics: 'GET /v1/metrics',
        providers: 'GET /v1/providers',
      },
    });
  });
}
