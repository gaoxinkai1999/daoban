<template>
  <div id="app">
    <!-- 错误处理器 -->
    <ErrorHandler />
    
    <!-- 全局加载指示器 -->
    <GlobalLoading />
    
    <!-- 未登录状态 -->
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
      <header class="app-header">
        <h1>倒班日历</h1>
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
        <div class="user-actions">
          <span class="username">{{ userStore.username }}</span>
          <van-button size="small" @click="handleLogout">退出</van-button>
        </div>
      </header>

      <main class="app-content">
        <ShiftCalendar 
          v-if="activeTab === 'calendar'" 
          :startDate="userStore.settings.startDate"
          :initialTaskId="userStore.settings.initialTaskId"
          :tasks="userStore.settings.tasks"
          :markedDates="userStore.markedDates"
          @markDate="handleMarkDate"
          ref="calendarRef"
        />
        <SalaryCalculator
          v-if="activeTab === 'salary'"
          :startDate="userStore.settings.startDate"
          :tasks="userStore.settings.tasks"
          :markedDates="userStore.markedDates"
          :salarySettings="userStore.salarySettings"
          :monthlySalarySettings="userStore.monthlySalarySettings"
          @navigate-to-month="navigateToMonth"
          @salary-settings-updated="handleSalaryUpdated"
          @month-changed="handleMonthChanged"
        />
        <SalarySettings
          v-if="activeTab === 'salary-settings'"
          v-model="userStore.salarySettings"
          :monthlySalarySettings="userStore.monthlySalarySettings"
          @saved="handleSalarySettingsSaved"
        />
        <ShiftSettings 
          v-if="activeTab === 'settings'" 
          v-model="userStore.settings"
          @saved="handleSettingsSaved"
          @goToSalarySettings="activeTab = 'salary-settings'"
        />
      </main>
    </template>

    <footer class="app-footer">
      <p>倒班日历 &copy; {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { showToast } from 'vant';
import ShiftCalendar from './components/ShiftCalendar.vue';
import ShiftSettings from './components/ShiftSettings.vue';
import SalaryCalculator from './components/SalaryCalculator.vue';
import SalarySettings from './components/SalarySettings.vue';
import UserLogin from './components/Login.vue';
import UserRegister from './components/UserRegister.vue';
import ErrorHandler from './components/ErrorHandler.vue';
import GlobalLoading from './components/GlobalLoading.vue';
import { useUserStore } from './stores/user';

// 使用ref创建响应式状态
const showRegister = ref(false);
const activeTab = ref('calendar');
const calendarRef = ref(null);

// 使用Pinia存储
const userStore = useUserStore();

// 监听activeTab变化，以保存数据
watch(activeTab, (newValue, oldValue) => {
  if (newValue !== oldValue && oldValue === 'settings') {
    userStore.saveUserData();
  }
});

// 处理登录成功
function handleLoginSuccess(userData) {
  showRegister.value = false;
  userStore.username = userData.username;
  userStore.isLoggedIn = true;
  userStore.loadUserData();
}

// 处理登出
async function handleLogout() {
  await userStore.logout();
}

// 处理标记日期
function handleMarkDate(date, type) {
  userStore.markDate(date, type);
}

// 处理设置保存
function handleSettingsSaved(newSettings) {
  const success = userStore.updateSettings(newSettings);
  if (success) {
    activeTab.value = 'calendar';
  }
}

// 处理工资设置保存
function handleSalarySettingsSaved(settings) {
  const success = userStore.updateMonthlySalarySettings(settings);
  if (success) {
    activeTab.value = 'salary';
  }
}

// 处理工资更新
function handleSalaryUpdated(settings) {
  console.log('处理工资设置更新:', settings);
  
  // 检查是否有特殊指令
  if (settings && settings.goToSettings) {
    activeTab.value = 'salary-settings';
    return;
  }
  
  // 显示保存中提示
  showToast({
    type: 'loading',
    message: '保存中...',
    duration: 0
  });
  
  // 有设置数据则更新
  if (settings) {
    try {
      // 验证设置数据
      if (settings.month && typeof settings.month !== 'object') {
        throw new Error('月份数据格式错误');
      }
      
      if (settings.month && (
          typeof settings.month.year !== 'number' || 
          typeof settings.month.month !== 'number')) {
        throw new Error('月份年或月数据类型错误');
      }
      
      if (settings.salarySettings !== null && typeof settings.salarySettings !== 'object') {
        throw new Error('工资设置数据格式错误');
      }
      
      // 记录更新前的monthlySalarySettings键
      const beforeKeys = Object.keys(userStore.monthlySalarySettings);
      console.log('更新前的月度设置键:', beforeKeys);
      
      // 执行更新
      const success = userStore.updateMonthlySalarySettings(settings);
      
      if (success) {
        console.log('更新后的月度设置键:', Object.keys(userStore.monthlySalarySettings));
        
        // 重新加载数据
        userStore.loadUserData()
          .then(() => {
            console.log('工资设置已保存并重新加载数据');
            console.log('重新加载后的月度设置键:', Object.keys(userStore.monthlySalarySettings));
            
            showToast({
              type: 'success',
              message: '工资设置已保存'
            });
          })
          .catch(error => {
            console.error('保存后数据加载失败:', error);
            showToast({
              type: 'fail',
              message: '数据加载失败，请刷新页面'
            });
          });
      } else {
        showToast({
          type: 'fail',
          message: '工资设置保存失败'
        });
      }
    } catch (error) {
      console.error('处理工资更新时出错:', error);
      showToast({
        type: 'fail',
        message: '保存失败: ' + error.message
      });
    }
  } else {
    // 无设置数据但仍需重新加载数据
    userStore.loadUserData()
      .then(() => {
        console.log('已重新加载用户数据');
        console.log('重新加载后的月度设置键:', Object.keys(userStore.monthlySalarySettings));
        
        showToast({
          type: 'success',
          message: '数据已更新'
        });
      })
      .catch(error => {
        console.error('数据加载失败:', error);
        showToast({
          type: 'fail',
          message: '数据加载失败'
        });
      });
  }
}

// 导航到特定月份
function navigateToMonth(month) {
  console.log('导航至月份:', month);
  
  if (calendarRef.value) {
    console.log('当前日历组件状态:', {
      'currentYear': calendarRef.value.currentYear,
      'currentMonth': calendarRef.value.currentMonth
    });
    
    // 确保参数有效
    if (typeof month.year === 'number' && typeof month.month === 'number') {
      calendarRef.value.currentYear = month.year;
      calendarRef.value.currentMonth = month.month;
      console.log('设置后日历状态:', {
        'currentYear': calendarRef.value.currentYear,
        'currentMonth': calendarRef.value.currentMonth
      });
      
      // 切换到日历Tab
      activeTab.value = 'calendar';
    } else {
      console.error('无效的月份参数:', month);
      showToast({
        type: 'fail',
        message: '无法切换月份: 参数无效'
      });
    }
  } else {
    console.error('找不到日历组件引用');
    showToast({
      type: 'fail',
      message: '无法切换月份: 日历组件未加载'
    });
  }
}

// 处理月份变化
function handleMonthChanged(month) {
  console.log('处理月份变化:', month);
  
  // 如果需要重新加载数据（月份切换）
  if (month.needReload) {
    console.log('正在重新加载用户数据...');
    
    // 显示加载提示
    showToast({
      type: 'loading',
      message: '加载数据中...',
      duration: 0
    });
    
    // 重新加载数据
    userStore.loadUserData()
      .then(() => {
        console.log('数据重新加载成功');
        showToast({
          type: 'success',
          message: '数据已更新'
        });
      })
      .catch(error => {
        console.error('数据重新加载失败:', error);
        showToast({
          type: 'fail',
          message: '数据加载失败'
        });
      });
  }
  
  // 切换到日历视图（如果需要）
  if (month.navigateToCalendar) {
    navigateToMonth(month);
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f7f8fa;
  color: #2c3e50;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 1rem 0;
  border-bottom: 1px solid #ddd;
  margin-bottom: 2rem;
}

.app-header h1 {
  text-align: center;
  margin-bottom: 1rem;
  color: #4caf50;
}

.tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  position: relative;
  color: #666;
  transition: color 0.3s;
}

.tab.active {
  color: #4caf50;
  font-weight: bold;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #4caf50;
}

.app-content {
  flex: 1;
  margin-bottom: 2rem;
}

.app-footer {
  margin-top: auto;
  padding: 1rem 0;
  text-align: center;
  color: #666;
  border-top: 1px solid #ddd;
}

@media (max-width: 768px) {
  #app {
    padding: 0.5rem;
  }
  
  .app-header {
    padding: 0.5rem 0;
  }
  
  .app-header h1 {
    font-size: 1.5rem;
    margin-bottom: 0.8rem;
  }
  
  .tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .tabs {
    overflow-x: auto;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    justify-content: flex-start;
    /* 为滚动条添加空间 */
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
  
  .user-actions {
    flex-direction: column;
    align-items: flex-end;
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .username {
    font-size: 12px;
    margin-bottom: 4px;
  }
}

/* 添加用户操作区域样式 */
.user-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
}

.username {
  margin-right: 8px;
  font-size: 14px;
  font-weight: 500;
}
</style>
