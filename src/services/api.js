import axios from 'axios';
import { showNotify } from 'vant';

/**
 * 创建axios实例
 * 统一配置请求参数
 */
const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://192.168.0.102:8087/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 请求拦截器
 * 在请求发送前处理请求配置
 * 注意：GlobalLoading组件也会添加自己的拦截器
 */
apiClient.interceptors.request.use(
  config => {
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 统一处理响应数据和错误
 * 注意：GlobalLoading组件也会添加自己的拦截器
 */
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 错误已经发生，其他拦截器（如GlobalLoading）已经处理了请求状态
    // 这里我们只关注错误通知

    // 默认错误消息
    let message = '请求失败';
    
    // 处理不同类型的错误
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      const errorData = error.response.data;
      
      // 优先使用服务器返回的错误消息
      if (errorData?.message) {
        message = errorData.message;
      } else {
        // 根据状态码定制错误消息
        const statusMessages = {
          401: '未授权，请重新登录',
          403: '您没有访问该资源的权限',
          404: '请求的资源不存在',
          408: '服务器繁忙，请稍后再试',
          429: '服务器繁忙，请稍后再试',
          500: '服务器暂时不可用，请稍后再试',
          502: '服务器暂时不可用，请稍后再试',
          503: '服务器暂时不可用，请稍后再试',
          504: '服务器暂时不可用，请稍后再试'
        };
        
        message = statusMessages[status] || `错误码: ${status}`;
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      message = '网络连接失败，请检查网络';
    } else if (error.message) {
      // 请求配置出错
      message = '请求错误: ' + error.message;
    }
    
    // 显示错误通知
    showNotify({
      type: 'danger',
      message: message
    });

    return Promise.reject(error);
  }
);

/**
 * API服务对象
 * 集中管理所有API请求
 */
const apiService = {
  // 认证相关
  auth: {
    /**
     * 用户登录
     * @param {Object} credentials - 登录凭证
     * @returns {Promise} 登录结果
     */
    login(credentials) {
      return apiClient.post('/auth/login', credentials);
    },
    
    /**
     * 用户注册
     * @param {Object} userData - 用户注册数据
     * @returns {Promise} 注册结果
     */
    register(userData) {
      return apiClient.post('/auth/register', userData);
    },
    
    /**
     * 用户登出
     * @returns {Promise} 登出结果
     */
    logout() {
      return apiClient.post('/auth/logout');
    }
  },
  
  // 用户数据相关
  user: {
    /**
     * 获取用户数据
     * @param {string} username - 用户名
     * @returns {Promise} 用户数据
     */
    getData(username) {
      return apiClient.get(`/user/data`, { params: { username } });
    },
    
    /**
     * 保存用户数据
     * @param {string} username - 用户名
     * @param {Object} data - 用户数据
     * @returns {Promise} 保存结果
     */
    saveData(username, data) {
      return apiClient.post(`/user/data`, data, { params: { username } });
    }
  }
};

export default apiService;
export { apiClient }; 