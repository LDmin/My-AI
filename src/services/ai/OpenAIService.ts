import { AIService, AIServiceConfig, ChatRequest } from '../AIService';

export interface OpenAIServiceConfig extends AIServiceConfig {
  apiKey: string;
}

export class OpenAIService extends AIService {
  private apiKey: string;

  constructor(config: OpenAIServiceConfig) {
    super(config);
    this.apiKey = config.apiKey;
  }

  async chat(request: ChatRequest): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages.map(m => ({ role: m.role, content: m.content }))
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async getModels(): Promise<string[]> {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    const data = await res.json();
    return data.data?.map((m: any) => m.id) || [];
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getServiceName(): string {
    return 'OpenAI';
  }
} 