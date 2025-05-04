import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './SettingsList.module.css'

export type SettingsTab = 'model' | 'mcp' | 'prompt' | 'web-search' | 'about'

interface SettingsListProps {
  active?: SettingsTab
  onChange?: (tab: SettingsTab) => void
}

const items = [
  { key: 'model', label: '模型设置' },
  { key: 'web-search', label: '联网搜索' },
  { key: 'mcp', label: 'MCP服务' },
  { key: 'prompt', label: '个人提词' },
  { key: 'about', label: '关于作者' },
]

const SettingsList: React.FC<SettingsListProps> = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const current = location.pathname.split('/')[2] as SettingsTab || 'model'
  
  const handleClick = (key: string) => {
    navigate(`/settings/${key}`)
  }
  
  return (
    <div className={styles.settingsList}>
      <div className={styles.header}>设置</div>
      <ul className={styles.list}>
        {items.map(item => (
          <li
            key={item.key}
            className={item.key === current ? styles.active : styles.item}
            onClick={() => handleClick(item.key)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SettingsList 