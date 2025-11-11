import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base';
import { CompletionRequest, CompletionResponse, OrchestrationError } from '../types';

export class GoogleProvider extends BaseProvider {
  private client: GoogleGenerativeAI;

  constructor(config: any) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    try {
      const model = request.model && request.model !== 'auto'
        ? request.model
        : 'gemini-1.5-flash';

      const genModel = this.client.getGenerativeModel({ model });

      // Convert messages to Gemini format
      const prompt = request.messages
        ? request.messages.map((m) => `${m.role}: ${m.content}`).join('\n')
        : request.prompt || '';

      const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: request.maxTokens,
          temperature: request.temperature,
          topP: request.topP,
        },
      });

      const response = result.response;
      const text = response.text();

      // Estimate tokens (Gemini doesn't provide exact counts in all cases)
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(text.length / 4);

      const cost = this.calculateCost(promptTokens, completionTokens, model);

      return {
        id: this.generateRequestId(),
        provider: 'google',
        model,
        content: text,
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
        `Google API error: ${error.message}`,
        'GOOGLE_ERROR',
        'google',
        error
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'test' }] }] });
      return true;
    } catch {
      return false;
    }
  }
}
