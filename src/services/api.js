import axios from 'axios';
import { eventBus } from '../utils/eventBus';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://192.168.0.102:8087/api', // 直接设置API URL，移除环境变量依赖
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 在这里可以添加认证信息等
    console.log('发送请求:', config.url);
    return config;
  },
  error => {
    console.error('请求错误:', error);
    // 触发全局错误事件
    eventBus.emit('api-error', error, '请求配置错误');
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    console.log('收到响应:', response.config.url);
    return response;
  },
  error => {
    // 处理错误响应
    if (error.response) {
      // 服务器响应了，但状态码不是2xx
      console.error('响应错误:', error.response.status, error.response.data);
      
      // 可以根据状态码处理特定情况
      let errorTitle = '服务器错误';
      let canRetry = true;
      
      switch (error.response.status) {
        case 401:
          errorTitle = '未授权, 请登录';
          canRetry = false;
          break;
        case 403:
          errorTitle = '权限不足';
          canRetry = false;
          break;
        case 404:
          errorTitle = '请求资源不存在';
          canRetry = false;
          break;
        case 400:
          errorTitle = '请求参数错误';
          canRetry = true;
          break;
        case 500:
          errorTitle = '服务器内部错误';
          canRetry = true;
          break;
        default:
          errorTitle = `错误(${error.response.status})`;
          canRetry = true;
      }
      
      // 触发全局错误事件
      eventBus.emit(
        'api-error', 
        error, 
        errorTitle, 
        canRetry, 
        () => {
          // 重试函数 - 重新发送原始请求
          const originalRequest = error.config;
          return apiClient(originalRequest);
        }
      );
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('无响应:', error.request);
      
      // 触发全局错误事件
      eventBus.emit(
        'api-error', 
        error, 
        '网络错误', 
        true, 
        () => {
          // 重试函数
          const originalRequest = error.config;
          return apiClient(originalRequest);
        }
      );
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
      
      // 触发全局错误事件
      eventBus.emit('api-error', error, '请求错误', false);
    }
    
    return Promise.reject(error);
  }
);

// API服务对象
const apiService = {
  // 认证相关
  auth: {
    // 登录
    login(credentials) {
      return apiClient.post('/auth/login', credentials);
    },
    
    // 注册
    register(userData) {
      return apiClient.post('/auth/register', userData);
    },
    
    // 登出
    logout() {
      return apiClient.post('/auth/logout');
    }
  },
  
  // 用户数据相关
  user: {
    // 获取用户数据
    getData(username) {
      return apiClient.get(`/user/data`, { params: { username } });
    },
    
    // 保存用户数据
    saveData(username, data) {
      return apiClient.post(`/user/data`, data, { params: { username } });
    }
  }
};

export default apiService; 