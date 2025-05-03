/**
 * 应用初始化工具
 * 用于集中管理所有配置的初始化
 */

import { useSettingsStore } from '../store/settingsStore';
import { useUIStore } from '../store/uiStore';

// 类型声明
declare global {
  interface Window {
    utools?: any;
  }
}

// 检查是否处于开发模式
export const isDev = () => {
  // 判断utools环境
  if (window.utools) {
    return window.utools.isDev();
  }
  // 判断非utools环境的开发模式
  try {
    // @ts-ignore 处理process环境变量可能不存在的问题
    return typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
  } catch {
    // 如果无法访问process，则检查当前URL
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
};

// 初始化应用配置
export const initApp = () => {
  // 初始化主题
  const initTheme = useUIStore.getState().initTheme;
  initTheme();
  
  // 初始化设置
  const initSettings = useSettingsStore.getState().initSettings;
  initSettings();
  
  console.log('应用初始化完成');
};

// 打印环境信息
export const logEnvironmentInfo = () => {
  const envType = isDev() ? '开发' : '生产';
  const storeType = window.utools ? 'uTools数据库' : '本地存储';
  
  console.log(`当前环境: ${envType}模式`);
  console.log(`主要存储: ${storeType}`);
  
  // 打印全局配置
  console.log('全局配置:', {
    ollama: useSettingsStore.getState().ollama,
    isDarkMode: useUIStore.getState().isDarkMode,
  });
};

// 统一的存储方法，自动选择uTools或localStorage
export const saveData = (key: string, value: any) => {
  try {
    // 同时保存到两个存储位置
    if (window.utools) {
      window.utools.dbStorage.setItem(key, value);
    }
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
};

// 统一的获取数据方法，优先从uTools获取
export const getData = (key: string, defaultValue: any = null) => {
  try {
    // 优先从uTools获取
    if (window.utools) {
      const data = window.utools.dbStorage.getItem(key);
      if (data !== null) return data;
    }
    
    // 从localStorage获取
    const data = localStorage.getItem(key);
    if (data === null) return defaultValue;
    
    // 尝试解析JSON
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    return defaultValue;
  }
};

export default {
  initApp,
  logEnvironmentInfo,
  saveData,
  getData,
  isDev,
}; 