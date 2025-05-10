/**
 * 班次设置状态管理存储
 * 使用Pinia管理班次设置和数据
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { showToast } from 'vant';

/**
 * 本地存储键
 * 用于在localStorage中保存班次设置
 */
const LOCAL_STORAGE_KEY = 'daoban-shift-data';

/**
 * 班次状态存储
 * 管理班次设置和数据
 */
export const useUserStore = defineStore('user', () => {
  /**
   * 班次设置相关变量
   * 包含起始日期、初始任务ID、任务列表等
   */
  const settings = ref({
    startDate: new Date(),  // 班次起始日期
    initialTaskId: 1,       // 初始任务ID
    tasks: [
      { id: 1, name: '一采', restTime: '3小时', taskClass: 'task-1' },
      { id: 2, name: '二采', restTime: '2小时', taskClass: 'task-2' },
      { id: 3, name: '三采', restTime: '休息', taskClass: 'task-3' },
      { id: 4, name: '一休', restTime: '休息', taskClass: 'task-4' },
      { id: 5, name: '二休', restTime: '休息', taskClass: 'task-5' },
      { id: 6, name: '三休', restTime: '休息', taskClass: 'task-6' }
    ]
  });
  
  /**
   * 从本地存储初始化班次设置
   * 应用启动时调用，恢复上次的设置状态
   */
  function initFromLocalStorage() {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const data = JSON.parse(storedData);
        
        // 恢复日期对象
        if (data.settings && data.settings.startDate) {
          data.settings.startDate = new Date(data.settings.startDate);
        }
        
        // 更新设置
        if (data.settings) {
          settings.value = {
            ...settings.value,
            ...data.settings
          };
        }
      }
    } catch (error) {
      console.error('从本地存储恢复设置状态失败', error);
      showToast('从本地存储恢复设置状态失败');
    }
  }

  /**
   * 保存设置到本地存储
   */
  function saveToLocalStorage() {
    try {
      const dataToSave = {
        settings: settings.value
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('保存设置到本地存储失败', error);
      showToast('保存设置到本地存储失败');
    }
  }

  /**
   * 加载用户数据
   * 从本地存储加载设置数据
   */
  function loadUserData() {
    initFromLocalStorage();
  }
  
  /**
   * 保存用户数据
   * 将设置数据保存到本地存储
   */
  function saveUserData(showSuccess = false) {
    saveToLocalStorage();
    
    if (showSuccess) {
      showToast({
        message: '设置已保存',
        type: 'success'
      });
    }
    
    return true;
  }
  
  /**
   * 更新班次设置
   * @param {Object} newSettings - 新的班次设置
   * @returns {boolean} 更新是否成功
   */
  function updateSettings(newSettings) {
    try {
      // 验证设置
      if (!newSettings) {
        showToast('无效的设置数据');
        return false;
      }
      
      // 确保日期对象格式一致
      if (newSettings.startDate && !(newSettings.startDate instanceof Date)) {
        newSettings.startDate = new Date(newSettings.startDate);
      }
      
      // 更新设置并保存
      settings.value = {
        ...settings.value,
        ...newSettings
      };
      
      saveUserData(true);
      return true;
    } catch (error) {
      console.error('更新设置失败', error);
      showToast({
        message: '更新设置失败',
        type: 'fail'
      });
      return false;
    }
  }
  
  // 初始加载设置
  initFromLocalStorage();
  
  return {
    settings,
    loadUserData,
    saveUserData,
    updateSettings
  };
});
