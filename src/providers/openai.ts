import OpenAI from 'openai';
import { BaseProvider } from './base';
import { CompletionRequest, CompletionResponse, OrchestrationError } from '../types';

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI;

  constructor(config: any) {
    super(config);
    this.client = new OpenAI({
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
        : 'gpt-3.5-turbo';

      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        stream: false,
      });

      const usage = response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const cost = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens,
        model
      );

      return {
        id: response.id || this.generateRequestId(),
        provider: 'openai',
        model: response.model,
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
        latency: Date.now() - startTime,
        cached: false,
        timestamp: new Date(),
        metadata: request.metadata,
      };
    } catch (error: any) {
      throw new OrchestrationError(
        `OpenAI API error: ${error.message}`,
        'OPENAI_ERROR',
        'openai',
        error
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
