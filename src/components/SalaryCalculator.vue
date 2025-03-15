<template>
  <div class="salary-calculator">
    <h2>工资计算</h2>
    
    <div class="salary-container">
      <div class="month-selector">
        <div class="month-navigation">
          <van-button size="small" @click="prevMonth">
            <van-icon name="arrow-left" />
          </van-button>
          <span>{{ currentYear }}年{{ currentMonth + 1 }}月</span>
          <van-button size="small" @click="nextMonth">
            <van-icon name="arrow" />
          </van-button>
        </div>
        <div class="salary-settings-status">
          <div class="status-indicator">
            <div class="indicator-dot" :class="{ active: isCustomMonthSettings }"></div>
            <span>{{ isCustomMonthSettings ? '已设置专属工资' : '使用默认工资' }}</span>
          </div>
          <van-button type="primary" plain size="small" class="settings-button" @click="editMonthSalarySettings">
            <van-icon name="setting-o" />
            <span>{{ isCustomMonthSettings ? '修改' : '设置' }}本月工资</span>
          </van-button>
        </div>
      </div>
      
      <div class="salary-details">
        <van-card class="salary-card">
          <template #title>
            <div class="card-title">
              <van-icon name="clock" />
              <span>出勤明细</span>
            </div>
          </template>
          <template #desc>
            <van-cell-group :border="false">
              <van-cell title="基本出勤" :value="normalAttendanceDays.toFixed(1) + '天'" />
              <van-cell title="请假天数" :value="'-' + leaveDays.toFixed(1) + '天'" class="leave-cell" />
              <van-cell title="加班天数" :value="'+' + totalOvertimeDays.toFixed(1) + '天'" class="overtime-cell" />
              <van-cell title="双倍工资" :value="'+' + extraDoubleDays.toFixed(1) + '天'" class="double-cell" />
              <van-cell size="large">
                <template #title>
                  <span class="highlight-text">总出勤天数</span>
                </template>
                <template #label>
                  <span class="cell-label">基本出勤 - 请假 + 加班 + 双倍工资</span>
                </template>
                <template #value>
                  {{ totalAttendance.toFixed(1) + '天' }}
                </template>
              </van-cell>
            </van-cell-group>
          </template>
        </van-card>
        
        <van-card class="salary-card">
          <template #title>
            <div class="card-title">
              <van-icon name="balance-o" />
              <span>工资明细</span>
            </div>
          </template>
          <template #desc>
            <van-cell-group :border="false">
              <van-cell title="日薪计算" :value="baseDailySalary.toFixed(2) + '元/天'" />
              <van-cell title="出勤工资" :value="baseDailySalary.toFixed(2) + ' × ' + totalAttendance.toFixed(1) + ' = ' + attendanceSalary.toFixed(2) + '元'" />
              <van-cell title="绩效" :value="Number(currentSalarySettings.performance || 0).toFixed(2) + '元'" />
              <van-cell title="工龄" :value="Number(currentSalarySettings.seniority || 0).toFixed(2) + '元'" />
              <van-cell title="学历补贴" :value="Number(currentSalarySettings.education || 0).toFixed(2) + '元'" />
              <van-cell title="保险" :value="'-' + Number(currentSalarySettings.insurance || 0).toFixed(2) + '元'" class="leave-cell" />
              <van-cell size="large">
                <template #title>
                  <span class="highlight-text">预计工资</span>
                </template>
                <template #label>
                  <span class="cell-label">出勤工资 + 绩效 + 工龄 + 学历补贴 - 保险</span>
                </template>
                <template #value>
                  {{ calculatedSalary.toFixed(2) + '元' }}
                </template>
              </van-cell>
            </van-cell-group>
          </template>
        </van-card>
        
        <div class="salary-actions">
          <van-button type="primary" plain block @click="navigateToSalarySettings" icon="setting-o">默认工资设置</van-button>
          <van-button type="primary" block @click="navigateToCalendar" icon="calendar-o">查看本月日历</van-button>
        </div>
      </div>
    </div>
    
    <!-- 提示卡片 -->
    <van-card class="info-card">
      <template #title>
        <div class="card-title">
          <van-icon name="info-o" />
          <span>出勤计算说明</span>
        </div>
      </template>
      <template #desc>
        <ul class="info-list">
          <li><span class="highlight-item">基本出勤</span>：工作日出勤，每个班次算作1.5天</li>
          <li><span class="highlight-item">请假</span>：从基本出勤中扣除，每次请假扣1.5天</li>
          <li><span class="highlight-item">加班</span>：增加出勤，普通加班1.5天，双倍加班3天</li>
          <li><span class="highlight-item">双倍工资</span>：增加出勤，每次增加1.5天</li>
          <li><span class="highlight-item">标记互相独立</span>：所有标记可以任意组合，互不影响</li>
        </ul>
      </template>
    </van-card>
    
    <!-- 月份工资设置弹窗 -->
    <van-popup v-model:show="monthSettingsPopup" position="bottom" round :style="{ height: '85%' }">
      <div class="popup-container">
        <div class="popup-header">
          <h3>
            <van-icon name="calendar-o" />
            {{ currentYear }}年{{ currentMonth + 1 }}月专属工资设置
          </h3>
          <van-icon name="cross" size="20" @click="monthSettingsPopup = false" />
        </div>
        <div class="popup-subheader">
          <div :class="['status-badge', isCustomMonthSettings ? 'custom' : 'default']">
            {{ isCustomMonthSettings ? '已设置专属工资' : '当前使用默认工资' }}
          </div>
        </div>
        <div class="popup-content">
          <SalarySettings 
            v-if="monthSettingsPopup" 
            v-model="editingSalarySettings"
            :month="currentMonthObj"
            :monthlySalarySettings="props.monthlySalarySettings"
            @saved="onMonthSettingsSaved"
          />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SalarySettings from './SalarySettings.vue';
import { showToast } from 'vant';

// 定义props
const props = defineProps({
  startDate: {
    type: Date,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  },
  markedDates: {
    type: Object,
    default: () => ({})
  },
  salarySettings: {
    type: Object,
    required: true
  },
  monthlySalarySettings: {
    type: Object,
    default: () => ({})
  }
});

// 定义事件
const emit = defineEmits(['navigate-to-month', 'salary-settings-updated', 'month-changed']);

// 状态
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const attendancePerShift = ref(1.5); // 每个班次的出勤天数
const monthSettingsPopup = ref(false);
const editingSalarySettings = ref(null);

// 当前月份的key，格式为 "YYYY-MM"
const currentMonthKey = computed(() => {
  // 确保月份始终是两位数
  const month = String(currentMonth.value + 1).padStart(2, '0');
  const key = `${currentYear.value}-${month}`;
  console.log(`计算当前月份键: ${key}`);
  return key;
});

// 月份对象，用于传递给SalarySettings组件
const currentMonthObj = computed(() => {
  return {
    year: currentYear.value,
    month: currentMonth.value
  };
});

// 判断当前月份是否有自定义工资设置
const isCustomMonthSettings = computed(() => {
  console.log('检查月度工资设置键:', currentMonthKey.value);
  console.log('所有月度工资设置键:', Object.keys(props.monthlySalarySettings || {}));
  console.log('所有月度工资设置:', props.monthlySalarySettings);
  
  // 手动检查对象属性
  const keys = Object.keys(props.monthlySalarySettings || {});
  const matchingKey = keys.find(key => key === currentMonthKey.value);
  console.log('匹配的键:', matchingKey);
  
  const hasSetting = props.monthlySalarySettings && 
                    Object.prototype.hasOwnProperty.call(props.monthlySalarySettings, currentMonthKey.value);
  
  console.log(`是否存在当前月份工资设置(${currentMonthKey.value}):`, hasSetting);
  return hasSetting;
});

// 获取当前应该使用的工资设置（优先使用月份设置，没有则使用默认设置）
const currentSalarySettings = computed(() => {
  // 确保props.monthlySalarySettings是对象
  if (!props.monthlySalarySettings) {
    console.log('月度工资设置为空，使用默认工资设置');
    return props.salarySettings;
  }
  
  // 检查月份专属工资设置是否存在且有效
  if (isCustomMonthSettings.value) {
    try {
      const monthlySettings = props.monthlySalarySettings[currentMonthKey.value];
      
      // 确保获取到的是有效对象且有必要的字段
      if (monthlySettings && typeof monthlySettings === 'object') {
        // 验证所有必要字段是否都是有效数字
        const requiredFields = ['baseSalary', 'performance', 'seniority', 'insurance'];
        const isValid = requiredFields.every(field => 
          typeof monthlySettings[field] === 'number' && !isNaN(monthlySettings[field])
        );
        
        if (isValid) {
          console.log(`使用 ${currentMonthKey.value} 的专属工资设置:`, monthlySettings);
          return monthlySettings;
        } else {
          console.warn(`${currentMonthKey.value} 的专属工资设置字段不完整或无效:`, monthlySettings);
          // 尝试自动修复专属设置
          const fixedSettings = { ...props.salarySettings };
          for (const key in monthlySettings) {
            if (typeof monthlySettings[key] === 'number' && !isNaN(monthlySettings[key])) {
              fixedSettings[key] = monthlySettings[key];
            }
          }
          console.log(`已修复的专属工资设置:`, fixedSettings);
          return fixedSettings;
        }
      } else {
        console.warn(`${currentMonthKey.value} 的专属工资设置无效:`, monthlySettings);
      }
    } catch (error) {
      console.error(`获取专属工资设置时出错:`, error);
    }
  }
  
  // 没有月份专属设置或设置无效，使用默认设置
  console.log(`${currentMonthKey.value} 使用默认工资设置:`, props.salarySettings);
  return props.salarySettings;
});

// 日基本工资计算
const baseDailySalary = computed(() => {
  // 基本工资 / 30天 = 日薪
  const baseSalary = parseFloat(currentSalarySettings.value.baseSalary) || 0;
  return baseSalary / 30;
});

// 当月所有日期的信息
const monthDays = computed(() => {
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  const days = [];
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value, i);
    const shiftInfo = getShiftInfo(date);
    const dateKey = formatDateKey(date);
    const markInfo = props.markedDates[dateKey] || {};
    
    days.push({
      date,
      shiftInfo,
      isMarkedLeave: markInfo.leave === true,
      isMarkedDouble: markInfo.double === true,
      isMarkedOvertime: markInfo.overtime === true,
      isMarkedDoubleOvertime: markInfo.doubleOvertime === true
    });
  }
  
  return days;
});

// 正常出勤天数（基本出勤，不考虑任何标记）
const normalAttendanceDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    // 只计算工作日（非休息日）的天数
    if (day.shiftInfo && !day.shiftInfo.isRest) {
      return total + attendancePerShift.value;
    }
    return total;
  }, 0);
});

// 请假天数
const leaveDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    if (day.isMarkedLeave) {
      // 只有工作日（非休息日）才计算请假
      if (day.shiftInfo && !day.shiftInfo.isRest) {
        return total + attendancePerShift.value; // 请假扣除1.5天
      }
    }
    return total;
  }, 0);
});

// 双倍工资天数（独立计算，无论是否请假或加班）
const extraDoubleDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    if (day.isMarkedDouble) {
      // 只有工作日（非休息日）才计算双倍工资
      if (day.shiftInfo && !day.shiftInfo.isRest) {
        return total + attendancePerShift.value; // 双倍工资增加1.5天
      }
    }
    return total;
  }, 0);
});

// 加班总天数
const totalOvertimeDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    // 普通加班
    if (day.isMarkedOvertime) {
      return total + attendancePerShift.value; // 普通加班增加1.5天
    }
    // 双倍加班
    if (day.isMarkedDoubleOvertime) {
      return total + (attendancePerShift.value * 2); // 双倍加班增加3天
    }
    return total;
  }, 0);
});

// 总出勤天数 = 基本出勤 - 请假 + 加班 + 双倍工资
const totalAttendance = computed(() => {
  return normalAttendanceDays.value - leaveDays.value + totalOvertimeDays.value + extraDoubleDays.value;
});

// 出勤工资 = 日薪 × 总出勤天数
const attendanceSalary = computed(() => {
  return baseDailySalary.value * totalAttendance.value;
});

// 预计工资
const calculatedSalary = computed(() => {
  // 出勤工资
  const salary = attendanceSalary.value;
  
  // 加上绩效
  const performance = parseFloat(currentSalarySettings.value.performance) || 0;
  
  // 加上工龄
  const seniority = parseFloat(currentSalarySettings.value.seniority) || 0;
  
  // 加上学历补贴
  const education = parseFloat(currentSalarySettings.value.education) || 0;
  
  // 减去保险
  const insurance = parseFloat(currentSalarySettings.value.insurance) || 0;
  
  return salary + performance + seniority + education - insurance;
});

// 上个月
function prevMonth() {
  if (currentMonth.value === 0) {
    currentYear.value--;
    currentMonth.value = 11;
  } else {
    currentMonth.value--;
  }
  
  // 月份变化后通知父组件加载新数据
  const monthData = {
    year: currentYear.value,
    month: currentMonth.value,
    needReload: true  // 标记需要重新加载数据
  };
  console.log('月份变化，请求重新加载数据:', monthData);
  emit('month-changed', monthData);
}

// 下个月
function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++;
    currentMonth.value = 0;
  } else {
    currentMonth.value++;
  }
  
  // 月份变化后通知父组件加载新数据
  const monthData = {
    year: currentYear.value,
    month: currentMonth.value,
    needReload: true  // 标记需要重新加载数据
  };
  console.log('月份变化，请求重新加载数据:', monthData);
  emit('month-changed', monthData);
}

// 编辑月度工资设置
function editMonthSalarySettings() {
  // 设置初始值为当前使用的工资设置
  editingSalarySettings.value = { ...currentSalarySettings.value };
  monthSettingsPopup.value = true;
}

// 保存月度工资设置
function onMonthSettingsSaved(settings) {
  // 构建正确的设置对象格式
  const settingsToSave = {
    month: {
      year: Number(currentYear.value),
      month: Number(currentMonth.value)
    },
    salarySettings: settings
  };
  
  console.log('保存月度工资设置，准备传递给父组件:', {
    month: settingsToSave.month,
    settingsData: settingsToSave.salarySettings ? '工资设置对象' : 'null',
    monthKey: `${settingsToSave.month.year}-${String(settingsToSave.month.month + 1).padStart(2, '0')}`
  });
  
  // 通知父组件更新工资设置
  emit('salary-settings-updated', settingsToSave);
  monthSettingsPopup.value = false;
  
  // 显示成功消息
  showToast({
    type: 'success',
    message: `已保存${currentYear.value}年${currentMonth.value + 1}月的工资设置`
  });
}

// 导航到日历页面，查看本月日历
function navigateToCalendar() {
  // 确保使用数字类型的年月
  const monthData = { 
    year: Number(currentYear.value), 
    month: Number(currentMonth.value),
    navigateToCalendar: true  // 标记需要切换到日历视图
  };
  
  console.log('从工资计算器导航到日历:', monthData);
  emit('month-changed', monthData);
}

// 导航到工资设置页面
function navigateToSalarySettings() {
  // 通知父组件切换到工资设置页面
  emit('salary-settings-updated', { goToSettings: true });
}

// 计算指定日期的班次和任务信息
function getShiftInfo(date) {
  // 确保startDate是日期对象
  const startDate = new Date(props.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  // 确保date是日期对象
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // 计算天数差异
  const msDiff = targetDate.getTime() - startDate.getTime();
  const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  
  // 计算在18天循环中的位置 (0-17)
  const position = ((daysDiff % 18) + 18) % 18;
  
  // 计算当前任务ID (1-6)
  const taskId = Math.floor(position / 3) + 1;
  
  // 计算班次类型（每个任务的3天内，依次是白班→夜班→休息日）
  const cyclePosition = position % 3;
  const isDay = cyclePosition === 0;
  const isNight = cyclePosition === 1;
  const isRest = cyclePosition === 2;
  
  // 查找任务对象
  const task = props.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  return {
    taskId,
    taskName: task.name,
    isDay,
    isNight,
    isRest,
    sleepTime: task.sleepTime,
    taskClass: task.taskClass
  };
}

// 格式化日期键
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 监视月份变化
watch([currentYear, currentMonth], () => {
  // 当月份变化时，如果有打开工资设置弹窗，则更新编辑的工资设置
  if (monthSettingsPopup.value) {
    editingSalarySettings.value = { ...currentSalarySettings.value };
  }
  
  // 告知父组件，可能需要重新加载数据
  console.log('月份已变更，可能需要重新加载数据');
  emit('month-changed', { year: currentYear.value, month: currentMonth.value });
});
</script>

<style scoped>
.salary-calculator {
  padding: 16px;
}

h2 {
  text-align: center;
  margin-bottom: 16px;
  color: #4caf50;
}

.salary-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
}

.month-selector {
  padding: 16px;
  border-bottom: 1px solid #f2f2f2;
}

.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.month-navigation span {
  font-size: 16px;
  font-weight: bold;
}

.salary-settings-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ddd;
  margin-right: 8px;
}

.indicator-dot.active {
  background-color: #4caf50;
}

.settings-button {
  display: flex;
  align-items: center;
}

.settings-button .van-icon {
  margin-right: 4px;
}

.salary-details {
  padding: 16px;
}

.salary-card {
  margin-bottom: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.card-title .van-icon {
  margin-right: 8px;
  color: #4caf50;
}

.highlight-text {
  color: #4caf50;
  font-weight: bold;
}

.cell-label {
  color: #999;
  font-size: 12px;
}

.leave-cell {
  color: #f44336;
}

.overtime-cell, .double-cell {
  color: #4caf50;
}

.salary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.info-card {
  margin-top: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.info-list {
  padding-left: 16px;
  margin: 0;
}

.info-list li {
  margin-bottom: 8px;
  font-size: 14px;
}

.highlight-item {
  color: #4caf50;
  font-weight: bold;
}

.popup-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.popup-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
}

.popup-header .van-icon {
  margin-right: 8px;
  color: #4caf50;
}

.popup-subheader {
  margin-bottom: 16px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.status-badge.custom {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-badge.default {
  background-color: #f5f5f5;
  color: #666;
}

.popup-content {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .salary-actions {
    grid-template-columns: 1fr;
  }
  
  .month-selector {
    padding: 12px;
  }
  
  .month-navigation span {
    font-size: 14px;
  }
  
  .card-title {
    font-size: 14px;
  }
}
</style> 