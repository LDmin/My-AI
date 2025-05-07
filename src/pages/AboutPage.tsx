import React from 'react'
import { Typography, Card, Divider, Space, Tag, theme } from 'antd'
import { GithubOutlined, MailOutlined, LinkOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text, Link } = Typography
const { useToken } = theme

const AboutPage: React.FC = () => {
  const { token } = useToken()

  return (
    <div style={{ padding: token.paddingLG, maxWidth: 800 }}>
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <div>
          <Title level={3}>关于 myAI</Title>
          <Paragraph type="secondary">
            myAI 是一个基于 React + TypeScript + Zustand + Ollama + Vite + Ant Design + @ant-design/x 构建的本地大语言模型对话工具，
            提供简洁高效的多会话管理和深色模式支持。
          </Paragraph>
        </div>

        <div>
          <Title level={4}>技术栈</Title>
          <Space wrap size={[0, 8]}>
            <Tag color="blue">React 18</Tag>
            <Tag color="green">TypeScript</Tag>
            <Tag color="purple">Zustand</Tag>
            <Tag color="gold">Ant Design</Tag>
            <Tag color="cyan">@ant-design/x</Tag>
            <Tag color="magenta">Vite</Tag>
            <Tag color="volcano">Ollama</Tag>
          </Space>
        </div>

        <div>
          <Title level={4}>特性</Title>
          <ul style={{ paddingLeft: token.paddingLG }}>
            <li>三栏布局，左侧为主菜单，中间为会话列表，右侧为聊天内容</li>
            <li>支持本地 Ollama 模型，无需连接云端API</li>
            <li>多会话管理，可以同时进行多个对话</li>
            <li>深色/浅色模式切换</li>
            <li>支持个人提词库，提高对话效率</li>
            <li>扩展性良好，可支持多种模型服务</li>
          </ul>
        </div>

        <div>
          <Title level={4}>作者信息</Title>
          <Card style={{ borderRadius: token.borderRadius }}>
            <Space direction="vertical">
              <Text strong>开发者: 牧曲哥哥</Text>
              {/* <Space>
                <MailOutlined /> <Link href="mailto:example@domain.com">example@domain.com</Link>
              </Space> */}
              <Space>
                <GithubOutlined /> <Link href="https://github.com/LDmin/My-AI" target="_blank">https://github.com/LDmin/My-AI</Link>
              </Space>
              {/* <Space>
                <LinkOutlined /> <Link href="https://yourwebsite.com" target="_blank">yourwebsite.com</Link>
              </Space> */}
            </Space>
          </Card>
        </div>

        <div>
          <Title level={4}>版本信息</Title>
          <Text>当前版本: v0.1.0</Text>
          <Paragraph style={{ marginTop: 8 }}>
            <Text type="secondary">构建日期: {new Date().toLocaleDateString()}</Text>
          </Paragraph>
        </div>
      </Space>
    </div>
  )
}

export default AboutPage 