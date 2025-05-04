import React, { useState, useEffect, useRef } from "react";
import { Message, useChatStore } from "../store/chatStore";
import { useSettingsStore, AIServiceType } from "../store/settingsStore";
import { usePromptStore, Prompt } from "../store/promptStore";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Tooltip,
  Space,
  Typography,
  theme,
  Card,
  message,
  Avatar,
  Dropdown,
  Menu,
  Modal,
  Select,
  Badge,
  Tag,
} from "antd";
import {
  RocketOutlined,
  CopyOutlined,
  CheckOutlined,
  UserOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  ApiOutlined,
  MessageOutlined,
  BulbOutlined,
  HighlightOutlined,
} from "@ant-design/icons";
import { Bubble, Sender, Suggestion } from "@ant-design/x";
import { AIServiceManager, AIServiceType as ServiceType, ChatRequest } from "../services";
import { SiliconflowServiceConfig } from "../services/SiliconflowService";

const { Text, Paragraph } = Typography;
const { useToken } = theme;

// 思考内容渲染组件
const ThinkingContent = ({ content }: { content: string }) => {
  const { token } = useToken();

  if (!content) return null;

  return (
    <Card
      size="small"
      style={{
        backgroundColor: token.colorBgLayout,
        borderRadius: token.borderRadiusLG,
        marginBottom: token.marginSM,
      }}
    >
      <div
        style={{
          fontSize: token.fontSizeSM,
          color: token.colorTextSecondary,
          marginBottom: token.marginXS,
          fontWeight: "bold",
        }}
      >
        💭 模型思考过程
      </div>
      <Paragraph
        style={{
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          color: token.colorTextDescription,
          fontSize: token.fontSizeSM,
          margin: 0,
        }}
      >
        {content}
      </Paragraph>
    </Card>
  );
};

// 消息内容渲染组件
const MessageContent = ({ content }: { content: string }) => {
  const { token } = useToken();
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});

  // 复制代码到剪贴板
  const copyToClipboard = (text: string, blockId: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // 设置对应代码块的复制状态为成功
        setCopyStates((prev) => ({ ...prev, [blockId]: true }));
        message.success("复制成功！");

        // 2秒后重置图标状态
        setTimeout(() => {
          setCopyStates((prev) => ({ ...prev, [blockId]: false }));
        }, 2000);
      })
      .catch(() => {
        message.error("复制失败，请手动复制");
      });
  };

  // 简单处理Markdown样式
  const formatMarkdown = (text: string) => {
    let codeBlockCounter = 0;

    // 处理代码块
    let formattedText = text.replace(
      /```([\w]*)\n?([\s\S]*?)```/g,
      (match, lang, code) => {
        const blockId = `code-block-${codeBlockCounter++}`;
        const copyIcon = copyStates[blockId]
          ? `<span style="color: ${token.colorSuccess};"><svg viewBox="64 64 896 896" focusable="false" data-icon="check" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"></path></svg></span>`
          : `<span style="color: ${token.colorTextSecondary};"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></span>`;

        // 获取语言标识（如果有）
        const language = lang ? lang.trim() : "";
        const languageLabel = language
          ? `<div style="position: absolute; top: 4px; left: 6px;font-size: 12px; color: ${token.colorTextSecondary}; font-family: ${token.fontFamily};">${language}</div>`
          : "";

        return `
        <div style="position: relative; background-color: ${
          token.colorBgLayout
        }; padding: 4px 6px; border-radius: ${
          token.borderRadiusSM
        }px; margin: ${token.marginXS}px 0; border: 1px solid ${
          token.colorBorderSecondary
        }; overflow: hidden;">
          ${languageLabel}<div class="copy-btn" data-code="${encodeURIComponent(
          code
        )}" data-id="${blockId}" style="position: absolute; top: 4px; right: 6px; cursor: pointer; z-index: 1;">${copyIcon}</div><pre style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: ${
          token.fontSizeSM
        }px; line-height: 1.4; white-space: pre-wrap; margin-top: 24px; padding: 0; overflow-x: auto;">${code.trim()}</pre>
        </div>
      `;
      }
    );

    // 处理行内代码
    formattedText = formattedText.replace(/`([^`]+)`/g, (match, code) => {
      return `<code style="background-color: ${token.colorBgLayout}; padding: 2px 4px; border-radius: ${token.borderRadiusSM}px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: ${token.fontSizeSM}px;">${code}</code>`;
    });

    // 处理标题
    formattedText = formattedText.replace(
      /^#{1,6}\s+(.*?)$/gm,
      (match, title) => {
        const level = match.trim().indexOf(" ");
        const fontSize = Math.max(
          token.fontSizeLG - (level - 1) * 2,
          token.fontSize
        );
        return `<div style="font-weight: bold; font-size: ${fontSize}px; margin: ${token.marginSM}px 0;">${title}</div>`;
      }
    );

    // 处理列表
    formattedText = formattedText.replace(/^[*-]\s+(.*?)$/gm, (match, item) => {
      return `<div style="display: flex; margin: ${token.marginXS}px 0;">• <div style="margin-left: ${token.marginXS}px;">${item}</div></div>`;
    });

    // 处理链接
    formattedText = formattedText.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, text, url) => {
        return `<a href="${url}" target="_blank" style="color: ${token.colorPrimary}; text-decoration: none;">${text}</a>`;
      }
    );

    // 处理粗体
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
      return `<b>${text}</b>`;
    });

    // 处理斜体
    formattedText = formattedText.replace(/\*([^*]+)\*/g, (match, text) => {
      return `<i>${text}</i>`;
    });

    // 处理换行 (保持换行)
    formattedText = formattedText.replace(/\n\n+/g, "<br/><br/>"); // 两个以上连续换行符替换为两个<br/>
    formattedText = formattedText.replace(/\n/g, "<br/>"); // 单个换行符替换为空格，让文本自然换行

    return formattedText;
  };

  // 添加点击事件处理复制功能
  useEffect(() => {
    const handleCopyClick = (e: MouseEvent) => {
      // 寻找最近的copy-btn元素
      const target = e.target as HTMLElement;
      const copyBtn = target.closest(".copy-btn") as HTMLElement;

      if (copyBtn) {
        e.stopPropagation();
        e.preventDefault();

        // 防止多次触发
        if ((copyBtn as any)._processing) return;
        (copyBtn as any)._processing = true;

        const code = decodeURIComponent(
          copyBtn.getAttribute("data-code") || ""
        );
        const blockId = copyBtn.getAttribute("data-id") || "";
        copyToClipboard(code, blockId);

        // 一段时间后清除处理标记
        setTimeout(() => {
          (copyBtn as any)._processing = false;
        }, 300);
      }
    };

    document.addEventListener("click", handleCopyClick);

    return () => {
      document.removeEventListener("click", handleCopyClick);
    };
  }, []);

  // 使用 dangerouslySetInnerHTML 显示格式化后的内容
  return (
    <div
      style={{
        fontSize: token.fontSize,
        lineHeight: 1.6,
        color: token.colorText,
        wordBreak: "break-word",
      }}
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};

// 格式化时间显示
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// 自定义消息气泡组件
interface ChatBubbleProps {
  content: React.ReactNode;
  isUser: boolean;
  time: string;
  message: Message;
  onCopy: (content: string) => void;
  onDelete: (messageId: string) => void;
  onReask: (content: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  content, 
  isUser, 
  time, 
  message, 
  onCopy, 
  onDelete, 
  onReask 
}) => {
  const { token } = theme.useToken();
  const [menuVisible, setMenuVisible] = useState(false);
  
  // 右键菜单项
  const menuItems = [
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制消息',
      onClick: () => {
        onCopy(message.content);
        setMenuVisible(false);
      },
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除消息',
      danger: true,
      onClick: () => {
        onDelete(message.id);
        setMenuVisible(false);
      },
    }
  ];
  
  // 仅对用户消息添加"重新提问"选项
  if (isUser) {
    menuItems.push({
      key: 'reask',
      icon: <ReloadOutlined />,
      label: '重新提问',
      onClick: () => {
        onReask(message.content);
        setMenuVisible(false);
      },
    });
  }

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuVisible(true);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        marginBottom: 16,
        position: "relative",
      }}
    >
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          backgroundColor: isUser ? token.colorPrimary : "#14ae5c",
          flexShrink: 0,
          margin: isUser ? "0 0 0 12px" : "0 12px 0 0",
        }}
      />
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['contextMenu']}
        open={menuVisible}
        onOpenChange={setMenuVisible}
      >
        <div 
          style={{ maxWidth: "80%", position: "relative" }}
          onContextMenu={handleContextMenu}
        >
          <div
            style={{
              fontSize: 12,
              color: token.colorTextSecondary,
              textAlign: isUser ? "right" : "left",
              padding: "0 12px",
              marginBottom: 4,
            }}
          >
            {time}
          </div>
          <div className="message-bubble-wrapper">
            <Bubble content={content} placement={isUser ? "end" : "start"} />
            <Button
              type="text"
              size="small"
              icon={<EllipsisOutlined />}
              style={{
                position: "absolute",
                right: isUser ? 5 : "auto",
                left: isUser ? "auto" : 5,
                top: 28, // 调整位置，避免遮挡时间
                opacity: 0,
                transition: "opacity 0.3s",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setMenuVisible(true);
              }}
              className="message-action-btn"
            />
          </div>
        </div>
      </Dropdown>
    </div>
  );
};

const ChatPanel: React.FC = () => {
  const { sessions, currentSessionId, addMessage, deleteMessage } = useChatStore();
  const { ollama, siliconflow, serviceType, setOllama, setSiliconflow } = useSettingsStore();
  const { prompts, globalPrompt, useGlobalPrompt, toggleGlobalPrompt } = usePromptStore();
  const session = sessions.find((s) => s.id === currentSessionId);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [thinkingContent, setThinkingContent] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [promptListVisible, setPromptListVisible] = useState(false); // 提示词列表弹窗可见性
  const navigate = useNavigate();
  const { token } = useToken();
  const bubbleListRef = useRef<HTMLDivElement>(null);
  
  // 获取当前选择的配置
  const currentConfig = serviceType === 'ollama' ? ollama : siliconflow;
  
  // 获取当前服务类型对应的模型列表
  const [modelList, setModelList] = useState<string[]>([]);
  
  // 加载模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        // 获取AI服务管理器实例
        const serviceManager = AIServiceManager.getInstance();
        const apiServiceType = serviceType === 'ollama' ? ServiceType.OLLAMA : ServiceType.SILICONFLOW;
        
        // 使用当前配置创建服务实例
        const service = serviceManager.getService(
          apiServiceType,
          serviceType === 'ollama' 
            ? { baseUrl: ollama.baseUrl, model: ollama.model } 
            : { baseUrl: siliconflow.baseUrl, model: siliconflow.model, token: siliconflow.token } as SiliconflowServiceConfig
        );
        
        // 获取模型列表
        const models = await service.getModels();
        setModelList(models);
      } catch (error) {
        console.error('获取模型列表失败:', error);
      }
    };
    
    if ((serviceType === 'ollama' && ollama.baseUrl) || 
        (serviceType === 'siliconflow' && siliconflow.token)) {
      fetchModels();
    }
  }, [serviceType, ollama.baseUrl, siliconflow.token]);
  
  // 获取AI服务管理器实例
  const serviceManager = AIServiceManager.getInstance();

  // 注入全局样式
  useEffect(() => {
    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
      .message-action-btn {
        opacity: 0;
        z-index: 10;
      }
      .message-bubble-wrapper:hover .message-action-btn {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    // 清理函数
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (bubbleListRef.current) {
      setTimeout(() => {
        if (bubbleListRef.current) {
          bubbleListRef.current.scrollTop = bubbleListRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [session?.messages, streamingContent, thinkingContent]);

  // 处理模型选择变化
  const handleModelChange = (selectedModel: string) => {
    if (serviceType === 'ollama') {
      setOllama({ ...ollama, model: selectedModel });
    } else {
      setSiliconflow({ ...siliconflow, model: selectedModel });
    }
    
    // 显示提示
    message.success(`已切换到模型: ${selectedModel}`);
  };

  // 获取服务名称显示
  const getServiceName = () => {
    switch (serviceType) {
      case 'ollama': return 'Ollama';
      case 'siliconflow': return '硅基流动';
      case 'openai': return 'OpenAI';
      case 'api2d': return 'API2D';
      case 'azure': return 'Azure';
      default: return serviceType;
    }
  };

  // 没有选择大模型时，显示提示
  if (!currentConfig.model) {
    return (
      <div
          style={{
          padding: token.paddingLG,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: token.marginMD,
        }}
      >
        <Text style={{ fontSize: token.fontSizeLG }}>
          请先选择大模型，否则无法进行对话
        </Text>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate("/settings/model")}
        >
          去选择大模型
        </Button>
      </div>
    );
  }

  // 快速插入提示词
  const handleInsertPrompt = (content: string) => {
    setInputValue((prev) => (prev ? prev + "\n" : "") + content);
    setPromptListVisible(false); // 选择后关闭弹窗
  };

  // 处理停止生成
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      message.info("已停止生成");
    }
  };

  // 处理发送消息
  const handleSendMessage = async (value: string) => {
    if (!value.trim() || !currentConfig.model || !session) return;
    
    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: value.trim(),
      role: "user",
      createAt: Date.now(),
      updateAt: Date.now(),
    };
    
    // 清空输入框并加入消息
    setInputValue("");
    addMessage(session.id, userMessage);
    
    // 自动滚动到底部
    if (bubbleListRef.current) {
      bubbleListRef.current.scrollTop = bubbleListRef.current.scrollHeight;
    }
    
    // 标记为生成中，设置状态并创建中止控制器
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    
    // 准备流式消息ID
    const streamId = `stream-${Date.now()}`;
    let lastContent = "";
    let finalThinkingContent = "";
    
    try {
      // 获取AI服务实例
      // 获取当前服务类型
      const apiServiceType = serviceType === 'ollama' ? ServiceType.OLLAMA : ServiceType.SILICONFLOW;
       
      // 获取对应的AI服务
      const aiService = serviceManager.getService(
        apiServiceType, 
        serviceType === 'ollama'
          ? { baseUrl: ollama.baseUrl, model: ollama.model }
          : { baseUrl: siliconflow.baseUrl, model: siliconflow.model, token: siliconflow.token } as SiliconflowServiceConfig
      );
      
      // 准备聊天历史消息
      const historyMessages = [...(session.messages || [])];
      
      // 如果启用了全局提词，添加到消息历史开头
      const messages = [];
      if (useGlobalPrompt && globalPrompt.trim()) {
        messages.push({
          role: "system",
          content: globalPrompt.trim()
        });
      }
      
      // 添加聊天历史
      messages.push(
        ...historyMessages
          .filter(m => !m.id.startsWith("thinking-")) // 过滤掉思考消息
          .map(m => ({
            role: m.role,
            content: m.content,
          }))
      );
      
      // 添加当前用户消息
      messages.push({
        role: userMessage.role,
        content: userMessage.content
      });
      
      // 开始流式响应
      setStreamingContent("");

      // 创建聊天请求
      const chatRequest: ChatRequest = {
        messages,
        signal: abortControllerRef.current.signal,
        onStream: (text) => {
          lastContent = text;
          setStreamingContent(text);
        },
        onThinking: (text) => {
          finalThinkingContent = text; // 记录最终的思考内容
          setThinkingContent(text);
        }
      };

      // 发送请求并获取回复
      await aiService.chat(chatRequest);

      // 流式回复结束，保存最终回复
          const msg: Message = {
            id: streamId,
            content: lastContent,
        role: "assistant",
        createAt: Date.now(),
        updateAt: Date.now(),
      };

      // 如果有思考内容，保存到会话中
      if (finalThinkingContent) {
        const thinkingMsg: Message = {
          id: `thinking-${Date.now()}`,
          content: finalThinkingContent,
          role: "assistant",
          createAt: Date.now(),
          updateAt: Date.now(),
        };
        addMessage(session.id, thinkingMsg);
      }

      addMessage(session.id, msg);
    } catch (error) {
      // 检查是否是用户主动取消的请求
      if ((error as any)?.name !== 'AbortError') {
        console.error("发送消息失败", error);
        
        // 添加错误提示消息到对话
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          content: "⚠️ **接口错误**：无法连接到大模型服务，请检查网络连接和大模型服务状态。\n\n可能的原因：\n- 大模型服务未启动\n- API地址配置错误\n- 网络连接问题\n- 所选模型不存在\n\n请前往设置页面检查配置，或重启大模型服务后重试。",
          role: "assistant",
          createAt: Date.now(),
          updateAt: Date.now(),
        };
        addMessage(session.id, errorMsg);
      }
    } finally {
      // 重置所有临时内容和状态
      setStreamingContent(null);
      setThinkingContent(null); // 清除思考内容，避免重复显示
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // 准备聊天数据，处理思考和流式消息
  const chatMessages = [...(session?.messages || [])];

  // 添加当前思考消息（如果有且正在流式响应时）
  if (thinkingContent && streamingContent !== null) {
    chatMessages.push({
      id: "thinking-current",
      content: thinkingContent,
      role: "assistant",
      createAt: Date.now(),
      updateAt: Date.now(),
    });
  }

  // 添加流式响应（如果有）
  if (streamingContent) {
    chatMessages.push({
      id: "stream",
      content: streamingContent,
      role: "assistant",
            createAt: Date.now(),
            updateAt: Date.now(),
    });
  }

  // 检查消息是否是思考内容
  const isThinkingMessage = (message: Message) => {
    return message.id.startsWith("thinking-");
  };

  // 处理快捷指令选择
  const handleSuggestionSelect = (value: string) => {
    setInputValue((prev) => prev + value);
  };

  // 自定义消息渲染
  const renderMessageContent = (content: string) => {
    return <MessageContent content={content} />;
  };

  // 处理复制消息
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        message.success("消息已复制到剪贴板");
      })
      .catch(() => {
        message.error("复制失败，请手动复制");
      });
  };

  // 处理删除消息
  const handleDeleteMessage = (messageId: string) => {
    if (!session) return;
    
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这条消息吗？",
      okText: "确定",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteMessage(session.id, messageId);
        message.success("消息已删除");
      },
    });
  };

  // 处理重新提问
  const handleReaskMessage = (content: string) => {
    if (isGenerating) {
      message.info("正在生成回复，请等待当前回复完成");
      return;
    }
    setInputValue(content);
    // 聚焦输入框
    const inputElement = document.querySelector('.ant-sender textarea') as HTMLTextAreaElement;
    if (inputElement) {
      inputElement.focus();
      // 自动滚动到底部
      if (bubbleListRef.current) {
        bubbleListRef.current.scrollTop = bubbleListRef.current.scrollHeight;
      }
    }
  };

  // 渲染提示词弹窗
  const renderPromptListModal = () => {
    return (
      <Modal
        title="选择提示词"
        open={promptListVisible}
        onCancel={() => setPromptListVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ 
          maxHeight: '60vh', 
          overflowY: 'auto',
          padding: token.paddingSM 
        }}>
          <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
            {prompts.map(prompt => (
              <Card 
                key={prompt.id} 
                size="small" 
                hoverable
                title={prompt.title}
                style={{ marginBottom: token.marginXS }}
                extra={
                  <Button 
                    type="primary" 
                    size="small" 
                    onClick={() => handleInsertPrompt(prompt.content)}
                  >
                    插入
                  </Button>
                }
              >
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                  style={{ 
                    color: token.colorTextSecondary,
                    marginBottom: 0,
                    fontSize: token.fontSizeSM
                  }}
                >
                  {prompt.content}
                </Paragraph>
              </Card>
            ))}
          </Space>
        </div>
      </Modal>
    );
  };

  return (
    <div className="chat-panel" style={{ position: "relative", height: "100%" }}>
      {/* 提示词列表弹窗 */}
      {renderPromptListModal()}
      
      {/* 顶部模型选择区域 */}
      <div style={{ 
        padding: `${token.paddingSM}px ${token.paddingMD}px`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
          <Badge 
            status="processing" 
            color={serviceType === 'ollama' ? '#52c41a' : '#1677ff'} 
          />
          <Text style={{ fontSize: token.fontSizeSM }}>
            {getServiceName()}
          </Text>
        </div>
        
        <Select
          value={currentConfig.model}
          onChange={handleModelChange}
          options={modelList.map(m => ({ label: m, value: m }))}
          placeholder="选择模型"
          size="small"
          variant="filled"
          loading={modelList.length === 0}
          disabled={isGenerating}
          showSearch
          filterOption={(input, option) => 
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          optionFilterProp="label"
        />
      </div>
      
      <div
        ref={bubbleListRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px 24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {chatMessages.map((msg) => {
            const isThinking = isThinkingMessage(msg);

            // 思考内容特殊处理
            if (isThinking) {
              return (
                <div key={msg.id} style={{ margin: "8px 0" }}>
                  <ThinkingContent content={msg.content} />
                </div>
              );
            }

            // 普通消息
            const isUser = msg.role === "user";
            return (
              <ChatBubble
                key={msg.id}
                content={renderMessageContent(msg.content)}
                isUser={isUser}
                time={formatTime(msg.createAt)}
                message={msg}
                onCopy={handleCopyMessage}
                onDelete={handleDeleteMessage}
                onReask={handleReaskMessage}
              />
            );
          })}
        </div>
      </div>
      
      {/* 底部操作区域 */}
      <div
        style={{
          padding: `${token.paddingMD}px`,
          backgroundColor: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          position: "sticky",
          bottom: 0,
          // width: "100%",
          zIndex: 10,
        }}
      >
        {/* 提示词按钮区域 */}
        {prompts.length > 0 && (
          <div
            style={{
              marginBottom: token.marginSM,
              padding: `${token.paddingXS}px 0`,
            }}
          >
            <Space align="center">
              <Tooltip title="点击按钮插入常用提示词">
                <Space size={4}>
                  <RocketOutlined
                    style={{ fontSize: 16, color: token.colorPrimary }}
                  />
                  <Text type="secondary">提示词:</Text>
                </Space>
              </Tooltip>

              <Space wrap size={[8, 8]} style={{ flexWrap: "wrap" }}>
                {prompts.slice(0, 5).map((prompt) => (
                  <Button
                    key={prompt.id}
                    size="small"
                    type="default"
                    onClick={() => handleInsertPrompt(prompt.content)}
                  >
                    {prompt.title}
                  </Button>
                ))}

                {prompts.length > 5 && (
                  <Button
                    size="small"
                    type="text"
                    onClick={() => setPromptListVisible(true)}
                    icon={<EllipsisOutlined />}
                  >
                    更多
                  </Button>
                )}
              </Space>
            </Space>
          </div>
        )}

        {/* 操作图标区域 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          alignItems: 'center',
          marginBottom: token.marginXS
        }}>
          {/* 全局提词开关按钮 */}
          <Tooltip title={useGlobalPrompt ? "已启用全局提词" : "点击启用全局提词"}>
            <Tag
              icon={<BulbOutlined />}
              color={useGlobalPrompt ? "processing" : "default"}
              style={{ 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: token.borderRadiusSM,
                marginRight: 0
              }}
              onClick={toggleGlobalPrompt}
            />
          </Tooltip>
          
          {/* 这里可以添加其他操作图标按钮 */}
        </div>
        
        {/* 输入框区域 */}
        <div style={{ position: "relative" }}>
          <Sender
            value={inputValue}
            onChange={setInputValue}
            onSubmit={isGenerating ? handleStopGeneration : handleSendMessage}
            placeholder="输入消息，或点击上方提示词快速插入"
            disabled={!currentConfig.model}
            style={{ 
              paddingRight: "16px",
              minHeight: "60px"
            }}
            actions={(_, info) => {
              const { SendButton, LoadingButton } = info.components;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isGenerating ? (
                    <LoadingButton 
                      type="primary" 
                      onClick={handleStopGeneration}
                      style={{ backgroundColor: token.colorError }}
                    />
                  ) : (
                    <SendButton 
                      type="primary" 
                      disabled={!inputValue.trim() || !currentConfig.model} 
                    />
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
