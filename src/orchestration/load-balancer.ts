import { BaseProvider } from '../providers/base';
import { ProviderType, CompletionRequest, ModelConfig } from '../types';
import { logger } from '../monitoring/logger';
import { metricsCollector } from '../monitoring/metrics';

export class LoadBalancer {
  private providers: Map<ProviderType, BaseProvider>;
  private roundRobinIndex: number = 0;

  constructor(providers: BaseProvider[]) {
    this.providers = new Map();
    providers.forEach((provider) => {
      if (provider.isEnabled()) {
        this.providers.set(provider.getName() as ProviderType, provider);
      }
    });
  }

  selectProvider(request: CompletionRequest): BaseProvider | null {
    // If specific provider requested
    if (request.provider && request.provider !== 'auto') {
      const provider = this.providers.get(request.provider);
      if (provider && provider.isEnabled()) {
        return provider;
      }
      logger.warn(`Requested provider ${request.provider} not available`);
    }

    // Auto-select based on strategy
    const availableProviders = Array.from(this.providers.values()).filter((p) =>
      p.isEnabled()
    );

    if (availableProviders.length === 0) {
      return null;
    }

    // Cost-optimized selection
    if (request.maxCost !== undefined) {
      return this.selectCostOptimized(availableProviders, request);
    }

    // Performance-based selection
    return this.selectPerformanceBased(availableProviders);
  }

  private selectCostOptimized(
    providers: BaseProvider[],
    request: CompletionRequest
  ): BaseProvider {
    let bestProvider: BaseProvider = providers[0];
    let lowestCost = Infinity;

    for (const provider of providers) {
      const config = provider.getConfig();
      const model = this.findBestModel(config.models, request);

      if (model) {
        const estimatedCost = this.estimateCost(model, request);
        if (estimatedCost < lowestCost && estimatedCost <= (request.maxCost || Infinity)) {
          lowestCost = estimatedCost;
          bestProvider = provider;
        }
      }
    }

    logger.debug(`Selected cost-optimized provider: ${bestProvider.getName()}`);
    return bestProvider;
  }

  private selectPerformanceBased(providers: BaseProvider[]): BaseProvider {
    const metrics = metricsCollector.getMetrics();

    // Filter out providers with recent failures
    const healthyProviders = providers.filter((provider) => {
      const providerName = provider.getName() as ProviderType;
      const stats = metrics.providerStats[providerName];

      if (!stats) return true;

      const failureRate = stats.failures / stats.requests;
      return failureRate < 0.5; // Less than 50% failure rate
    });

    if (healthyProviders.length === 0) {
      // Fallback to round-robin if all have high failure rates
      return this.selectRoundRobin(providers);
    }

    // Select provider with best average latency
    let bestProvider = healthyProviders[0];
    let bestLatency = Infinity;

    for (const provider of healthyProviders) {
      const providerName = provider.getName() as ProviderType;
      const stats = metrics.providerStats[providerName];

      const latency = stats?.averageLatency || 0;
      if (latency > 0 && latency < bestLatency) {
        bestLatency = latency;
        bestProvider = provider;
      }
    }

    logger.debug(`Selected performance-based provider: ${bestProvider.getName()}`);
    return bestProvider;
  }

  private selectRoundRobin(providers: BaseProvider[]): BaseProvider {
    const provider = providers[this.roundRobinIndex % providers.length];
    this.roundRobinIndex++;
    logger.debug(`Selected round-robin provider: ${provider.getName()}`);
    return provider;
  }

  private findBestModel(models: ModelConfig[], request: CompletionRequest): ModelConfig | null {
    if (request.model && request.model !== 'auto') {
      return models.find((m) => m.name === request.model) || models[0];
    }

    // Return cheapest model by default
    return models.reduce((best, current) =>
      current.costPer1kPromptTokens < best.costPer1kPromptTokens ? current : best
    );
  }

  private estimateCost(model: ModelConfig, request: CompletionRequest): number {
    const estimatedPromptTokens = request.prompt
      ? Math.ceil(request.prompt.length / 4)
      : request.messages
      ? Math.ceil(JSON.stringify(request.messages).length / 4)
      : 100;

    const estimatedCompletionTokens = request.maxTokens || 1000;

    const promptCost = (estimatedPromptTokens / 1000) * model.costPer1kPromptTokens;
    const completionCost = (estimatedCompletionTokens / 1000) * model.costPer1kCompletionTokens;

    return promptCost + completionCost;
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }
}
