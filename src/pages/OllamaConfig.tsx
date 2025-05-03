// @ts-ignore
import React, { useState, useEffect } from 'react';
import { fetchOllamaModels } from './ollamaApi';
import { useSettingsStore } from '../store/settingsStore'
import { Form, Input, Button, Select, Spin, Alert, message, Typography, Space, theme } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography
const { useToken } = theme

declare global {
  interface Window {
    utools?: any;
  }
}

const OllamaConfig: React.FC = () => {
  const { ollama, setOllama } = useSettingsStore()
  const [baseUrl, setBaseUrl] = useState(ollama.baseUrl);
  const [model, setModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useToken();

  // 初始化时优先读取缓存
  useEffect(() => {
    const cachedModel = window.utools?.dbStorage.getItem('selected-model')
    if (cachedModel) {
      setModel(cachedModel)
      setOllama({ baseUrl, model: cachedModel })
    }
  }, [])

  useEffect(() => {
    if (!baseUrl) return;
    setLoading(true);
    setError('');
    fetchOllamaModels(baseUrl)
      .then(list => {
        setModels(list);
        // 只在 model 为空时才自动设置
        if (list.length > 0 && !model) {
          setModel(list[0]);
          setOllama({ baseUrl, model: list[0] });
        }
      })
      .catch(() => setError('无法获取模型列表'))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  // 选择模型时自动同步到全局 store并缓存
  const handleModelChange = (value: string) => {
    setModel(value);
    setOllama({ baseUrl, model: value });
    window.utools?.dbStorage.setItem('selected-model', value)
  };

  // 保存配置并提示
  const handleSave = () => {
    try {
      setOllama({ baseUrl, model });
      window.utools?.dbStorage.setItem('selected-model', model)
      message.success('保存配置成功');
    } catch (err) {
      message.error('保存配置失败');
    }
  }

  return (
    <Space direction="vertical" size={token.marginMD} style={{ width: '100%' }}>
      <div>
        <Title level={4}>Ollama 配置</Title>
        <Paragraph type="secondary">
          配置本地Ollama服务和使用的模型
        </Paragraph>
      </div>
      
      <Form layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item label="Ollama 服务地址">
          <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="http://localhost:11434" />
        </Form.Item>
        <Form.Item label="模型名称">
          {loading ? (
            <Spin size="small" />
          ) : error ? (
            <Alert type="error" message={error} />
          ) : (
            <Select
              value={model}
              onChange={handleModelChange}
              style={{ width: '100%' }}
              options={models.map(m => ({ label: m, value: m }))}
              placeholder="请选择模型"
            />
          )}
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave} disabled={!model}>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Space>
  );
};

export default OllamaConfig; 