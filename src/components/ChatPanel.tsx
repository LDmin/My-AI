import React, { useState, useEffect, useRef } from 'react'
import { Message, useChatStore } from '../store/chatStore'
import { ProChat } from '@ant-design/pro-chat'
import { sendMessageToOllamaStream } from '../pages/ollamaApi'
import { useSettingsStore } from '../store/settingsStore'
import { usePromptStore } from '../store/promptStore'
import { useNavigate } from 'react-router-dom'
import { Button, Tooltip, Space, Typography, theme } from 'antd'
import { RocketOutlined } from '@ant-design/icons'

const { Text } = Typography
const { useToken } = theme

// 默认系统建议
const defaultSuggestions = [
  { label: '写一份日报', value: '写日报' },
  { label: '画一张画', value: '画画' },
  {
    label: '查知识',
    value: '知识',
    children: [
      { label: '关于React', value: 'react' },
      { label: '关于Ant Design', value: 'antd' },
    ],
  },
]

const ChatPanel: React.FC = () => {
  const { sessions, currentSessionId, addMessage } = useChatStore()
  const { ollama } = useSettingsStore()
  const { prompts } = usePromptStore()
  const session = sessions.find(s => s.id === currentSessionId)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [thinkingContent, setThinkingContent] = useState<string | null>(null) // 模型思考过程
  const [suggestions, setSuggestions] = useState(defaultSuggestions)
  const [inputValue, setInputValue] = useState('')
  const navigate = useNavigate()
  const { token } = useToken()

  // 合并默认建议和个人提示词
  useEffect(() => {
    if (prompts.length > 0) {
      // 将提示词格式化为ProChat需要的suggestion格式
      const promptSuggestions = {
        label: '个人提词',
        value: 'prompt',
        children: prompts.map(prompt => ({
          label: prompt.title,
          value: prompt.content
        }))
      }
      
      setSuggestions([...defaultSuggestions, promptSuggestions])
    } else {
      setSuggestions(defaultSuggestions)
    }
  }, [prompts])

  // 没有选择大模型时，显示提示
  if (!ollama.model) {
    return (
      <div style={{ 
        padding: token.paddingLG, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: token.marginMD
      }}>
        <Text style={{ fontSize: token.fontSizeLG }}>请先选择大模型，否则无法进行对话</Text>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/settings/model')}
        >
          去选择大模型
        </Button>
      </div>
    )
  }

  // 快速插入提示词
  const handleInsertPrompt = (content: string) => {
    setInputValue((prev) => (prev ? prev + '\n' : '') + content)
  }

  // 渲染顶部提示词按钮
  const renderPromptButtons = () => {
    if (prompts.length === 0) return null

    return (
      <div style={{ 
        padding: `${token.paddingXS}px ${token.paddingLG}px`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        backgroundColor: token.colorBgElevated,
      }}>
        <Space align="center">
          <Tooltip title="点击按钮插入常用提示词">
            <Space size={4}>
              <RocketOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
              <Text type="secondary">提示词:</Text>
            </Space>
          </Tooltip>
          
          <Space wrap size={[8, 8]} style={{ flexWrap: 'wrap' }}>
            {prompts.slice(0, 5).map(prompt => (
              <Button 
                key={prompt.id} 
                size="small"
                type="default"
                onClick={() => handleInsertPrompt(prompt.content)}
              >
                {prompt.title}
              </Button>
            ))}
            
            {prompts.length > 5 && (
              <Button
                size="small"
                type="text"
                onClick={() => {
                  // 直接使用第六个提示词
                  const nextPrompt = prompts[5]
                  if (nextPrompt) {
                    handleInsertPrompt(nextPrompt.content)
                  }
                }}
              >
                更多...
              </Button>
            )}
          </Space>
        </Space>
      </div>
    )
  }

  // 准备消息数据
  const chatData = [...(session?.messages || [])]
  
  // 添加思考消息（如果有）
  if (thinkingContent) {
    chatData.push({
      id: 'thinking',
      content: `> **💭 模型思考过程**\n\`\`\`\n${thinkingContent}\n\`\`\``,
      role: 'assistant',
      createAt: Date.now(),
      updateAt: Date.now()
    })
  }
  

  
  // 添加流式响应（如果有）
  if (streamingContent) {
    chatData.push({
      id: 'stream',
      content: streamingContent,
      role: 'assistant',
      createAt: Date.now(),
      updateAt: Date.now()
    })
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: token.colorBgContainer,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {renderPromptButtons()}
      <div 
        style={{ 
          flex: 1, 
          overflow: 'hidden',
          height: '100%',
          position: 'relative'
        }}
      >
        <ProChat
          key={currentSessionId}
          chats={chatData}
          // 不设置loading属性，避免影响正常显示
          placeholder="输入消息，/ 查看建议，或点击上方提示词快速插入"
          request={async (allMessages) => {
            // 每次开始新请求时清空思考内容
            setThinkingContent(null);
            
            // 获取最后一条用户消息
            const userMessage = allMessages[allMessages.length - 1]
            
            // 创建用户消息并添加到会话
            const userMsg: Message = {
              id: `user-${Date.now()}`,
              content: String(userMessage.content),
              role: 'user',
              createAt: Date.now(),
              updateAt: Date.now(),
            }
            addMessage(session?.id || '', userMsg)
            
            // 开始生成AI回复
            let streamId = `ai-${Date.now()}`
            let lastContent = ''
            // 设置状态为处理中
            setStreamingContent('')
            
            try {
              // 构建消息历史
              const messages = allMessages
                .filter(m => m.id !== 'thinking') // 过滤掉思考消息
                .map(m => ({ 
                  role: m.role, 
                  content: String(m.content) 
                }))
              
              await sendMessageToOllamaStream({
                baseUrl: ollama.baseUrl,
                model: ollama.model,
                messages,
                onStream: (text) => {
                  lastContent = text
                  setStreamingContent(text)
                },
                onThinking: (text) => {
                  setThinkingContent(text)
                }
              })
              
              // 完成响应，但保持生成状态直到保存完所有消息
              
              // 流式回复结束，保存最终回复
              const msg: Message = {
                id: streamId,
                content: lastContent,
                role: 'assistant',
                createAt: Date.now(),
                updateAt: Date.now(),
              }
              
              // 如果有思考内容，保存到会话中
              if (thinkingContent) {
                const thinkingMsg: Message = {
                  id: `thinking-${Date.now()}`,
                  content: `> **💭 模型思考过程**\n\`\`\`\n${thinkingContent}\n\`\`\``,
                  role: 'assistant',
                  createAt: Date.now(),
                  updateAt: Date.now(),
                }
                addMessage(session?.id || '', thinkingMsg)
              }
              
              addMessage(session?.id || '', msg)
              // 返回结果并指定状态为complete，以解决发送按钮一直转圈问题
              // 返回简单字符串而不是对象，避免 response.clone 错误
              return lastContent
            } finally {
              // 无论成功失败，都重置各种状态
              setStreamingContent(null) // 结束流式
              setThinkingContent(null) // 清空思考内容
            }
          }}
          style={{ 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      </div>
    </div>
  )
}

export default ChatPanel