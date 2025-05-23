// @ts-ignore
import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore'
import { Form, Input, Button, Select, Spin, Alert, message, Typography, Space, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { AIServiceManager, AIServiceType } from '@/services';

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
  const [model, setModel] = useState(ollama.model || '');
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useToken();
  
  // 获取AI服务管理器
  const serviceManager = AIServiceManager.getInstance();

  // 只获取一次模型列表
  useEffect(() => {
    if (!baseUrl) return;
    setLoading(true);
    setError('');
    
    // 使用服务架构获取模型列表
    const service = serviceManager.getService(
      AIServiceType.OLLAMA, 
      { baseUrl, model: '' } // 临时服务实例，不需要指定模型
    );
    
    service.getModels()
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

  // 选择模型时自动同步到全局 store
  const handleModelChange = (value: string) => {
    setModel(value);
    setOllama({ baseUrl, model: value });
  };

  // 检查服务可用性
  const checkServiceAvailability = async () => {
    setLoading(true);
    try {
      const service = serviceManager.getService(
        AIServiceType.OLLAMA, 
        { baseUrl, model: model || '' }
      );
      
      const available = await service.checkAvailability();
      if (available) {
        message.success('服务连接成功');
      } else {
        message.error('服务连接失败');
      }
    } catch (err) {
      message.error('服务连接失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // 保存配置并提示
  const handleSave = () => {
    try {
      setOllama({ baseUrl, model });
      
      // 清除原有服务缓存
      serviceManager.clearServiceCache(AIServiceType.OLLAMA, baseUrl);
      
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
          <Space.Compact style={{ width: '100%' }}>
            <Input 
              value={baseUrl} 
              onChange={e => setBaseUrl(e.target.value)} 
              placeholder="http://localhost:11434" 
            />
            <Button onClick={checkServiceAvailability} loading={loading}>
              测试连接
            </Button>
          </Space.Compact>
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