import { AbstractSearchService, RawHtmlSearchResult, SearchResult, SearchServiceConfig } from "./AbstractSearchService";

/**
 * 原始搜索服务基类
 * 获取原始HTML而不进行解析
 */
export abstract class RawSearchService extends AbstractSearchService {
  constructor(config: SearchServiceConfig = {}) {
    super(config);
  }
  
  /**
   * 获取原始HTML搜索结果
   * @param query 搜索关键词
   * @returns 原始HTML搜索结果
   */
  public abstract searchRaw(query: string): Promise<RawHtmlSearchResult>;
  
  /**
   * 标准搜索方法
   * 这个方法不会被使用，取而代之的是searchRaw
   */
  public async search(query: string): Promise<SearchResult[]> {
    console.warn('RawSearchService的search方法不应该被直接调用，请使用searchRaw方法');
    return [];
  }
}

/**
 * 原始Bing搜索服务
 */
export class RawBingSearchService extends RawSearchService {
  constructor(config: SearchServiceConfig = {}) {
    super(config);
  }
  
  /**
   * 获取搜索引擎名称
   * @returns 搜索引擎名称
   */
  public getName(): string {
    return 'Bing';
  }
  
  /**
   * 获取Bing搜索URL
   * @param query 搜索关键词
   * @returns 完整的搜索URL
   */
  protected getSearchUrl(query: string): string {
    // 使用配置中的URL或默认的Bing搜索URL
    let searchUrl = this.config.searchUrl || `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    
    // 如果URL中没有查询参数，则添加
    if (!searchUrl.includes('?q=') && !searchUrl.includes('&q=')) {
      searchUrl += searchUrl.includes('?') ? '&' : '?';
      searchUrl += `q=${encodeURIComponent(query)}`;
    }
    
    return searchUrl;
  }
  
  /**
   * 执行Bing原始搜索
   * @param query 搜索关键词
   * @returns 原始HTML搜索结果
   */
  public async searchRaw(query: string): Promise<RawHtmlSearchResult> {
    try {
      // 获取搜索URL和用户代理
      const searchUrl = this.getSearchUrl(query);
      const userAgent = this.getUserAgent();
      
      console.log(`[RawBingSearch] 搜索URL: ${searchUrl}`);
      
      // 执行HTTP请求
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });
      
      // 获取HTML内容
      const html = await response.text();
      console.log(`[RawBingSearch] 获取到HTML长度: ${html.length}`);
      
      return {
        searchUrl,
        html,
        source: this.getName(),
        query
      };
    } catch (error) {
      console.error('Bing原始搜索失败:', error);
      return {
        searchUrl: this.getSearchUrl(query),
        html: '搜索失败，无法获取HTML内容',
        source: this.getName(),
        query
      };
    }
  }
}

/**
 * 原始Google搜索服务
 */
export class RawGoogleSearchService extends RawSearchService {
  constructor(config: SearchServiceConfig = {}) {
    super(config);
  }
  
  /**
   * 获取搜索引擎名称
   * @returns 搜索引擎名称
   */
  public getName(): string {
    return 'Google';
  }
  
  /**
   * 获取Google搜索URL
   * @param query 搜索关键词
   * @returns 完整的搜索URL
   */
  protected getSearchUrl(query: string): string {
    // 使用配置中的URL或默认的Google搜索URL
    let searchUrl = this.config.searchUrl || `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    // 如果URL中没有查询参数，则添加
    if (!searchUrl.includes('?q=') && !searchUrl.includes('&q=')) {
      searchUrl += searchUrl.includes('?') ? '&' : '?';
      searchUrl += `q=${encodeURIComponent(query)}`;
    }
    
    return searchUrl;
  }
  
  /**
   * 执行Google原始搜索
   * @param query 搜索关键词
   * @returns 原始HTML搜索结果
   */
  public async searchRaw(query: string): Promise<RawHtmlSearchResult> {
    try {
      // 获取搜索URL和用户代理
      const searchUrl = this.getSearchUrl(query);
      const userAgent = this.getUserAgent();
      
      console.log(`[RawGoogleSearch] 搜索URL: ${searchUrl}`);
      
      // 执行HTTP请求
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });
      
      // 获取HTML内容
      const html = await response.text();
      console.log(`[RawGoogleSearch] 获取到HTML长度: ${html.length}`);
      
      return {
        searchUrl,
        html,
        source: this.getName(),
        query
      };
    } catch (error) {
      console.error('Google原始搜索失败:', error);
      return {
        searchUrl: this.getSearchUrl(query),
        html: '搜索失败，无法获取HTML内容',
        source: this.getName(),
        query
      };
    }
  }
}

/**
 * 原始百度搜索服务
 */
export class RawBaiduSearchService extends RawSearchService {
  constructor(config: SearchServiceConfig = {}) {
    super(config);
  }
  
  /**
   * 获取搜索引擎名称
   * @returns 搜索引擎名称
   */
  public getName(): string {
    return '百度';
  }
  
  /**
   * 获取百度搜索URL
   * @param query 搜索关键词
   * @returns 完整的搜索URL
   */
  protected getSearchUrl(query: string): string {
    // 使用配置中的URL或默认的百度搜索URL
    let searchUrl = this.config.searchUrl || `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
    
    // 如果URL中没有查询参数，则添加
    if (!searchUrl.includes('?wd=') && !searchUrl.includes('&wd=')) {
      searchUrl += searchUrl.includes('?') ? '&' : '?';
      searchUrl += `wd=${encodeURIComponent(query)}`;
    }
    
    return searchUrl;
  }
  
  /**
   * 执行百度原始搜索
   * @param query 搜索关键词
   * @returns 原始HTML搜索结果
   */
  public async searchRaw(query: string): Promise<RawHtmlSearchResult> {
    try {
      // 获取搜索URL和用户代理
      const searchUrl = this.getSearchUrl(query);
      const userAgent = this.getUserAgent();
      
      console.log(`[RawBaiduSearch] 搜索URL: ${searchUrl}`);
      
      // 执行HTTP请求
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });
      
      // 获取HTML内容
      const html = await response.text();
      console.log(`[RawBaiduSearch] 获取到HTML长度: ${html.length}`);
      
      return {
        searchUrl,
        html,
        source: this.getName(),
        query
      };
    } catch (error) {
      console.error('百度原始搜索失败:', error);
      return {
        searchUrl: this.getSearchUrl(query),
        html: '搜索失败，无法获取HTML内容',
        source: this.getName(),
        query
      };
    }
  }
}