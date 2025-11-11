import { createClient, RedisClientType } from 'redis';
import { CompletionRequest, CompletionResponse } from '../types';
import { config } from '../config';
import { logger } from '../monitoring/logger';

export class CacheManager {
  private client: RedisClientType | null = null;
  private enabled: boolean;
  private ttl: number;

  constructor() {
    this.enabled = config.cache.enabled && config.redis.enabled;
    this.ttl = config.cache.ttl;
  }

  async initialize(): Promise<void> {
    if (!this.enabled) {
      logger.info('Cache is disabled');
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password,
      });

      this.client.on('error', (err) => logger.error('Redis Client Error', err));

      await this.client.connect();
      logger.info('Cache initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize cache', error);
      this.enabled = false;
    }
  }

  async get(request: CompletionRequest): Promise<CompletionResponse | null> {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const key = this.generateCacheKey(request);
      const cached = await this.client.get(key);

      if (cached) {
        logger.debug(`Cache hit for key: ${key}`);
        const response = JSON.parse(cached) as CompletionResponse;
        response.cached = true;
        return response;
      }

      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error', error);
      return null;
    }
  }

  async set(request: CompletionRequest, response: CompletionResponse): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      const key = this.generateCacheKey(request);
      await this.client.setEx(key, this.ttl, JSON.stringify(response));
      logger.debug(`Cached response for key: ${key}`);
    } catch (error) {
      logger.error('Cache set error', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.flushAll();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      logger.info('Cache disconnected');
    }
  }

  private generateCacheKey(request: CompletionRequest): string {
    const keyData = {
      prompt: request.prompt,
      messages: request.messages,
      model: request.model,
      provider: request.provider,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      topP: request.topP,
    };

    const hash = Buffer.from(JSON.stringify(keyData)).toString('base64');
    return `completion:${hash}`;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const cacheManager = new CacheManager();
