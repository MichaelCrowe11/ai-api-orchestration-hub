import { MetricsCollector } from '../metrics';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('recordRequest', () => {
    it('should record successful request', () => {
      collector.recordRequest('openai', true, 0.001, 500, false);

      const metrics = collector.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.totalCost).toBe(0.001);
      expect(metrics.averageLatency).toBe(500);
    });

    it('should record failed request', () => {
      collector.recordRequest('openai', false, 0, 500, false);

      const metrics = collector.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.totalCost).toBe(0);
    });

    it('should track provider-specific metrics', () => {
      collector.recordRequest('openai', true, 0.001, 500, false);
      collector.recordRequest('anthropic', true, 0.002, 600, false);

      const metrics = collector.getMetrics();

      expect(metrics.providerStats.openai).toBeDefined();
      expect(metrics.providerStats.openai.requests).toBe(1);
      expect(metrics.providerStats.anthropic).toBeDefined();
      expect(metrics.providerStats.anthropic.requests).toBe(1);
    });

    it('should calculate cache hit rate correctly', () => {
      collector.recordRequest('openai', true, 0, 100, true); // Cached
      collector.recordRequest('openai', true, 0.001, 500, false); // Not cached

      const metrics = collector.getMetrics();

      expect(metrics.cacheHitRate).toBe(0.5);
    });
  });

  describe('getDailyCost', () => {
    it('should track daily cost', () => {
      collector.recordRequest('openai', true, 0.001, 500, false);
      collector.recordRequest('openai', true, 0.002, 500, false);

      const dailyCost = collector.getDailyCost();

      expect(dailyCost).toBe(0.003);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      collector.recordRequest('openai', true, 0.001, 500, false);
      collector.reset();

      const metrics = collector.getMetrics();

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.totalCost).toBe(0);
    });
  });
});
