import { create } from 'zustand'

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
  setOllama: (config) => set({ ollama: config }),
  
  // 初始化函数：从uTools数据库和localStorage加载配置
  initSettings: () => {
    try {
      // 尝试从uTools数据库获取
      const dbModel = window.utools?.dbStorage.getItem('selected-model')
      const dbBaseUrl = window.utools?.dbStorage.getItem('ollama-baseUrl')
      
      // 尝试从localStorage获取作为备份
      const lsModel = localStorage.getItem('selected-model')
      const lsBaseUrl = localStorage.getItem('ollama-baseUrl')
      
      // 优先使用uTools数据库的值，其次使用localStorage的值
      const model = dbModel || lsModel || ''
      const baseUrl = dbBaseUrl || lsBaseUrl || 'http://localhost:11434'
      
      if (model || baseUrl !== 'http://localhost:11434') {
        set({ 
          ollama: { 
            baseUrl, 
            model 
          } 
        })
        
        // 同步一下，确保两处存储一致
        if (window.utools) {
          window.utools.dbStorage.setItem('selected-model', model)
          window.utools.dbStorage.setItem('ollama-baseUrl', baseUrl)
        }
        localStorage.setItem('selected-model', model)
        localStorage.setItem('ollama-baseUrl', baseUrl)
        
        console.log('从缓存初始化配置成功:', { baseUrl, model })
      }
    } catch (err) {
      console.error('初始化配置失败:', err)
    }
  }
}))
