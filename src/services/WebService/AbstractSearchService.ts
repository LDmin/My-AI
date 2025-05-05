// 搜索结果类型
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

// 搜索服务配置
export interface SearchServiceConfig {
  searchUrl?: string;  // 搜索引擎URL
  userAgent?: string;  // 用户代理
}

/**
 * 搜索服务抽象基类
 * 定义搜索服务的通用接口和方法
 */
export abstract class AbstractSearchService {
  protected config: SearchServiceConfig;
  
  constructor(config: SearchServiceConfig = {}) {
    this.config = config;
  }
  
  /**
   * 执行搜索并返回结果
   * @param query 搜索关键词
   * @returns 搜索结果
   */
  public abstract search(query: string): Promise<SearchResult[]>;
  
  /**
   * 获取搜索引擎名称
   * @returns 搜索引擎名称
   */
  public abstract getName(): string;
  
  /**
   * 获取搜索URL
   * @param query 搜索关键词
   * @returns 完整的搜索URL
   */
  protected abstract getSearchUrl(query: string): string;
  
  /**
   * 获取用户代理
   * @returns 用户代理字符串
   */
  protected getUserAgent(): string {
    // 使用配置中的用户代理或默认值
    return this.config.userAgent || 
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }
  
  /**
   * 移除HTML标签
   * @param html HTML文本
   * @returns 纯文本
   */
  protected stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
} 