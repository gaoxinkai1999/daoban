<template>
  <van-overlay :show="show" class="global-loading">
    <div class="loading-wrapper">
      <van-loading size="24px" color="#4caf50">加载中...</van-loading>
    </div>
  </van-overlay>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import { useApiService } from '../composables/useApiService';

const show = ref(false);
const apiService = useApiService();

// 监听loading状态变化
onMounted(() => {
  // 使用watchEffect监听apiService.loading的变化
  watchEffect(() => {
    const isLoading = apiService.loading.value;
    
    // 加入短暂延迟，避免闪烁
    if (isLoading) {
      const timer = setTimeout(() => {
        if (apiService.loading.value) {
          show.value = true;
        }
      }, 300);
      
      // 确保在watchEffect重新运行时清除定时器
      return () => clearTimeout(timer);
    } else {
      show.value = false;
    }
  });
});

// 导出方法供外部调用
defineExpose({
  showLoading: () => { show.value = true; },
  hideLoading: () => { show.value = false; }
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