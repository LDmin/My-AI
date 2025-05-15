import { AIService, AIServiceConfig, ChatRequest } from '../AIService';

export interface BaiduServiceConfig extends AIServiceConfig {
  apiKey: string;
  secretKey: string;
}

export class BaiduService extends AIService {
  private apiKey: string;
  private secretKey: string;
  private accessToken: string = '';

  constructor(config: BaiduServiceConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
  }

  private async fetchAccessToken() {
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    this.accessToken = data.access_token;
  }

  async chat(request: ChatRequest): Promise<string> {
    if (!this.accessToken) await this.fetchAccessToken();
    const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: this.config.model
      })
    });
    const data = await res.json();
    return data.result || '';
  }

  async getModels(): Promise<string[]> {
    // 百度API暂不支持直接获取模型列表，返回常用模型
    return ['ernie-bot', 'ernie-bot-turbo', 'ernie-bot-4'];
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.fetchAccessToken();
      return !!this.accessToken;
    } catch {
      return false;
    }
  }

  getServiceName(): string {
    return '百度文心一言';
  }
} 