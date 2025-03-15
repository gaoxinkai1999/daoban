import axios from 'axios';
import { ref } from 'vue';
import { showNotify } from 'vant';
import { eventBus } from '../utils/eventBus';

// 创建一个API服务实例
export function useApiService() {
  const loading = ref(false);
  const error = ref(null);

  // 创建axios实例
  const apiClient = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://192.168.0.102:8087/api', // 根据环境设置API URL
    timeout: 15000, // 增加超时时间
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 请求拦截器
  apiClient.interceptors.request.use(
    config => {
      loading.value = true;
      error.value = null;
      
      // 添加时间戳防止缓存
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: new Date().getTime()
        };
      }
      
      return config;
    },
    err => {
      loading.value = false;
      error.value = err;
      
      // 使用事件总线发送错误事件
      eventBus.emit('api-error', err, '请求配置错误', false);
      
      return Promise.reject(err);
    }
  );

  // 响应拦截器
  apiClient.interceptors.response.use(
    response => {
      loading.value = false;
      return response;
    },
    err => {
      loading.value = false;
      error.value = err;

      // 处理不同类型的错误
      if (err.response) {
        // 服务器返回了错误状态码
        const status = err.response.status;
        const errorData = err.response.data;
        
        let title = '请求失败';
        let message = errorData?.message || `错误码: ${status}`;
        let canRetry = false;
        
        switch(status) {
          case 401:
            title = '未授权';
            message = '请重新登录';
            canRetry = false;
            break;
          case 403:
            title = '无权访问';
            message = '您没有访问该资源的权限';
            canRetry = false;
            break;
          case 404:
            title = '资源不存在';
            canRetry = false;
            break;
          case 408:
          case 429:
            title = '请求超时';
            message = '服务器繁忙，请稍后再试';
            canRetry = true;
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            title = '服务器错误';
            message = '服务器暂时不可用，请稍后再试';
            canRetry = true;
            break;
        }
        
        showNotify({
          type: 'danger',
          message: message
        });
        
        eventBus.emit('api-error', err, title, canRetry, () => {
          // 重试当前请求的逻辑
          const originalRequest = err.config;
          return apiClient(originalRequest);
        });
      } else if (err.request) {
        // 请求已发送但未收到响应
        showNotify({
          type: 'danger',
          message: '网络连接失败，请检查网络'
        });
        // 发送网络错误事件
        eventBus.emit('api-error', err, '网络连接失败', true, () => {
          // 重试当前请求
          const originalRequest = err.config;
          return apiClient(originalRequest);
        });
      } else {
        // 请求配置出错
        showNotify({
          type: 'danger',
          message: '请求错误: ' + err.message
        });
        // 发送请求错误事件
        eventBus.emit('api-error', err, '请求错误', false);
      }

      return Promise.reject(err);
    }
  );

  // 定义API服务
  const apiService = {
    auth: {
      // 登录
      login: (userData) => {
        return apiClient.post('/auth/login', userData);
      },
      // 注册
      register: (userData) => {
        return apiClient.post('/auth/register', userData);
      },
      // 登出
      logout: () => {
        return apiClient.post('/auth/logout');
      }
    },
    user: {
      // 获取用户数据
      getData: (username) => {
        return apiClient.get(`/user/data`, { params: { username } });
      },
      // 保存用户数据
      saveData: (username, data) => {
        // 数据验证
        if (!data) {
          console.error('保存用户数据失败: 数据为空');
          return Promise.reject(new Error('数据为空'));
        }
        
        if (data.monthlySalarySettings) {
          console.log('准备保存的月度工资设置数据:', Object.keys(data.monthlySalarySettings));
          
          // 检查月度工资设置数据
          for (const key in data.monthlySalarySettings) {
            const monthSettings = data.monthlySalarySettings[key];
            if (!monthSettings || typeof monthSettings !== 'object') {
              console.warn(`月份 ${key} 的设置无效，将被移除`, monthSettings);
              delete data.monthlySalarySettings[key];
              continue;
            }
            
            // 验证必要字段
            const requiredFields = ['baseSalary', 'performance', 'seniority', 'insurance'];
            let hasInvalidField = false;
            
            for (const field of requiredFields) {
              if (typeof monthSettings[field] !== 'number' || isNaN(monthSettings[field])) {
                console.warn(`月份 ${key} 的设置字段 ${field} 无效:`, monthSettings[field]);
                hasInvalidField = true;
                // 尝试修复
                monthSettings[field] = Number(monthSettings[field]) || 0;
              }
            }
            
            if (hasInvalidField) {
              console.log(`修复后的月份 ${key} 设置:`, monthSettings);
            }
          }
        }
        
        console.log('最终保存的用户数据:', {
          username,
          hasSettings: !!data.settings,
          hasSalarySettings: !!data.salarySettings,
          monthlySettingsCount: data.monthlySalarySettings ? Object.keys(data.monthlySalarySettings).length : 0,
          markedDatesCount: data.markedDates ? Object.keys(data.markedDates).length : 0
        });
        
        return apiClient.post(`/user/data`, data, { params: { username } });
      }
    }
  };

  const finalService = {
    loading,
    error,
    apiClient,
    ...apiService
  };

  return finalService;
} 