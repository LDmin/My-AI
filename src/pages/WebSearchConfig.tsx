import React, { useState, useEffect } from 'react';
import { useSettingsStore, WebSearchType } from '../store/settingsStore';
import { Form, Radio, Input, Button, Card, Space, Typography, theme, message, Alert, InputNumber, Divider } from 'antd';
import { GlobalOutlined, QuestionCircleOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { SearchEngineType } from '../services/WebService/SearchFactory';

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

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
  
  // 添加自定义搜索选项
  options.push({
    label: '自定义搜索',
    value: 'custom',
    description: '(使用自定义搜索URL, 推荐使用searxng)'
  });
  
  return options;
};

const WebSearchConfig: React.FC = () => {
  const { webSearch, setWebSearch } = useSettingsStore();
  const { token } = useToken();
  
  // 本地状态 - 移除enabled状态，完全依靠searchType控制
  const [searchType, setSearchType] = useState<WebSearchType>(
    webSearch.type || 'none'
  );
  const [searchUrl, setSearchUrl] = useState<string>(
    webSearch.searchUrl || ''
  );
  const [searchParam, setSearchParam] = useState<string>(
    webSearch.searchParam || 'q'
  );
  const [userAgent, setUserAgent] = useState<string>(
    webSearch.userAgent || ''
  );
  const [maxResults, setMaxResults] = useState<number>(
    webSearch.maxResults || 3
  );
  
  // 当全局状态变化时，更新本地状态
  useEffect(() => {
    setSearchType(webSearch.type || 'none');
    setSearchUrl(webSearch.searchUrl || '');
    setSearchParam(webSearch.searchParam || 'q');
    setUserAgent(webSearch.userAgent || '');
    setMaxResults(webSearch.maxResults || 3);
  }, [webSearch]);
  
  // 保存设置
  const handleSave = () => {
    // 如果是自定义搜索类型，需要验证URL不为空
    if (searchType === 'custom' && (!searchUrl || searchUrl.trim() === '')) {
      message.error('使用自定义搜索时，必须填写搜索URL');
      return;
    }
    
    const config = {
      enabled: searchType !== 'none', // 基于搜索类型设置enabled状态
      type: searchType,
      searchUrl: searchUrl || undefined,
      searchParam,
      userAgent: userAgent || undefined,
      maxResults
    };
    
    setWebSearch(config);
    message.success('网络搜索设置已保存');
  };
  
  // 切换搜索类型
  const handleSearchTypeChange = (e: any) => {
    const newType = e.target.value;
    setSearchType(newType);
  };

  // 处理搜索URL变更
  const handleSearchUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchUrl(e.target.value);
  };

  // 处理用户代理变更
  const handleUserAgentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAgent(e.target.value);
  };
  
  // 处理搜索参数名变更
  const handleSearchParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParam(e.target.value);
  };
  
  // 处理结果数量变更
  const handleMaxResultsChange = (value: number | null) => {
    setMaxResults(value || 3);
  };
  
  // 计算是否需要自定义URL
  const isCustomSearch = searchType === 'custom';
  // 判断是否启用了搜索（不是none类型）
  const isSearchEnabled = searchType !== 'none';
  
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
              label="搜索服务类型"
              help="选择使用哪种搜索服务来获取网络信息，选择「不使用联网搜索」将禁用联网功能"
            >
              <Radio.Group 
                value={searchType} 
                onChange={handleSearchTypeChange}
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
            
            {/* 自定义搜索设置 */}
            {isCustomSearch && (
              <Form.Item>
                <Alert
                  message="自定义搜索URL设置"
                  description="请提供一个基础搜索URL，系统会自动在URL末尾添加搜索关键词参数。"
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ marginBottom: token.marginMD }}
                />
                
                <Form.Item
                  label="搜索URL"
                  tooltip="用于自定义搜索引擎时的URL，搜索词将添加到URL末尾，例如：https://www.example.com/search"
                  required
                  help={!searchUrl ? '使用自定义搜索时，搜索URL为必填项' : undefined}
                  validateStatus={!searchUrl ? 'error' : undefined}
                >
                  <Input
                    placeholder="请输入搜索URL"
                    value={searchUrl}
                    onChange={handleSearchUrlChange}
                  />
                  {!searchUrl && (
                    <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, marginTop: 4 }}>
                      系统将自动在末尾添加参数，使用下方的搜索参数名
                    </div>
                  )}
                </Form.Item>
                
                <Form.Item
                  label="搜索参数名"
                  tooltip="设置搜索参数的名称，大多数搜索引擎使用'q'，但有些使用'query'、'keyword'等"
                >
                  <Input
                    placeholder="默认为q"
                    value={searchParam}
                    onChange={handleSearchParamChange}
                  />
                  <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, marginTop: 4 }}>
                    系统将使用格式：<Text code>{searchUrl.includes('?') ? `&${searchParam}=关键词` : `?${searchParam}=关键词`}</Text>
                  </div>
                </Form.Item>
                
                <Form.Item
                  label="用户代理 (User-Agent)"
                  tooltip="设置请求搜索引擎时使用的User-Agent，留空使用默认值"
                >
                  <Input
                    placeholder="可选，留空使用默认值"
                    value={userAgent}
                    onChange={handleUserAgentChange}
                  />
                </Form.Item>
              </Form.Item>
            )}
            
            {/* 搜索高级设置 - 直接显示，不使用折叠面板 */}
            <Divider orientation="left">
              <Space>
                <SettingOutlined />
                <span>高级配置</span>
              </Space>
            </Divider>
            
            {/* 直接显示高级配置选项，不需要条件判断 */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: token.marginMD }}>
              <Form.Item
                label="最大分析结果数量" 
                tooltip="设置网络搜索时要分析的最大结果数量，数值越大分析越全面但耗时也越长"
              >
                <InputNumber 
                  min={1} 
                  max={10} 
                  value={maxResults} 
                  onChange={handleMaxResultsChange}
                  disabled={!isSearchEnabled} 
                  addonAfter="个结果"
                  style={{ width: 150 }}
                />
                <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary, marginTop: 4 }}>
                  默认值: 3，推荐范围: 1-5 (数值越大分析越详细但速度越慢)
                </div>
              </Form.Item>
            </Space>
            
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
            1. 选择非"不使用联网搜索"选项后，AI将能够在对话中查询最新信息<br />
            2. 系统会自动判断是否需要联网搜索，如时效性内容、新闻、股票等<br />
            3. 搜索功能使用网页爬取，无需配置任何API密钥<br />
            4. 联网搜索可能会增加响应时间，但能提供更新的信息<br />
            5. 高级配置中可设置最大分析结果数量，优化搜索分析质量<br />
            6. 选择"自定义搜索"时，需要提供搜索URL和搜索参数名（默认为"q"），系统会自动添加搜索参数
          </Paragraph>
        </div>
      </Space>
    </div>
  );
};

export default WebSearchConfig; 