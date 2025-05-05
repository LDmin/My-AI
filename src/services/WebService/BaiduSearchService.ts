import { AbstractSearchService, SearchResult, SearchServiceConfig } from "./AbstractSearchService";

/**
 * 百度搜索服务
 * 实现基于百度搜索引擎的网络搜索
 */
export class BaiduSearchService extends AbstractSearchService {
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
   * 执行百度搜索
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
      
      // 百度搜索结果解析
      const titleRegex = /<h3 class="[^"]*"><a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a><\/h3>/gi;
      const snippetRegex = /<div class="[^"]*c-abstract[^"]*">(.*?)<\/div>/gi;
      
      let titleMatch;
      let index = 0;
      while ((titleMatch = titleRegex.exec(html)) && index < 5) {
        // 获取链接和标题
        let link = titleMatch[1];
        const title = this.stripHtmlTags(titleMatch[2]);
        
        // 百度的链接需要额外处理，它们通常是重定向链接
        if (link.startsWith('http')) {
          // 保留链接
        } else {
          // 尝试从URL中提取真实链接
          try {
            const url = new URL(link, 'https://www.baidu.com');
            const realUrl = url.searchParams.get('url');
            if (realUrl) {
              link = realUrl;
            }
          } catch (e) {
            // 忽略URL解析错误，使用原始链接
          }
        }
        
        // 查找对应的摘要
        const snippetHTML = html.substring(titleMatch.index);
        const snippetMatch = snippetRegex.exec(snippetHTML);
        const snippet = snippetMatch ? this.stripHtmlTags(snippetMatch[1]) : '无可用摘要';
        
        results.push({
          title,
          link,
          snippet,
          source: this.getName()
        });
        
        index++;
      }
      
      return results;
    } catch (error) {
      console.error('百度搜索失败:', error);
      return [];
    }
  }
} 