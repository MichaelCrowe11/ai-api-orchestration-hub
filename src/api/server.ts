import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config';
import { logger } from '../monitoring/logger';
import { registerRoutes } from './routes';

export async function createServer() {
  const server = Fastify({
    logger: logger,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    trustProxy: true,
  });

  // Register plugins
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    errorResponseBuilder: (request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
      };
    },
  });

  // Register routes
  await registerRoutes(server);

  // Error handler
  server.setErrorHandler((error, request, reply) => {
    logger.error('Unhandled error:', error);

    reply.status(error.statusCode || 500).send({
      error: error.message || 'Internal Server Error',
      statusCode: error.statusCode || 500,
    });
  });

  return server;
}
