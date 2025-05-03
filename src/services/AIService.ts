import { Message } from "../store/chatStore";

// 对话请求参数
export interface ChatRequest {
  messages: { role: string; content: string }[];
  signal?: AbortSignal;
  onStream?: (text: string) => void;
  onThinking?: (text: string) => void;
}

// 基础AI服务配置
export interface AIServiceConfig {
  baseUrl: string;
  model: string;
}

// 抽象AI服务类
export abstract class AIService {
  protected config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * 发送聊天消息并获取流式响应
   * @param request 聊天请求参数
   */
  abstract chat(request: ChatRequest): Promise<string>;

  /**
   * 获取可用模型列表
   * @returns 可用模型列表
   */
  abstract getModels(): Promise<string[]>;

  /**
   * 更新服务配置
   * @param config 新的配置
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查服务可用性
   * @returns 是否可用
   */
  abstract checkAvailability(): Promise<boolean>;

  /**
   * 获取当前已选择的模型
   * @returns 当前模型名称
   */
  getSelectedModel(): string {
    return this.config.model;
  }

  /**
   * 获取服务名称
   * @returns 服务类型名称
   */
  abstract getServiceName(): string;
}

// AI服务工厂类型
export type AIServiceFactory = (config: AIServiceConfig) => AIService; 