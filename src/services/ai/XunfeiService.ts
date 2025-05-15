import { AIService, AIServiceConfig, ChatRequest } from '../AIService';

export interface XunfeiServiceConfig extends AIServiceConfig {
  appId: string;
  apiSecret: string;
  apiKey: string;
}

export class XunfeiService extends AIService {
  private appId: string;
  private apiSecret: string;
  private apiKey: string;

  constructor(config: XunfeiServiceConfig) {
    super(config);
    this.appId = config.appId;
    this.apiSecret = config.apiSecret;
    this.apiKey = config.apiKey;
  }

  async chat(request: ChatRequest): Promise<string> {
    // 讯飞星火推荐WebSocket流式对接，后续补充
    // 这里只做结构占位，返回空字符串
    return '';
  }

  async getModels(): Promise<string[]> {
    // 讯飞API暂不支持直接获取模型列表，返回常用模型
    return ['spark-v1.5', 'spark-v2.0', 'spark-v3.0'];
  }

  async checkAvailability(): Promise<boolean> {
    // 讯飞API需签名和WebSocket，后续补充
    return false;
  }

  getServiceName(): string {
    return '讯飞星火';
  }
} 