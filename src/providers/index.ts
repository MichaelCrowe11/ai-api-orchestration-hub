import { BaseProvider } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { CohereProvider } from './cohere';
import { ProviderConfig, ProviderType } from '../types';

export class ProviderFactory {
  static createProvider(config: ProviderConfig): BaseProvider {
    switch (config.name) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'google':
        return new GoogleProvider(config);
      case 'cohere':
        return new CohereProvider(config);
      default:
        throw new Error(`Unknown provider: ${config.name}`);
    }
  }
}

export { BaseProvider, OpenAIProvider, AnthropicProvider, GoogleProvider, CohereProvider };
