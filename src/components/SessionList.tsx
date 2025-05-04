import React, { useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import styles from './SessionList.module.css'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'

const SessionList: React.FC = () => {
  const { sessions, currentSessionId, setCurrentSession, addSession } = useChatStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  
  // 获取URL中的id参数，如果没有则使用currentSessionId，如果仍然没有则使用第一个会话id
  const sessionIdFromUrl = searchParams.get('id')
  let selectedId = sessionIdFromUrl || currentSessionId
  
  // 确保有选中的会话ID
  useEffect(() => {
    if (!selectedId && sessions.length > 0) {
      const firstSessionId = sessions[0].id
      setCurrentSession(firstSessionId)
      navigate(`/chat/session?id=${firstSessionId}`, { replace: true })
    } else if (sessionIdFromUrl && sessionIdFromUrl !== currentSessionId) {
      // 如果URL中的id与当前选中的不同，则更新状态
      setCurrentSession(sessionIdFromUrl)
    }
  }, [sessions, currentSessionId, selectedId, sessionIdFromUrl, setCurrentSession, navigate])
  
  // 如果selectedId仍然为空，但有会话，则使用第一个会话的ID
  if (!selectedId && sessions.length > 0) {
    selectedId = sessions[0].id
  }

  useEffect(() => {
    console.log('SessionList 挂载/路由变化:', location.pathname, location.search)
  }, [location.pathname, location.search])

  return (
    <div className={styles.sessionList}>
      <div className={styles.header}>会话列表</div>
      <ul className={styles.list}>
        {sessions.map(session => (
          <li
            key={session.id}
            className={session.id === selectedId ? styles.active : ''}
            onClick={() => {
              setCurrentSession(session.id)
              navigate(`/chat/session?id=${session.id}`)
              console.log('点击会话，跳转路由:', `/chat/session?id=${session.id}`)
            }}
          >
            {session.name}
          </li>
        ))}
      </ul>
      <button className={styles.addBtn} onClick={() => addSession('新会话')}>+ 新建会话</button>
    </div>
  )
}

export default SessionList
