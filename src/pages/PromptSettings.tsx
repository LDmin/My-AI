import React, { useState } from 'react'
import { Button, Input, List, Popconfirm, Form, Card, Typography, message, Space, Divider, theme } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { usePromptStore, Prompt } from '../store/promptStore'

const { TextArea } = Input
const { Title, Paragraph, Text } = Typography
const { useToken } = theme

const PromptSettings: React.FC = () => {
  const { prompts, addPrompt, updatePrompt, deletePrompt } = usePromptStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [form] = Form.useForm()
  const { token } = useToken()

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

  return (
    <div style={{ padding: token.paddingLG, maxWidth: 800 }}>
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <div>
          <Title level={3}>个人提词管理</Title>
          <Paragraph type="secondary">
            添加常用提示词，在聊天时可以快速插入，提高与AI对话的效率
          </Paragraph>
        </div>

        <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text strong>我的提示词</Text>
              <Text type="secondary">({prompts.length}个)</Text>
            </Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              添加提示词
            </Button>
          </div>
          
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
                    title="确定删除这个提示词？"
                    description="删除后无法恢复"
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
            1. 提示词会在聊天界面顶部显示，点击即可快速插入<br />
            2. 输入框中输入 / 也可查看所有提示词<br />
            3. 提示词支持多行文本和格式，例如代码块等
          </Paragraph>
        </div>
      </Space>
    </div>
  )
}

export default PromptSettings 