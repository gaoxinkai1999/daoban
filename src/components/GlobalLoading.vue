<template>
  <van-overlay :show="show" class="global-loading">
    <div class="loading-wrapper">
      <van-loading size="24px" color="#4caf50">加载中...</van-loading>
    </div>
  </van-overlay>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { apiClient } from '../services/api';

/**
 * 控制加载状态的显示
 */
const show = ref(false);

/**
 * 拦截器ID，用于移除拦截器
 */
let requestInterceptorId = null;
let responseInterceptorId = null;

/**
 * 请求计数器
 */
let requestCount = 0;

/**
 * 更新加载状态的函数
 */
function updateLoadingState() {
  if (requestCount > 0) {
    // 添加短延迟，避免过快的请求导致闪烁
    setTimeout(() => {
      if (requestCount > 0) {
        show.value = true;
      }
    }, 300);
  } else {
    show.value = false;
  }
}

/**
 * 减少请求计数的函数
 */
function decrementRequestCount() {
  requestCount = Math.max(0, requestCount - 1);
  updateLoadingState();
}

/**
 * 添加axios请求和响应拦截器
 */
onMounted(() => {
  // 添加请求拦截器
  requestInterceptorId = apiClient.interceptors.request.use(
    config => {
      // 增加请求计数
      requestCount++;
      updateLoadingState();
      return config;
    },
    error => {
      decrementRequestCount();
      return Promise.reject(error);
    }
  );

  // 添加响应拦截器
  responseInterceptorId = apiClient.interceptors.response.use(
    response => {
      decrementRequestCount();
      return response;
    },
    error => {
      decrementRequestCount();
      return Promise.reject(error);
    }
  );
});

/**
 * 组件卸载时移除拦截器
 */
onUnmounted(() => {
  if (requestInterceptorId !== null) {
    apiClient.interceptors.request.eject(requestInterceptorId);
  }
  if (responseInterceptorId !== null) {
    apiClient.interceptors.response.eject(responseInterceptorId);
  }
});

/**
 * 导出方法供外部调用
 */
defineExpose({
  /**
   * 显示加载状态
   */
  showLoading: () => { 
    show.value = true; 
  },
  
  /**
   * 隐藏加载状态
   */
  hideLoading: () => { 
    show.value = false; 
  }
});
</script>

<style scoped>
.global-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
}

.loading-wrapper {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style> 