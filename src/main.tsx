import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  window.getSettings = () => ({ apiUrl: 'http://localhost:11434' });
  window.saveSettings = (settings) => { console.log('保存设置', settings); };
  window.sendMessageToAI = async (msg) => ({ message: '开发环境模拟回复：' + msg });
}

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
)
