# WebService 模块架构设计

## 整体架构

WebService模块采用面向对象和工厂模式架构，提供网络搜索能力，主要包含以下组件：

1. **抽象基类** - AbstractSearchService
2. **具体实现类** - BingSearchService, GoogleSearchService, BaiduSearchService
3. **工厂类** - SearchFactory
4. **主服务类** - WebService

## 组件职责

### AbstractSearchService

抽象搜索服务基类，定义了搜索服务的通用接口和方法：

- 提供通用的Helper方法(如stripHtmlTags、getUserAgent)
- 定义抽象方法(search、getName、getSearchUrl)为子类提供统一接口
- 管理搜索配置(searchUrl, userAgent)

### BingSearchService / GoogleSearchService / BaiduSearchService

具体搜索引擎实现类，继承AbstractSearchService：

- 实现特定搜索引擎的URL构建逻辑
- 实现HTML解析和结果提取
- 处理搜索引擎特定逻辑(如百度的重定向链接)

### SearchFactory

搜索服务工厂类，负责创建和管理搜索服务实例：

- 提供单例getInstance方法
- 根据搜索引擎类型创建对应服务实例
- 缓存已创建的服务实例，提高性能
- 提供统一接口隐藏具体实现细节

### WebService

主要服务类，提供高级功能和对外接口：

- 判断查询是否需要联网搜索(shouldUseWebSearch)
- 提取查询关键词(extractSearchKeywords)
- 过滤思考内容(removeThinkTags)
- 使用工厂模式创建并使用搜索服务
- 格式化搜索结果(formatSearchResultsForModel)

## 使用方式

```typescript
// 1. 获取WebService实例
const webService = WebService.getInstance();

// 2. 判断是否需要网络搜索
const needSearch = await webService.shouldUseWebSearch(query, aiConfig);

// 3. 提取搜索关键词
const keywords = await webService.extractSearchKeywords(query, aiConfig);

// 4. 执行搜索
const results = await webService.search(keywords, 'bing', {
  searchUrl: customSearchUrl,
  userAgent: customUserAgent
});

// 5. 格式化结果
const formattedResults = webService.formatSearchResultsForModel(results);
```

## 扩展方式

要添加新的搜索引擎支持，按照以下步骤：

1. 创建新的搜索服务类(如ToutiaoSearchService)，继承AbstractSearchService
2. 在SearchEngineType枚举中添加新的类型
3. 在SearchFactory中增加对应的实例创建逻辑
4. 在WebSearchConfig界面中添加新的选项

## 设计原则

- **单一职责原则** - 每个类只负责一个功能
- **开闭原则** - 对扩展开放，对修改封闭
- **依赖倒置原则** - 依赖抽象，而不是具体实现
- **工厂模式** - 封装对象创建逻辑
- **单例模式** - 管理全局服务实例