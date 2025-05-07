// 搜索结果类型
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  description?: string; // 结果正文内容
  savedHtml?: string;   // 用于存储已获取的HTML内容，避免重复获取
}

// 原始HTML搜索结果类型
export interface RawHtmlSearchResult {
  searchUrl: string;   // 搜索URL
  html: string;        // 原始HTML内容
  source: string;      // 搜索引擎来源
  query: string;       // 搜索查询
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
  
  /**
   * 清理HTML并提取正文文本
   * @param html 原始HTML文本
   * @returns 清理后的纯文本内容
   */
  protected extractTextFromHtml(html: string): string {
    try {
      if (!html) return '';
      
      // 1. 移除所有样式标签及其内容
      let cleanedHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // 2. 移除所有脚本标签及其内容
      cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // 3. 移除所有行内样式属性
      cleanedHtml = cleanedHtml.replace(/\s+style="[^"]*"/gi, '');
      cleanedHtml = cleanedHtml.replace(/\s+style='[^']*'/gi, '');
      
      // 4. 提取body内容
      const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(cleanedHtml);
      const bodyContent = bodyMatch ? bodyMatch[1] : cleanedHtml;
      
      // 5. 移除所有剩余的HTML标签
      const textContent = this.stripHtmlTags(bodyContent);
      
      // 6. 处理空白字符：合并多个空格、换行等
      return textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
    } catch (error) {
      console.error('提取HTML文本失败:', error);
      return this.stripHtmlTags(html); // 降级处理，直接去除所有标签
    }
  }
} 