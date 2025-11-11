import dotenv from 'dotenv';
import { ProviderConfig } from '../types';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    enabled: process.env.REDIS_ENABLED === 'true',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    enabled: process.env.CACHE_ENABLED !== 'false',
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10),
  },
  cost: {
    trackingEnabled: process.env.ENABLE_COST_TRACKING !== 'false',
    maxPerRequest: parseFloat(process.env.MAX_COST_PER_REQUEST || '1.0'),
    dailyBudgetLimit: parseFloat(process.env.DAILY_BUDGET_LIMIT || '100.0'),
  },
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    metricsEnabled: process.env.ENABLE_METRICS !== 'false',
  },
  loadBalancing: {
    enabled: process.env.ENABLE_LOAD_BALANCING !== 'false',
    failoverEnabled: process.env.ENABLE_FAILOVER !== 'false',
    retryAttempts: parseInt(process.env.FAILOVER_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.FAILOVER_RETRY_DELAY || '1000', 10),
  },
  defaults: {
    provider: process.env.DEFAULT_PROVIDER || 'auto',
    model: process.env.DEFAULT_MODEL || 'auto',
    maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '1000', 10),
    temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
  },
};

export const providerConfigs: ProviderConfig[] = [
  {
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    enabled: !!process.env.OPENAI_API_KEY,
    priority: 1,
    timeout: 30000,
    maxRetries: 3,
    models: [
      {
        name: 'gpt-4-turbo',
        costPer1kPromptTokens: 0.01,
        costPer1kCompletionTokens: 0.03,
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        name: 'gpt-4',
        costPer1kPromptTokens: 0.03,
        costPer1kCompletionTokens: 0.06,
        maxTokens: 8192,
        contextWindow: 8192,
      },
      {
        name: 'gpt-3.5-turbo',
        costPer1kPromptTokens: 0.0005,
        costPer1kCompletionTokens: 0.0015,
        maxTokens: 4096,
        contextWindow: 16385,
      },
    ],
  },
  {
    name: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    enabled: !!process.env.ANTHROPIC_API_KEY,
    priority: 2,
    timeout: 30000,
    maxRetries: 3,
    models: [
      {
        name: 'claude-3-5-sonnet-20241022',
        costPer1kPromptTokens: 0.003,
        costPer1kCompletionTokens: 0.015,
        maxTokens: 8192,
        contextWindow: 200000,
      },
      {
        name: 'claude-3-opus-20240229',
        costPer1kPromptTokens: 0.015,
        costPer1kCompletionTokens: 0.075,
        maxTokens: 4096,
        contextWindow: 200000,
      },
      {
        name: 'claude-3-sonnet-20240229',
        costPer1kPromptTokens: 0.003,
        costPer1kCompletionTokens: 0.015,
        maxTokens: 4096,
        contextWindow: 200000,
      },
      {
        name: 'claude-3-haiku-20240307',
        costPer1kPromptTokens: 0.00025,
        costPer1kCompletionTokens: 0.00125,
        maxTokens: 4096,
        contextWindow: 200000,
      },
    ],
  },
  {
    name: 'google',
    apiKey: process.env.GOOGLE_API_KEY || '',
    enabled: !!process.env.GOOGLE_API_KEY,
    priority: 3,
    timeout: 30000,
    maxRetries: 3,
    models: [
      {
        name: 'gemini-1.5-pro',
        costPer1kPromptTokens: 0.0035,
        costPer1kCompletionTokens: 0.0105,
        maxTokens: 8192,
        contextWindow: 1000000,
      },
      {
        name: 'gemini-1.5-flash',
        costPer1kPromptTokens: 0.00035,
        costPer1kCompletionTokens: 0.00105,
        maxTokens: 8192,
        contextWindow: 1000000,
      },
      {
        name: 'gemini-pro',
        costPer1kPromptTokens: 0.0005,
        costPer1kCompletionTokens: 0.0015,
        maxTokens: 2048,
        contextWindow: 32760,
      },
    ],
  },
  {
    name: 'cohere',
    apiKey: process.env.COHERE_API_KEY || '',
    enabled: !!process.env.COHERE_API_KEY,
    priority: 4,
    timeout: 30000,
    maxRetries: 3,
    models: [
      {
        name: 'command-r-plus',
        costPer1kPromptTokens: 0.003,
        costPer1kCompletionTokens: 0.015,
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        name: 'command-r',
        costPer1kPromptTokens: 0.0005,
        costPer1kCompletionTokens: 0.0015,
        maxTokens: 4096,
        contextWindow: 128000,
      },
      {
        name: 'command',
        costPer1kPromptTokens: 0.001,
        costPer1kCompletionTokens: 0.002,
        maxTokens: 4096,
        contextWindow: 4096,
      },
    ],
  },
];
