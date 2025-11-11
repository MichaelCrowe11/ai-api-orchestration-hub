import { BaseProvider, ProviderFactory } from '../providers';
import { LoadBalancer } from './load-balancer';
import { cacheManager } from '../cache';
import { metricsCollector } from '../monitoring/metrics';
import { logger } from '../monitoring/logger';
import {
  CompletionRequest,
  CompletionResponse,
  OrchestrationError,
  ProviderType,
} from '../types';
import { config, providerConfigs } from '../config';

export class Orchestrator {
  private providers: Map<ProviderType, BaseProvider>;
  private loadBalancer: LoadBalancer;

  constructor() {
    this.providers = new Map();

    // Initialize all enabled providers
    providerConfigs.forEach((providerConfig) => {
      if (providerConfig.enabled) {
        try {
          const provider = ProviderFactory.createProvider(providerConfig);
          this.providers.set(providerConfig.name, provider);
          logger.info(`Initialized provider: ${providerConfig.name}`);
        } catch (error) {
          logger.error(`Failed to initialize provider ${providerConfig.name}:`, error);
        }
      }
    });

    this.loadBalancer = new LoadBalancer(Array.from(this.providers.values()));
  }

  async initialize(): Promise<void> {
    await cacheManager.initialize();
    logger.info('Orchestrator initialized');
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Check cache first
    const cachedResponse = await cacheManager.get(request);
    if (cachedResponse) {
      logger.info('Returning cached response');
      metricsCollector.recordRequest(cachedResponse.provider, true, 0, 0, true);
      return cachedResponse;
    }

    // Check daily budget
    if (config.cost.trackingEnabled) {
      const dailyCost = metricsCollector.getDailyCost();
      if (dailyCost >= config.cost.dailyBudgetLimit) {
        throw new OrchestrationError(
          'Daily budget limit exceeded',
          'BUDGET_EXCEEDED',
          undefined,
          { dailyCost, limit: config.cost.dailyBudgetLimit }
        );
      }
    }

    // Select provider
    const provider = this.loadBalancer.selectProvider(request);
    if (!provider) {
      throw new OrchestrationError(
        'No available providers',
        'NO_PROVIDERS',
        undefined,
        { availableProviders: this.loadBalancer.getAvailableProviders() }
      );
    }

    // Try primary provider with failover
    return await this.executeWithFailover(provider, request);
  }

  private async executeWithFailover(
    primaryProvider: BaseProvider,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const maxAttempts = config.loadBalancing.failoverEnabled
      ? config.loadBalancing.retryAttempts
      : 1;

    let lastError: Error | null = null;
    const triedProviders = new Set<string>();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let provider = primaryProvider;

      // On retry, try different provider
      if (attempt > 0 && config.loadBalancing.failoverEnabled) {
        const availableProviders = Array.from(this.providers.values()).filter(
          (p) => p.isEnabled() && !triedProviders.has(p.getName())
        );

        if (availableProviders.length === 0) {
          break;
        }

        provider = availableProviders[0];
        logger.info(
          `Failover attempt ${attempt + 1}: Trying provider ${provider.getName()}`
        );

        // Wait before retry
        if (attempt > 0) {
          await this.delay(config.loadBalancing.retryDelay * attempt);
        }
      }

      triedProviders.add(provider.getName());

      try {
        const startTime = Date.now();
        const response = await provider.complete(request);
        const latency = Date.now() - startTime;

        // Record metrics
        metricsCollector.recordRequest(
          provider.getName() as ProviderType,
          true,
          response.cost,
          latency,
          false
        );

        // Cache the response
        await cacheManager.set(request, response);

        logger.info(
          `Request completed successfully with ${provider.getName()} (${latency}ms, $${response.cost.toFixed(4)})`
        );

        return response;
      } catch (error: any) {
        lastError = error;
        const latency = Date.now();

        logger.error(
          `Provider ${provider.getName()} failed (attempt ${attempt + 1}):`,
          error.message
        );

        metricsCollector.recordRequest(
          provider.getName() as ProviderType,
          false,
          0,
          latency,
          false
        );
      }
    }

    // All attempts failed
    throw new OrchestrationError(
      `All providers failed: ${lastError?.message}`,
      'ALL_PROVIDERS_FAILED',
      undefined,
      { attempts: maxAttempts, lastError }
    );
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        health[name] = await provider.healthCheck();
      } catch (error) {
        logger.error(`Health check failed for ${name}:`, error);
        health[name] = false;
      }
    }

    return health;
  }

  getMetrics() {
    return metricsCollector.getMetrics();
  }

  async shutdown(): Promise<void> {
    await cacheManager.disconnect();
    logger.info('Orchestrator shutdown complete');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const orchestrator = new Orchestrator();
