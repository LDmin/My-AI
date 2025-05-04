import { AIService, AIServiceConfig, ChatRequest } from "./AIService";

// 提取思考内容和实际输出
function processThinkContent(text: string): { thinking: string, content: string } {
  // 初始状态
  let thinking = '';
  let content = '';
  
  // 检查是否有<think>标签
  if (text.includes('<think>')) {
    const thinkStartIndex = text.indexOf('<think>');
    
    // 查找</think>结束标签
    const thinkEndIndex = text.indexOf('</think>', thinkStartIndex);
    
    if (thinkEndIndex !== -1) {
      // 提取思考内容(不包含标签本身)
      thinking = text.substring(thinkStartIndex + 7, thinkEndIndex);
      
      // 提取标签外的内容
      content = text.substring(0, thinkStartIndex) + text.substring(thinkEndIndex + 8);
    } else {
      // 有开始标签但没找到结束标签，说明思考还在进行中
      thinking = text.substring(thinkStartIndex + 7);
      content = text.substring(0, thinkStartIndex);
    }
  } else {
    // 没有<think>标签，全部作为content
    content = text;
  }
  
  // 返回处理后的内容
  return {
    thinking: thinking.trim(),
    content: content.trim()
  };
}

export class OllamaService extends AIService {
  constructor(config: AIServiceConfig) {
    super(config);
  }

  /**
   * 发送聊天消息并获取流式响应
   */
  async chat(request: ChatRequest): Promise<string> {
    const { messages, signal, onStream, onThinking } = request;
    
    const res = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: true
      }),
      signal
    });
    
    // 检查响应状态码，如果不是成功状态，抛出错误
    if (!res.ok) {
      throw new Error(`API请求失败，状态码: ${res.status}, 错误信息: ${res.statusText}`);
    }
    
    const reader = res.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let thinking = '';
    
    if (!reader) return fullText;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 解码获取到的数据块
        const chunk = decoder.decode(value, { stream: true });
        
        // 处理返回的JSON行
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            // 解析JSON
            const data = JSON.parse(line);
            
            // 检查是否包含消息内容
            if (data.message && data.message.content) {
              // 累加消息内容
              fullText += data.message.content;
              
              // 处理<think>标签
              const processed = processThinkContent(fullText);
              
              // 调用回调函数更新UI
              if (onStream && processed.content) {
                onStream(processed.content);
              }
              
              // 如果有思考内容并且提供了处理函数
              if (onThinking && processed.thinking && processed.thinking !== thinking) {
                thinking = processed.thinking;
                onThinking(thinking);
              }
            }
          } catch (e) {
            console.error('JSON解析错误:', line, e);
          }
        }
      }
    } catch (error) {
      // 检查是否是中止错误
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error; // 继续抛出中止错误，让调用者知道请求被中止
      }
      console.error('流式读取错误:', error);
    }
    
    // 最终处理一次，确保返回的是去除思考部分的内容
    const finalProcessed = processThinkContent(fullText);
    return finalProcessed.content;
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.config.baseUrl}/api/tags`, { method: 'GET' });
      const data = await res.json();
      // 返回模型名数组
      return Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  /**
   * 检查服务可用性
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.baseUrl}/api/version`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      return res.ok;
    } catch (error) {
      console.error('Ollama服务不可用:', error);
      return false;
    }
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'Ollama';
  }
} 