import React from 'react'
import { Typography, Card, Form, Input, Button, Space, theme } from 'antd'

const { Title, Paragraph, Text } = Typography
const { useToken } = theme

const MCPSettings: React.FC = () => {
  const { token } = useToken()
  
  return (
    <div style={{ padding: token.paddingLG, maxWidth: 800 }}>
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <div>
          <Title level={3}>MCP服务设置</Title>
          <Paragraph type="secondary">
            配置MCP服务连接和使用方式，实现更强大的功能扩展
          </Paragraph>
        </div>
        
        <Card 
          style={{ borderRadius: token.borderRadius }} 
          bodyStyle={{ padding: token.paddingLG }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>该功能正在开发中，敬请期待</Text>
            <Paragraph type="secondary">
              MCP服务将提供以下功能：
              <ul style={{ paddingLeft: token.paddingLG, marginTop: token.marginSM }}>
                <li>文件系统访问能力</li>
                <li>外部API调用集成</li>
                <li>高级数据分析处理</li>
                <li>更多自定义扩展功能</li>
              </ul>
            </Paragraph>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default MCPSettings 