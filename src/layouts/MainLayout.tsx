import React, { useEffect } from 'react'
import styles from './MainLayout.module.css'
import SidebarMenu from '../components/SidebarMenu'
import { useLocation, useNavigate } from 'react-router-dom'

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (children && location.pathname.endsWith('index.html')) {
      navigate('/chat/session', { replace: true })
    }
  }, [children, location, navigate])

  console.log('MainLayout渲染，children:', children ? '有内容' : '无内容')
  
  return (
    <div className={styles.layout}>
      <aside className={styles.left}><SidebarMenu /></aside>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default MainLayout
