/**
 * 倒班日历主应用组件
 * 负责整个应用的布局、导航和状态管理
 */
<template>
  <div id="app">
    <!-- 全局加载指示器 -->
    <GlobalLoading />
    
    <!-- 未登录状态展示登录或注册组件 -->
    <template v-if="!userStore.isLoggedIn">
      <UserLogin 
        v-if="!showRegister" 
        @login-success="handleLoginSuccess" 
        @switch-to-register="showRegister = true" 
      />
      <UserRegister 
        v-else 
        @switch-to-login="showRegister = false" 
      />
    </template>
    
    <!-- 主应用内容，只有登录后才显示 -->
    <template v-else>
      <!-- 应用头部，包含标题、用户信息和导航选项卡 -->
      <header class="app-header">
        <h1>倒班日历</h1>
        
        <!-- 用户信息和退出按钮 -->
        <div class="user-info">
          <span class="username">{{ userStore.username }}</span>
          <van-button size="small" type="default" @click="handleLogout">退出</van-button>
        </div>
        
        <!-- 导航选项卡 -->
        <div class="tabs-container">
          <div class="tabs">
            <button 
              :class="['tab', { active: activeTab === 'calendar' }]" 
              @click="activeTab = 'calendar'"
            >
              日历
            </button>
            <button 
              :class="['tab', { active: activeTab === 'salary' }]" 
              @click="activeTab = 'salary'"
            >
              工资计算
            </button>
            <button 
              :class="['tab', { active: activeTab === 'settings' }]" 
              @click="activeTab = 'settings'"
            >
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
        <!-- 工资计算组件 -->
        <SalaryCalculator
          v-if="activeTab === 'salary'"
        />
        <!-- 工资设置组件 -->
        <SalarySettings
          v-if="activeTab === 'salary-settings'"
        />
        <!-- 班次设置组件 -->
        <ShiftSettings 
          v-if="activeTab === 'settings'"
        />
      </main>
    </template>

    <!-- 应用页脚 -->
    <footer class="app-footer">
      <p>倒班日历 &copy; {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';


// 导入组件
import ShiftCalendar from './components/ShiftCalendar.vue';
import ShiftSettings from './components/ShiftSettings.vue';
import SalaryCalculator from './components/SalaryCalculator.vue';
import SalarySettings from './components/SalarySettings.vue';
import UserLogin from './components/Login.vue';
import UserRegister from './components/UserRegister.vue';
import GlobalLoading from './components/GlobalLoading.vue';
import { useUserStore } from './stores/user';

// 用ref创建响应式状态
const showRegister = ref(false);  // 控制显示注册还是登录界面
const activeTab = ref('calendar'); // 当前活动选项卡


// 使用Pinia存储
const userStore = useUserStore();

/**
 * 处理登录成功
 * 更新用户状态并加载用户数据
 * @param {Object} userData - 登录成功返回的用户数据
 */
function handleLoginSuccess(userData) {
  showRegister.value = false;
  userStore.username = userData.username;
  userStore.isLoggedIn = true;
  userStore.loadUserData();
}

/**
 * 处理登出
 * 调用用户存储的登出方法
 */
async function handleLogout() {
  await userStore.logout();
}




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
  padding: 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 应用头部样式 */
.app-header {
  padding: 1rem 0;
  border-bottom: 1px solid #ddd;
  margin-bottom: 2rem;
  position: relative;
}

.app-header h1 {
  text-align: center;
  margin-bottom: 1rem;
  color: #4caf50;
}

/* 用户信息区域样式 */
.user-info {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  z-index: 10; /* 添加z-index确保显示在最上层 */
}

.username {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
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
  margin-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
  max-width: 100%;
}

/* 隐藏滚动条 */
.tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 选项卡按钮样式 */
.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  position: relative;
  color: #666;
  transition: color 0.3s;
  flex-shrink: 0;
}

.tab.active {
  color: #4caf50;
  font-weight: bold;
}

/* 活动选项卡底部指示线 */
.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #4caf50;
}

/* 内容区域样式 */
.app-content {
  flex: 1;
  margin-bottom: 2rem;
}

/* 页脚样式 */
.app-footer {
  margin-top: auto;
  padding: 1rem 0;
  text-align: center;
  color: #666;
  border-top: 1px solid #ddd;
}

/* 响应式布局样式 */
@media (max-width: 768px) {
  #app {
    padding: 0.5rem;
  }
  
  .app-header {
    padding: 0.5rem 0;
    margin-bottom: 1rem;
    position: relative; /* 确保position属性 */
  }
  
  .app-header h1 {
    font-size: 1.5rem;
    margin-bottom: 0.8rem;
    padding-top: 0.5rem;
  }
  
  .user-info {
    top: 0.5rem;
    right: 0.5rem;
    gap: 4px;
    padding: 0;
    position: fixed; /* 改为fixed定位，不受tab切换影响 */
  }
  
  .username {
    font-size: 12px;
  }
  
  .tab {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .tabs {
    justify-content: flex-start;
    padding: 0 8px 4px;
    margin-bottom: 0.5rem;
  }
}
</style>
