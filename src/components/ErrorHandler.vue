<template>
  <div class="error-handler">
    <van-popup v-model:show="showError" class="error-popup" position="bottom">
      <div class="error-content">
        <van-icon name="warning-o" size="24" color="#ee0a24" />
        <h3>{{ errorTitle }}</h3>
        <p>{{ errorMessage }}</p>
        <div class="error-actions">
          <van-button type="danger" size="small" @click="hideError">关闭</van-button>
          <van-button v-if="canRetry" type="primary" size="small" @click="retry">重试</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import eventBus from '../utils/eventBus';

// 响应式状态
const showError = ref(false);
const errorTitle = ref('发生错误');
const errorMessage = ref('');
const canRetry = ref(false);
const retryAction = ref(null);

// 处理API错误
function handleApiError(error, title, canRetryValue, retryActionValue) {
  errorTitle.value = title || '请求错误';
  
  // 处理不同类型的错误
  if (error.response) {
    // 服务器响应的错误
    errorMessage.value = error.response.data?.message || `错误码: ${error.response.status}`;
  } else if (error.request) {
    // 请求未收到响应
    errorMessage.value = '无法连接到服务器，请检查网络连接';
  } else {
    // 请求设置错误
    errorMessage.value = error.message || '未知错误';
  }
  
  // 设置重试选项
  canRetry.value = canRetryValue;
  retryAction.value = retryActionValue;
  
  // 显示错误
  showError.value = true;
}

// 隐藏错误提示
function hideError() {
  showError.value = false;
}

// 重试操作
function retry() {
  hideError();
  if (typeof retryAction.value === 'function') {
    retryAction.value();
  }
}

// 组件挂载时添加事件监听
onMounted(() => {
  eventBus.on('api-error', handleApiError);
});

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  eventBus.off('api-error', handleApiError);
});

// 暴露方法给父组件或全局
defineExpose({
  showError: handleApiError,
  hideError
});
</script>

<style scoped>
.error-popup {
  width: 90%;
  max-width: 500px;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.error-content {
  padding: 20px;
  text-align: center;
}

.error-content h3 {
  margin: 10px 0;
  color: #ee0a24;
}

.error-content p {
  margin: 10px 0 20px;
  color: #666;
  font-size: 14px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style> 