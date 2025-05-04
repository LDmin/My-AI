import React, { useState, useEffect } from 'react';
import { useSettingsStore, WebSearchType } from '../store/settingsStore';
import { Form, Switch, Radio, Input, Button, Card, Space, Typography, theme, message } from 'antd';
import { GlobalOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

const WebSearchConfig: React.FC = () => {
  const { webSearch, setWebSearch } = useSettingsStore();
  const { token } = useToken();
  
  // 本地状态
  const [enabled, setEnabled] = useState(webSearch.enabled);
  const [searchType, setSearchType] = useState<WebSearchType>(webSearch.type);
  const [apiKey, setApiKey] = useState(webSearch.apiKey || '');
  
  // 当全局状态变化时，更新本地状态
  useEffect(() => {
    setEnabled(webSearch.enabled);
    setSearchType(webSearch.type);
    setApiKey(webSearch.apiKey || '');
  }, [webSearch]);
  
  // 保存设置
  const handleSave = () => {
    const config = {
      enabled,
      type: searchType,
      apiKey: apiKey.trim() ? apiKey.trim() : undefined
    };
    
    setWebSearch(config);
    message.success('网络搜索设置已保存');
  };
  
  // 切换网络搜索启用状态
  const handleToggleEnabled = (checked: boolean) => {
    setEnabled(checked);
  };
  
  // 切换搜索类型
  const handleSearchTypeChange = (e: any) => {
    setSearchType(e.target.value);
  };
  
  // 是否需要展示API密钥输入框
  const showApiKeyInput = searchType === 'bing' || searchType === 'google';
  
  return (
    <div style={{ padding: token.paddingLG, maxWidth: 800 }}>
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        <div>
          <Title level={3}>联网搜索设置</Title>
          <Paragraph type="secondary">
            配置AI模型是否可以联网搜索信息，获取最新数据
          </Paragraph>
        </div>
        
        <Card 
          style={{ 
            marginBottom: token.marginMD, 
            borderRadius: token.borderRadius 
          }}
          bordered
        >
          <Form layout="vertical">
            <Form.Item
              label={
                <Space>
                  <Text strong>启用联网搜索</Text>
                  <Text type="secondary">(让AI获取最新信息)</Text>
                </Space>
              }
            >
              <Switch 
                checked={enabled} 
                onChange={handleToggleEnabled}
                checkedChildren="开启" 
                unCheckedChildren="关闭"
              />
            </Form.Item>
            
            <Form.Item 
              label="搜索服务类型"
              style={{ marginTop: token.marginMD }}
              help="选择使用哪种搜索服务来获取网络信息"
            >
              <Radio.Group 
                value={searchType} 
                onChange={handleSearchTypeChange}
                disabled={!enabled}
              >
                <Space direction="vertical">
                  <Radio value="none">不使用联网搜索</Radio>
                  <Radio value="built-in">
                    <Space>
                      <Text>插件自带网络搜索</Text>
                      <Text type="secondary">(推荐，无需额外配置)</Text>
                    </Space>
                  </Radio>
                  <Radio value="bing">
                    <Space>
                      <Text>Bing搜索</Text>
                      <Text type="secondary">(需要API密钥)</Text>
                    </Space>
                  </Radio>
                  <Radio value="google">
                    <Space>
                      <Text>Google搜索</Text>
                      <Text type="secondary">(需要API密钥)</Text>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            
            {showApiKeyInput && (
              <Form.Item
                label={`${searchType === 'bing' ? 'Bing' : 'Google'} API密钥`}
                help={`请输入${searchType === 'bing' ? 'Bing' : 'Google'}搜索API密钥，用于访问搜索服务`}
              >
                <Input.Password
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`请输入${searchType === 'bing' ? 'Bing' : 'Google'} API密钥`}
                  disabled={!enabled}
                />
              </Form.Item>
            )}
            
            <Form.Item style={{ marginTop: token.marginLG }}>
              <Button
                type="primary"
                onClick={handleSave}
                icon={<GlobalOutlined />}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
        
        <div>
          <Title level={4} style={{ display: 'flex', alignItems: 'center' }}>
            <QuestionCircleOutlined style={{ marginRight: 8 }} />
            使用说明
          </Title>
          <Paragraph type="secondary">
            1. 启用联网搜索后，AI将能够在对话中查询最新信息<br />
            2. 插件自带网络搜索无需额外配置，但可能有一定的请求限制<br />
            3. 如果选择Bing或Google，需要提供相应的API密钥<br />
            4. 联网搜索可能会增加响应时间，但能提供更新的信息
          </Paragraph>
        </div>
      </Space>
    </div>
  );
};

export default WebSearchConfig; 