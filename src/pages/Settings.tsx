import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SettingsList, { SettingsTab } from '../components/SettingsList'
import ModelSettings from './ModelSettings/index'
import MCPSettings from './MCPSettings'
import AboutPage from './AboutPage'
import PromptSettings from './PromptSettings'
import WebSearchConfig from './WebSearchConfig'

const Settings = () => {
  const location = useLocation();
  const [tab, setTab] = useState<SettingsTab>('model');
  
  // 当URL路径变化时，更新当前显示的tab
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const currentTab = pathSegments[2] as SettingsTab;
    
    if (currentTab && ['model', 'mcp', 'prompt', 'web-search', 'about'].includes(currentTab)) {
      setTab(currentTab);
    }
  }, [location.pathname]);

  let content: React.ReactNode = null
  if (tab === 'model') content = <ModelSettings />
  else if (tab === 'mcp') content = <MCPSettings />
  else if (tab === 'prompt') content = <PromptSettings />
  else if (tab === 'web-search') content = <WebSearchConfig />
  else if (tab === 'about') content = <AboutPage />

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div style={{ width: '250px', borderRight: '1px solid #f0f0f0' }}>
        <SettingsList active={tab} onChange={setTab} />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {content}
      </div>
    </div>
  )
}

export default Settings
