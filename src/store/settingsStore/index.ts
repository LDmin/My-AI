import { create } from 'zustand'
import { saveData, getData } from '../../utils/init'

interface OllamaConfig {
  baseUrl: string
  model: string
}

interface SiliconflowConfig {
  baseUrl: string
  model: string
  token: string
}

// 网络搜索配置
export type WebSearchType = 'none' | 'bing' | 'google' | 'baidu' | 'custom';

interface WebSearchConfig {
  enabled: boolean
  type: WebSearchType
  searchUrl?: string
  searchParam?: string  // 自定义搜索参数名，默认为"q"
  userAgent?: string
  maxResults?: number
  chunkSize?: number
}

// 服务类型定义
export type AIServiceType = 'ollama' | 'siliconflow' | 'openai' | 'api2d' | 'azure';

// 完整设置类型
interface Settings {
  apiUrl: string
  model: string
  temperature: number
  darkMode: boolean
  serviceType: AIServiceType
  siliconflowToken: string
  webSearch: WebSearchConfig
  [key: string]: any
}

interface SettingsState {
  ollama: OllamaConfig
  siliconflow: SiliconflowConfig
  webSearch: WebSearchConfig
  settings: Settings
  serviceType: AIServiceType
  setOllama: (config: OllamaConfig) => void
  setSiliconflow: (config: SiliconflowConfig) => void
  setWebSearch: (config: WebSearchConfig) => void
  setServiceType: (type: AIServiceType) => void
  setSettings: (settings: Settings) => void
  setTheme: (theme: 'light' | 'dark') => void
  initSettings: () => void
}

const defaultSettings: Settings = {
  apiUrl: 'http://localhost:11434',
  model: 'llama3',
  temperature: 0.7,
  darkMode: false,
  serviceType: 'ollama',
  siliconflowToken: '',
  webSearch: {
    enabled: false,
    type: 'bing'
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: '',
  },
  siliconflow: {
    baseUrl: 'https://api.siliconflow.cn',
    model: '',
    token: ''
  },
  webSearch: {
    enabled: false,
    type: 'bing'
  },
  serviceType: 'ollama',
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
        model: config.model,
        serviceType: 'ollama'
      })
    }
  },
  
  setSiliconflow: (config) => {
    set({ siliconflow: config })
    
    // 保存配置到存储
    saveData('siliconflow-baseUrl', config.baseUrl)
    saveData('siliconflow-model', config.model)
    saveData('siliconflow-token', config.token)
    
    // 同步到uTools配置
    if (window.saveSettings) {
      const current = get().settings
      window.saveSettings({
        ...current,
        apiUrl: config.baseUrl,
        model: config.model,
        siliconflowToken: config.token,
        serviceType: 'siliconflow'
      })
    }
  },
  
  setWebSearch: (config) => {
    set({ webSearch: config })
    
    // 保存配置到存储
    saveData('web-search-enabled', config.enabled)
    saveData('web-search-type', config.type)
    saveData('web-search-url', config.searchUrl)
    saveData('web-search-param', config.searchParam)
    saveData('web-search-useragent', config.userAgent)
    saveData('web-search-max-results', config.maxResults)
    saveData('web-search-chunk-size', config.chunkSize)
    
    // 同步到uTools配置
    if (window.saveSettings) {
      const current = get().settings
      window.saveSettings({
        ...current,
        webSearch: config
      })
    }
  },
  
  setServiceType: (type) => {
    set({ serviceType: type })
    
    // 保存到存储
    saveData('service-type', type)
    
    // 同步到uTools配置
    if (window.saveSettings) {
      const current = get().settings
      window.saveSettings({
        ...current,
        serviceType: type
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
          // 获取服务类型
          const serviceType = uToolsSettings.serviceType || 'ollama'
          
          // 获取网络搜索配置，处理旧版本的'built-in'类型
          let webSearch = uToolsSettings.webSearch || {
            enabled: false,
            type: 'bing'
          }
          
          // 兼容处理：旧版本的built-in类型转换为bing
          if (webSearch.type === 'built-in' || webSearch.type === 'none' || !['none', 'bing', 'google', 'baidu', 'custom'].includes(webSearch.type as string)) {
            webSearch = {
              ...webSearch,
              type: 'bing'
            }
          }
          
          // 确保maxResults和chunkSize有默认值
          webSearch = {
            ...webSearch,
            maxResults: webSearch.maxResults || 3,
            chunkSize: webSearch.chunkSize || 100
          }
          
          set({ 
            settings: {
              ...uToolsSettings,
              webSearch // 更新处理后的webSearch
            },
            serviceType,
            webSearch,
            ollama: {
              baseUrl: uToolsSettings.apiUrl || 'http://localhost:11434',
              model: serviceType === 'ollama' ? (uToolsSettings.model || '') : ''
            },
            siliconflow: {
              baseUrl: serviceType === 'siliconflow' ? (uToolsSettings.apiUrl || 'https://api.siliconflow.cn') : 'https://api.siliconflow.cn',
              model: serviceType === 'siliconflow' ? (uToolsSettings.model || '') : '',
              token: uToolsSettings.siliconflowToken || ''
            }
          })
          console.log('从uTools初始化配置成功:', uToolsSettings)
          return
        }
      }
      
      // 否则使用本地存储
      const serviceType = getData('service-type', 'ollama') as AIServiceType
      
      // 获取网络搜索配置
      const webSearchEnabled = getData('web-search-enabled', false)
      let webSearchType = getData('web-search-type', 'bing') as WebSearchType
      const webSearchUrl = getData('web-search-url', undefined) as string | undefined
      const webSearchParam = getData('web-search-param', 'q') as string | undefined
      const webSearchUserAgent = getData('web-search-useragent', undefined) as string | undefined
      const webSearchMaxResults = getData('web-search-max-results', 3) as number
      const webSearchChunkSize = getData('web-search-chunk-size', 100) as number
      
      // 兼容处理：旧版本的built-in类型转换为bing
      if (webSearchType === 'built-in' as any || !['none', 'bing', 'google', 'baidu', 'custom'].includes(webSearchType as string)) {
        webSearchType = 'bing';
      }
      
      const webSearch = {
        enabled: webSearchEnabled,
        type: webSearchType,
        searchUrl: webSearchUrl,
        searchParam: webSearchParam,
        userAgent: webSearchUserAgent,
        maxResults: webSearchMaxResults,
        chunkSize: webSearchChunkSize
      }
      
      if (serviceType === 'ollama') {
        const model = getData('selected-model', '')
        const baseUrl = getData('ollama-baseUrl', 'http://localhost:11434')
        
        set({ 
          serviceType,
          webSearch,
          ollama: { 
            baseUrl, 
            model 
          },
          settings: {
            ...defaultSettings,
            apiUrl: baseUrl,
            model,
            serviceType,
            webSearch
          }
        })
      } else {
        const model = getData('siliconflow-model', '')
        const baseUrl = getData('siliconflow-baseUrl', 'https://api.siliconflow.cn')
        const token = getData('siliconflow-token', '')
        
        set({ 
          serviceType,
          webSearch,
          siliconflow: { 
            baseUrl, 
            model,
            token
          },
          settings: {
            ...defaultSettings,
            apiUrl: baseUrl,
            model,
            siliconflowToken: token,
            serviceType,
            webSearch
          }
        })
      }
      
      console.log('从本地存储初始化配置成功:', { serviceType, webSearch })
    } catch (err) {
      console.error('初始化配置失败:', err)
    }
  }
}))
