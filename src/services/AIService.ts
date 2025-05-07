import { Message } from "../store/chatStore";

// 对话请求参数
export interface ChatRequest {
  messages: { role: string; content: string }[];
  signal?: AbortSignal;
  onStream?: (text: string) => void;
  onThinking?: (text: string) => void;
  sessionId?: string; // 添加会话ID，用于识别请求属于哪个会话
}

// 基础AI服务配置
export interface AIServiceConfig {
  baseUrl: string;
  model: string;
}

// 抽象AI服务类
export abstract class AIService {
  protected config: AIServiceConfig;
  protected activeRequests: Map<string, AbortController[]> = new Map(); // 记录活跃的请求
  
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
  
  /**
   * 添加请求控制器到活跃请求列表
   * @param sessionId 会话ID
   * @param controller 请求控制器
   */
  protected addActiveRequest(sessionId: string, controller: AbortController): void {
    if (!this.activeRequests.has(sessionId)) {
      this.activeRequests.set(sessionId, []);
    }
    this.activeRequests.get(sessionId)?.push(controller);
  }
  
  /**
   * 从活跃请求列表中移除请求控制器
   * @param sessionId 会话ID
   * @param controller 请求控制器
   */
  protected removeActiveRequest(sessionId: string, controller: AbortController): void {
    if (!this.activeRequests.has(sessionId)) return;
    
    const controllers = this.activeRequests.get(sessionId);
    if (controllers) {
      const index = controllers.indexOf(controller);
      if (index !== -1) {
        controllers.splice(index, 1);
      }
    }
  }
  
  /**
   * 取消指定会话的所有请求
   * @param sessionId 会话ID
   */
  public cancelRequests(sessionId: string): void {
    console.log(`[${this.getServiceName()}] 取消会话 ${sessionId} 的所有请求`);
    
    if (!this.activeRequests.has(sessionId)) return;
    
    const controllers = this.activeRequests.get(sessionId);
    if (controllers && controllers.length > 0) {
      controllers.forEach(controller => {
        try {
          controller.abort();
        } catch (error) {
          console.error(`[${this.getServiceName()}] 取消请求失败:`, error);
        }
      });
      
      // 清空该会话的请求列表
      this.activeRequests.set(sessionId, []);
    }
  }
  
  /**
   * 取消所有会话的请求
   */
  public cancelAllRequests(): void {
    console.log(`[${this.getServiceName()}] 取消所有请求`);
    
    this.activeRequests.forEach((controllers, sessionId) => {
      controllers.forEach(controller => {
        try {
          controller.abort();
        } catch (error) {
          console.error(`[${this.getServiceName()}] 取消请求失败:`, error);
        }
      });
    });
    
    // 清空所有请求列表
    this.activeRequests.clear();
  }
}

// AI服务工厂类型
export type AIServiceFactory = (config: AIServiceConfig) => AIService; 