import { AIService, AIServiceConfig, ChatRequest } from '../AIService';

export interface MiniMaxServiceConfig extends AIServiceConfig {
  apiKey: string;
}

export class MiniMaxService extends AIService {
  private apiKey: string;

  constructor(config: MiniMaxServiceConfig) {
    super(config);
    this.apiKey = config.apiKey;
  }

  async chat(request: ChatRequest): Promise<string> {
    const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion', {
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
    // MiniMax API暂不支持直接获取模型列表，返回常用模型
    return ['abab5.5-chat', 'abab6-chat', 'abab6-13b-chat'];
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'abab5.5-chat', messages: [{ role: 'user', content: 'ping' }] })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getServiceName(): string {
    return 'MiniMax';
  }
} 