import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Form, Input, Button, message, Typography, Space, theme } from 'antd';
import { AIServiceManager, AIServiceType } from '@/services';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

const BaiduConfig: React.FC = () => {
  const { baidu = { apiKey: '', secretKey: '', model: '' }, setBaidu } = useSettingsStore();
  const [apiKey, setApiKey] = useState(baidu.apiKey);
  const [secretKey, setSecretKey] = useState(baidu.secretKey);
  const [model, setModel] = useState(baidu.model);
  const [loading, setLoading] = useState(false);
  const { token } = useToken();
  const serviceManager = AIServiceManager.getInstance();

  const checkServiceAvailability = async () => {
    if (!apiKey || !secretKey || !model) {
      message.error('请先填写 API Key、Secret Key 和模型名称');
      return;
    }
    setLoading(true);
    try {
      const service = serviceManager.getService(
        AIServiceType.BAIDU,
        { baseUrl: '', model, apiKey, secretKey } as any
      );
      const available = await service.checkAvailability();
      if (available) {
        message.success('API Key 有效');
      } else {
        message.error('API Key 或 Secret Key 无效');
      }
    } catch (err) {
      message.error('API Key 检查失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setBaidu({ apiKey, secretKey, model });
    message.success('保存配置成功');
  };

  return (
    <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
      <div>
        <Title level={4}>百度文心一言 API 配置</Title>
        <Paragraph type="secondary">配置百度API Key、Secret Key和模型</Paragraph>
      </div>
      <Form layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item label="API Key" required>
          <Input.Password value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="百度API Key" />
        </Form.Item>
        <Form.Item label="Secret Key" required>
          <Input.Password value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="百度Secret Key" />
        </Form.Item>
        <Form.Item label="模型名称" required>
          <Input value={model} onChange={e => setModel(e.target.value)} placeholder="ernie-bot" />
        </Form.Item>
        <Form.Item>
          <Button onClick={checkServiceAvailability} loading={loading}>测试API Key</Button>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave} disabled={!apiKey || !secretKey || !model}>保存配置</Button>
        </Form.Item>
      </Form>
    </Space>
  );
};

export default BaiduConfig;
