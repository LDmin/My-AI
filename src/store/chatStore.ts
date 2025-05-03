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
  addMessage: (sessionId: string, message: Message) => void
  deleteMessage: (sessionId: string, messageId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [
    {
      id: 'default',
      name: '默认会话',
      messages: [
        {
          id: 'init',
          content: '你好，我是AI助手，有什么可以帮你？',
          role: 'assistant',
          createAt: Date.now(),
          updateAt: Date.now(),
        }
      ]
    }
  ],
  currentSessionId: 'default',
  setCurrentSession: (id) => set({ currentSessionId: id }),
  addSession: (name) => set(state => {
    const id = Date.now().toString()
    return {
      sessions: [...state.sessions, { id, name, messages: [] }],
      currentSessionId: id
    }
  }),
  addMessage: (sessionId, message) => set(state => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
    )
  })),
  deleteMessage: (sessionId, messageId) => set(state => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId 
        ? { ...s, messages: s.messages.filter(m => m.id !== messageId) } 
        : s
    )
  }))
}))
