// const { ipcRenderer } = require('electron')

window.exports = {
  myai: {
    mode: 'none',
    args: {
      enter: (action) => {
        // 用于在插件装载时执行
        window.utools.setExpendHeight(600)
      }
    }
  }
}

// 与本地大模型通信的方法
window.sendMessageToAI = async (message) => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
}

// 获取设置
window.getSettings = () => {
  return window.utools.dbStorage.getItem('ai-settings') || {
    apiUrl: 'http://localhost:11434'
  }
} 