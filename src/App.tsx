import { ConfigProvider, theme } from 'antd'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import { useUIStore } from './store/uiStore'
import MainLayout from './layouts/MainLayout'
import SessionList from './components/SessionList'
import SettingsList from './components/SettingsList'
import ChatPanel from './components/ChatPanel'
import ModelSettings from './pages/ModelSettings'
import PromptSettings from './pages/PromptSettings'
import AboutPage from './pages/AboutPage'
import React, { useEffect } from 'react'
import { initApp, logEnvironmentInfo } from './utils/init'

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
  
  // 应用初始化
  useEffect(() => {
    // 初始化应用配置和主题
    initApp();
    
    // 打印环境信息用于调试
    logEnvironmentInfo();
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
