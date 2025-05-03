# AI 聊天插件（重构版）

## 项目简介
本插件基于 React + TypeScript + Zustand + Vite + TailwindCSS + Ant Design + chat-pro + Ollama 构建，支持本地大模型对话，界面采用左中右三栏结构，极简高效，易于扩展。

## 主要功能
- 左侧菜单栏：一级菜单（会话、设置等）
- 中间会话列表：支持多会话切换与新建
- 右侧聊天对话框：与本地 Ollama 模型流畅对话
- 支持深色/浅色主题切换
- 支持消息建议与快捷输入
- 支持多模型配置与切换

## 目录结构
```
├── src
│   ├── components         # 复用组件（SidebarMenu, SessionList, ChatPanel等）
│   ├── layouts            # 页面布局（MainLayout）
│   ├── pages              # 页面（Chat, Settings, OllamaConfig等）
│   ├── services           # API服务（ollamaApi等）
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
- 详见 `src/store/chatStore.ts` 和 `src/store/uiStore.ts`

## API 服务
- Ollama 本地模型对话与模型列表获取，详见 `src/pages/ollamaApi.ts`

## 使用方法
1. 启动本地 Ollama 服务（默认 http://localhost:11434）
2. 安装依赖并运行插件：
   ```bash
   pnpm install
   pnpm dev
   ```
3. 访问本地页面，体验三栏式 AI 聊天

## 参数与返回值说明
- 详见各组件/服务文件头部注释

## 常见问题与改进建议
- 支持更多模型与多端适配
- 优化消息流与上下文管理
- 增加用户自定义主题与快捷指令

---
如需二次开发或遇到问题，请查阅源码注释或联系开发者。
