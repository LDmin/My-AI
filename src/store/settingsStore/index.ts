import { create } from 'zustand'
import { saveData, getData } from '../../utils/init'

interface OllamaConfig {
  baseUrl: string
  model: string
}

// 完整设置类型
interface Settings {
  apiUrl: string
  model: string
  temperature: number
  darkMode: boolean
  [key: string]: any
}

interface SettingsState {
  ollama: OllamaConfig
  settings: Settings
  setOllama: (config: OllamaConfig) => void
  setSettings: (settings: Settings) => void
  setTheme: (theme: 'light' | 'dark') => void
  initSettings: () => void
}

const defaultSettings: Settings = {
  apiUrl: 'http://localhost:11434',
  model: 'llama3',
  temperature: 0.7,
  darkMode: false
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: '',
  },
  settings: {...defaultSettings},
  
  setOllama: (config) => {
    set({ ollama: config })
    
    // 保存配置到存储
    saveData('ollama-baseUrl', config.baseUrl)
    saveData('selected-model', config.model)
    
    // 同步到uTools配置
    if (window.saveSettings) {
      const current = get().settings
      window.saveSettings({
        ...current,
        apiUrl: config.baseUrl,
        model: config.model
      })
    }
  },
  
  setSettings: (settings) => {
    set({ settings })
    
    // 同步到uTools配置
    if (window.saveSettings) {
      window.saveSettings(settings)
    }
  },
  
  setTheme: (theme) => {
    const isDarkMode = theme === 'dark'
    
    // 更新当前设置
    set(state => ({
      settings: {
        ...state.settings,
        darkMode: isDarkMode
      }
    }))
    
    // 同步到文档属性
    document.documentElement.setAttribute('data-theme', theme)
    
    // 保存到localStorage
    localStorage.setItem('theme', theme)
    
    // 同步到uTools配置
    if (window.saveSettings) {
      const current = get().settings
      window.saveSettings({
        ...current,
        darkMode: isDarkMode
      })
    }
  },
  
  // 初始化函数：从存储加载配置
  initSettings: () => {
    try {
      // 首先尝试从uTools获取配置
      if (window.getSettings) {
        const uToolsSettings = window.getSettings()
        if (uToolsSettings) {
          set({ 
            settings: uToolsSettings,
            ollama: {
              baseUrl: uToolsSettings.apiUrl || 'http://localhost:11434',
              model: uToolsSettings.model || ''
            }
          })
          console.log('从uTools初始化配置成功:', uToolsSettings)
          return
        }
      }
      
      // 否则使用本地存储
      const model = getData('selected-model', '')
      const baseUrl = getData('ollama-baseUrl', 'http://localhost:11434')
      
      if (model || baseUrl !== 'http://localhost:11434') {
        set({ 
          ollama: { 
            baseUrl, 
            model 
          },
          settings: {
            ...defaultSettings,
            apiUrl: baseUrl,
            model
          }
        })
        
        console.log('从本地存储初始化配置成功:', { baseUrl, model })
      }
    } catch (err) {
      console.error('初始化配置失败:', err)
    }
  }
}))
