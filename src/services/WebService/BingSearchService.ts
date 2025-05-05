import { AbstractSearchService, SearchResult, SearchServiceConfig } from "./AbstractSearchService";

/**
 * Bing搜索服务
 * 实现基于Bing搜索引擎的网络搜索
 */
export class BingSearchService extends AbstractSearchService {
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
   * 执行Bing搜索
   * @param query 搜索关键词
   * @returns 搜索结果数组
   */
  public async search(query: string): Promise<SearchResult[]> {
    try {
      // 获取搜索URL和用户代理
      const searchUrl = this.getSearchUrl(query);
      const userAgent = this.getUserAgent();
      
      console.log(`[BingSearch] 搜索URL: ${searchUrl}`);
      
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
      console.log(`[BingSearch] 获取到HTML长度: ${html.length}`);
      
      const results: SearchResult[] = [];
      
      // Bing搜索结果解析
      const titleRegex = /<h2><a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a><\/h2>/gi;
      const snippetRegex = /<p[^>]*>(.*?)<\/p>/gi;
      
      let titleMatch;
      let index = 0;
      let matchCount = 0;
      
      // 提取标题匹配，记录所有匹配而不仅仅是前5个
      const allMatches = [];
      while (titleMatch = titleRegex.exec(html)) {
        allMatches.push(titleMatch);
        matchCount++;
      }
      
      console.log(`[BingSearch] 找到标题匹配数量: ${matchCount}`);
      
      // 仅处理前5个匹配
      for (index = 0; index < Math.min(allMatches.length, 5); index++) {
        titleMatch = allMatches[index];
        
        // 获取链接和标题
        const link = titleMatch[1];
        const title = this.stripHtmlTags(titleMatch[2]);
        
        // 查找对应的摘要
        const snippetHTML = html.substring(titleMatch.index);
        const snippetMatch = snippetRegex.exec(snippetHTML);
        const snippet = snippetMatch ? this.stripHtmlTags(snippetMatch[1]) : '无可用摘要';
        
        console.log(`[BingSearch] 结果 #${index + 1}: ${title.substring(0, 30)}...`);
        
        results.push({
          title,
          link,
          snippet,
          source: this.getName()
        });
      }
      
      console.log(`[BingSearch] 返回结果数量: ${results.length}`);
      return results;
    } catch (error) {
      console.error('Bing搜索失败:', error);
      return [];
    }
  }
} 