import { RawHtmlSearchResult, SearchResult, SearchServiceConfig } from "./AbstractSearchService";
import { SearchEngineType, SearchFactory } from "./SearchFactory";
import * as cheerio from 'cheerio';

/**
 * Web服务配置扩展，包括AI服务配置和搜索引擎配置
 */
export interface WebServiceConfig {
  baseUrl?: string;
  model?: string;
  searchUrl?: string;  // 搜索引擎URL
  searchParam?: string; // 搜索参数名称，默认为"q"
  userAgent?: string;  // 用户代理
  sessionId?: string;  // 会话ID，用于取消请求
  maxResults?: number; // 最大分析结果数量，默认3
}

/**
 * Web搜索服务
 * 提供联网搜索和判断是否需要联网搜索的功能
 */
export class WebService {
  private static instance: WebService;
  private activeRequests: Map<string, AbortController[]> = new Map(); // 活跃请求映射
  
  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): WebService {
    if (!WebService.instance) {
      WebService.instance = new WebService();
    }
    return WebService.instance;
  }
  
  /**
   * 添加请求到活跃请求列表
   * @param sessionId 会话ID
   * @param controller 请求控制器
   */
  private addActiveRequest(sessionId: string, controller: AbortController): void {
    if (!sessionId) return;
    
    if (!this.activeRequests.has(sessionId)) {
      this.activeRequests.set(sessionId, []);
    }
    this.activeRequests.get(sessionId)?.push(controller);
    console.log(`[WebService] 添加会话 ${sessionId} 的请求到活跃列表, 当前数量: ${this.activeRequests.get(sessionId)?.length}`);
  }
  
  /**
   * 从活跃请求列表中移除请求
   * @param sessionId 会话ID
   * @param controller 请求控制器
   */
  private removeActiveRequest(sessionId: string, controller: AbortController): void {
    if (!sessionId || !this.activeRequests.has(sessionId)) return;
    
    const controllers = this.activeRequests.get(sessionId);
    if (controllers) {
      const index = controllers.indexOf(controller);
      if (index !== -1) {
        controllers.splice(index, 1);
        console.log(`[WebService] 从活跃列表中移除会话 ${sessionId} 的请求, 剩余: ${controllers.length}`);
      }
    }
  }
  
  /**
   * 取消指定会话的所有请求
   * @param sessionId 会话ID
   */
  public cancelRequests(sessionId: string): void {
    if (!sessionId || !this.activeRequests.has(sessionId)) return;
    
    console.log(`[WebService] 取消会话 ${sessionId} 的所有请求`);
    const controllers = this.activeRequests.get(sessionId);
    
    if (controllers && controllers.length > 0) {
      controllers.forEach(controller => {
        try {
          controller.abort();
        } catch (error) {
          console.error('[WebService] 取消请求失败:', error);
        }
      });
      
      // 清空该会话的请求列表
      this.activeRequests.set(sessionId, []);
    }
  }
  
  /**
   * 取消所有会话的请求
   */
  public cancelAllRequests(): void {
    console.log(`[WebService] 取消所有请求`);
    
    this.activeRequests.forEach((controllers, sessionId) => {
      controllers.forEach(controller => {
        try {
          controller.abort();
        } catch (error) {
          console.error('[WebService] 取消请求失败:', error);
        }
      });
    });
    
    // 清空所有请求列表
    this.activeRequests.clear();
  }

  /**
   * 判断用户查询是否需要联网搜索
   * @param query 用户查询
   * @param aiConfig AI服务配置
   * @returns 是否需要联网搜索
   */
  public async shouldUseWebSearch(query: string, aiConfig: WebServiceConfig): Promise<boolean> {
    try {
      // 首先过滤掉<think>标签内的内容
      const filteredQuery = this.removeThinkTags(query);
      
      // 构建提示词，询问模型是否需要实时信息
      const promptText = `
请分析以下用户查询，判断是否需要联网搜索获取实时信息或数据来准确回答。
仅当满足以下条件之一时回答"是"，否则回答"否"：
1. 查询涉及近期事件、新闻或最新数据（如比赛结果、股票、天气）
2. 查询特定的事实信息，需要最新或准确数据（如公司信息、产品规格）
3. 查询需要实时网络内容（如网站状态、最新视频）
4. 用户明确要求获取最新信息或提到日期/时间相关内容

用户查询: "${filteredQuery.trim()}"

只需回答"是"或"否"，不要解释理由。
`;

      // 创建AbortController用于请求控制
      const controller = new AbortController();
      const { signal } = controller;
      
      // 如果提供了会话ID，将请求添加到活跃列表
      if (aiConfig.sessionId) {
        this.addActiveRequest(aiConfig.sessionId, controller);
      }
      
      try {
        // 使用fetch直接请求Ollama API判断是否需要搜索
        const baseUrl = aiConfig.baseUrl;
        const model = aiConfig.model;
        
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'user', content: promptText }
            ],
            stream: false
          }),
          signal
        });

        const data = await response.json();
        
        // 分析回答
        const answer = data.message.content.trim().toLowerCase();
        return answer.includes('是') || answer.includes('yes') || answer.includes('需要');
      } finally {
        // 如果提供了会话ID，从活跃列表中移除请求
        if (aiConfig.sessionId) {
          this.removeActiveRequest(aiConfig.sessionId, controller);
        }
      }
    } catch (error) {
      // 检查是否是请求被中止
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[WebService] 判断是否需要联网搜索的请求被中止');
        throw error;
      }
      
      console.error('判断是否需要联网搜索失败:', error);
      // 出错时默认不使用网络搜索
      return false;
    }
  }

  /**
   * 分析用户提问，判断是否需要联网，并提取关键词和用户要求
   */
  public async analyzeUserQuery(query: string, aiConfig: WebServiceConfig): Promise<{
    needWebSearch: boolean,
    keywords: string,
    requirement: string,
    question: string
  }> {
    const controller = new AbortController();
    const { signal } = controller;
    if (aiConfig.sessionId) {
      this.addActiveRequest(aiConfig.sessionId, controller);
    }
    try {
      const filteredQuery = this.removeThinkTags(query);
      const promptText = `
你是一个专业的AI助手，请对用户提交的信息进行如下处理：
1. 判断用户的提问是否需要联网搜索（如涉及最新新闻、时效性、实时数据等），输出needWebSearch字段（true/false）。
2. 区分"用户的提问"（即用户想要了解、查询、获取的信息）和"用户的要求"（对回答方式、内容、格式等的特殊要求）。
3. 只从"用户的提问"中提取最适合用于网络搜索的关键词，要求：
  - 保留关键实体词、专有名词、数字和重要形容词
  - 去除代词、无关介词和连词
  - 不要解释或回答查询，只提取搜索词
  - 最终结果应该是精简的搜索关键词，不超过10个词
  - 特别重要：保留所有与时间相关的词语，如"今天"、"当前"、"最新"、"明天"、"未来"、"近期"等
4. 请严格只返回如下JSON格式，不要输出任何多余内容（不要加注释、不要加代码块标记、不要加前后缀、不要解释）：
{
  "needWebSearch": true,
  "question": "用户的提问内容",
  "requirement": "用户的要求内容",
  "keywords": "关键词1 关键词2 关键词3"
}

用户提交的信息如下：
${filteredQuery.trim()}
`;
      const baseUrl = aiConfig.baseUrl;
      const model = aiConfig.model;
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: promptText }
          ],
          stream: false
        }),
        signal
      });
      const data = await response.json();
      const content = data.message.content.trim();
      let needWebSearch = false;
      let keywords = '';
      let requirement = '';
      let question = '';
      try {
        // 优先直接解析
        const json = JSON.parse(content);
        needWebSearch = json.needWebSearch === true || json.needWebSearch === 'true';
        keywords = json.keywords?.trim() || '';
        requirement = json.requirement?.trim() || '';
        question = json.question?.trim() || '';
      } catch (e) {
        // 新增：尝试用正则提取 JSON
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const json = JSON.parse(match[0]);
            needWebSearch = json.needWebSearch === true || json.needWebSearch === 'true';
            keywords = json.keywords?.trim() || '';
            requirement = json.requirement?.trim() || '';
            question = json.question?.trim() || '';
          } catch (e2) {
            keywords = filteredQuery.trim();
            requirement = '';
            question = filteredQuery.trim();
          }
        } else {
          keywords = filteredQuery.trim();
          requirement = '';
          question = filteredQuery.trim();
        }
      }
      if (!keywords) {
        keywords = filteredQuery.trim();
      }
      if (!question) {
        question = filteredQuery.trim();
      }
      return { needWebSearch, keywords, requirement, question };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[WebService] 分析用户提问的请求被中止');
        throw error;
      }
      console.error('分析用户提问失败:', error);
      return { needWebSearch: false, keywords: query || '', requirement: '', question: query || '' };
    } finally {
      if (aiConfig.sessionId) {
        this.removeActiveRequest(aiConfig.sessionId, controller);
      }
    }
  }

  /**
   * 从用户查询中提取搜索关键词和用户要求
   * @param query 用户查询
   * @param aiConfig AI服务配置
   * @returns { keywords: string, requirement: string }
   */
  public async extractSearchKeywords(query: string, aiConfig: WebServiceConfig): Promise<{ keywords: string, requirement: string }> {
    // 创建AbortController用于请求控制
    const controller = new AbortController();
    const { signal } = controller;
    
    // 如果提供了会话ID，将请求添加到活跃列表
    if (aiConfig.sessionId) {
      this.addActiveRequest(aiConfig.sessionId, controller);
    }
    
    try {
      // 首先过滤掉<think>标签内的内容
      const filteredQuery = this.removeThinkTags(query);
      
      // 构建提示词，要求大模型只返回JSON格式
      const promptText = `
你是一个专业的AI助手，请对用户提交的信息进行如下处理：
1. 先分析用户提交的信息，区分出"用户的提问"（即用户想要了解、查询、获取的信息）和"用户的要求"（即用户对回答方式、内容、格式等的特殊要求）。
2. 只从"用户的提问"中提取最适合用于网络搜索的关键词，要求：
  - 保留关键实体词、专有名词、数字和重要形容词
  - 去除代词、无关介词和连词
  - 不要解释或回答查询，只提取搜索词
  - 最终结果应该是精简的搜索关键词，不超过10个词
  - 特别重要：保留所有与时间相关的词语，如"今天"、"当前"、"最新"、"明天"、"未来"、"近期"等
3. 请严格只返回如下JSON格式，不要输出任何多余内容：
{
  "question": "用户的提问内容",
  "requirement": "用户的要求内容",
  "keywords": "关键词1 关键词2 关键词3"
}

用户提交的信息如下：
${filteredQuery.trim()}
`;
      // 使用fetch直接请求Ollama API提取关键词
      const baseUrl = aiConfig.baseUrl;
      const model = aiConfig.model;
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: promptText }
          ],
          stream: false
        }),
        signal
      });

      const data = await response.json();
      const content = data.message.content.trim();
      // 直接解析JSON
      let keywords = '';
      let requirement = '';
      try {
        const json = JSON.parse(content);
        keywords = json.keywords?.trim() || '';
        requirement = json.requirement?.trim() || '';
      } catch (e) {
        // 兜底：如果解析失败，直接用原始问题
        keywords = filteredQuery.trim();
        requirement = '';
      }
      if (!keywords) {
        keywords = filteredQuery.trim();
      }
      return { keywords, requirement };
    } catch (error) {
      // 检查是否是请求被中止
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[WebService] 提取搜索关键词的请求被中止');
        throw error;
      }
      console.error('提取搜索关键词失败:', error);
      // 出错时返回原始问题
      return { keywords: query || '', requirement: '' };
    } finally {
      // 如果提供了会话ID，从活跃列表中移除请求
      if (aiConfig.sessionId) {
        this.removeActiveRequest(aiConfig.sessionId, controller);
      }
    }
  }

  /**
   * 移除<think>标签及其中的内容
   * @param text 输入文本
   * @returns 过滤后的文本
   */
  private removeThinkTags(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/<think>([\s\S]*?)<\/think>/g, '').trim();
  }

  /**
   * 网络搜索
   * @param query 搜索关键词
   * @param searchType 搜索类型 ('bing'|'google'|'baidu'|'custom')
   * @param config 搜索配置，包括搜索URL和用户代理
   * @returns 搜索结果
   */
  public async search(
    query: string, 
    searchType: string = 'bing',
    config: Partial<WebServiceConfig> = {}
  ): Promise<SearchResult[]> {
    try {
      // 确保过滤掉<think>标签内的内容
      query = this.removeThinkTags(query);
      
      // 如果是自定义搜索URL模式，直接使用用户配置的URL+关键词
      if (searchType === 'custom' && config.searchUrl) {
        console.log(`[WebService] 使用自定义搜索URL: ${config.searchUrl}`);
        
        // 编码查询关键词
        const encodedQuery = encodeURIComponent(query);
        
        // 获取用户自定义的搜索参数名，默认为"q"
        const searchParam = config.searchParam || 'q';
        
        // 检查URL是否已有参数
        const customUrl = config.searchUrl.includes('?') 
          ? `${config.searchUrl}&${searchParam}=${encodedQuery}` 
          : `${config.searchUrl}?${searchParam}=${encodedQuery}`;
          
        console.log(`[WebService] 最终搜索URL: ${customUrl}`);
        
        // 创建和执行请求
        const response = await fetch(customUrl, {
          headers: {
            'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          }
        });
        
        if (!response.ok) {
          console.error(`[WebService] 自定义搜索请求失败: ${response.status}`);
          return [];
        }
        
        const html = await response.text();
        
        // 根据HTML内容提取搜索结果
        // 这里使用一个简单的提取逻辑，可能需要根据不同的目标网站进行调整
        const results: SearchResult[] = [];
        
        // 使用正则表达式尝试提取标题、链接和描述
        const titleRegex = /<h3.*?><a.*?href="(.*?)".*?>(.*?)<\/a><\/h3>/gi;
        const descRegex = /<p.*?>(.*?)<\/p>/gi;
        
        let titleMatch;
        let index = 0;
        while ((titleMatch = titleRegex.exec(html)) !== null && index < 5) {
          const link = titleMatch[1];
          const title = this.stripHtmlTags(titleMatch[2]);
          
          // 尝试找到对应的描述
          descRegex.lastIndex = titleMatch.index;
          const descMatch = descRegex.exec(html);
          const description = descMatch ? this.stripHtmlTags(descMatch[1]) : '';
          
          results.push({
            title: title,
            link: link.startsWith('http') ? link : `https://${new URL(customUrl).hostname}${link}`,
            snippet: description,
            source: new URL(customUrl).hostname
          });
          
          index++;
        }
        
        // 如果没有找到结果，创建一个基本结果表示搜索完成
        if (results.length === 0) {
          results.push({
            title: "自定义搜索结果",
            link: customUrl,
            snippet: "使用自定义搜索引擎搜索时未能提取到结构化结果。请查看原始搜索链接获取更多信息。",
            source: new URL(customUrl).hostname
          });
        }
        
        return results;
      }
      
      // 创建搜索配置
      const searchConfig: SearchServiceConfig = {
        searchUrl: config.searchUrl,
        userAgent: config.userAgent
      };
      
      // 获取工厂单例
      const factory = SearchFactory.getInstance();
      
      // 确定搜索引擎类型
      let engineType: SearchEngineType;
      switch (searchType.toLowerCase()) {
        case 'google':
          engineType = SearchEngineType.GOOGLE;
          break;
        case 'baidu':
          engineType = SearchEngineType.BAIDU;
          break;
        case 'bing':
        default:
          engineType = SearchEngineType.BING;
      }
      
      // 创建对应的搜索服务
      const searchService = factory.createSearchService(engineType, searchConfig);
      
      // 执行搜索
      return await searchService.search(query);
    } catch (error) {
      console.error('网络搜索失败:', error);
      return [];
    }
  }
  
  /**
   * 删除HTML标签
   * @param html HTML字符串
   * @returns 纯文本内容
   */
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * 获取无搜索结果时的提示文本
   * @returns 提示文本，包含当前系统时间
   */
  private getNoResultTip(): string {
    return `当前系统时间为${new Date().toLocaleString()}。请基于您的知识回答用户问题。`;
  }

  /**
   * 格式化搜索结果为大模型可用的文本
   * @param results 搜索结果
   * @returns 格式化的文本
   */
  public formatSearchResultsForModel(results: SearchResult[]): string {
    if (results.length === 0) {
      return this.getNoResultTip();
    }

    let formattedText = '### 网络搜索结果\n\n';
    
    results.forEach((result, index) => {
      formattedText += `**${index + 1}. [${result.title}](${result.link})**\n`;
      
      // 显示详细的正文内容（如果有）
      if (result.description && result.description.trim()) {
        formattedText += `**正文内容:**\n${result.description}\n\n`;
      }
      
      // 显示摘要（可能与正文有重复，但保留以确保完整性）
      if (result.snippet && result.snippet.trim()) {
        formattedText += `**摘要:**\n${result.snippet}\n\n`;
      }
      
      // 提取链接的域名作为真实来源，不使用域名时使用来源标识
      const urlObj = new URL(result.link);
      const sourceDomain = urlObj.hostname;
      formattedText += `**来源:** [${sourceDomain}](${result.link})\n\n`;
      formattedText += `---\n\n`; // 添加分隔线使结果更清晰
    });

    formattedText += '请务必仔细阅读并充分利用以上网络搜索结果来回答用户的问题。这些是最新的实时信息，请优先使用这些信息构建您的回答，同时结合您的知识提供全面、准确的回复。在回答中应清晰引用信息的来源。';
    return formattedText;
  }

  /**
   * 使用AI解析搜索结果
   * @param results 搜索结果
   * @param userQuery 用户原始查询
   * @param aiConfig AI服务配置
   * @returns 解析后的内容
   */
  public async parseSearchResultsWithAI(
    results: SearchResult[], 
    userQuery: string, 
    aiConfig: WebServiceConfig
  ): Promise<string> {
    try {
      if (results.length === 0) {
        return this.getNoResultTip();
      }

      // 先格式化搜索结果为文本
      let rawSearchResults = '### 搜索结果数据\n\n';
      
      results.forEach((result, index) => {
        rawSearchResults += `**${index + 1}. [${result.title}](${result.link})**\n`;
        rawSearchResults += `${result.snippet}\n`;
        // 提取链接的域名作为真实来源
        const urlObj = new URL(result.link);
        const sourceDomain = urlObj.hostname;
        rawSearchResults += `**来源:** [${sourceDomain}](${result.link})\n\n`;
      });

      // 构建提示词，要求AI解析搜索结果
      const promptText = `
您是一个专业的网络搜索结果解析助手。请根据以下网络搜索结果，对用户的查询进行分析和整理。

用户原始查询: "${this.removeThinkTags(userQuery).trim()}"

${rawSearchResults}

请执行以下任务:
1. 分析所有搜索结果，提取与用户查询相关的关键信息
2. 将信息按照相关性和重要性进行整理，去除重复内容
3. 以结构化的方式呈现信息，使用标题、要点或段落
4. 对于矛盾的信息，请标明并列出不同来源的观点
5. 确保包含关键的日期、数字、名称等具体事实
6. 引用信息时标明来源，使用格式: [来源网站域名](链接URL)
7. 不要进行最终回答，仅整理事实和相关信息，为后续回答做准备

回复格式:
---
## 搜索结果摘要

[整理后的关键信息，包含来源引用: [来源网站域名](链接)]

## 主要相关事实

- [事实1] - 来源: [来源网站域名](链接)
- [事实2] - 来源: [来源网站域名](链接)
...

## 注意事项

[标明任何需要注意的问题，如信息时效性、矛盾点等]
---

请注意：您的任务是整理信息，不是直接回答用户问题。确保为每个关键信息点标明其来源。
`;

      // 使用fetch直接请求Ollama API解析搜索结果
      const baseUrl = aiConfig.baseUrl;
      const model = aiConfig.model;
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: promptText }
          ],
          stream: false
        })
      });

      const data = await response.json();
      
      // 获取AI解析后的内容
      const parsedContent = data.message.content.trim();
      
      // 添加引导语
      return `### 网络搜索结果解析\n\n${parsedContent}\n\n请根据以上网络搜索解析结果，结合您的知识来回答用户问题。在回答中引用信息的来源，以增加回答的可信度。`;
    } catch (error) {
      console.error('使用AI解析搜索结果失败:', error);
      // 出错时使用默认格式化方法
      return this.formatSearchResultsForModel(results);
    }
  }

  /**
   * 使用AI分析搜索结果并提取关键信息
   * @param query 用户查询
   * @param results 搜索结果
   * @param config AI配置
   * @returns 提取后的关键信息文本
   */
  public async extractKeyInfoWithAI(
    results: SearchResult[], 
    userQuery: string, 
    aiConfig: WebServiceConfig
  ): Promise<string> {
    try {
      if (results.length === 0) {
        return this.getNoResultTip();
      }

      // 先格式化搜索结果为文本
      let rawSearchResults = '### 搜索结果数据\n\n';
      
      results.forEach((result, index) => {
        rawSearchResults += `**${index + 1}. [${result.title}](${result.link})**\n`;
        rawSearchResults += `${result.snippet}\n`;
        // 提取链接的域名作为真实来源
        const urlObj = new URL(result.link);
        const sourceDomain = urlObj.hostname;
        rawSearchResults += `**来源:** [${sourceDomain}](${result.link})\n\n`;
      });

      // 构建提示词，要求AI解析搜索结果
      const promptText = `
您是一个专业的网络搜索结果解析助手。请根据以下网络搜索结果，对用户的查询进行分析和整理。

用户原始查询: "${this.removeThinkTags(userQuery).trim()}"

${rawSearchResults}

请执行以下任务:
1. 分析所有搜索结果，提取与用户查询相关的关键信息
2. 将信息按照相关性和重要性进行整理，去除重复内容
3. 以结构化的方式呈现信息，使用标题、要点或段落
4. 对于矛盾的信息，请标明并列出不同来源的观点
5. 确保包含关键的日期、数字、名称等具体事实
6. 引用信息时标明来源，使用格式: [来源网站域名](链接URL)
7. 不要进行最终回答，仅整理事实和相关信息，为后续回答做准备

回复格式:
---
## 搜索结果摘要

[整理后的关键信息，包含来源引用: [来源网站域名](链接)]

## 主要相关事实

- [事实1] - 来源: [来源网站域名](链接)
- [事实2] - 来源: [来源网站域名](链接)
...

## 注意事项

[标明任何需要注意的问题，如信息时效性、矛盾点等]
---

请注意：您的任务是整理信息，不是直接回答用户问题。确保为每个关键信息点标明其来源。
`;

      // 使用fetch直接请求Ollama API解析搜索结果
      const baseUrl = aiConfig.baseUrl;
      const model = aiConfig.model;
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: promptText }
          ],
          stream: false
        })
      });

      const data = await response.json();
      
      // 获取AI解析后的内容
      const parsedContent = data.message.content.trim();
      
      // 添加引导语
      return `### 网络搜索结果解析\n\n${parsedContent}\n\n请根据以上网络搜索解析结果，结合您的知识来回答用户问题。在回答中引用信息的来源，以增加回答的可信度。`;
    } catch (error) {
      console.error('使用AI解析搜索结果失败:', error);
      // 出错时使用默认格式化方法
      return this.formatSearchResultsForModel(results);
    }
  }

  /**
   * 从搜索结果的HTML中提取纯文本并使用AI分析
   * @param results 搜索结果数组
   * @param query 用户查询
   * @param config AI配置
   * @returns AI分析后的结果
   */
  public async analyzeHtmlContentWithAI(
    results: SearchResult[],
    query: string,
    config: WebServiceConfig
  ): Promise<string> {
    try {
      if (!results || results.length === 0) {
        return this.getNoResultTip();
      }

      const baseUrl = config.baseUrl;
      const model = config.model;
      
      if (!baseUrl || !model) {
        throw new Error('缺少必要的AI服务配置');
      }
      
      // 配置可分析的结果数量，默认3个
      const maxResults = config.maxResults || 3;
      console.log(`[WebService] 设置分析的最大结果数量: ${maxResults}`);
      
      // 获取与查询相关性最高的前N个结果
      const topResults = results.slice(0, maxResults);
      let processedTexts: string[] = [];
      
      // 直接获取每个网页的HTML内容并用cheerio提取纯文本
      for (const result of topResults) {
        try {
          console.log(`[WebService] 正在获取网页内容: ${result.link}`);
          const userAgent = config.userAgent || 
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
          const response = await fetch(result.link, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html',
              'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
          });
          if (!response.ok) {
            console.warn(`[WebService] 获取网页失败: ${result.link}, 状态码: ${response.status}`);
            if (result.description) {
              const urlObj = new URL(result.link);
              const sourceDomain = urlObj.hostname;
              processedTexts.push(
                `### 来源: [${sourceDomain}](${result.link})\n\n${result.description}\n\n---\n\n`
              );
            } else if (result.snippet) {
              const urlObj = new URL(result.link);
              const sourceDomain = urlObj.hostname;
              processedTexts.push(
                `### 来源: [${sourceDomain}](${result.link})\n\n${result.snippet}\n\n---\n\n`
              );
            }
            continue;
          }
          const html = await response.text();
          // 先去除注释、样式和脚本
          let cleanedHtml = html.replace(/<!--[\s\S]*?-->/g, '');
          cleanedHtml = cleanedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
          // 用cheerio解析HTML并提取纯文本
          const $ = cheerio.load(cleanedHtml);
          const textContent = $.text().replace(/\s+/g, ' ').trim();
          const urlObj = new URL(result.link);
          const sourceDomain = urlObj.hostname;
          processedTexts.push(
            `### 来源: [${sourceDomain}](${result.link})\n\n${textContent}\n\n---\n\n`
          );
        } catch (error) {
          console.error(`处理网页内容失败: ${result.link}`, error);
          if (result.description) {
            const urlObj = new URL(result.link);
            const sourceDomain = urlObj.hostname;
            processedTexts.push(
              `### 来源: [${sourceDomain}](${result.link})\n\n${result.description}\n\n---\n\n`
            );
          } else if (result.snippet) {
            const urlObj = new URL(result.link);
            const sourceDomain = urlObj.hostname;
            processedTexts.push(
              `### 来源: [${sourceDomain}](${result.link})\n\n${result.snippet}\n\n---\n\n`
            );
          }
        }
      }
      if (processedTexts.length === 0) {
        return this.formatSearchResultsForModel(results);
      }
      // 构建提示词
      const promptText = `
您是一位专业的信息分析专家。请分析以下从网页获取的纯文本内容，并提取与用户问题相关的关键信息。
同时目前的系统时间为: ${new Date().toLocaleString()}。
用户问题: "${this.removeThinkTags(query)}"

下面是从网络搜索结果页面中获取的纯文本内容：

${processedTexts.join('\n')}

请执行以下任务:
1. 对内容进行清理和结构化，去除无关信息、广告和重复内容
2. 提取与用户问题直接相关的关键信息和事实
3. 按主题或逻辑顺序整理信息
4. 保留所有关键的数字、日期、名称和事实
5. 用简洁清晰的方式呈现信息，使用标题和要点结构
6. 如果信息矛盾或来源不同，请注明区别
7. 对每个信息点，标明其来源网站的域名和链接
8. 特别注意：如果用户询问包含时效性内容（如"今天"、"最新"、"当前"等词语），请优先关注最新的信息，并明确标注信息的发布时间或更新时间

输出格式:
---
## 信息分析结果

[按主题组织的关键信息，每个信息点后标明来源]

## 主要事实要点

- [要点1] - 来源: [来源网站域名](链接)
- [要点2] - 来源: [来源网站域名](链接)
...

## 时效性信息（如有）

- [包含日期/时间的信息点] - 来源: [来源网站域名](链接)
...

## 注意事项(如有)

[有关信息可靠性、时效性或完整性的说明]
---

请确保分析客观、专业，只提供来源文本中包含的信息，并明确标记每个信息的来源。`;
      // 使用AI分析处理后的纯文本内容
      console.log(`[WebService] 使用AI分析处理后的纯文本内容，共${processedTexts.length}个来源`);
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: promptText }
          ],
          stream: false
        })
      });
      const data = await response.json();
      const analysisResult = data.message.content.trim();
      return `### 当前系统时间为: ${new Date().toLocaleString()}\n\n这是实时的网页内容分析结果\n\n${analysisResult}\n\n请根据以上网页内容分析结果和您的知识来回答用户问题。回答中应引用相关信息的来源。`;
    } catch (error) {
      console.error('分析HTML内容失败:', error);
      return this.formatSearchResultsForModel(results);
    }
  }
  
  /**
   * 清理HTML并提取文本内容
   * @param html 原始HTML文本
   * @returns 清理后的纯文本内容
   */
  private cleanHtmlAndExtractText(html: string): string {
    try {
      if (!html) return '';
      
      // 1. 移除所有样式标签及其内容
      let cleanedHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // 2. 移除所有脚本标签及其内容
      cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // 3. 移除所有链接标签
      cleanedHtml = cleanedHtml.replace(/<link[^>]*>/gi, '');
      
      // 4. 移除所有行内样式属性
      cleanedHtml = cleanedHtml.replace(/\s+style="[^"]*"/gi, '');
      cleanedHtml = cleanedHtml.replace(/\s+style='[^']*'/gi, '');
      
      // 5. 提取body内容
      const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(cleanedHtml);
      const bodyContent = bodyMatch ? bodyMatch[1] : cleanedHtml;
      
      // 6. 移除所有剩余的HTML标签
      const textContent = bodyContent.replace(/<[^>]*>/g, '');
      
      // 7. 处理空白字符：合并多个空格、换行等
      return textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
    } catch (error) {
      console.error('提取HTML文本失败:', error);
      return html.replace(/<[^>]*>/g, ''); // 降级处理，直接去除所有标签
    }
  }

  /**
   * 从用户查询中提取关键词作为数组
   * @param query 用户查询
   * @param config 配置
   * @returns 关键词数组
   */
  private async extractKeywords(query: string, config: Partial<WebServiceConfig>): Promise<string[]> {
    try {
      const filteredQuery = this.removeThinkTags(query).trim();
      
      // 检查是否配置了AI服务
      if (!config.baseUrl || !config.model) {
        // 简单分割查询字符串
        return filteredQuery
          .split(/\s+/)
          .filter(keyword => keyword && keyword.trim().length > 0);
      }
      
      // 使用AI提取关键词
      const baseUrl = config.baseUrl;
      const model = config.model;
      
      // 准备AbortController用于请求控制
      const controller = new AbortController();
      const signal = controller.signal;
      
      // 如果提供了会话ID，添加到活跃请求列表
      if (config.sessionId) {
        this.addActiveRequest(config.sessionId, controller);
      }
      
      // 构建提示词
      const promptText = `
你是一个关键词提取专家。请从以下查询中提取重要关键词。只返回关键词列表，以JSON数组格式，不需要任何解释:

查询: "${filteredQuery}"

要求:
1. 只提取对理解查询内容至关重要的关键词
2. 忽略常见的停用词(如"的"、"是"、"在"等)
3. 关注名词、专有名词和重要的动词
4. 以JSON数组格式返回，例如: ["关键词1", "关键词2", "关键词3"]
5. 不要添加任何注释或额外文本，只返回JSON数组
      `;
      
      // 发送请求
      console.log('[WebService] 正在提取搜索关键词');
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: promptText }
          ],
          stream: false
        }),
        signal
      });

      const data = await response.json();
      const content = data.message.content.trim();
      
      // 尝试解析JSON数组
      try {
        // 如果返回的是JSON字符串，直接解析
        if (content.startsWith('[') && content.endsWith(']')) {
          return JSON.parse(content);
        }
        
        // 如果不是JSON，尝试从文本中提取JSON部分
        const jsonMatch = content.match(/\[.*\]/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // 如果无法解析JSON，则将文本按逗号或空格分割
        return content
          .replace(/["'[\]{}]/g, '')  // 移除可能的标点符号
          .split(/[,，、\s]+/)        // 按逗号、顿号、空格等分割
          .filter((keyword: string) => keyword && keyword.trim().length > 0);
      } catch (error) {
        console.error('解析关键词JSON失败:', error);
        // 降级处理：去掉特殊字符，按空格分割
        return filteredQuery
          .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')  // 保留字母、数字、中文和空格
          .split(/\s+/)
          .filter((keyword: string) => keyword && keyword.trim().length > 0);
      }
    } catch (error) {
      console.error('提取关键词失败:', error);
      // 出错时简单分割查询字符串
      return this.removeThinkTags(query)
        .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
        .split(/\s+/)
        .filter((keyword: string) => keyword && keyword.trim().length > 0);
    }
  }
}

// 导出重要的类型和接口
export type { SearchResult, SearchServiceConfig } from './AbstractSearchService';
export type { SearchEngineType } from './SearchFactory'; 