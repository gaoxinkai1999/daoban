/**
 * 倒班日历主应用组件
 * 负责整个应用的布局、导航和状态管理
 */
<template>
  <div id="app">
    <!-- 全局加载指示器 -->
    <GlobalLoading />
    
    <!-- 应用头部，包含标题和导航选项卡 -->
    <header class="app-header">
      <h1>倒班日历</h1>
      
      <!-- 导航选项卡 -->
      <div class="tabs-container">
        <div class="tabs">
          <button 
            :class="['tab', { active: activeTab === 'calendar' }]" 
            @click="activeTab = 'calendar'"
          >
            <van-icon name="calendar-o" size="16" class="tab-icon" />
            日历
          </button>
          <button 
            :class="['tab', { active: activeTab === 'settings' }]" 
            @click="activeTab = 'settings'"
          >
            <van-icon name="setting-o" size="16" class="tab-icon" />
            设置
          </button>
        </div>
      </div>
    </header>

    <!-- 主要内容区域，根据activeTab显示不同组件 -->
    <main class="app-content">
      <!-- 日历组件 -->
      <ShiftCalendar 
        v-if="activeTab === 'calendar'"
      />
      <!-- 班次设置组件 -->
      <ShiftSettings 
        v-if="activeTab === 'settings'"
      />
    </main>

    <!-- 应用页脚 -->
    <footer class="app-footer">
      <p>倒班日历 &copy; {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import GlobalLoading from './components/GlobalLoading.vue';
import { useUserStore } from './stores/user';
import ShiftCalendar from './components/ShiftCalendar.vue';
import ShiftSettings from './components/ShiftSettings.vue';

// 用ref创建响应式状态
const activeTab = ref('calendar'); // 当前活动选项卡

// 使用Pinia存储
const userStore = useUserStore();

// 初始化加载数据
userStore.loadUserData();
</script>

<style>
/* 全局样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 基础样式 */
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f7f8fa;
  color: #2c3e50;
}

/* 应用容器样式 */
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 应用头部样式 */
.app-header {
  padding: 1.5rem 0;
  margin-bottom: 2rem;
  position: relative;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  color: white;
}

.app-header h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: white;
  font-size: 2.2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 选项卡容器样式 */
.tabs-container {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.tabs {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  margin-bottom: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
  max-width: 100%;
  gap: 1.5rem;
}

/* 隐藏滚动条 */
.tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 选项卡按钮样式 */
.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  font-size: 1rem;
  position: relative;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s;
  flex-shrink: 0;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.tab.active {
  color: white;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tab-icon {
  margin-right: 4px;
}

/* 内容区域样式 */
.app-content {
  flex: 1;
  margin-bottom: 2rem;
  padding: 20px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 页脚样式 */
.app-footer {
  margin-top: auto;
  padding: 1.5rem 0;
  text-align: center;
  color: #777;
  font-size: 0.9rem;
}

/* 响应式布局样式 */
@media (max-width: 768px) {
  #app {
    padding: 1rem;
  }
  
  .app-header {
    padding: 1rem 0;
    margin-bottom: 1.5rem;
    border-radius: 12px;
  }
  
  .app-header h1 {
    font-size: 1.8rem;
    margin-bottom: 1.2rem;
  }
  
  .tab {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
  
  .tabs {
    justify-content: flex-start;
    padding: 0 12px 4px;
    margin-bottom: 0.5rem;
    gap: 1rem;
  }
  
  .app-content {
    padding: 15px;
    border-radius: 12px;
  }
}
</style>
