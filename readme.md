# AI 聊天插件（重构版）

## 项目简介
本插件基于 React + TypeScript + Zustand + Vite + TailwindCSS + Ant Design + @ant-design/x + Ollama 构建，支持本地大模型对话，界面采用左中右三栏结构，极简高效，易于扩展。

## 主要功能
- 左侧菜单栏：一级菜单（会话、设置等）
- 中间会话列表：支持多会话切换与新建
- 右侧聊天对话框：与本地 Ollama 模型流畅对话
- 支持深色/浅色主题切换
- 支持消息建议与快捷输入
- 支持多模型配置与切换
- 支持右键菜单操作消息（复制、删除、重新提问）
- 支持查看模型思考过程
- 支持自定义提示词和快速插入

## 目录结构
```
├── src
│   ├── components         # 复用组件（SidebarMenu, SessionList, ChatPanel等）
│   ├── layouts            # 页面布局（MainLayout）
│   ├── pages              # 页面（Chat, Settings, OllamaConfig等）
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
- **OllamaService**：Ollama服务实现
- **AIServiceManager**：服务管理器，负责创建、缓存和管理服务实例

通过这种设计，可以轻松添加新的AI服务提供商，如OpenAI、Azure等，只需实现AIService接口即可。

## 使用方法
1. 启动本地 Ollama 服务（默认 http://localhost:11434）
2. 安装依赖并运行插件：
   ```bash
   pnpm install
   pnpm dev
   ```
3. 访问本地页面，体验三栏式 AI 聊天

## 扩展新的AI服务
要添加新的AI服务，只需：

1. 创建新的服务类实现AIService接口
2. 在AIServiceManager中注册新服务类型
3. 在设置界面添加相应配置选项

## 常见问题与改进建议
- 支持更多模型与多端适配
- 优化消息流与上下文管理
- 增加用户自定义主题与快捷指令

---
如需二次开发或遇到问题，请查阅源码注释或联系开发者。
