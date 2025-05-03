import { create } from 'zustand';
import { saveData, getData } from '../../utils/init';

interface UIState {
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  initTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  
  setDarkMode: (isDark: boolean) => {
    set({ isDarkMode: isDark });
    
    // 保存主题设置
    saveData('ui-theme-mode', isDark ? 'dark' : 'light');
    
    // 设置HTML标签属性以便应用全局CSS样式
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  },
  
  initTheme: () => {
    // 使用统一的数据获取函数
    const savedTheme = getData('ui-theme-mode', '');
    
    // 设置初始主题
    let isDark = false;
    
    // 优先使用保存的设置
    if (savedTheme === 'dark') {
      isDark = true;
    } else if (savedTheme === 'light') {
      isDark = false;
    } else {
      // 如果没有保存的设置，则检测系统主题
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // 更新状态并设置HTML属性
    set({ isDarkMode: isDark });
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    console.log('初始化主题:', isDark ? '深色' : '明亮');
  }
})); 