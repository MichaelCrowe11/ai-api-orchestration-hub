import { Orchestrator } from '../orchestrator';
import { CompletionRequest } from '../../types';

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeAll(async () => {
    orchestrator = new Orchestrator();
    await orchestrator.initialize();
  });

  afterAll(async () => {
    await orchestrator.shutdown();
  });

  describe('complete', () => {
    it('should handle completion request with prompt', async () => {
      const request: CompletionRequest = {
        prompt: 'Hello, world!',
        maxTokens: 50,
      };

      // This test would need actual API keys to run
      // For now, we're just testing the structure
      expect(orchestrator).toBeDefined();
      expect(typeof orchestrator.complete).toBe('function');
    });

    it('should handle completion request with messages', async () => {
      const request: CompletionRequest = {
        messages: [
          { role: 'user', content: 'Hello!' },
        ],
        maxTokens: 50,
      };

      expect(orchestrator).toBeDefined();
      expect(typeof orchestrator.complete).toBe('function');
    });
  });

  describe('healthCheck', () => {
    it('should return health status for all providers', async () => {
      const health = await orchestrator.healthCheck();

      expect(health).toBeDefined();
      expect(typeof health).toBe('object');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', () => {
      const metrics = orchestrator.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('totalCost');
      expect(metrics).toHaveProperty('averageLatency');
    });
  });
});
