import { CacheManager } from '../index';
import { CompletionRequest, CompletionResponse } from '../../types';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeAll(() => {
    cacheManager = new CacheManager();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent keys for identical requests', () => {
      const request1: CompletionRequest = {
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
      };

      const request2: CompletionRequest = {
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo',
      };

      // Access private method through any for testing
      const key1 = (cacheManager as any).generateCacheKey(request1);
      const key2 = (cacheManager as any).generateCacheKey(request2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different requests', () => {
      const request1: CompletionRequest = {
        prompt: 'Test prompt 1',
        model: 'gpt-3.5-turbo',
      };

      const request2: CompletionRequest = {
        prompt: 'Test prompt 2',
        model: 'gpt-3.5-turbo',
      };

      const key1 = (cacheManager as any).generateCacheKey(request1);
      const key2 = (cacheManager as any).generateCacheKey(request2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('isEnabled', () => {
    it('should return boolean', () => {
      const enabled = cacheManager.isEnabled();
      expect(typeof enabled).toBe('boolean');
    });
  });
});
