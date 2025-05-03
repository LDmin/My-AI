import { create } from 'zustand'
import { saveData, getData } from '../../utils/init'

interface OllamaConfig {
  baseUrl: string
  model: string
}

interface SettingsState {
  ollama: OllamaConfig
  setOllama: (config: OllamaConfig) => void
  initSettings: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: '',
  },
  setOllama: (config) => {
    set({ ollama: config })
    
    // 保存配置到存储
    saveData('ollama-baseUrl', config.baseUrl)
    saveData('selected-model', config.model)
  },
  
  // 初始化函数：从存储加载配置
  initSettings: () => {
    try {
      // 使用统一的数据获取函数
      const model = getData('selected-model', '')
      const baseUrl = getData('ollama-baseUrl', 'http://localhost:11434')
      
      if (model || baseUrl !== 'http://localhost:11434') {
        set({ 
          ollama: { 
            baseUrl, 
            model 
          } 
        })
        
        console.log('从缓存初始化配置成功:', { baseUrl, model })
      }
    } catch (err) {
      console.error('初始化配置失败:', err)
    }
  }
}))
