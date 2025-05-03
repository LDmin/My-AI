import { AIService, AIServiceConfig, AIServiceFactory } from "./AIService";
import { OllamaService } from "./OllamaService";

// 服务类型枚举
export enum AIServiceType {
  OLLAMA = 'ollama',
  // 未来可以添加其他服务类型
}

// 服务工厂映射
const serviceFactories: Record<AIServiceType, AIServiceFactory> = {
  [AIServiceType.OLLAMA]: (config) => new OllamaService(config),
};

/**
 * AI服务管理器
 * 负责创建、缓存和管理各类AI服务实例
 */
export class AIServiceManager {
  private static instance: AIServiceManager;
  private services: Map<string, AIService> = new Map();

  private constructor() { }

  /**
   * 获取管理器单例
   */
  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * 获取或创建AI服务
   * @param type 服务类型
   * @param config 服务配置
   */
  public getService(type: AIServiceType, config: AIServiceConfig): AIService {
    const serviceKey = `${type}-${config.baseUrl}-${config.model}`;
    
    // 检查缓存中是否已有服务实例
    if (this.services.has(serviceKey)) {
      const service = this.services.get(serviceKey)!;
      
      // 如果配置变更，更新配置
      if (service.getSelectedModel() !== config.model) {
        service.updateConfig(config);
      }
      
      return service;
    }

    // 创建新服务实例
    const factory = serviceFactories[type];
    if (!factory) {
      throw new Error(`不支持的AI服务类型: ${type}`);
    }

    const service = factory(config);
    this.services.set(serviceKey, service);
    return service;
  }

  /**
   * 清除指定服务的缓存
   * @param type 服务类型
   * @param baseUrl 服务基础URL
   */
  public clearServiceCache(type: AIServiceType, baseUrl: string): void {
    for (const [key, _] of this.services.entries()) {
      if (key.startsWith(`${type}-${baseUrl}`)) {
        this.services.delete(key);
      }
    }
  }

  /**
   * 清除所有服务缓存
   */
  public clearAllServiceCache(): void {
    this.services.clear();
  }
} 