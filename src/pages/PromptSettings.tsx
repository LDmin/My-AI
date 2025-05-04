import React, { useState, useEffect } from 'react'
import { Button, Input, List, Popconfirm, Form, Card, Typography, message, Space, Divider, theme } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { usePromptStore, Prompt } from '../store/promptStore'

const { TextArea } = Input
const { Title, Paragraph, Text } = Typography
const { useToken } = theme

const PromptSettings: React.FC = () => {
  const { prompts, addPrompt, updatePrompt, deletePrompt, globalPrompt, setGlobalPrompt } = usePromptStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [globalPromptValue, setGlobalPromptValue] = useState(globalPrompt || '')
  const { token } = useToken()

  // 初始化全局提词
  useEffect(() => {
    setGlobalPromptValue(globalPrompt || '')
  }, [globalPrompt])

  const handleAdd = () => {
    form.resetFields()
    setEditing('new')
  }

  const handleEdit = (id: string) => {
    const prompt = prompts.find(p => p.id === id)
    if (prompt) {
      form.setFieldsValue(prompt)
      setEditing(id)
    }
  }

  const handleDelete = (id: string) => {
    deletePrompt(id)
    message.success('已删除提示词')
  }

  const handleSave = () => {
    form.validateFields().then(values => {
      const { title, content } = values
      
      if (editing === 'new') {
        addPrompt(title, content)
        message.success('已添加新提示词')
      } else if (editing) {
        updatePrompt(editing, title, content)
        message.success('已更新提示词')
      }
      
      setEditing(null)
    })
  }

  // 保存全局提词
  const handleSaveGlobalPrompt = () => {
    setGlobalPrompt(globalPromptValue)
    message.success('全局提词已保存')
  }

  return (
    <div style={{ padding: token.paddingLG, maxWidth: 800 }}>
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <div>
          <Title level={3}>提示词管理</Title>
          <Paragraph type="secondary">
            配置提示词以提高与AI对话的效率，全局提词将应用于所有对话
          </Paragraph>
        </div>

        {/* 全局提词设置 */}
        <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
          <Title level={4}>全局提词</Title>
          <Paragraph type="secondary">
            全局提词会在每次对话开始时自动添加到对话上下文中，用于设置AI的行为模式和回答风格
          </Paragraph>
          
          <Card 
            style={{ 
              marginBottom: token.marginMD, 
              borderRadius: token.borderRadius,
              backgroundColor: token.colorBgContainer,
            }}
            bordered
          >
            <Form layout="vertical">
              <Form.Item
                label="全局提词内容"
                help="设置AI的全局行为规则，例如：'你是一个专业的程序员，请用简洁代码回答问题'"
              >
                <TextArea
                  rows={6}
                  value={globalPromptValue}
                  onChange={(e) => setGlobalPromptValue(e.target.value)}
                  placeholder="输入全局提词内容，它将作为系统指令应用于所有对话"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  onClick={handleSaveGlobalPrompt}
                  disabled={!globalPromptValue || !globalPromptValue.trim()}
                >
                  保存全局提词
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Space>

        <Divider />

        {/* 个人提词列表 */}
        <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>个人提词列表</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              添加提示词
            </Button>
          </div>
          
          <Paragraph type="secondary">
            个人提词用于在聊天时快速插入常用的提示语，提高对话效率
          </Paragraph>
          
          {editing !== null && (
            <Card 
              style={{ marginBottom: token.marginMD, borderRadius: token.borderRadius }}
              title={editing === 'new' ? '添加提示词' : '编辑提示词'}
              bordered
            >
              <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item
                  name="title"
                  label="标题"
                  rules={[{ required: true, message: '请输入提示词标题' }]}
                >
                  <Input placeholder="简短的描述性标题，如：翻译助手" />
                </Form.Item>
                <Form.Item
                  name="content"
                  label="内容"
                  rules={[{ required: true, message: '请输入提示词内容' }]}
                >
                  <TextArea 
                    rows={5} 
                    placeholder="提示词内容，可以包含占位符，如：请将以下内容翻译成中文：" 
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">保存</Button>
                    <Button onClick={() => setEditing(null)}>取消</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          <List
            itemLayout="horizontal"
            dataSource={prompts}
            renderItem={item => (
              <List.Item
                key={item.id}
                style={{ 
                  padding: token.padding,
                  borderRadius: token.borderRadius,
                  backgroundColor: token.colorBgContainer,
                  marginBottom: token.marginXS,
                  border: `1px solid ${token.colorBorderSecondary}`
                }}
                actions={[
                  <Button 
                    icon={<EditOutlined />} 
                    type="text"
                    onClick={() => handleEdit(item.id)}
                    key="edit"
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确认删除"
                    description="确定要删除这个提示词？"
                    onConfirm={() => handleDelete(item.id)}
                    okText="确定"
                    cancelText="取消"
                    key="delete"
                  >
                    <Button icon={<DeleteOutlined />} type="text" danger>
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Text strong>{item.title}</Text>
                  }
                  description={
                    <div style={{ 
                      maxHeight: '80px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical',
                      color: token.colorTextSecondary
                    }}>
                      {item.content}
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: 
              <div style={{ 
                padding: token.paddingLG, 
                textAlign: 'center' 
              }}>
                <Space direction="vertical" size={token.marginSM} align="center">
                  <QuestionCircleOutlined style={{ fontSize: 24, color: token.colorTextDisabled }} />
                  <Text type="secondary">暂无提示词，点击上方按钮添加</Text>
                </Space>
              </div> 
            }}
          />
        </Space>

        <div>
          <Title level={4}>使用说明</Title>
          <Paragraph type="secondary">
            1. 全局提词：应用于所有对话，设置AI的基本行为模式<br />
            2. 个人提词：在聊天界面顶部显示，点击即可快速插入<br />
            3. 输入框中输入 / 也可查看所有提示词<br />
            4. 在对话界面底部可以开启/关闭全局提词功能
          </Paragraph>
        </div>
      </Space>
    </div>
  )
}

export default PromptSettings 