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
      
      console.log(`[GoogleSearch] 搜索URL: ${searchUrl}`);
      
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
      console.log(`[GoogleSearch] 获取到HTML长度: ${html.length}`);
      
      const results: SearchResult[] = [];
      
      // Google搜索结果解析 - 更新正则表达式以匹配更多可能的格式
      const titleRegex = /<h3[^>]*>(.*?)<\/h3>/gi;
      const linkRegex = /<a href="([^"]*)"[^>]*>/gi;
      const snippetRegex = /<div[^>]*class="[^"]*"[^>]*>(.*?)<\/div>/gi;
      
      let match;
      let matchCount = 0;
      
      // 提取标题匹配，记录所有匹配而不仅仅是前5个
      const allMatches = [];
      while (match = titleRegex.exec(html)) {
        allMatches.push({
          index: match.index,
          title: match[1]
        });
        matchCount++;
      }
      
      console.log(`[GoogleSearch] 找到标题匹配数量: ${matchCount}`);
      
      // 仅处理前5个匹配
      for (let index = 0; index < Math.min(allMatches.length, 5); index++) {
        const titleMatch = allMatches[index];
        const title = this.stripHtmlTags(titleMatch.title);
        
        // 查找链接 - 搜索范围扩大
        let link = '';
        const beforeTitleHtml = html.substring(Math.max(0, titleMatch.index - 300), titleMatch.index);
        const linkMatches = [...beforeTitleHtml.matchAll(/<a href="([^"]*)"[^>]*>/gi)];
        
        if (linkMatches.length > 0) {
          // 取最近的链接
          const lastLinkMatch = linkMatches[linkMatches.length - 1];
          link = lastLinkMatch[1];
          
          // 如果是Google内部链接，尝试提取原始URL
          if (link.startsWith('/url?') || link.includes('/url?')) {
            try {
              const urlParams = new URLSearchParams(link.split('?')[1]);
              const originalUrl = urlParams.get('q') || urlParams.get('url');
              if (originalUrl) link = originalUrl;
            } catch (e) {
              // 忽略解析错误，保留原始链接
            }
          }
        }
        
        // 查找摘要 - 搜索范围扩大
        let snippet = '';
        const afterTitleHtml = html.substring(titleMatch.index, titleMatch.index + 500);
        const snippetMatches = [...afterTitleHtml.matchAll(/<div[^>]*>(.*?)<\/div>/gi)];
        
        if (snippetMatches.length > 0) {
          // 取第一个非空摘要
          for (const snippetMatch of snippetMatches) {
            const possibleSnippet = this.stripHtmlTags(snippetMatch[1]).trim();
            if (possibleSnippet && possibleSnippet.length > 20) {
              snippet = possibleSnippet;
              break;
            }
          }
        }
        
        // 如果仍没有摘要，尝试其他方法
        if (!snippet) {
          const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
          const paragraphMatches = [...afterTitleHtml.matchAll(paragraphRegex)];
          if (paragraphMatches.length > 0) {
            snippet = this.stripHtmlTags(paragraphMatches[0][1]);
          }
        }
        
        console.log(`[GoogleSearch] 结果 #${index + 1}: ${title.substring(0, 30)}...`);
        
        results.push({
          title,
          link,
          snippet: snippet || '无可用摘要',
          source: this.getName()
        });
      }
      
      console.log(`[GoogleSearch] 返回结果数量: ${results.length}`);
      return results;
    } catch (error) {
      console.error('Google搜索失败:', error);
      return [];
    }
  }
} 