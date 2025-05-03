import React from 'react'
import { SettingOutlined, MessageOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Tooltip, Switch } from 'antd'
import styles from './SidebarMenu.module.css'
import { useUIStore } from '../store/uiStore'

const SidebarMenu: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode, setDarkMode } = useUIStore()
  const isChat = location.pathname.startsWith('/chat')
  const isSettings = location.pathname.startsWith('/settings')
  return (
    <div className={styles.menu}>
      <Tooltip title="会话列表" placement="right">
        <Button
          type={isChat ? 'primary' : 'text'}
          icon={<MessageOutlined style={{ fontSize: 24 }} />}
          onClick={() => navigate('/chat')}
        />
      </Tooltip>
      <Tooltip title="设置" placement="right">
        <Button
          type={isSettings ? 'primary' : 'text'}
          icon={<SettingOutlined style={{ fontSize: 24 }} />}
          onClick={() => navigate('/settings/model')}
        />
      </Tooltip>
      <Switch
        checkedChildren="🌙"
        unCheckedChildren="☀️"
        checked={isDarkMode}
        onChange={setDarkMode}
        style={{ marginTop: 24 }}
      />
    </div>
  )
}

export default SidebarMenu
