import React, { useState } from 'react'
import { Form, Select, Card, Divider, Typography, Space, theme } from 'antd'
import OllamaConfig from '../OllamaConfig'

const { Option } = Select
const { Title, Paragraph, Text } = Typography
const { useToken } = theme

type ModelType = 'ollama' | 'openai' | 'api2d' | 'azure'

const ModelSettings: React.FC = () => {
  const [modelType, setModelType] = useState<ModelType>('ollama')
  const { token } = useToken()

  // 根据模型类型渲染对应的配置组件
  const renderModelConfig = () => {
    switch (modelType) {
      case 'ollama':
        return <OllamaConfig />
      case 'openai':
        return <Card title="OpenAI API 配置">敬请期待</Card>
      case 'api2d':
        return <Card title="API2D 配置">敬请期待</Card>
      case 'azure':
        return <Card title="Azure OpenAI 配置">敬请期待</Card>
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
              onChange={(value: ModelType) => setModelType(value)}
              style={{ width: 300 }}
            >
              <Option value="ollama">Ollama (本地模型)</Option>
              <Option value="openai">OpenAI API</Option>
              <Option value="api2d">API2D (OpenAI代理)</Option>
              <Option value="azure">Azure OpenAI</Option>
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