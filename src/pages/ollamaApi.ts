export async function sendMessageToOllama({ baseUrl, model, messages }: {
  baseUrl: string;
  model: string;
  messages: { role: string; content: string }[];
}): Promise<string> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  });
  const data = await res.json();
  // 只返回最终内容，确保会话区能正确显示
  return data.message?.content || '';
}

// 提取思考内容和实际输出
function processThinkContent(text: string): { thinking: string, content: string } {
  // 初始状态
  let thinking = '';
  let content = '';
  let isInThinkingMode = false;
  
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
      isInThinkingMode = true;
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

// 新增：流式对话
export async function sendMessageToOllamaStream({ baseUrl, model, messages, onStream, onThinking }: {
  baseUrl: string;
  model: string;
  messages: { role: string; content: string }[];
  onStream?: (text: string) => void;
  onThinking?: (text: string) => void;
}): Promise<string> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true
    })
  });
  
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
    console.error('流式读取错误:', error);
  }
  
  // 最终处理一次，确保返回的是去除思考部分的内容
  const finalProcessed = processThinkContent(fullText);
  return finalProcessed.content;
}

// 获取本地Ollama模型列表
export async function fetchOllamaModels(baseUrl: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    const data = await res.json();
    // 返回模型名数组
    return Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
  } catch (error) {
    console.error('获取模型列表失败:', error);
    return [];
  }
}