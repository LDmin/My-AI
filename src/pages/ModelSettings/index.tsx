import React, { useState, useEffect } from 'react'
import { Form, Select, Card, Divider, Typography, Space, theme } from 'antd'
import OllamaConfig from '@/pages/ModelSettings/OllamaConfig'
import SiliconflowConfig from '@/pages/ModelSettings/SiliconflowConfig'
import OpenAIConfig from '@/pages/ModelSettings/OpenAIConfig'
import BaiduConfig from '@/pages/ModelSettings/BaiduConfig'
import AliConfig from '@/pages/ModelSettings/AliConfig'
import ZhipuConfig from '@/pages/ModelSettings/ZhipuConfig'
import MiniMaxConfig from '@/pages/ModelSettings/MiniMaxConfig'
import XunfeiConfig from '@/pages/ModelSettings/XunfeiConfig'
import { useSettingsStore, AIServiceType } from '../../store/settingsStore'

const { Option } = Select
const { Title, Paragraph, Text } = Typography
const { useToken } = theme

const ModelSettings: React.FC = () => {
  const { serviceType, setServiceType } = useSettingsStore()
  const [modelType, setModelType] = useState<AIServiceType>(serviceType)
  const { token } = useToken()
  
  // 当store中的serviceType变化时，同步更新modelType
  useEffect(() => {
    setModelType(serviceType)
  }, [serviceType])

  // 处理模型类型变化
  const handleModelTypeChange = (type: AIServiceType) => {
    setModelType(type)
    setServiceType(type)
  }

  // 根据模型类型渲染对应的配置组件
  const renderModelConfig = () => {
    switch (modelType) {
      case 'ollama':
        return <OllamaConfig />
      case 'siliconflow':
        return <SiliconflowConfig />
      case 'openai':
        return <OpenAIConfig />
      case 'baidu':
        return <BaiduConfig />
      case 'ali':
        return <AliConfig />
      case 'zhipu':
        return <ZhipuConfig />
      case 'minimax':
        return <MiniMaxConfig />
      case 'xunfei':
        return <XunfeiConfig />
      default:
        return null
    }
  }

  return (
    <div style={{ padding: token.paddingLG, maxWidth: 800 }}>
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <div>
          <Title level={3}>模型配置</Title>
          <Paragraph type="secondary">
            选择并配置您要使用的大语言模型服务
          </Paragraph>
        </div>
        
        <Form layout="vertical">
          <Form.Item label="模型服务类型" required>
            <Select
              value={modelType}
              onChange={handleModelTypeChange}
              style={{ width: 300 }}
            >
              <Option value="ollama">Ollama (本地模型)</Option>
              <Option value="siliconflow">硅基流动 API</Option>
              <Option value="openai">OpenAI API</Option>
              <Option value="baidu">百度文心一言</Option>
              <Option value="ali">阿里通义千问</Option>
              <Option value="zhipu">智谱AI</Option>
              <Option value="minimax">MiniMax</Option>
              <Option value="xunfei">讯飞星火</Option>
            </Select>
          </Form.Item>
        </Form>
        
        <Divider style={{ margin: `${token.marginMD}px 0` }} />
        
        {renderModelConfig()}
      </Space>
    </div>
  )
}

export default ModelSettings 