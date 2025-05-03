import { create } from 'zustand'

interface OllamaConfig {
  baseUrl: string
  model: string
}

interface SettingsState {
  ollama: OllamaConfig
  setOllama: (config: OllamaConfig) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: '',
  },
  setOllama: (config) => set({ ollama: config })
}))
