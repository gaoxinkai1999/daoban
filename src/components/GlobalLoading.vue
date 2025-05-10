<template>
  <van-overlay :show="show" class="global-loading">
    <div class="loading-wrapper">
      <van-loading size="24px" color="#4caf50">加载中...</van-loading>
    </div>
  </van-overlay>
</template>

<script setup>
import { ref } from 'vue';

/**
 * 控制加载状态的显示
 */
const show = ref(false);

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