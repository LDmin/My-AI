import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Form, Input, Button, message, Typography, Space, theme } from 'antd';
import { AIServiceManager, AIServiceType } from '@/services';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

const AliConfig: React.FC = () => {
  const { ali = { apiKey: '', model: '' }, setAli } = useSettingsStore();
  const [apiKey, setApiKey] = useState(ali.apiKey);
  const [model, setModel] = useState(ali.model);
  const [loading, setLoading] = useState(false);
  const { token } = useToken();
  const serviceManager = AIServiceManager.getInstance();

  const checkServiceAvailability = async () => {
    if (!apiKey || !model) {
      message.error('请先填写 API Key 和模型名称');
      return;
    }
    setLoading(true);
    try {
      const service = serviceManager.getService(
        AIServiceType.ALI,
        { baseUrl: '', model, apiKey } as any
      );
      const available = await service.checkAvailability();
      if (available) {
        message.success('API Key 有效');
      } else {
        message.error('API Key 无效');
      }
    } catch (err) {
      message.error('API Key 检查失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setAli({ apiKey, model });
    message.success('保存配置成功');
  };

  return (
    <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
      <div>
        <Title level={4}>阿里通义千问 API 配置</Title>
        <Paragraph type="secondary">配置阿里API Key和模型</Paragraph>
      </div>
      <Form layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item label="API Key" required>
          <Input.Password value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="阿里API Key" />
        </Form.Item>
        <Form.Item label="模型名称" required>
          <Input value={model} onChange={e => setModel(e.target.value)} placeholder="qwen-turbo" />
        </Form.Item>
        <Form.Item>
          <Button onClick={checkServiceAvailability} loading={loading}>测试API Key</Button>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave} disabled={!apiKey || !model}>保存配置</Button>
        </Form.Item>
      </Form>
    </Space>
  );
};

export default AliConfig;
