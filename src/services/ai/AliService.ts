import { AIService, AIServiceConfig, ChatRequest } from '../AIService';

export interface AliServiceConfig extends AIServiceConfig {
  apiKey: string;
}

export class AliService extends AIService {
  private apiKey: string;

  constructor(config: AliServiceConfig) {
    super(config);
    this.apiKey = config.apiKey;
  }

  async chat(request: ChatRequest): Promise<string> {
    const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        input: { messages: request.messages.map(m => ({ role: m.role, content: m.content })) }
      })
    });
    const data = await res.json();
    return data.output?.choices?.[0]?.message?.content || '';
  }

  async getModels(): Promise<string[]> {
    // 阿里API暂不支持直接获取模型列表，返回常用模型
    return ['qwen-turbo', 'qwen-plus', 'qwen-max'];
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'qwen-turbo', input: { messages: [{ role: 'user', content: 'ping' }] } })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getServiceName(): string {
    return '阿里通义千问';
  }
} 