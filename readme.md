# AI 聊天插件（重构版）

## 项目简介
本插件基于 React + TypeScript + Zustand + Vite + TailwindCSS + Ant Design + @ant-design/x 构建，支持本地大模型对话和云端AI服务，界面采用左中右三栏结构，极简高效，易于扩展。

## 主要功能
- 左侧菜单栏：一级菜单（会话、设置等）
- 中间会话列表：支持多会话切换与新建
- 右侧聊天对话框：与本地或云端AI模型流畅对话
- 支持多种AI服务：
  - Ollama（本地模型）
  - 硅基流动（云端API服务，支持思考过程展示）
  - 更多服务持续添加中...
- 支持深色/浅色主题切换
- 支持消息建议与快捷输入
- 支持多模型配置与切换
- 支持右键菜单操作消息（复制、删除、重新提问）
- 支持查看模型思考过程
- 支持自定义提示词和快速插入
- 支持模型搜索过滤，快速找到所需模型

## 目录结构
```
├── src
│   ├── components         # 复用组件（SidebarMenu, SessionList, ChatPanel等）
│   ├── layouts            # 页面布局（MainLayout）
│   ├── pages              # 页面（Chat, Settings, OllamaConfig, SiliconflowConfig等）
│   ├── services           # AI服务架构（抽象服务、具体实现和管理器）
│   ├── store              # Zustand状态管理
│   ├── utils              # 工具函数
│   ├── assets             # 静态资源
│   └── index.css          # 全局样式
├── files                  # 设计稿/截图
├── public                 # 静态文件
├── readme.md              # 项目说明
```

## 组件说明
- **SidebarMenu**：左侧一级菜单，切换会话/设置
- **SessionList**：中间会话列表，支持多会话与切换
- **ChatPanel**：右侧聊天窗口，支持消息流与建议
- **MainLayout**：三栏布局容器

## 状态管理
- 使用 Zustand 统一管理会话、消息、主题等全局状态
- 详见 `src/store/chatStore.ts` 和 `src/store/settingsStore.ts`

## 服务架构
项目采用抽象服务架构，方便扩展不同的AI模型服务：

- **AIService**：抽象基类，定义了所有AI服务的通用接口
- **OllamaService**：Ollama本地模型服务实现
- **SiliconflowService**：硅基流动云端API服务实现，支持流式响应和思考过程
- **AIServiceManager**：服务管理器，负责创建、缓存和管理服务实例

通过这种设计，可以轻松添加新的AI服务提供商，如OpenAI、Azure等，只需实现AIService接口即可。

## 使用方法

### 使用Ollama本地模型
1. 启动本地 Ollama 服务（默认 http://localhost:11434）
2. 在设置中选择"Ollama (本地模型)"服务类型
3. 填写Ollama服务地址并选择要使用的模型

### 使用硅基流动API
1. 在设置中选择"硅基流动 API"服务类型
2. 填写API Token（从[硅基流动平台](https://siliconflow.cn)获取）
3. 点击"获取模型列表"按钮，然后选择要使用的模型
4. 保存配置并开始聊天

#### 硅基流动特色功能
- **思考过程可视化**：支持查看模型的思考过程，适用于需要推理透明度的场景
- **流式响应**：支持流式输出，提供更流畅的交互体验
- **多种模型**：支持硅基流动平台提供的所有模型，包括开源和自研模型
- **Token验证**：使用API Token进行身份验证和访问控制

### 启动应用
```bash
pnpm install
pnpm dev
```

## 扩展新的AI服务
要添加新的AI服务，只需：

1. 创建新的服务类实现AIService接口（参考`OllamaService.ts`或`SiliconflowService.ts`）
2. 在AIServiceManager中注册新服务类型
3. 在设置界面添加相应配置选项

例如，添加OpenAI服务的步骤：
```typescript
// 1. 创建OpenAIService.ts
export class OpenAIService extends AIService {
  // 实现所需方法
}

// 2. 在AIServiceManager.ts中注册
export enum AIServiceType {
  OLLAMA = 'ollama',
  SILICONFLOW = 'siliconflow',
  OPENAI = 'openai'
}

// 3. 添加OpenAIConfig.tsx页面
```

## 常见问题与改进建议
- 支持更多模型与多端适配
- 优化消息流与上下文管理
- 增加用户自定义主题与快捷指令

## 构建说明

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
# 构建Web应用
npm run build

# 构建U-Tools插件
npm run build:plugin

# 构建UPX安装包
npm run build:upx  # 需要安装utools-pkg-builder
```

### 构建配置说明

该项目使用Vite进行构建，经过优化的配置包括：

1. 资源分类存放 - 按照文件类型（JS、CSS、图片、字体等）进行归类处理
2. 依赖优化 - 将node_modules模块打包为单独的vendor文件，减少打包体积
3. U-Tools插件支持 - 确保`plugin.json`、`preload.js`和`logo.png`复制到dist目录

### 插件结构

- `plugin.json` - U-Tools插件配置文件，定义了插件基本信息和功能入口
- `preload.js` - 预加载脚本，处理与系统的交互
- `logo.png` - 插件图标
- `dist/` - 构建输出目录，包含所有Web资源和插件文件

---
如需二次开发或遇到问题，请查阅源码注释或联系开发者。
