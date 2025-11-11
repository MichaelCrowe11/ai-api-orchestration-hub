import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base';
import { CompletionRequest, CompletionResponse, OrchestrationError } from '../types';

export class AnthropicProvider extends BaseProvider {
  private client: Anthropic;

  constructor(config: any) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    try {
      const messages = request.messages || [
        { role: 'user' as const, content: request.prompt || '' },
      ];

      const model = request.model && request.model !== 'auto'
        ? request.model
        : 'claude-3-5-sonnet-20241022';

      const response = await this.client.messages.create({
        model,
        messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature,
        top_p: request.topP,
      });

      const usage = response.usage;
      const cost = this.calculateCost(
        usage.input_tokens,
        usage.output_tokens,
        model
      );

      return {
        id: response.id || this.generateRequestId(),
        provider: 'anthropic',
        model: response.model,
        content: response.content[0]?.type === 'text' ? response.content[0].text : '',
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
        },
        cost,
        latency: Date.now() - startTime,
        cached: false,
        timestamp: new Date(),
        metadata: request.metadata,
      };
    } catch (error: any) {
      throw new OrchestrationError(
        `Anthropic API error: ${error.message}`,
        'ANTHROPIC_ERROR',
        'anthropic',
        error
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try a minimal request to verify API key
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
