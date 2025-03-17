/**
 * 用户状态管理存储
 * 使用Pinia管理用户认证、个人设置和数据
 */
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import apiService from '../services/api';
import { showToast } from 'vant';
import { debounce } from 'lodash';

/**
 * 本地存储键
 * 用于在localStorage中保存用户状态
 */
const LOCAL_STORAGE_KEY = 'daoban-user-data';

/**
 * 用户状态存储
 * 管理用户认证状态、个人设置和数据
 */
export const useUserStore = defineStore('user', () => {
  /**
   * 用户认证状态相关变量
   */
  const username = ref('');     // 用户名
  const isLoggedIn = ref(false); // 是否已登录
  
  /**
   * 班次设置相关变量
   * 包含起始日期、初始任务ID、任务列表等
   */
  const settings = ref({
    startDate: new Date(),  // 班次起始日期
    initialTaskId: 1,       // 初始任务ID
    tasks: [
      { id: 1, name: '一采', restTime: '3小时', sleepTime: '23:00', taskClass: 'task-1' },
      { id: 2, name: '二采', restTime: '2小时', sleepTime: '02:00', taskClass: 'task-2' },
      { id: 3, name: '三采', restTime: '休息', sleepTime: '21:00', taskClass: 'task-3' },
      { id: 4, name: '一休', restTime: '休息', sleepTime: '21:00', taskClass: 'task-4' },
      { id: 5, name: '二休', restTime: '休息', sleepTime: '02:00', taskClass: 'task-5' },
      { id: 6, name: '三休', restTime: '休息', sleepTime: '23:00', taskClass: 'task-6' }
    ]
  });
  
  /**
   * 工资设置
   * 默认的全局工资设置
   */
  const salarySettings = ref({
    baseSalary: 5000,   // 底薪
    performance: 800,   // 绩效
    seniority: 500,     // 工龄
    insurance: 600,     // 保险
    education: 0,       // 学历补贴
  });
  
  /**
   * 月度工资设置
   * 特定月份的专属工资设置，键格式为 YYYY-MM
   */
  const monthlySalarySettings = ref([]);
  
  /**
   * 标记的日期
   * 记录请假、加班等特殊标记，键格式为 YYYY-MM-DD
   */
  const markedDates = ref({});
  
  /**
   * 计算属性 - 是否已认证
   * 同时满足已登录且有用户名时为true
   */
  const isAuthenticated = computed(() => isLoggedIn.value && username.value);
  
  /**
   * 从本地存储初始化用户状态
   * 应用启动时调用，恢复上次的登录状态
   */
  function initFromLocalStorage() {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const data = JSON.parse(storedData);
        username.value = data.username || '';
        isLoggedIn.value = data.isLoggedIn || false;

        // 如果有登录信息，尝试加载用户数据
        if (isLoggedIn.value && username.value) {
          loadUserData();
        }
      }
    } catch (error) {
      showToast('从本地存储恢复用户状态失败');
    }
  }

  /**
   * 保存用户状态到本地存储
   * 登录状态变化时调用，保存最新状态
   */
  function saveToLocalStorage() {
    try {
      const dataToSave = {
        username: username.value,
        isLoggedIn: isLoggedIn.value
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      showToast('保存用户状态到本地存储失败');
    }
  }

  /**
   * 监听登录状态变化，保存到本地存储
   * 使用Vue的watch API监听状态变化
   */
  watch([isLoggedIn, username], () => {
    saveToLocalStorage();
  });
  
  /**
   * 用户登录
   * 向后端发送登录请求并更新本地状态
   * @param {Object} userData - 用户登录信息（用户名和密码）
   * @returns {Promise} 登录结果
   */
  async function login(userData) {
    const response = await apiService.auth.login(userData);
    isLoggedIn.value = true;
    username.value = userData.username;
    return response;
  }
  
  /**
   * 用户注册
   * 向后端发送注册请求
   * @param {Object} userData - 用户注册信息（用户名、密码等）
   * @returns {Promise} 注册结果
   */
  async function register(userData) {
    return apiService.auth.register(userData);
  }
  
  /**
   * 用户登出
   * 向后端发送登出请求并重置本地状态
   */
  async function logout() {
    try {
      await apiService.auth.logout();
      reset();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      showToast('已退出登录');
    } catch (error) {
      // 即使API调用失败，也应该重置状态
      reset();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
  
  /**
   * 重置用户状态
   * 清空所有用户相关数据
   */
  function reset() {
    isLoggedIn.value = false;
    username.value = '';
  }
  
  /**
   * 从后端加载用户数据
   * 获取用户的设置、标记的日期等数据
   * @param {number} retryCount - 重试次数，默认为0
   * @returns {Promise} 用户数据
   */
  async function loadUserData(retryCount = 0) {
    if (!isLoggedIn.value || !username.value) {
      return Promise.reject(new Error('未登录状态'));
    }

    try {
      const response = await apiService.user.getData(username.value);
      const data = response.data;
      
      // 更新数据
      if (data.settings) {
        // 合并设置，但保留任务配置
        settings.value = {
          ...settings.value,
          startDate: new Date(data.settings.startDate),
          initialTaskId: data.settings.initialTaskId
        };
      }
      
      if (data.salarySettings) {
        salarySettings.value = data.salarySettings;
      }
      
      if (data.markedDates) {
        markedDates.value = data.markedDates;
      }
      
      if (data.monthlySalarySettings) {
        monthlySalarySettings.value = data.monthlySalarySettings || [];
      }
      
      // 更新startDate为日期对象
      if (settings.value.startDate && !(settings.value.startDate instanceof Date)) {
        settings.value.startDate = new Date(settings.value.startDate);
      }
      
      return Promise.resolve(data);
    } catch (error) {
      // 如果是网络错误并且重试次数小于3，尝试重试
      if (error.code === 'ERR_NETWORK' && retryCount < 3) {
        // 延迟重试，避免立即请求
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return loadUserData(retryCount + 1);
      }
      
      // 显示错误提示
      let errorMsg = '加载数据失败';
      if (error.response && error.response.status === 404) {
        errorMsg = '用户数据不存在';
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = '网络连接失败，请检查网络';
      }
      
      showToast({
        type: 'fail',
        message: errorMsg
      });
      return Promise.reject(error);
    }
  }
  
  /**
   * 使用debounce包装保存用户数据函数
   * 避免频繁请求，提高性能和用户体验
   */
  const debouncedSaveUserData = debounce(async () => {
    if (!isLoggedIn.value || !username.value) {
      return;
    }

    try {
      // 准备要保存的数据 - 只保存关键数据，避免不必要的数据传输
      const dataToSave = {
        settings: {
          startDate: settings.value.startDate,
          initialTaskId: settings.value.initialTaskId,
          tasks: settings.value.tasks
        },
        salarySettings: salarySettings.value,
        markedDates: markedDates.value,
        monthlySalarySettings: monthlySalarySettings.value
      };

      console.log('Saving user data:', dataToSave)
      await apiService.user.saveData(username.value, dataToSave);
      
      // 静默保存，不显示成功提示
      // 只有失败时才显示提示
    } catch (error) {
      showToast({
        type: 'fail',
        message: '保存失败，请重试'
      });
    }
  }, 1000); // 延迟1秒执行，期间如有多次调用，只执行最后一次

  /**
   * 保存用户数据到后端
   * 将本地状态同步到服务器
   * @param {boolean} showSuccess - 是否显示成功提示，默认为false
   */
  async function saveUserData(showSuccess = false) {
    await debouncedSaveUserData();
    
    // 如果需要显示成功提示，手动添加
    if (showSuccess) {
      showToast({
        type: 'success',
        message: '保存成功'
      });
    }
  }
  
  /**
   * 更新用户设置
   * 更新班次和任务相关设置
   * @param {Object} newSettings - 新的设置
   * @returns {boolean} 是否更新成功
   */
  function updateSettings(newSettings) {
    if (!newSettings) return false;
    
    try {
      // 更新设置
      settings.value = {
        ...settings.value,
        ...newSettings
      };
      
      // 确保startDate是Date对象
      if (settings.value.startDate && !(settings.value.startDate instanceof Date)) {
        settings.value.startDate = new Date(settings.value.startDate);
      }
      
      // 保存到服务器
      saveUserData();
      return true;
    } catch (error) {
      showToast({
        type: 'fail',
        message: '更新设置失败'
      });
      return false;
    }
  }
  
  /**
   * 标记日期
   * 添加、更新或删除特定日期的标记（请假、加班等）
   * @param {Date|string} date - 需要标记的日期
   * @param {string} type - 标记类型
   */
  function markDate(date, type) {
    if (!date) return;
    
    // 确保日期格式统一（YYYY-MM-DD）
    const dateKey = formatDateKey(date);
    
    // 如果type为null或undefined，则删除该日期的标记
    if (type === null || type === undefined) {
      if (dateKey in markedDates.value) {
        delete markedDates.value[dateKey];
      }
    } else {
      // 否则，设置或更新标记
      markedDates.value[dateKey] = type;
    }
    
    // 保存更新
    saveUserData();
  }
  
  /**
   * 更新月度工资设置
   * 根据操作类型更新月度工资设置
   * @param {Object} data - 包含操作类型和设置数据的对象
   * @returns {boolean} 是否更新成功
   */
  function updateMonthlySalarySettings(data) {
    if (!data || !data.type) return false;
    
    try {
      // 根据操作类型执行不同的操作
      switch (data.type) {
        case 'default':
          return updateDefaultSalarySettings(data.settings);
        
        case 'monthly':
          return updateMonthlySalary(data.settings);
        
        case 'remove':
          return removeMonthlySalary(data.monthKey);
        
        default:
          console.error('未知的操作类型:', data.type);
          return false;
      }
    } catch (error) {
      console.error('更新工资设置失败:', error);
      showToast({
        type: 'fail',
        message: '更新工资设置失败'
      });
      return false;
    }
  }
  
  /**
   * 更新默认工资设置
   * @param {Object} settings - 新的默认工资设置
   * @returns {boolean} 是否更新成功
   */
  function updateDefaultSalarySettings(settings) {
    if (!settings) return false;
    
    try {
      // 更新全局默认工资设置
      salarySettings.value = {
        ...salarySettings.value,
        ...settings
      };
      
      // 保存更新
      saveUserData();
      return true;
    } catch (error) {
      console.error('更新默认工资设置失败:', error);
      return false;
    }
  }
  
  /**
   * 更新月度工资设置
   * @param {Object} monthlySettings - 包含month字段的月度工资设置
   * @returns {boolean} 是否更新成功
   */
  function updateMonthlySalary(monthlySettings) {
    if (!monthlySettings || !monthlySettings.month) return false;
    
    try {
      // 确保monthlySalarySettings.value是数组
      if (!monthlySalarySettings.value) {
        monthlySalarySettings.value = [];
      }
      
      // 查找是否已存在该月份的设置
      const existingIndex = monthlySalarySettings.value.findIndex(
        item => item.month === monthlySettings.month
      );
      
      if (existingIndex >= 0) {
        // 更新已存在的月份设置
        monthlySalarySettings.value[existingIndex] = { ...monthlySettings };
      } else {
        // 添加新的月份设置
        monthlySalarySettings.value.push({ ...monthlySettings });
      }
      
      console.log(`已保存 ${monthlySettings.month} 的工资设置:`, monthlySettings);

      // 保存更新
      saveUserData();
      return true;
    } catch (error) {
      console.error('更新月度工资设置失败:', error);
      return false;
    }
  }
  
  /**
   * 删除特定月份的工资设置
   * @param {string} monthKey - 月份键 (YYYY-MM格式)
   * @returns {boolean} 是否删除成功
   */
  function removeMonthlySalary(monthKey) {
    if (!monthKey) return false;
    
    try {
      // 确保monthlySalarySettings.value是对象且月独立设置数组存在
      if (!monthlySalarySettings.value || monthlySalarySettings.value.length === 0) {
        return true; // 没有数据可删除也视为成功
      }
      
      // 过滤掉要删除的月份
      monthlySalarySettings.value = monthlySalarySettings.value.filter(
        item => item.month !== monthKey
      );
      
      console.log(`已删除 ${monthKey} 的工资设置`);
      
      // 保存更新
      saveUserData();
      return true;
    } catch (error) {
      console.error('删除月度工资设置失败:', error);
      return false;
    }
  }
  
  /**
   * 格式化日期为统一的字符串格式
   * @param {Date|string} date - 需要格式化的日期
   * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
   */
  function formatDateKey(date) {
    if (!date) return '';
    
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // 如果已经是ISO格式或标准格式，直接解析
      dateObj = new Date(date);
    } else {
      throw new Error('无效的日期格式');
    }
    
    // 格式化为YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // 初始化用户状态
  initFromLocalStorage();
  
  return {
    // 状态
    username,
    isLoggedIn,
    settings,
    salarySettings,
    monthlySalarySettings,
    markedDates,
    isAuthenticated,
    
    // 认证方法
    login,
    register,
    logout,
    
    // 数据方法
    loadUserData,
    saveUserData,
    updateSettings,
    markDate,
    updateMonthlySalarySettings,
    
    // 新增的工资设置方法
    updateDefaultSalarySettings,
    updateMonthlySalary,
    removeMonthlySalary
  };
}); 