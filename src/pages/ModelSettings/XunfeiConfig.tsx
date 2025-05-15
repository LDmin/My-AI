import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Form, Input, Button, message, Typography, Space, theme } from 'antd';
import { AIServiceManager, AIServiceType } from '@/services';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

const XunfeiConfig: React.FC = () => {
  const { xunfei = { appId: '', apiSecret: '', apiKey: '', model: '' }, setXunfei } = useSettingsStore();
  const [appId, setAppId] = useState(xunfei.appId);
  const [apiSecret, setApiSecret] = useState(xunfei.apiSecret);
  const [apiKey, setApiKey] = useState(xunfei.apiKey);
  const [model, setModel] = useState(xunfei.model);
  const [loading, setLoading] = useState(false);
  const { token } = useToken();
  const serviceManager = AIServiceManager.getInstance();

  // 目前仅保存参数，不做API Key有效性检测
  const handleSave = () => {
    setXunfei({ appId, apiSecret, apiKey, model });
    message.success('保存配置成功');
  };

  return (
    <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
      <div>
        <Title level={4}>讯飞星火 API 配置</Title>
        <Paragraph type="secondary">配置讯飞 AppID、APISecret、APIKey 和模型</Paragraph>
      </div>
      <Form layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item label="AppID" required>
          <Input value={appId} onChange={e => setAppId(e.target.value)} placeholder="讯飞AppID" />
        </Form.Item>
        <Form.Item label="APISecret" required>
          <Input.Password value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="讯飞APISecret" />
        </Form.Item>
        <Form.Item label="APIKey" required>
          <Input.Password value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="讯飞APIKey" />
        </Form.Item>
        <Form.Item label="模型名称" required>
          <Input value={model} onChange={e => setModel(e.target.value)} placeholder="spark-v3.0" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave} disabled={!appId || !apiSecret || !apiKey || !model}>保存配置</Button>
        </Form.Item>
      </Form>
    </Space>
  );
};

export default XunfeiConfig;
