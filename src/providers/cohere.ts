import { CohereClient } from 'cohere-ai';
import { BaseProvider } from './base';
import { CompletionRequest, CompletionResponse, OrchestrationError } from '../types';

export class CohereProvider extends BaseProvider {
  private client: CohereClient;

  constructor(config: any) {
    super(config);
    this.client = new CohereClient({
      token: config.apiKey,
    });
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    try {
      const model = request.model && request.model !== 'auto'
        ? request.model
        : 'command-r';

      // Convert messages to chat format
      const message = request.messages
        ? request.messages[request.messages.length - 1]?.content
        : request.prompt || '';

      const chatHistory = request.messages
        ? request.messages.slice(0, -1).map((m) => ({
            role: m.role === 'user' ? ('USER' as const) : ('CHATBOT' as const),
            message: m.content,
          }))
        : undefined;

      const response = await this.client.chat({
        model,
        message,
        chatHistory,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
        p: request.topP,
      });

      const promptTokens = response.meta?.tokens?.inputTokens || 0;
      const completionTokens = response.meta?.tokens?.outputTokens || 0;

      const cost = this.calculateCost(promptTokens, completionTokens, model);

      return {
        id: response.generationId || this.generateRequestId(),
        provider: 'cohere',
        model,
        content: response.text,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        cost,
        latency: Date.now() - startTime,
        cached: false,
        timestamp: new Date(),
        metadata: request.metadata,
      };
    } catch (error: any) {
      throw new OrchestrationError(
        `Cohere API error: ${error.message}`,
        'COHERE_ERROR',
        'cohere',
        error
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.chat({
        model: 'command',
        message: 'test',
        maxTokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
