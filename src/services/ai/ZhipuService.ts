import { AIService, AIServiceConfig, ChatRequest } from '../AIService';

export interface ZhipuServiceConfig extends AIServiceConfig {
  apiKey: string;
}

export class ZhipuService extends AIService {
  private apiKey: string;

  constructor(config: ZhipuServiceConfig) {
    super(config);
    this.apiKey = config.apiKey;
  }

  async chat(request: ChatRequest): Promise<string> {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v3/model-api', {
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
    return data.choices?.[0]?.content || '';
  }

  async getModels(): Promise<string[]> {
    // 智谱API暂不支持直接获取模型列表，返回常用模型
    return ['glm-4', 'glm-3-turbo', 'chatglm_pro'];
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch('https://open.bigmodel.cn/api/paas/v3/model-api', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'glm-4', messages: [{ role: 'user', content: 'ping' }] })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getServiceName(): string {
    return '智谱AI';
  }
} 