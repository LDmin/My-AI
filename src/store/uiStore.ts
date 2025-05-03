import { create } from 'zustand'

interface UIState {
  isDarkMode: boolean
  setDarkMode: (isDark: boolean) => void
  initTheme: () => void
}

// 检测系统是否为深色模式
const prefersDarkMode = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

// 从localStorage获取保存的主题，或使用系统主题
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') return true
  if (savedTheme === 'light') return false
  return prefersDarkMode()
}

// 设置document的data-theme属性
const setDocumentTheme = (isDark: boolean) => {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: getInitialTheme(),
  
  setDarkMode: (isDark) => {
    setDocumentTheme(isDark)
    set({ isDarkMode: isDark })
  },
  
  initTheme: () => {
    const isDark = getInitialTheme()
    setDocumentTheme(isDark)
    set({ isDarkMode: isDark })
  }
}))
