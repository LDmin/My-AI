import React, { useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import styles from './SessionList.module.css'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'

const SessionList: React.FC = () => {
  const { sessions, currentSessionId, setCurrentSession, addSession } = useChatStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const selectedId = searchParams.get('id') || currentSessionId

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
