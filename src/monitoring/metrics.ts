import { OrchestrationMetrics, ProviderMetrics, ProviderType } from '../types';

export class MetricsCollector {
  private metrics: OrchestrationMetrics;
  private dailyCost: number = 0;
  private dailyCostResetTime: Date;

  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      averageLatency: 0,
      cacheHitRate: 0,
      providerStats: {} as Record<ProviderType, ProviderMetrics>,
    };
    this.dailyCostResetTime = this.getNextMidnight();
  }

  recordRequest(
    provider: ProviderType,
    success: boolean,
    cost: number,
    latency: number,
    cached: boolean
  ): void {
    this.checkDailyReset();

    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.totalCost += cost;
    this.dailyCost += cost;

    // Update average latency
    const totalLatency = this.metrics.averageLatency * (this.metrics.totalRequests - 1);
    this.metrics.averageLatency = (totalLatency + latency) / this.metrics.totalRequests;

    // Update cache hit rate
    if (cached) {
      const totalCacheHits = this.metrics.cacheHitRate * (this.metrics.totalRequests - 1);
      this.metrics.cacheHitRate = (totalCacheHits + 1) / this.metrics.totalRequests;
    } else {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHitRate * (this.metrics.totalRequests - 1)) /
        this.metrics.totalRequests;
    }

    // Update provider stats
    if (!this.metrics.providerStats[provider]) {
      this.metrics.providerStats[provider] = {
        requests: 0,
        successes: 0,
        failures: 0,
        totalCost: 0,
        averageLatency: 0,
      };
    }

    const providerStats = this.metrics.providerStats[provider];
    providerStats.requests++;

    if (success) {
      providerStats.successes++;
    } else {
      providerStats.failures++;
      providerStats.lastFailure = new Date();
    }

    providerStats.totalCost += cost;

    const providerTotalLatency = providerStats.averageLatency * (providerStats.requests - 1);
    providerStats.averageLatency = (providerTotalLatency + latency) / providerStats.requests;
  }

  getMetrics(): OrchestrationMetrics {
    return { ...this.metrics };
  }

  getDailyCost(): number {
    this.checkDailyReset();
    return this.dailyCost;
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      averageLatency: 0,
      cacheHitRate: 0,
      providerStats: {} as Record<ProviderType, ProviderMetrics>,
    };
    this.dailyCost = 0;
    this.dailyCostResetTime = this.getNextMidnight();
  }

  private checkDailyReset(): void {
    if (new Date() >= this.dailyCostResetTime) {
      this.dailyCost = 0;
      this.dailyCostResetTime = this.getNextMidnight();
    }
  }

  private getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}

export const metricsCollector = new MetricsCollector();
