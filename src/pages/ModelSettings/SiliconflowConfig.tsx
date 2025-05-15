import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Form, Input, Button, Select, Spin, Alert, message, Typography, Space, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AIServiceManager, AIServiceType } from '@/services';
import { SiliconflowServiceConfig } from '@/services/SiliconflowService';

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

const SiliconflowConfig: React.FC = () => {
  const { siliconflow, setSiliconflow } = useSettingsStore();
  const [baseUrl, setBaseUrl] = useState(siliconflow.baseUrl);
  const [token, setToken] = useState(siliconflow.token);
  const [model, setModel] = useState(siliconflow.model || '');
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token: themeToken } = useToken();
  
  // 获取AI服务管理器
  const serviceManager = AIServiceManager.getInstance();

  // 获取模型列表
  const fetchModels = async () => {
    if (!baseUrl || !token) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 使用服务架构获取模型列表
      const service = serviceManager.getService(
        AIServiceType.SILICONFLOW, 
        { baseUrl, model: '', token } as SiliconflowServiceConfig // 明确指定类型
      );
      
      const list = await service.getModels();
      setModels(list);
      
      // 如果模型列表不为空且当前未选择模型，自动选择第一个
      if (list.length > 0 && !model) {
        setModel(list[0]);
        setSiliconflow({ baseUrl, token, model: list[0] });
      }
      
      if (list.length > 0) {
        message.success('成功获取模型列表');
      } else {
        setError('获取到的模型列表为空，请检查Token是否正确');
      }
    } catch (err) {
      setError('获取模型列表失败，请检查Token和API地址');
      console.error('获取模型列表错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 选择模型时自动同步到全局 store
  const handleModelChange = (value: string) => {
    setModel(value);
    setSiliconflow({ baseUrl, token, model: value });
  };

  // 检查服务可用性
  const checkServiceAvailability = async () => {
    if (!token) {
      message.error('请先输入Token');
      return;
    }
    
    setLoading(true);
    try {
      const service = serviceManager.getService(
        AIServiceType.SILICONFLOW, 
        { baseUrl, model: model || '', token } as SiliconflowServiceConfig // 明确指定类型
      );
      
      const available = await service.checkAvailability();
      if (available) {
        message.success('服务连接成功');
        fetchModels(); // 连接成功后获取模型列表
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
    if (!token) {
      message.error('请输入Token');
      return;
    }
    
    if (!model) {
      message.error('请选择模型');
      return;
    }
    
    try {
      setSiliconflow({ baseUrl, token, model });
      
      // 清除原有服务缓存
      serviceManager.clearServiceCache(AIServiceType.SILICONFLOW, baseUrl);
      
      message.success('保存配置成功');
    } catch (err) {
      message.error('保存配置失败');
    }
  };

  return (
    <Space direction="vertical" size={themeToken.marginMD} style={{ width: '100%' }}>
      <div>
        <Title level={4}>硅基流动 API 配置</Title>
        <Paragraph type="secondary">
          配置硅基流动API服务和使用的模型
        </Paragraph>
      </div>
      
      <Form layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item label="API 服务地址">
          <Input 
            value={baseUrl} 
            onChange={e => setBaseUrl(e.target.value)} 
            placeholder="https://api.siliconflow.cn" 
          />
        </Form.Item>
        
        <Form.Item 
          label="API Token" 
          required
          help="请输入硅基流动平台的API Token，用于访问API服务"
        >
          <Input.Password 
            value={token} 
            onChange={e => setToken(e.target.value)} 
            placeholder="输入API Token" 
          />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" onClick={checkServiceAvailability} loading={loading}>
            获取模型列表
          </Button>
        </Form.Item>
        
        <Form.Item label="选择模型">
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
              loading={loading}
            />
          )}
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            onClick={handleSave} 
            disabled={!token || !model}
          >
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Space>
  );
};

export default SiliconflowConfig; 