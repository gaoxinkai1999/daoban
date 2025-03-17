/**
* 工资计算器组件
* 用于显示和计算月度工资及出勤明细
*/
<template>
  <div class="salary-calculator">
    <h2>工资计算</h2>

    <div class="salary-container">
      <!-- 月份选择区域 -->
      <div class="month-selector">
        <!-- 月份导航区域 -->
        <div class="month-navigation">
          <van-button size="small" @click="prevMonth">
            <van-icon name="arrow-left"/>
          </van-button>
          <span class="month-display" @click="showMonthPicker = true">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
          <van-button size="small" @click="nextMonth">
            <van-icon name="arrow"/>
          </van-button>
        </div>
        <!-- 工资设置状态显示区域 -->
        <div class="salary-settings-status">
          <div class="status-indicator">
            <div :class="{ active: isCustomMonthSettings }" class="indicator-dot"></div>
            <span>{{ isCustomMonthSettings ? '已设置专属工资' : '使用默认工资' }}</span>
          </div>
          <van-button class="settings-button" plain size="small" type="primary" @click="editMonthSalarySettings">
            <van-icon name="setting-o"/>
            <span>{{ isCustomMonthSettings ? '修改' : '设置' }}本月工资</span>
          </van-button>
        </div>
      </div>

      <!-- 工资和出勤明细区域 -->
      <div class="salary-details">
        <!-- 出勤明细卡片 -->
        <van-card class="salary-card">
          <template #title>
            <div class="card-title">
              <van-icon name="clock"/>
              <span>出勤明细</span>
            </div>
          </template>
          <template #desc>
            <van-cell-group :border="false">
              <van-cell :value="normalAttendanceDays.toFixed(1) + '天'" title="基本出勤"/>
              <van-cell :value="'-' + leaveDays.toFixed(1) + '天'" class="leave-cell" title="请假天数"/>
              <van-cell :value="'+' + totalOvertimeDays.toFixed(1) + '天'" class="overtime-cell" title="加班天数"/>
              <van-cell :value="'+' + extraDoubleDays.toFixed(1) + '天'" class="double-cell" title="双倍工资"/>
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

        <!-- 工资明细卡片 -->
        <van-card class="salary-card">
          <template #title>
            <div class="card-title">
              <van-icon name="balance-o"/>
              <span>工资明细</span>
            </div>
          </template>
          <template #desc>
            <van-cell-group :border="false">
              <van-cell :value="baseDailySalary.toFixed(2) + '元/天'" title="日薪计算"/>
              <van-cell
                  :value="baseDailySalary.toFixed(2) + ' × ' + totalAttendance.toFixed(1) + ' = ' + attendanceSalary.toFixed(2) + '元'"
                  title="出勤工资"/>
              <van-cell :value="Number(currentSalarySettings.performance || 0).toFixed(2) + '元'" title="绩效"/>
              <van-cell :value="Number(currentSalarySettings.seniority || 0).toFixed(2) + '元'" title="工龄"/>
              <van-cell :value="Number(currentSalarySettings.education || 0).toFixed(2) + '元'" title="学历补贴"/>
              <van-cell :value="'-' + Number(currentSalarySettings.insurance || 0).toFixed(2) + '元'" class="leave-cell"
                        title="保险"/>
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

        <!-- 操作按钮区域 -->
        <div class="salary-actions">
          <van-button block icon="setting-o" plain type="primary" @click="navigateToSalarySettings">默认工资设置
          </van-button>
          <van-button block icon="calendar-o" type="primary" @click="navigateToCalendar">查看本月日历</van-button>
        </div>
      </div>
    </div>

    <!-- 出勤计算说明卡片 -->
    <van-card class="info-card">
      <template #title>
        <div class="card-title">
          <van-icon name="info-o"/>
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
    <van-popup v-model:show="monthSettingsPopup" :style="{ height: '85%' }" position="bottom" round>
      <div class="popup-container">
        <div class="popup-header">
          <h3>
            <van-icon name="calendar-o"/>
            {{ currentYear }}年{{ currentMonth + 1 }}月专属工资设置
          </h3>
          <van-icon name="cross" size="20" @click="monthSettingsPopup = false"/>
        </div>
        <div class="popup-subheader">
          <div :class="['status-badge', isCustomMonthSettings ? 'custom' : 'default']">
            {{ isCustomMonthSettings ? '已设置专属工资' : '当前使用默认工资' }}
          </div>
        </div>
        <div class="popup-content">
          <SalarySettings
              v-if="monthSettingsPopup"
              :month="currentMonthObj"
          />
        </div>
      </div>
    </van-popup>
    
    <!-- 月份选择器 -->
    <van-popup v-model:show="showMonthPicker" position="bottom" round>
      <van-date-picker
        v-model="currentDateArray"
        title="选择年月"
        :columns-type="['year', 'month']"
        :min-date="new Date(2010, 0, 1)"
        :max-date="new Date(2030, 11, 31)"
        @confirm="onMonthSelected"
        @cancel="showMonthPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import SalarySettings from './SalarySettings.vue';

import {useUserStore} from '@/stores/user';
import {storeToRefs} from 'pinia';

// 使用用户store
const userStore = useUserStore();
// 从store中解构需要的响应式状态
const {settings, markedDates, salarySettings, monthlySalarySettings} = storeToRefs(userStore);


// 组件状态初始化
const today = new Date();  // 获取当前日期
const currentYear = ref(today.getFullYear());  // 当前年份
// JavaScript的月份从0开始计数
const currentMonth = ref(today.getMonth());    // 当前月份（0-11）
const attendancePerShift = ref(1.5);           // 每个班次的出勤天数（1.5天/班）
const monthSettingsPopup = ref(false);         // 月度工资设置弹窗显示状态
const showMonthPicker = ref(false);            // 月份选择器显示状态
const currentDateArray = ref([
  currentYear.value.toString(),
  (currentMonth.value + 1).toString().padStart(2, '0')
]); // 用于日期选择器的年月数组

// 从store获取数据
const startDate = computed(() => settings.value.startDate);  // 班次起始日期
const tasks = computed(() => settings.value.tasks);          // 任务列表

/**
 * 当前月份的key，格式为 "YYYY-MM"
 * 用于在monthlySalarySettings中查找对应月份的工资设置
 */
const currentMonthKey = computed(() => {
  // 确保月份始终是两位数
  const month = String(currentMonth.value + 1).padStart(2, '0');
  const key = `${currentYear.value}-${month}`;
  console.log(`计算当前月份键: ${key}`);
  return key;
});

/**
 * 当前月份对象，用于传递给子组件
 * 包含年份和月份数据
 */
const currentMonthObj = computed(() => ({
  year: currentYear.value,
  month: currentMonth.value
}));

/**
 * 检查当前月份是否有专属工资设置
 * 用于显示状态指示器和决定使用哪套工资设置
 */
const isCustomMonthSettings = computed(() => {
  return Array.isArray(monthlySalarySettings.value) &&
      monthlySalarySettings.value.some(item => item.month === currentMonthKey.value);
});

/**
 * 获取当前应该使用的工资设置
 * 优先使用月份专属设置，没有则使用默认设置
 */
const currentSalarySettings = computed(() => {
  // 如果没有月份专属设置，直接返回默认设置
  if (!isCustomMonthSettings.value) {
    return salarySettings.value;
  }

  // 从月份设置数组中查找当前月份的设置
  return monthlySalarySettings.value.find(
      item => item.month === currentMonthKey.value
  );


});

/**
 * 计算日基本工资
 * 公式：基本工资 / 30天 = 日薪
 */
const baseDailySalary = computed(() => {
  // 基本工资 / 30天 = 日薪
  const baseSalary = parseFloat(currentSalarySettings.value.baseSalary) || 0;
  return baseSalary / 30;
});

/**
 * 生成当月所有日期的详细信息
 * 包含每日的班次信息和标记状态
 */
const monthDays = computed(() => {
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  const days = [];

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value, i);
    const shiftInfo = getShiftInfo(date);
    const dateKey = formatDateKey(date);
    const markData = markedDates.value[dateKey];

    // 检查不同标记类型
    const isMarkedLeave = markData && markData.leave === true;
    const isMarkedDouble = markData && markData.double === true;
    const isMarkedOvertime = markData && markData.overtime === true;
    const isMarkedDoubleOvertime = markData && markData.doubleOvertime === true;

    days.push({
      date,
      shiftInfo,
      isMarkedLeave,
      isMarkedDouble,
      isMarkedOvertime,
      isMarkedDoubleOvertime
    });
  }

  return days;
});

/**
 * 计算正常出勤天数（基本出勤，不考虑任何标记）
 * 只计算工作日（非休息日）的天数
 */
const normalAttendanceDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    // 只计算工作日（非休息日）的天数
    if (day.shiftInfo && !day.shiftInfo.isRest) {
      return total + attendancePerShift.value;
    }
    return total;
  }, 0);
});

/**
 * 计算请假天数
 * 只有工作日（非休息日）的请假才计入
 */
const leaveDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    if (day.isMarkedLeave) {
      return total + attendancePerShift.value; // 请假扣除1.5天
    }
    return total;
  }, 0);
});

/**
 * 计算双倍工资天数
 * 独立计算，无论是否请假或加班
 * 只有工作日（非休息日）才计算
 */
const extraDoubleDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    if (day.isMarkedDouble) {
      return total + attendancePerShift.value; // 双倍工资增加1.5天
    }
    return total;
  }, 0);
});

/**
 * 计算加班总天数
 * 包含普通加班和双倍加班,互不冲突
 */
const totalOvertimeDays = computed(() => {
  return monthDays.value.reduce((total, day) => {
    let a = 0
    // 普通加班
    if (day.isMarkedOvertime) {
      a = a + attendancePerShift.value; // 普通加班增加1.5天
    }
    // 双倍加班
    if (day.isMarkedDoubleOvertime) {
      a = a + (attendancePerShift.value * 2); // 双倍加班增加3天
    }
    return total + a;
  }, 0);
});

/**
 * 计算总出勤天数
 * 公式：基本出勤 - 请假 + 加班 + 双倍工资
 */
const totalAttendance = computed(() => {
  return normalAttendanceDays.value - leaveDays.value + totalOvertimeDays.value + extraDoubleDays.value;
});

/**
 * 计算出勤工资
 * 公式：日薪 × 总出勤天数
 */
const attendanceSalary = computed(() => {
  return baseDailySalary.value * totalAttendance.value;
});

/**
 * 计算预计工资总额
 * 公式：出勤工资 + 绩效 + 工龄 + 学历补贴 - 保险
 */
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

/**
 * 切换到上一个月
 * 处理年份和月份的边界情况
 */
function prevMonth() {
  if (currentMonth.value === 0) {
    currentYear.value--;
    currentMonth.value = 11;
  } else {
    currentMonth.value--;
  }
}

/**
 * 切换到下一个月
 * 处理年份和月份的边界情况
 */
function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++;
    currentMonth.value = 0;
  } else {
    currentMonth.value++;
  }
}

/**
 * 打开月度工资设置弹窗
 */
function editMonthSalarySettings() {
  monthSettingsPopup.value = true;
}

/**
 * 计算指定日期的班次和任务信息
 * @param {Date} date - 需要计算班次的日期
 * @returns {Object|null} 班次信息对象或null
 */
function getShiftInfo(date) {
  // 确保startDate是日期对象
  const startDateObj = new Date(startDate.value);
  startDateObj.setHours(0, 0, 0, 0);

  // 确保date是日期对象
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // 计算天数差异
  const msDiff = targetDate.getTime() - startDateObj.getTime();
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
  const task = tasks.value.find(t => t.id === taskId);
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

/**
 * 格式化日期为统一的字符串格式
 * @param {Date} date - 需要格式化的日期
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 处理月份选择
 * 更新currentYear和currentMonth
 */
function onMonthSelected(value) {
  console.log('选择的日期：', value);
  if (value && Array.isArray(value) && value.length >= 2) {
    // 从数组中提取年月
    const year = parseInt(value[0]);
    // 月份需要减1，因为JavaScript月份从0开始
    const month = parseInt(value[1]) - 1;
    
    currentYear.value = year;
    currentMonth.value = month;
    
    // 更新currentDateArray，确保同步
    currentDateArray.value = [
      year.toString(),
      (month + 1).toString().padStart(2, '0')
    ];
  }
  showMonthPicker.value = false;
}

// 监听年月变化，更新选择器数组
watch([currentYear, currentMonth], ([newYear, newMonth]) => {
  currentDateArray.value = [
    newYear.toString(),
    (newMonth + 1).toString().padStart(2, '0')
  ];
});

</script>

<style scoped>
/* 组件容器样式 */
.salary-calculator {
  padding: 16px;
}

/* 标题样式 */
h2 {
  text-align: center;
  margin-bottom: 16px;
  color: #4caf50;
}

/* 工资容器样式 */
.salary-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
}

/* 月份选择器样式 */
.month-selector {
  padding: 16px;
  border-bottom: 1px solid #f2f2f2;
}

/* 月份导航样式 */
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

/* 工资设置状态样式 */
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

/* 工资详情样式 */
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

/* 操作按钮样式 */
.salary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

/* 信息卡片样式 */
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

/* 弹窗相关样式 */
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

/* 响应式样式 */
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

.month-display {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.month-display:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.month-display:active {
  background-color: rgba(0, 0, 0, 0.1);
}
</style> 