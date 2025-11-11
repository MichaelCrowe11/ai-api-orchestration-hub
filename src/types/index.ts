export type ProviderType = 'openai' | 'anthropic' | 'google' | 'cohere';

export type ModelType =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'gemini-pro'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'command-r-plus'
  | 'command-r'
  | 'command'
  | string;

export interface CompletionRequest {
  prompt?: string;
  messages?: Message[];
  model?: ModelType | 'auto';
  provider?: ProviderType | 'auto';
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  maxCost?: number;
  metadata?: Record<string, unknown>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResponse {
  id: string;
  provider: ProviderType;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  latency: number;
  cached: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ProviderConfig {
  name: ProviderType;
  apiKey: string;
  enabled: boolean;
  priority: number;
  models: ModelConfig[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  timeout?: number;
  maxRetries?: number;
}

export interface ModelConfig {
  name: string;
  costPer1kPromptTokens: number;
  costPer1kCompletionTokens: number;
  maxTokens: number;
  contextWindow: number;
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'least-load' | 'cost-optimized' | 'performance';
  providers: ProviderType[];
}

export interface OrchestrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  averageLatency: number;
  providerStats: Record<ProviderType, ProviderMetrics>;
  cacheHitRate: number;
}

export interface ProviderMetrics {
  requests: number;
  successes: number;
  failures: number;
  totalCost: number;
  averageLatency: number;
  lastFailure?: Date;
}

export interface CacheEntry {
  key: string;
  response: CompletionResponse;
  expiresAt: Date;
}

export interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
}

export class OrchestrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: ProviderType,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }
}
