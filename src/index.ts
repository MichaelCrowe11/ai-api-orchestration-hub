import { createServer } from './api/server';
import { orchestrator } from './orchestration/orchestrator';
import { config } from './config';
import { logger } from './monitoring/logger';

async function start() {
  try {
    // Initialize orchestrator
    await orchestrator.initialize();

    // Create and start server
    const server = await createServer();

    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      `AI API Orchestration Hub started on http://${config.server.host}:${config.server.port}`
    );

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      try {
        await server.close();
        await orchestrator.shutdown();
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
