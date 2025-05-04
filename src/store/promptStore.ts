import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Prompt {
  id: string
  title: string
  content: string
}

// 定义保存到uTools的数据结构
interface PromptStorage {
  prompts: Prompt[]
  globalPrompt: string
  useGlobalPrompt: boolean
}

interface PromptState {
  prompts: Prompt[]
  globalPrompt: string
  useGlobalPrompt: boolean
  addPrompt: (title: string, content: string) => void
  updatePrompt: (id: string, title: string, content: string) => void
  deletePrompt: (id: string) => void
  getPrompt: (id: string) => Prompt | undefined
  initPrompts: (prompts: Prompt[]) => void
  savePrompts: () => void
  setGlobalPrompt: (content: string) => void
  toggleGlobalPrompt: () => void
  setUseGlobalPrompt: (use: boolean) => void
}

// 默认提示词
const defaultPrompts: Prompt[] = [
  { id: '1', title: '翻译助手', content: '请将以下内容翻译成中文：\n\n' },
  { id: '2', title: '代码优化', content: '请帮我优化以下代码，提高性能和可读性：\n\n```\n\n```' },
  { id: '3', title: '写作助手', content: '请用以下关键词写一篇短文：' },
  { id: '4', title: '总结内容', content: '请帮我总结以下内容的要点：' },
  { id: '5', title: '技术解释', content: '请用通俗易懂的语言解释什么是：' },
]

// 默认全局提词
const defaultGlobalPrompt = '你是一个有帮助的AI助手，请用简洁专业的语言回答我的问题。';

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: defaultPrompts,
      globalPrompt: defaultGlobalPrompt,
      useGlobalPrompt: false,
      
      addPrompt: (title, content) => {
        const newPrompt = {
          id: Date.now().toString(),
          title,
          content
        }
        set(state => ({ 
          prompts: [...state.prompts, newPrompt] 
        }))
        
        // 同步到uTools存储
        get().savePrompts()
      },
      
      updatePrompt: (id, title, content) => {
        set(state => ({
          prompts: state.prompts.map(p => 
            p.id === id ? { ...p, title, content } : p
          )
        }))
        
        // 同步到uTools存储
        get().savePrompts()
      },
      
      deletePrompt: (id) => {
        set(state => ({
          prompts: state.prompts.filter(p => p.id !== id)
        }))
        
        // 同步到uTools存储
        get().savePrompts()
      },
      
      getPrompt: (id) => {
        return get().prompts.find(p => p.id === id)
      },
      
      // 设置全局提词
      setGlobalPrompt: (content) => {
        set({ globalPrompt: content })
        // 同步到本地存储
        localStorage.setItem('global-prompt', content)
      },
      
      // 切换是否使用全局提词
      toggleGlobalPrompt: () => {
        const newValue = !get().useGlobalPrompt
        set({ useGlobalPrompt: newValue })
        // 同步到本地存储
        localStorage.setItem('use-global-prompt', String(newValue))
      },
      
      // 设置是否使用全局提词
      setUseGlobalPrompt: (use) => {
        set({ useGlobalPrompt: use })
        // 同步到本地存储
        localStorage.setItem('use-global-prompt', String(use))
      },
      
      // 初始化提示词
      initPrompts: (prompts) => {
        if (prompts && prompts.length > 0) {
          set({ prompts })
        }
      },
      
      // 保存提示词到uTools存储
      savePrompts: () => {
        const { prompts } = get()
        if (window.savePrompts) {
          window.savePrompts(prompts)
        }
      }
    }),
    {
      name: 'prompt-storage', // localStorage的key
      partialize: (state) => ({ 
        prompts: state.prompts,
        globalPrompt: state.globalPrompt,
        useGlobalPrompt: state.useGlobalPrompt
      }), 
    }
  )
) 