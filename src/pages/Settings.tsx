import { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import SidebarMenu from '../components/SidebarMenu'
import SettingsList, { SettingsTab } from '../components/SettingsList'
import OllamaConfig from './OllamaConfig'
import MCPSettings from './MCPSettings'
import AboutPage from './AboutPage'
import PromptSettings from './PromptSettings'

const Settings = () => {
  const [tab, setTab] = useState<SettingsTab>('model')

  let content: React.ReactNode = null
  if (tab === 'model') content = <OllamaConfig />
  else if (tab === 'mcp') content = <MCPSettings />
  else if (tab === 'prompt') content = <PromptSettings />
  else if (tab === 'about') content = <AboutPage />

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ width: '250px', borderRight: '1px solid #f0f0f0' }}>
          <SettingsList active={tab} onChange={setTab} />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {content}
        </div>
      </div>
    </MainLayout>
  )
}

export default Settings
