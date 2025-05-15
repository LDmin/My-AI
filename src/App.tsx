import { ConfigProvider, theme } from 'antd'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import { useUIStore } from './store/uiStore'
import MainLayout from './layouts/MainLayout'
import SessionList from './components/SessionList'
import ChatPanel from './components/ChatPanel'
import React, { useEffect, lazy } from 'react'
import { initApp, logEnvironmentInfo } from './utils/init'
import { useSettingsStore } from './store/settingsStore'
import { useChatStore } from './store/chatStore'
import { usePromptStore } from './store/promptStore'
import Settings from './pages/Settings'

// 会话路由
function ChatRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessions, currentSessionId, setCurrentSession } = useChatStore()
  
  // 确保有选中的会话，否则选择第一个会话
  useEffect(() => {
    if (sessions.length > 0 && !location.search.includes('id=')) {
      // 如果没有指定id参数，则选中第一个会话
      const firstSessionId = sessions[0].id
      setCurrentSession(firstSessionId)
      navigate(`/chat/session?id=${firstSessionId}`, { replace: true })
    }
  }, [location.search, sessions, navigate, setCurrentSession])
  
  console.log('ChatRoute渲染，当前路径:', location.pathname)
  
  return (
    <>
      <div className="center-panel">
        <SessionList />
      </div>
      <div className="right-panel">
        <ChatPanel />
      </div>
    </>
  )
}

// 设置路由
function SettingsRoute() {
  return <Settings />;
}

// 声明全局方法
declare global {
  interface Window {
    // uTools相关方法
    getSettings?: () => any;
    saveSettings?: (settings: any) => boolean;
    getSessions?: () => any[];
    saveSessions?: (sessions: any[]) => boolean;
    getPrompts?: () => any[];
    savePrompts?: (prompts: any[]) => boolean;
    copyToClipboard?: (text: string) => boolean;
    getSystemInfo?: () => any;
    sendMessageToAI?: (message: any, options?: any) => Promise<any>;
  }
}

function App() {
  const isDarkMode = useUIStore(state => state.isDarkMode)
  const { setTheme, setSettings } = useSettingsStore()
  const { initSessions, sessions, currentSessionId, setCurrentSession } = useChatStore()
  const { initPrompts } = usePromptStore()
  
  // 应用初始化
  useEffect(() => {
    // 初始化应用配置和主题
    initApp();
    
    // 打印环境信息用于调试
    logEnvironmentInfo();

    // 从uTools获取设置
    if (window.getSettings) {
      const settings = window.getSettings()
      setSettings(settings)
      setTheme(settings.darkMode ? 'dark' : 'light')
    }

    // 从uTools获取会话
    if (window.getSessions) {
      const sessions = window.getSessions()
      if (sessions && sessions.length > 0) {
        initSessions(sessions)
      }
    }

    // 从uTools获取提示词
    if (window.getPrompts) {
      const prompts = window.getPrompts()
      if (prompts && prompts.length > 0) {
        initPrompts(prompts)
      }
    }

    // 如果在开发环境，打印系统信息
    if (window.getSystemInfo && import.meta.env.DEV) {
      console.log('系统信息:', window.getSystemInfo())
    }
  }, [setTheme, setSettings, initSessions, initPrompts])
  
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/chat/session" replace />} />
            <Route path="/chat" element={<Navigate to="/chat/session" replace />} />
            <Route path="/chat/session" element={<ChatRoute />} />
            <Route path="/settings/:tab" element={<SettingsRoute />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  )
}

export default App
