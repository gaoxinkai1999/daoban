import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useApiService } from '../composables/useApiService';
import { showToast } from 'vant';
import { debounce } from 'lodash';

// 本地存储键
const LOCAL_STORAGE_KEY = 'daoban-user-data';

// 定义用户store
export const useUserStore = defineStore('user', () => {
  // 使用API服务
  const apiService = useApiService();
  
  // 状态
  const username = ref('');
  const isLoggedIn = ref(false);
  
  // 设置
  const settings = ref({
    startDate: new Date(),
    initialTaskId: 1,
    tasks: [
      { id: 1, name: '一采', restTime: '3小时', sleepTime: '23:00', taskClass: 'task-1' },
      { id: 2, name: '二采', restTime: '2小时', sleepTime: '02:00', taskClass: 'task-2' },
      { id: 3, name: '三采', restTime: '休息', sleepTime: '21:00', taskClass: 'task-3' },
      { id: 4, name: '一休', restTime: '休息', sleepTime: '21:00', taskClass: 'task-4' },
      { id: 5, name: '二休', restTime: '休息', sleepTime: '02:00', taskClass: 'task-5' },
      { id: 6, name: '三休', restTime: '休息', sleepTime: '23:00', taskClass: 'task-6' }
    ]
  });
  
  // 工资设置
  const salarySettings = ref({
    baseSalary: 5000,   // 底薪
    performance: 800,   // 绩效
    seniority: 500,     // 工龄
    insurance: 600,     // 保险
    education: 0,       // 学历补贴
  });
  
  // 月度工资设置
  const monthlySalarySettings = ref({});
  
  // 标记的日期
  const markedDates = ref({});
  
  // 计算属性
  const isAuthenticated = computed(() => isLoggedIn.value && username.value);
  
  // 初始化：尝试从本地存储恢复用户状态
  function initFromLocalStorage() {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const data = JSON.parse(storedData);
        username.value = data.username || '';
        isLoggedIn.value = data.isLoggedIn || false;

        // 如果有登录信息，尝试加载用户数据
        if (isLoggedIn.value && username.value) {
          loadUserData().catch(err => {
            console.error('自动加载用户数据失败:', err);
            // 如果加载失败，可能是token过期或网络问题，不重置登录状态
          });
        }
      }
    } catch (error) {
      console.error('从本地存储恢复用户状态失败:', error);
    }
  }

  // 保存用户登录状态到本地存储
  function saveToLocalStorage() {
    try {
      const dataToSave = {
        username: username.value,
        isLoggedIn: isLoggedIn.value
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('保存用户状态到本地存储失败:', error);
    }
  }

  // 监听登录状态变化，保存到本地存储
  watch([isLoggedIn, username], () => {
    saveToLocalStorage();
  });
  
  // 计算当前班次的辅助方法（用于调试）
  const currentShift = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 确保是当天的零点
    
    const startDate = new Date(settings.value.startDate);
    startDate.setHours(0, 0, 0, 0); // 确保是当天的零点
    
    // 计算天数差异
    const msDiff = today.getTime() - startDate.getTime();
    const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
    
    // 计算在18天循环中的位置 (0-17)
    const position = ((daysDiff % 18) + 18) % 18;
    
    // 计算当前任务ID (1-6)
    // 每个任务连续3天，然后切换到下一个任务
    const taskId = Math.floor(position / 3) + 1;
    
    // 计算班次类型（每个任务的3天内，依次是白班→夜班→休息日）
    const cyclePosition = position % 3;
    const isDay = cyclePosition === 0;
    const isNight = cyclePosition === 1;
    const shiftType = isDay ? '白班' : (isNight ? '夜班' : '休息日');
    
    // 查找任务名称
    const taskName = settings.value.tasks.find(t => t.id === taskId)?.name || '未知任务';
    
    return {
      taskId,
      taskName,
      shiftType,
      date: today,
      daysDiff,
      position,
      cyclePosition
    };
  });
  
  // 登录
  async function login(userData) {
    try {
      const response = await apiService.auth.login(userData);
      isLoggedIn.value = true;
      username.value = userData.username;
      // 登录成功后会通过watch自动保存到本地存储
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }
  
  // 注册
  async function register(userData) {
    try {
      const response = await apiService.auth.register(userData);
      return response;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }
  
  // 登出
  async function logout() {
    try {
      await apiService.auth.logout();
      reset();
      // 清除本地存储
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      showToast('已退出登录');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使API调用失败，也应该重置状态
      reset();
      // 清除本地存储
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
  
  // 重置状态
  function reset() {
    isLoggedIn.value = false;
    username.value = '';
  }
  
  // 从后端加载用户数据
  async function loadUserData(retryCount = 0) {
    if (!isLoggedIn.value || !username.value) {
      console.warn('尝试加载用户数据但未登录');
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
        monthlySalarySettings.value = data.monthlySalarySettings || {};
        console.log('已加载月度工资设置:', Object.keys(monthlySalarySettings.value));
      }
      
      // 更新startDate为日期对象
      if (settings.value.startDate && !(settings.value.startDate instanceof Date)) {
        settings.value.startDate = new Date(settings.value.startDate);
      }
      
      // 打印当前班次信息（调试用）
      console.log('[调试] 今天的班次信息:', currentShift.value);
      
      return Promise.resolve(data);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      
      // 如果是网络错误并且重试次数小于3，尝试重试
      if (error.code === 'ERR_NETWORK' && retryCount < 3) {
        console.log(`正在重试加载用户数据 (${retryCount + 1}/3)...`);
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
  
  // 保存用户数据到后端
  async function saveUserData() {
    if (!isLoggedIn.value || !username.value) {
      console.warn('尝试保存用户数据但未登录');
      return Promise.reject(new Error('未登录状态'));
    }
    
    try {
      // 确保monthlySalarySettings存在
      if (!monthlySalarySettings.value) {
        monthlySalarySettings.value = {};
      }
      
      // 准备要保存的数据
      const userData = {
        settings: {
          startDate: settings.value.startDate,
          initialTaskId: settings.value.initialTaskId,
          tasks: settings.value.tasks
        },
        salarySettings: salarySettings.value,
        monthlySalarySettings: monthlySalarySettings.value,
        markedDates: markedDates.value
      };
      
      console.log('保存用户数据:', {
        username: username.value,
        settings: '包含初始任务ID和开始日期',
        salarySettings: '默认工资属性',
        monthlySettingsCount: Object.keys(monthlySalarySettings.value).length,
        markedDatesCount: Object.keys(markedDates.value).length
      });
      
      const response = await apiService.user.saveData(username.value, userData);
      console.log('数据保存成功:', response.data);
      return Promise.resolve(response.data);
    } catch (error) {
      console.error('保存用户数据失败:', error);
      showToast({
        type: 'fail',
        message: '保存数据失败'
      });
      return Promise.reject(error);
    }
  }
  
  // 更新设置
  function updateSettings(newSettings) {
    // 检查设置是否有效
    if (newSettings && newSettings.startDate) {
      settings.value = {
        ...settings.value,
        startDate: new Date(newSettings.startDate),
        initialTaskId: newSettings.initialTaskId || settings.value.initialTaskId
      };
      
      // 保存到后端
      saveUserData();
      return true;
    } else {
      console.error('更新设置失败: 收到无效的设置数据', newSettings);
      showToast({
        type: 'fail',
        message: '保存设置失败'
      });
      return false;
    }
  }
  
  // 标记日期
  function markDate(date, type) {
    // 格式化日期为YYYY-MM-DD格式
    const dateKey = formatDateKey(date);
    
    // 获取当前日期的标记，如果不存在则创建一个新对象
    const currentMarks = { ...(markedDates.value[dateKey] || {}) };
    
    // 切换指定类型的标记状态
    currentMarks[type] = !currentMarks[type];
    
    // 检查是否至少有一个标记是 true
    const hasAnyMark = ['leave', 'double', 'overtime', 'doubleOvertime'].some(t => currentMarks[t] === true);
    
    if (hasAnyMark) {
      // 更新标记
      markedDates.value[dateKey] = currentMarks;
    } else {
      // 如果没有任何标记，则删除该日期的条目
      delete markedDates.value[dateKey];
    }
    
    console.log(`日期${dateKey}的${type}标记已${currentMarks[type] ? '添加' : '删除'}`);
    
    // 保存到后端
    saveUserData();
  }
  
  // 更新月度工资设置
  function updateMonthlySalarySettings(settings) {
    console.log('更新月度工资设置，接收到的数据:', settings);
    
    // 更新设置
    if (settings) {
      if (settings.month) {
        try {
          // 确保月份是数字
          const year = Number(settings.month.year);
          const month = Number(settings.month.month);
          
          if (isNaN(year) || isNaN(month)) {
            throw new Error('无效的月份数据');
          }
          
          // 格式化月份键 (确保月份是两位数)
          const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
          console.log(`处理月度工资设置 - 原始数据:`, settings.month);
          console.log(`处理月度工资设置 - 格式化 - 年:${year}, 月:${month}, 月份键:${monthKey}`);
          
          // 确保monthlySalarySettings是对象
          if (!monthlySalarySettings.value) {
            monthlySalarySettings.value = {};
            console.log('初始化月度工资设置对象');
          }
          
          // 打印检查现有的所有键
          console.log('保存前的所有月度设置键:', Object.keys(monthlySalarySettings.value));
          console.log('检查是否已存在该月设置:', Object.prototype.hasOwnProperty.call(monthlySalarySettings.value, monthKey));
          
          if (settings.salarySettings === null) {
            // 如果是null，表示删除该月设置
            if (monthKey in monthlySalarySettings.value) {
              delete monthlySalarySettings.value[monthKey];
              console.log(`已删除${monthKey}的专属工资设置`);
            } else {
              console.log(`${monthKey}没有专属工资设置，无需删除`);
            }
          } else {
            // 验证工资设置数据
            if (!settings.salarySettings || typeof settings.salarySettings !== 'object') {
              throw new Error('工资设置数据无效');
            }
            
            // 检查工资设置是否有必要的字段
            const requiredFields = ['baseSalary', 'performance', 'seniority', 'insurance'];
            const validatedSettings = {};
            
            for (const field of requiredFields) {
              // 确保是数字类型
              let value = Number(settings.salarySettings[field]);
              if (isNaN(value)) {
                console.warn(`工资设置字段 ${field} 不是有效数字:`, settings.salarySettings[field]);
                value = 0;
              }
              validatedSettings[field] = value;
            }
            
            // 复制其他可能存在的字段（如education）
            for (const key in settings.salarySettings) {
              if (!Object.prototype.hasOwnProperty.call(validatedSettings, key)) {
                let value = Number(settings.salarySettings[key]);
                validatedSettings[key] = isNaN(value) ? 0 : value;
              }
            }
            
            console.log('原始工资设置数据:', settings.salarySettings);
            console.log('验证后的工资设置数据:', validatedSettings);
            
            // 设置或更新该月的工资设置（直接使用验证后的数据）
            monthlySalarySettings.value[monthKey] = validatedSettings;
            console.log(`已保存${monthKey}的专属工资设置:`, monthlySalarySettings.value[monthKey]);
          }
          
          // 输出更新后的全部月度设置
          console.log('更新后的所有月度工资设置键:', Object.keys(monthlySalarySettings.value));
          for (const key of Object.keys(monthlySalarySettings.value)) {
            console.log(`- ${key}:`, monthlySalarySettings.value[key]);
          }
        } catch (error) {
          console.error('处理月度工资设置时出错:', error);
          showToast({
            type: 'fail',
            message: '保存月度工资设置失败: ' + error.message
          });
          return false;
        }
      } else if (settings.salarySettings) {
        // 默认设置
        salarySettings.value = {...settings.salarySettings};
        console.log('更新了默认工资设置:', salarySettings.value);
      } else {
        console.warn('工资设置数据格式不正确:', settings);
        showToast({
          type: 'fail',
          message: '工资设置数据格式不正确'
        });
        return false;
      }
      
      // 保存到后端
      try {
        saveUserData();
        return true;
      } catch (error) {
        console.error('保存数据到后端失败:', error);
        showToast({
          type: 'fail',
          message: '保存到服务器失败'
        });
        return false;
      }
    } else {
      console.error('保存工资设置失败: 收到无效的设置数据', settings);
      showToast({
        type: 'fail',
        message: '保存工资设置失败'
      });
      return false;
    }
  }
  
  // 格式化日期键
  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 初始化
  initFromLocalStorage();
  
  return {
    // 状态
    username,
    isLoggedIn,
    settings,
    salarySettings,
    monthlySalarySettings,
    markedDates,
    
    // 计算属性
    isAuthenticated,
    currentShift,
    
    // 方法
    login,
    register,
    logout,
    reset,
    loadUserData,
    saveUserData,
    updateSettings,
    markDate,
    updateMonthlySalarySettings,
    initFromLocalStorage
  };
}); 