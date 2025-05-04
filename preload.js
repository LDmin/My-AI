// const { ipcRenderer } = require('electron')

window.exports = {
  myai: {
    mode: 'none',
    args: {
      enter: (action) => {
        // 用于在插件装载时执行
        window.utools.setExpendHeight(600)
        // 初始化数据库
        initDatabase()
      }
    }
  }
}

// 初始化数据库
function initDatabase() {
  // 确保设置存在
  if (!window.utools.dbStorage.getItem('ai-settings')) {
    window.utools.dbStorage.setItem('ai-settings', {
      apiUrl: 'http://localhost:11434',
      model: 'llama3',
      temperature: 0.7,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
    })
  }
  
  // 确保会话列表存在
  if (!window.utools.dbStorage.getItem('chat-sessions')) {
    window.utools.dbStorage.setItem('chat-sessions', [
      {
        id: 'default-' + Date.now(),
        title: '新的会话',
        messages: [],
        createdAt: new Date().toISOString()
      }
    ])
  }
  
  // 确保提示词列表存在
  if (!window.utools.dbStorage.getItem('prompts')) {
    window.utools.dbStorage.setItem('prompts', [
      {
        id: 'default-prompt-' + Date.now(),
        title: '翻译为中文',
        content: '请将以下内容翻译为中文：\n\n',
        createdAt: new Date().toISOString()
      }
    ])
  }
}

// 与本地大模型通信的方法
window.sendMessageToAI = async (message, options = {}) => {
  try {
    const settings = window.getSettings()
    const apiUrl = options.apiUrl || settings.apiUrl || 'http://localhost:11434'
    const model = options.model || settings.model || 'llama3'
    
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: Array.isArray(message) ? message : [{ role: 'user', content: message }],
        stream: options.stream || false,
        temperature: options.temperature || settings.temperature || 0.7
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    if (options.stream) {
      return response; // 返回响应对象，供调用者处理流
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    return { error: error.message };
  }
}

// 保存设置
window.saveSettings = (settings) => {
  window.utools.dbStorage.setItem('ai-settings', settings)
  return true
}

// 获取设置
window.getSettings = () => {
  return window.utools.dbStorage.getItem('ai-settings') || {
    apiUrl: 'http://localhost:11434',
    model: 'llama3',
    temperature: 0.7,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
  }
}

// 会话数据相关方法
window.saveSessions = (sessions) => {
  window.utools.dbStorage.setItem('chat-sessions', sessions)
  return true
}

window.getSessions = () => {
  return window.utools.dbStorage.getItem('chat-sessions') || []
}

// 提示词相关方法
window.savePrompts = (prompts) => {
  window.utools.dbStorage.setItem('prompts', prompts)
  return true
}

window.getPrompts = () => {
  return window.utools.dbStorage.getItem('prompts') || []
}

// 复制到剪贴板
window.copyToClipboard = (text) => {
  window.utools.copyText(text)
  return true
}

// 获取系统信息
window.getSystemInfo = () => {
  return {
    // platform: window.utools.platform(),
    isDev: window.utools.isDev(),
    version: window.utools.getAppVersion()
  }
} 