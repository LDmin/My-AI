import { AbstractSearchService, SearchResult, SearchServiceConfig } from "./AbstractSearchService";

/**
 * Google搜索服务
 * 实现基于Google搜索引擎的网络搜索
 */
export class GoogleSearchService extends AbstractSearchService {
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
   * 执行Google搜索
   * @param query 搜索关键词
   * @returns 搜索结果数组
   */
  public async search(query: string): Promise<SearchResult[]> {
    try {
      // 获取搜索URL和用户代理
      const searchUrl = this.getSearchUrl(query);
      const userAgent = this.getUserAgent();
      
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
      const results: SearchResult[] = [];
      
      // Google搜索结果解析
      const titleRegex = /<h3 class="[^"]*">(.*?)<\/h3>/gi;
      const linkRegex = /<a href="([^"]*)"[^>]*>/gi;
      const snippetRegex = /<div class="[^"]*">(.*?)<\/div>/gi;
      
      let matches = [];
      let match;
      let index = 0;
      
      // 简化的解析方法，实际可能需要更复杂的HTML解析
      while ((match = titleRegex.exec(html)) && index < 5) {
        const title = this.stripHtmlTags(match[1]);
        
        // 查找链接
        let link = '';
        const linkMatch = linkRegex.exec(html.substring(match.index - 200, match.index));
        if (linkMatch) {
          link = linkMatch[1];
        }
        
        // 查找摘要
        let snippet = '';
        const snippetMatch = snippetRegex.exec(html.substring(match.index, match.index + 500));
        if (snippetMatch) {
          snippet = this.stripHtmlTags(snippetMatch[1]);
        }
        
        results.push({
          title,
          link,
          snippet: snippet || '无可用摘要',
          source: this.getName()
        });
        
        index++;
      }
      
      return results;
    } catch (error) {
      console.error('Google搜索失败:', error);
      return [];
    }
  }
} 