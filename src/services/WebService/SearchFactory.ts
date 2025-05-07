import { AbstractSearchService, SearchServiceConfig } from "./AbstractSearchService";
import { BingSearchService } from "./BingSearchService";
import { GoogleSearchService } from "./GoogleSearchService";
import { BaiduSearchService } from "./BaiduSearchService";
import { RawBingSearchService, RawGoogleSearchService, RawBaiduSearchService, RawSearchService } from "./RawSearchService";

/**
 * 搜索引擎类型枚举
 */
export enum SearchEngineType {
  BING = 'bing',
  GOOGLE = 'google',
  BAIDU = 'baidu'
}

/**
 * 搜索服务工厂类
 * 负责创建和管理不同类型的搜索服务实例
 */
export class SearchFactory {
  private static instance: SearchFactory;
  private serviceCache: Map<string, AbstractSearchService> = new Map();
  private rawServiceCache: Map<string, RawSearchService> = new Map();
  
  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor() {}
  
  /**
   * 获取工厂单例实例
   * @returns 搜索服务工厂实例
   */
  public static getInstance(): SearchFactory {
    if (!SearchFactory.instance) {
      SearchFactory.instance = new SearchFactory();
    }
    return SearchFactory.instance;
  }
  
  /**
   * 创建搜索服务实例
   * @param type 搜索引擎类型
   * @param config 搜索配置
   * @returns 搜索服务实例
   */
  public createSearchService(type: SearchEngineType, config: SearchServiceConfig = {}): AbstractSearchService {
    // 创建缓存键
    const cacheKey = `${type}-${JSON.stringify(config)}`;
    
    // 检查缓存
    if (this.serviceCache.has(cacheKey)) {
      return this.serviceCache.get(cacheKey)!;
    }
    
    // 创建新实例
    let service: AbstractSearchService;
    
    switch (type) {
      case SearchEngineType.BING:
        service = new BingSearchService(config);
        break;
      case SearchEngineType.GOOGLE:
        service = new GoogleSearchService(config);
        break;
      case SearchEngineType.BAIDU:
        service = new BaiduSearchService(config);
        break;
      default:
        // 默认使用Bing搜索
        service = new BingSearchService(config);
    }
    
    // 缓存服务实例
    this.serviceCache.set(cacheKey, service);
    
    return service;
  }

  /**
   * 创建原始搜索服务实例
   * @param type 搜索引擎类型
   * @param config 搜索配置
   * @returns 原始搜索服务实例
   */
  public createRawSearchService(type: SearchEngineType, config: SearchServiceConfig = {}): RawSearchService {
    // 创建缓存键
    const cacheKey = `raw-${type}-${JSON.stringify(config)}`;
    
    // 检查缓存
    if (this.rawServiceCache.has(cacheKey)) {
      return this.rawServiceCache.get(cacheKey)!;
    }
    
    // 创建新实例
    let service: RawSearchService;
    
    switch (type) {
      case SearchEngineType.BING:
        service = new RawBingSearchService(config);
        break;
      case SearchEngineType.GOOGLE:
        service = new RawGoogleSearchService(config);
        break;
      case SearchEngineType.BAIDU:
        service = new RawBaiduSearchService(config);
        break;
      default:
        // 默认使用Bing搜索
        service = new RawBingSearchService(config);
    }
    
    // 缓存服务实例
    this.rawServiceCache.set(cacheKey, service);
    
    return service;
  }
} 