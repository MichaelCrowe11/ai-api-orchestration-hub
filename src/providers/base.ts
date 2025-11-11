import { CompletionRequest, CompletionResponse, ProviderConfig } from '../types';

export abstract class BaseProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;

  abstract healthCheck(): Promise<boolean>;

  protected calculateCost(promptTokens: number, completionTokens: number, modelName: string): number {
    const model = this.config.models.find((m) => m.name === modelName);
    if (!model) {
      return 0;
    }

    const promptCost = (promptTokens / 1000) * model.costPer1kPromptTokens;
    const completionCost = (completionTokens / 1000) * model.costPer1kCompletionTokens;

    return promptCost + completionCost;
  }

  protected generateRequestId(): string {
    return `${this.config.name}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  getConfig(): ProviderConfig {
    return this.config;
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  getName(): string {
    return this.config.name;
  }

  getAvailableModels(): string[] {
    return this.config.models.map((m) => m.name);
  }
}
