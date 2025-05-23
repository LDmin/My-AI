import React, { useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import styles from './SessionList.module.css'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { DeleteOutlined } from '@ant-design/icons'
import { Modal, message } from 'antd'

const SessionList: React.FC = () => {
  const { sessions, currentSessionId, setCurrentSession, addSession, deleteSession } = useChatStore()
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

  // 处理删除会话
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    // 阻止事件冒泡，避免触发会话选择
    e.stopPropagation()
    
    // 默认会话不允许删除
    if (sessionId === 'default') {
      message.warning('默认会话不能删除')
      return
    }
    
    // 二次确认
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此会话吗？该操作不可恢复。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        // 如果删除的是当前会话，需要先导航到其他会话
        if (sessionId === selectedId) {
          // 找到一个可用的会话ID
          const availableSessionId = sessions.find(s => s.id !== sessionId)?.id || 'default'
          // 先删除会话
          deleteSession(sessionId)
          // 然后导航到可用会话
          navigate(`/chat/session?id=${availableSessionId}`)
          message.success('会话已删除')
        } else {
          // 如果删除的不是当前会话，直接删除
          deleteSession(sessionId)
          message.success('会话已删除')
        }
      }
    })
  }

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
            <span className={styles.sessionName}>{session.name}</span>
            <DeleteOutlined 
              className={styles.deleteIcon} 
              onClick={(e) => handleDeleteSession(e, session.id)}
            />
          </li>
        ))}
      </ul>
      <button className={styles.addBtn} onClick={() => addSession('新会话')}>+ 新建会话</button>
    </div>
  )
}

export default SessionList
