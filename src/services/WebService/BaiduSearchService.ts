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
      
      console.log(`[BaiduSearch] 搜索URL: ${searchUrl}`);
      
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
      console.log(`[BaiduSearch] 获取到HTML长度: ${html.length}`);
      
      const results: SearchResult[] = [];
      
      // 百度搜索结果解析 - 更新正则表达式以更广泛匹配
      const titleRegex = /<h3[^>]*>(?:<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>|<a[^>]*>(.*?)<\/a>.*?<a[^>]*href="([^"]*)"[^>]*>)/gi;
      const snippetRegex = /<div[^>]*class="[^"]*c-abstract[^"]*"[^>]*>(.*?)<\/div>|<div[^>]*class="[^"]*c-span[^"]*"[^>]*>(.*?)<\/div>/gi;
      const contentRegex = /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>|<div[^>]*class="[^"]*c-container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      
      let titleMatch;
      let matchCount = 0;
      
      // 提取标题匹配，记录所有匹配
      const allMatches = [];
      while (titleMatch = titleRegex.exec(html)) {
        allMatches.push(titleMatch);
        matchCount++;
      }
      
      console.log(`[BaiduSearch] 找到标题匹配数量: ${matchCount}`);
      
      // 备用摘要正则
      const backupSnippetRegex = /<div[^>]*class="[^"]*"[^>]*>(.*?)<\/div>/gi;
      
      // 仅处理前5个匹配
      for (let index = 0; index < Math.min(allMatches.length, 5); index++) {
        titleMatch = allMatches[index];
        
        // 获取链接和标题 - 根据匹配组判断
        let link = titleMatch[1] || titleMatch[4] || '';
        let title = this.stripHtmlTags(titleMatch[2] || titleMatch[3] || '');
        
        // 百度的链接需要额外处理，它们通常是重定向链接
        if (link) {
          if (link.startsWith('http')) {
            // 保留链接
          } else if (link.includes('/url?') || link.includes('&url=')) {
            // 处理查询参数中的URL
            try {
              const urlParams = new URLSearchParams(link.split('?')[1]);
              const realUrl = urlParams.get('url');
              if (realUrl) {
                link = realUrl;
              }
            } catch (e) {
              // 忽略URL解析错误，使用原始链接
              console.log(`[BaiduSearch] URL解析错误:`, e);
            }
          } else {
            // 尝试从URL中提取真实链接
            try {
              link = new URL(link, 'https://www.baidu.com').href;
            } catch (e) {
              // 忽略URL解析错误，使用原始链接
              console.log(`[BaiduSearch] URL构建错误:`, e);
            }
          }
        }
        
        // 查找对应的摘要 - 尝试不同的方法提取
        let snippet = '';
        const snippetHTML = html.substring(titleMatch.index, titleMatch.index + 800);
        
        // 先尝试主摘要正则
        const snippetMatch = snippetRegex.exec(snippetHTML);
        if (snippetMatch) {
          snippet = this.stripHtmlTags(snippetMatch[1] || snippetMatch[2] || '');
        }
        
        // 如果未找到，尝试备用正则
        if (!snippet || snippet.length < 10) {
          const backupMatches = [...snippetHTML.matchAll(backupSnippetRegex)];
          for (const match of backupMatches) {
            const content = this.stripHtmlTags(match[1] || '').trim();
            if (content && content.length > 20 && !content.includes('百度') && !content.includes('查看更多')) {
              snippet = content;
              break;
            }
          }
        }
        
        // 提取更详细的内容
        let description = '';
        const contentHTML = html.substring(titleMatch.index - 200, titleMatch.index + 1000);
        const contentMatches = [...contentHTML.matchAll(contentRegex)];
        
        if (contentMatches.length > 0) {
          // 收集所有可能的内容段落
          const paragraphs: string[] = [];
          
          for (const contentMatch of contentMatches) {
            const contentText = this.stripHtmlTags(contentMatch[1] || contentMatch[2] || '').trim();
            if (contentText && contentText.length > 50 && !paragraphs.includes(contentText)) {
              paragraphs.push(contentText);
              
              // 最多收集5个段落
              if (paragraphs.length >= 5) break;
            }
          }
          
          if (paragraphs.length > 0) {
            description = paragraphs.join('\n\n');
          }
        }
        
        // 如果仍未找到内容，尝试从其他元素提取
        if (!description) {
          const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
          const paraMatches = [...contentHTML.matchAll(paraRegex)];
          
          const contentTexts: string[] = [];
          for (const paraMatch of paraMatches) {
            const paraText = this.stripHtmlTags(paraMatch[1]).trim();
            if (paraText && paraText.length > 50 && !contentTexts.includes(paraText) && 
                !paraText.includes('百度') && !paraText.includes('搜索')) {
              contentTexts.push(paraText);
              
              // 最多收集3个段落
              if (contentTexts.length >= 3) break;
            }
          }
          
          if (contentTexts.length > 0) {
            description = contentTexts.join('\n\n');
          }
        }
        
        // 处理摘要长度
        if (snippet.length > 200) {
          snippet = snippet.substring(0, 197) + '...';
        }
        
        console.log(`[BaiduSearch] 结果 #${index + 1}: ${title.substring(0, 30)}... (${link ? '有链接' : '无链接'})`);
        
        // 只添加有标题和链接的结果
        if (title && link) {
          results.push({
            title,
            link,
            snippet: snippet || '无可用摘要',
            description,
            source: this.getName()
          });
        }
      }
      
      console.log(`[BaiduSearch] 返回结果数量: ${results.length}`);
      return results;
    } catch (error) {
      console.error('百度搜索失败:', error);
      return [];
    }
  }
} 