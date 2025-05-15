import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Form, Input, Button, message, Typography, Space, theme } from 'antd';
import { AIServiceManager, AIServiceType } from '@/services';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

const ZhipuConfig: React.FC = () => {
  const { zhipu = { apiKey: '', model: '' }, setZhipu } = useSettingsStore();
  const [apiKey, setApiKey] = useState(zhipu.apiKey);
  const [model, setModel] = useState(zhipu.model);
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
        AIServiceType.ZHIPU,
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
    setZhipu({ apiKey, model });
    message.success('保存配置成功');
  };

  return (
    <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
      <div>
        <Title level={4}>智谱AI API 配置</Title>
        <Paragraph type="secondary">配置智谱API Key和模型</Paragraph>
      </div>
      <Form layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item label="API Key" required>
          <Input.Password value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="智谱API Key" />
        </Form.Item>
        <Form.Item label="模型名称" required>
          <Input value={model} onChange={e => setModel(e.target.value)} placeholder="glm-4" />
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

export default ZhipuConfig;
