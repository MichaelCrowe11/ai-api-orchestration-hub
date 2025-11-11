import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.monitoring.logLevel,
  transport: config.server.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
