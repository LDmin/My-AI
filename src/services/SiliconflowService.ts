import { AIService, AIServiceConfig, ChatRequest } from "./AIService";

// 硅基流动API服务配置，扩展基础配置
export interface SiliconflowServiceConfig extends AIServiceConfig {
  token: string; // API令牌
}

// 思考内容处理
function extractReasoningContent(responseData: any): { reasoning: string, content: string } {
  const reasoning = responseData.choices?.[0]?.message?.reasoning_content || '';
  const content = responseData.choices?.[0]?.message?.content || '';
  return { reasoning, content };
}

export class SiliconflowService extends AIService {
  private token: string;

  constructor(config: SiliconflowServiceConfig) {
    super(config);
    this.token = config.token;
  }

  /**
   * 发送聊天消息并获取流式响应
   */
  async chat(request: ChatRequest): Promise<string> {
    const { messages, signal, onStream, onThinking, sessionId } = request;
    
    // 创建请求的AbortController
    const controller = signal ? undefined : new AbortController();
    const requestSignal = signal || controller?.signal;
    
    // 如果提供了会话ID，则添加到活跃请求列表
    if (sessionId && controller) {
      this.addActiveRequest(sessionId, controller);
    }
    
    // 构建请求URL
    const apiUrl = `${this.config.baseUrl}/v1/chat/completions`;
    
    // 构建请求选项
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        stream: true,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.7,
      }),
      signal: requestSignal
    };

    // 发送请求并处理响应
    try {
      const response = await fetch(apiUrl, options);
      
      if (!response.ok) {
        throw new Error(`硅基流动API请求失败: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let thinkingContent = '';
      
      if (!reader) {
        return fullText;
      }

      // 处理流式响应
      // 如果是流式响应
      if (options.body.includes('"stream":true')) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() && line.trim() !== 'data: [DONE]');
          
          for (const line of lines) {
            try {
              // 从 "data: {...}" 中提取 JSON 部分
              const jsonStr = line.replace(/^data: /, '').trim();
              if (!jsonStr) continue;
              
              const data = JSON.parse(jsonStr);
              
              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta;
                if (delta?.content) {
                  fullText += delta.content;
                  onStream?.(fullText);
                }
                
                if (delta?.reasoning_content) {
                  thinkingContent += delta.reasoning_content;
                  onThinking?.(thinkingContent);
                }
              }
            } catch (e) {
              console.error('解析流式响应JSON时出错:', e);
            }
          }
        }
      } else {
        // 如果是非流式响应，直接解析整个响应
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          const { reasoning, content } = extractReasoningContent(data);
          
          fullText = content;
          onStream?.(fullText);
          
          if (reasoning) {
            onThinking?.(reasoning);
          }
        } catch (e) {
          console.error('解析非流式响应JSON时出错:', e);
        }
      }
      
      return fullText;
    } catch (error) {
      // 检查是否是用户主动取消请求
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[SiliconflowService] 请求被用户取消');
      } else {
        console.error('[SiliconflowService] 读取响应流时出错:', error);
      }
      throw error;
    } finally {
      // 无论成功还是失败，都从活跃请求中移除
      if (sessionId && controller) {
        this.removeActiveRequest(sessionId, controller);
      }
    }
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 根据API文档处理模型列表格式
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => model.id);
      }
      
      return [];
    } catch (error) {
      console.error('获取硅基流动模型列表失败:', error);
      return [];
    }
  }

  /**
   * 检查服务可用性
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      return response.ok;
    } catch (error) {
      console.error('硅基流动服务不可用:', error);
      return false;
    }
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return '硅基流动';
  }
  
  /**
   * 获取token
   */
  getToken(): string {
    return this.token;
  }
  
  /**
   * 更新token
   */
  updateToken(token: string): void {
    this.token = token;
  }
} 