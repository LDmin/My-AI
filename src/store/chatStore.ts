import { create } from 'zustand'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createAt: number
  updateAt: number
}

export interface ChatSession {
  id: string
  name: string
  messages: Message[]
}

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  setCurrentSession: (id: string) => void
  addSession: (name: string) => void
  deleteSession: (id: string) => void
  addMessage: (sessionId: string, message: Message) => void
  deleteMessage: (sessionId: string, messageId: string) => void
  clearMessages: (sessionId: string) => void
  initSessions: (sessions: ChatSession[]) => void
  saveSessions: () => void
}

// 初始化的默认会话
const defaultSessions = [
  {
    id: 'default',
    name: '默认会话',
    messages: [
      {
        id: 'init',
        content: '你好，我是AI助手，有什么可以帮你？',
        role: 'assistant' as const,
        createAt: Date.now(),
        updateAt: Date.now(),
      }
    ]
  }
]

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [...defaultSessions],
  currentSessionId: 'default',
  
  setCurrentSession: (id) => set({ currentSessionId: id }),
  
  addSession: (name) => {
    const id = Date.now().toString()
    set(state => ({
      sessions: [...state.sessions, { id, name, messages: [] }],
      currentSessionId: id
    }))
    
    // 保存到存储
    get().saveSessions()
  },
  
  addMessage: (sessionId, message) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      )
    }))
    
    // 保存到存储
    get().saveSessions()
  },
  
  deleteMessage: (sessionId, messageId) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId 
          ? { ...s, messages: s.messages.filter(m => m.id !== messageId) } 
          : s
      )
    }))
    
    // 保存到存储
    get().saveSessions()
  },
  
  // 删除会话
  deleteSession: (id) => {
    set(state => {
      // 过滤掉要删除的会话
      const filteredSessions = state.sessions.filter(s => s.id !== id)
      
      // 检查是否删除的是当前选中的会话
      let newCurrentId = state.currentSessionId
      
      // 如果删除的是当前会话，则选择第一个会话（如果有）
      if (id === state.currentSessionId) {
        newCurrentId = filteredSessions.length > 0 ? filteredSessions[0].id : null
      }
      
      return {
        sessions: filteredSessions,
        currentSessionId: newCurrentId
      }
    })
    
    // 保存到存储
    get().saveSessions()
  },
  
  // 清空指定会话的所有消息
  clearMessages: (sessionId) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId 
          ? { ...s, messages: [] } 
          : s
      )
    }))
    
    // 保存到存储
    get().saveSessions()
  },
  
  // 初始化会话列表
  initSessions: (sessions) => {
    if (sessions && sessions.length > 0) {
      // 确保设置当前会话ID为第一个会话
      const firstSessionId = sessions[0].id
      set({ 
        sessions,
        currentSessionId: firstSessionId
      })
      
      // 输出日志，便于调试
      console.log(`initSessions: 初始化${sessions.length}个会话，当前选中ID: ${firstSessionId}`)
    } else {
      // 如果没有会话，使用默认会话
      set({
        sessions: [...defaultSessions],
        currentSessionId: defaultSessions[0].id
      })
      console.log(`initSessions: 无会话，使用默认会话，ID: ${defaultSessions[0].id}`)
    }
  },
  
  // 保存会话到存储
  saveSessions: () => {
    const { sessions } = get()
    if (window.saveSessions) {
      window.saveSessions(sessions)
    }
  }
}))
