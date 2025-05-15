import { AIService, AIServiceConfig, AIServiceFactory } from "./AIService";
import { OllamaService } from "./OllamaService";
import { SiliconflowService, SiliconflowServiceConfig } from "./SiliconflowService";
import { OpenAIService, OpenAIServiceConfig } from "./ai/OpenAIService";
import { BaiduService, BaiduServiceConfig } from "./ai/BaiduService";
import { AliService, AliServiceConfig } from "./ai/AliService";
import { ZhipuService, ZhipuServiceConfig } from "./ai/ZhipuService";
import { MiniMaxService, MiniMaxServiceConfig } from "./ai/MiniMaxService";
import { XunfeiService, XunfeiServiceConfig } from "./ai/XunfeiService";

// 服务类型枚举
export enum AIServiceType {
  OLLAMA = 'ollama',
  SILICONFLOW = 'siliconflow',
  OPENAI = 'openai',
  BAIDU = 'baidu',
  ALI = 'ali',
  ZHIPU = 'zhipu',
  MINIMAX = 'minimax',
  XUNFEI = 'xunfei',
}

// 服务工厂映射
const serviceFactories: Record<AIServiceType, AIServiceFactory> = {
  [AIServiceType.OLLAMA]: (config) => new OllamaService(config),
  [AIServiceType.SILICONFLOW]: (config) => new SiliconflowService(config as SiliconflowServiceConfig),
  [AIServiceType.OPENAI]: (config) => new OpenAIService(config as OpenAIServiceConfig),
  [AIServiceType.BAIDU]: (config) => new BaiduService(config as BaiduServiceConfig),
  [AIServiceType.ALI]: (config) => new AliService(config as AliServiceConfig),
  [AIServiceType.ZHIPU]: (config) => new ZhipuService(config as ZhipuServiceConfig),
  [AIServiceType.MINIMAX]: (config) => new MiniMaxService(config as MiniMaxServiceConfig),
  [AIServiceType.XUNFEI]: (config) => new XunfeiService(config as XunfeiServiceConfig),
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
    // 对于硅基流动服务，需要使用token作为缓存键的一部分
    let serviceKey = `${type}-${config.baseUrl}-${config.model}`;
    if (type === AIServiceType.SILICONFLOW) {
      const siliconflowConfig = config as SiliconflowServiceConfig;
      serviceKey = `${type}-${config.baseUrl}-${config.model}-${siliconflowConfig.token}`;
    }
    
    // 检查缓存中是否已有服务实例
    if (this.services.has(serviceKey)) {
      const service = this.services.get(serviceKey)!;
      
      // 如果配置变更，更新配置
      if (service.getSelectedModel() !== config.model) {
        service.updateConfig(config);
      }
      
      // 特殊处理硅基流动服务的token更新
      if (type === AIServiceType.SILICONFLOW) {
        const siliconflowService = service as SiliconflowService;
        const siliconflowConfig = config as SiliconflowServiceConfig;
        if (siliconflowService.getToken() !== siliconflowConfig.token) {
          siliconflowService.updateToken(siliconflowConfig.token);
        }
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