import { ConfigProvider, theme } from 'antd'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import { useUIStore } from './store/uiStore'
import { useSettingsStore } from './store/settingsStore'
import MainLayout from './layouts/MainLayout'
import SessionList from './components/SessionList'
import SettingsList from './components/SettingsList'
import ChatPanel from './components/ChatPanel'
import ModelSettings from './pages/ModelSettings'
import PromptSettings from './pages/PromptSettings'
import AboutPage from './pages/AboutPage'
import React, { useEffect } from 'react'

const MCPPlaceholder = () => <div style={{ padding: 32 }}>敬请期待</div>

// 会话路由
function ChatRoute() {
  const location = useLocation()
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
  const location = useLocation()
  const tab = location.pathname.split('/')[2] || 'model'
  console.log('SettingsRoute渲染，当前路径:', location.pathname, '选中的tab:', tab)
  
  let rightContent = <ModelSettings />
  
  if (tab === 'mcp') rightContent = <MCPPlaceholder />
  else if (tab === 'prompt') rightContent = <PromptSettings />
  else if (tab === 'about') rightContent = <AboutPage />
  
  return (
    <>
      <div className="center-panel">
        <SettingsList />
      </div>
      <div className="right-panel">
        {rightContent}
      </div>
    </>
  )
}

function App() {
  const isDarkMode = useUIStore(state => state.isDarkMode)
  const initTheme = useUIStore(state => state.initTheme)
  const initSettings = useSettingsStore(state => state.initSettings)
  
  // 初始化主题和应用配置
  useEffect(() => {
    // 初始化主题
    initTheme()
    console.log('初始化主题:', isDarkMode ? '深色' : '明亮')
    
    // 初始化应用配置
    initSettings()
  }, [])
  
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
            <Route path="/chat" element={<ChatRoute />} />
            <Route path="/chat/session" element={<ChatRoute />} />
            <Route path="/settings/:tab" element={<SettingsRoute />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  )
}

export default App
