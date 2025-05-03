import React from 'react'
import styles from './MainLayout.module.css'
import SidebarMenu from '../components/SidebarMenu'

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('MainLayout渲染，children:', children ? '有内容' : '无内容')
  
  return (
    <div className={styles.layout}>
      <aside className={styles.left}><SidebarMenu /></aside>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default MainLayout
