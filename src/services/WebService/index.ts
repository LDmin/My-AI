import { SearchResult, SearchServiceConfig } from "./AbstractSearchService";
import { SearchEngineType, SearchFactory } from "./SearchFactory";

/**
 * Web服务配置扩展，包括AI服务配置和搜索引擎配置
 */
export interface WebServiceConfig {
  baseUrl?: string;
  model?: string;
  searchUrl?: string;  // 搜索引擎URL
  userAgent?: string;  // 用户代理
}

/**
 * Web搜索服务
 * 提供联网搜索和判断是否需要联网搜索的功能
 */
export class WebService {
  private static instance: WebService;
  
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
        })
      });

      const data = await response.json();
      
      // 分析回答
      const answer = data.message.content.trim().toLowerCase();
      return answer.includes('是') || answer.includes('yes') || answer.includes('需要');
    } catch (error) {
      console.error('判断是否需要联网搜索失败:', error);
      // 出错时默认不使用网络搜索
      return false;
    }
  }

  /**
   * 从用户查询中提取搜索关键词
   * @param query 用户查询
   * @param aiConfig AI服务配置
   * @returns 搜索关键词
   */
  public async extractSearchKeywords(query: string, aiConfig: WebServiceConfig): Promise<string> {
    try {
      // 首先过滤掉<think>标签内的内容
      const filteredQuery = this.removeThinkTags(query);
      
      // 构建提示词，提取搜索关键词
      const promptText = `
请从以下用户查询中提取最适合用于网络搜索的关键词。
提取原则：
1. 保留关键实体词、专有名词、数字和重要形容词
2. 去除代词、无关介词和连词
3. 不要解释或回答查询，只提取搜索词
4. 最终结果应该是精简的搜索关键词，不超过10个词
5. 不要包含用户可能的思考内容、猜测或推理过程

只关注用户明确表达的信息需求：
- 如果用户询问"我在思考XXX"，只提取XXX中的关键信息词，不包含"思考"或"我认为"等词
- 如果用户询问"我想了解XXX"，只提取XXX部分
- 如果用户表述中包含推测或个人观点，只提取客观事实部分的关键词

用户查询: "${filteredQuery.trim()}"

只返回提取的关键词，不要加任何前缀或解释。
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
        })
      });

      const data = await response.json();
      
      // 获取关键词并进一步处理
      let keywords = data.message.content.trim();
      
      // 额外过滤：移除可能的"我在思考"、"我认为"等前缀
      keywords = keywords.replace(/^(我在思考|我认为|我觉得|我想|思考|认为|觉得)\s*/i, '');
      
      return keywords;
    } catch (error) {
      console.error('提取搜索关键词失败:', error);
      // 出错时返回过滤后的原始查询，但移除明显的思考词汇
      const filteredQuery = this.removeThinkTags(query).trim().replace(/^(我在思考|我认为|我觉得|我想|思考|认为|觉得)\s*/i, '');
      return filteredQuery;
    }
  }

  /**
   * 移除<think>标签及其中的内容
   * @param text 输入文本
   * @returns 过滤后的文本
   */
  private removeThinkTags(text: string): string {
    // 移除<think>标签及其中的所有内容
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  /**
   * 网络搜索
   * @param query 搜索关键词
   * @param searchType 搜索类型 ('bing'|'google'|'baidu')
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
   * 格式化搜索结果为大模型可用的文本
   * @param results 搜索结果
   * @returns 格式化的文本
   */
  public formatSearchResultsForModel(results: SearchResult[]): string {
    if (results.length === 0) {
      return '未找到相关搜索结果。请基于您的知识回答用户问题。';
    }

    let formattedText = '### 网络搜索结果\n\n';
    
    results.forEach((result, index) => {
      formattedText += `**${index + 1}. ${result.title}**\n`;
      formattedText += `${result.snippet}\n`;
      formattedText += `来源: ${result.source} - [链接](${result.link})\n\n`;
    });

    formattedText += '请务必仔细阅读并充分利用以上网络搜索结果来回答用户的问题。这些是最新的实时信息，请优先使用这些信息构建您的回答，同时结合您的知识提供全面、准确的回复。不要忽略搜索结果中的重要信息。';
    return formattedText;
  }
}

// 导出重要的类型和接口
export type { SearchResult, SearchServiceConfig } from './AbstractSearchService';
export type { SearchEngineType } from './SearchFactory'; 