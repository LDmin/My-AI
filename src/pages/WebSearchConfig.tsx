import React, { useState, useEffect } from 'react';
import { useSettingsStore, WebSearchType } from '../store/settingsStore';
import { Form, Switch, Radio, Input, Button, Card, Space, Typography, theme, message, Collapse } from 'antd';
import { GlobalOutlined, QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { SearchEngineType } from '../services/WebService/SearchFactory';

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;
const { Panel } = Collapse;

// 搜索引擎选项类型
interface SearchEngineOption {
  label: string;
  value: string;
  description?: string;
}

// 获取搜索引擎选项
const getSearchEngineOptions = (): SearchEngineOption[] => {
  // 基础选项：不使用搜索
  const options: SearchEngineOption[] = [
    {
      label: '不使用联网搜索',
      value: 'none'
    }
  ];
  
  // 从枚举中获取搜索引擎类型
  for (const type in SearchEngineType) {
    // 只处理枚举值，跳过枚举键
    if (isNaN(Number(type))) {
      // 获取枚举值
      const value = SearchEngineType[type as keyof typeof SearchEngineType].toLowerCase();
      
      // 根据类型设置显示名称
      let label: string;
      switch (value) {
        case 'bing':
          label = 'Bing搜索';
          break;
        case 'google':
          label = 'Google搜索';
          break;
        case 'baidu':
          label = '百度搜索';
          break;
        default:
          label = `${value.charAt(0).toUpperCase() + value.slice(1)}搜索`;
      }
      
      options.push({
        label,
        value,
        description: '(无需API密钥)'
      });
    }
  }
  
  return options;
};

const WebSearchConfig: React.FC = () => {
  const { webSearch, setWebSearch } = useSettingsStore();
  const { token } = useToken();
  
  // 本地状态
  const [enabled, setEnabled] = useState(webSearch.enabled);
  const [searchType, setSearchType] = useState<WebSearchType>(webSearch.type);
  const [searchUrl, setSearchUrl] = useState<string>(webSearch.searchUrl || '');
  const [userAgent, setUserAgent] = useState<string>(webSearch.userAgent || '');
  
  // 当全局状态变化时，更新本地状态
  useEffect(() => {
    setEnabled(webSearch.enabled);
    setSearchType(webSearch.type);
    setSearchUrl(webSearch.searchUrl || '');
    setUserAgent(webSearch.userAgent || '');
  }, [webSearch]);
  
  // 保存设置
  const handleSave = () => {
    const config = {
      enabled,
      type: searchType,
      searchUrl: searchUrl || undefined,
      userAgent: userAgent || undefined
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

  // 更新搜索URL
  const handleSearchUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchUrl(e.target.value);
  };

  // 更新User Agent
  const handleUserAgentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAgent(e.target.value);
  };
  
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
                  {getSearchEngineOptions().map((option) => (
                    <Radio key={option.value} value={option.value}>
                      <Space>
                        <Text>{option.label}</Text>
                        {option.description && <Text type="secondary">{option.description}</Text>}
                      </Space>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>
            
            <Collapse 
              ghost 
              style={{ marginBottom: token.marginMD, border: 'none' }}
              expandIcon={({ isActive }) => <SettingOutlined rotate={isActive ? 90 : 0} />}
            >
              <Panel header="高级设置" key="advanced">
                <Form.Item 
                  label="自定义搜索URL" 
                  tooltip="可选：自定义搜索服务的URL，留空使用默认配置"
                >
                  <Input 
                    placeholder="例如: https://api.example.com/search?q=" 
                    value={searchUrl} 
                    onChange={handleSearchUrlChange}
                    disabled={!enabled || searchType === 'none'}
                  />
                </Form.Item>
                
                <Form.Item 
                  label="自定义User Agent" 
                  tooltip="可选：自定义搜索请求的User Agent，留空使用默认配置"
                >
                  <Input 
                    placeholder="Mozilla/5.0 ..." 
                    value={userAgent} 
                    onChange={handleUserAgentChange}
                    disabled={!enabled || searchType === 'none'}
                  />
                </Form.Item>
              </Panel>
            </Collapse>
            
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
            2. 系统会自动判断是否需要联网搜索，如时效性内容、新闻、股票等<br />
            3. 搜索功能使用网页爬取，无需配置任何API密钥<br />
            4. 联网搜索可能会增加响应时间，但能提供更新的信息<br />
            5. 高级设置中可自定义搜索URL和User Agent，适用于特殊网络环境
          </Paragraph>
        </div>
      </Space>
    </div>
  );
};

export default WebSearchConfig; 