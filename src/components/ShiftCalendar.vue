<template>
  <div class="shift-calendar">
    <div class="calendar-header">
      <div class="month-navigation">
        <van-button size="small" @click="prevMonth">
          <van-icon name="arrow-left"/>
        </van-button>
        <span class="month-display" @click="showMonthPicker = true">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
        <van-button size="small" @click="nextMonth">
          <van-icon name="arrow"/>
        </van-button>
      </div>

      <div class="buttons">
        <van-button plain size="small" type="primary" @click="goToToday" class="today-btn">
          <van-icon name="calendar-o" class="btn-icon"/>
          <span class="btn-text">今天</span>
        </van-button>
      </div>
    </div>

    <div class="calendar-grid">
      <div class="weekday-header">
        <div v-for="day in weekdays" :key="day" class="weekday-cell">{{ day }}</div>
      </div>

      <div class="calendar-body">
        <div
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="['calendar-cell', getDayClasses(day)]"
        >
          <div class="date-header">
            <div class="date-number">{{ day.date }}</div>
            <div class="lunar-date">{{ day.lunarDate }}</div>
          </div>

          <div v-if="day.task" class="task-info">
            <div class="task-name">{{ day.task.taskName }}</div>
            <div class="shift-type">{{ day.task.isDay ? '白' : day.task.isNight ? '夜' : '休' }}</div>
          </div>
        </div>
      </div>
    </div>

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
import {computed, onMounted, ref} from 'vue';
import {useUserStore} from '@/stores/user';
import {storeToRefs} from 'pinia';
import {Solar} from 'lunar-javascript';

// 使用用户store
const userStore = useUserStore();
const {settings} = storeToRefs(userStore);

// 响应式状态
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const showMonthPicker = ref(false); // 月份选择器显示状态
const currentDateArray = ref([
  currentYear.value.toString(),
  (currentMonth.value + 1).toString().padStart(2, '0')
]); // 用于日期选择器的年月数组

// 从store中获取数据
const startDate = computed(() => settings.value.startDate);
const initialTaskId = computed(() => settings.value.initialTaskId);
const tasks = computed(() => settings.value.tasks);

// 计算属性
const weekdays = computed(() => ['日', '一', '二', '三', '四', '五', '六']);

// 获取农历日期
function getLunarDate(date) {
  try {
    // 创建阳历对象
    const solar = Solar.fromDate(date);
    // 转换为农历
    const lunar = solar.getLunar();

    // 获取农历日期
    let lunarDay = lunar.getDayInChinese();

    // 如果是农历月的第一天，显示月份
    if (lunar.getDay() === 1) {
      return lunar.getMonthInChinese() + '月';
    }

    // 判断是否是节气
    const term = lunar.getJieQi();
    if (term) {
      // 确保节气名称不超过4个字
      return term.length > 4 ? term.substring(0, 4) + '..' : term;
    }

    // 判断是否是农历节日
    const festivals = lunar.getFestivals();
    if (festivals.length > 0) {
      // 只取第一个节日，并缩短显示
      const festival = festivals[0];
      // 限制节日名称长度，超过4个字就截断
      return festival.length > 4 ? festival.substring(0, 4) + '..' : festival;
    }

    // 判断是否是公历节日
    const solarFestivals = solar.getFestivals();
    if (solarFestivals.length > 0) {
      // 只取第一个节日，并缩短显示
      const festival = solarFestivals[0];
      // 限制节日名称长度，超过4个字就截断
      return festival.length > 4 ? festival.substring(0, 4) + '..' : festival;
    }

    return lunarDay;
  } catch (e) {
    console.error('农历转换失败', e);
    return '';
  }
}

// 计算当前月份的日历天数
const calendarDays = computed(() => {
  const result = [];

  // 获取当前月的第一天
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1);

  // 获取当前月的天数
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();

  // 获取当前月第一天是星期几 (0-6, 0 is Sunday)
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 上一个月的最后几天
  const lastDayOfLastMonth = new Date(currentYear.value, currentMonth.value, 0).getDate();

  // 填充上个月的日期
  for (let i = 0; i < firstDayOfWeek; i++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, lastDayOfLastMonth - firstDayOfWeek + i + 1);
    result.push(createDayObject(date, false));
  }

  // 填充当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i);
    result.push(createDayObject(date, true));
  }

  // 填充下个月的日期
  const remainingSlots = 42 - result.length; // 6 rows * 7 days = 42
  for (let i = 1; i <= remainingSlots; i++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, i);
    result.push(createDayObject(date, false));
  }

  return result;
});

// 创建日期对象
function createDayObject(date, isCurrentMonth) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 计算这一天的任务和班次
  const {taskId, shift} = calculateShiftForDate(date);

  // 获取任务对象
  const task = tasks.value.find(t => t.id === taskId);

  // 格式化日期作为key
  const fullDate = new Date(date);
  fullDate.setHours(0, 0, 0, 0);

  // 检查班次类型
  const isDay = shift === '白班';
  const isNight = shift === '夜班';
  const isRest = shift === '休息';

  // 获取农历日期
  const lunarDate = getLunarDate(date);

  return {
    date: date.getDate(),
    fullDate: fullDate,
    lunarDate: lunarDate,
    isCurrentMonth: isCurrentMonth,
    isToday: date.getTime() === today.getTime(),
    taskId: taskId,
    taskName: task ? task.name : '未知',
    taskClass: task ? task.taskClass : '',
    shift: shift,
    // 班次类型
    isDay: isDay,
    isNight: isNight,
    isRest: isRest,
    // 设置任务信息
    task: {
      taskName: task ? task.name : '未知',
      taskClass: task ? task.taskClass : '',
      isDay: isDay,
      isNight: isNight,
      isRest: isRest
    }
  };
}

// 计算指定日期的班次和任务
function calculateShiftForDate(date) {
  // 确保startDate是日期对象
  const startDateObj = new Date(startDate.value);
  startDateObj.setHours(0, 0, 0, 0);

  // 确保date是日期对象
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // 计算从startDate到targetDate的天数
  const msDiff = targetDate.getTime() - startDateObj.getTime();
  const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

  // 倒班规则: 每18天一个完整循环，每个任务持续3天
  // 计算在18天循环中的位置 (0-17)
  const positionInCycle = ((daysDiff % 18) + 18) % 18;

  // 获取初始任务ID (1-6)
  const initialTaskIdValue = initialTaskId.value || 1;

  // 计算任务偏移量
  const taskOffset = positionInCycle / 3 | 0; // 整除，得到0-5

  // 计算实际任务ID (1-6)
  let taskId = ((initialTaskIdValue - 1 + taskOffset) % 6) + 1;

  // 获取在3天子循环中的位置 (0, 1, 2)
  const positionInTask = positionInCycle % 3;

  // 确定班次类型
  let shift;
  if (positionInTask === 0) {
    shift = '白班';
  } else if (positionInTask === 1) {
    shift = '夜班';
  } else {
    shift = '休息';
  }

  return {taskId, shift};
}

// 上个月
function prevMonth() {
  if (currentMonth.value === 0) {
    currentYear.value--;
    currentMonth.value = 11;
  } else {
    currentMonth.value--;
  }
}

// 下个月
function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++;
    currentMonth.value = 0;
  } else {
    currentMonth.value++;
  }
}

// 跳转到今天
function goToToday() {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
}

// 月份选择器确认事件
function onMonthSelected(values) {
  if (values && values.length >= 2) {
    currentYear.value = parseInt(values[0], 10);
    currentMonth.value = parseInt(values[1], 10) - 1;
    showMonthPicker.value = false;
  }
}

// 组件挂载后
onMounted(() => {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
});

// 获取日期的CSS类
function getDayClasses(day) {
  const classes = [];

  if (day.isCurrentMonth) {
    classes.push('current-month');
  } else {
    classes.push('other-month');
  }

  if (day.isToday) {
    classes.push('today');
  }

  // 添加任务类
  if (day.taskClass) {
    classes.push(day.taskClass);
  }

  // 添加班次类
  if (day.isDay) {
    classes.push('day-shift');
  } else if (day.isNight) {
    classes.push('night-shift');
  } else if (day.isRest) {
    classes.push('rest-day');
  }

  return classes;
}
</script>

<style scoped>
/* 日历容器样式 */
.shift-calendar {
  width: 100%;
  max-width: 100%;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 覆盖Vant按钮样式 */
:deep(.van-button) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.van-button__content) {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 日历头部样式 */
.calendar-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.month-display {
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  min-width: 140px;
  text-align: center;
  color: white;
  transition: all 0.2s ease;
}

.month-display:hover {
  transform: scale(1.05);
}

.buttons {
  display: flex;
  gap: 10px;
}

/* 今天按钮样式 */
.today-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 32px;
  white-space: nowrap;
}

.btn-icon {
  flex-shrink: 0;
}

.btn-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 日历网格容器 */
.calendar-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 星期头部样式 */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.weekday-cell {
  padding: 14px 8px;
  text-align: center;
  font-weight: 600;
  color: #444;
  font-size: 15px;
}

/* 周末特殊样式 */
.weekday-cell:first-child, 
.weekday-cell:last-child {
  color: #e53935;
}

/* 日历主体样式 */
.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr); /* 固定6行高度 */
  background-color: #fcfcfc;
}

/* 日历单元格样式 */
.calendar-cell {
  padding: 8px;
  border-right: 1px solid #eee;
  border-bottom: 1px solid #eee;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.25s ease;
  min-height: 80px; /* 确保最小高度 */
}

/* 桌面端日历单元格样式 */
@media (min-width: 769px) {
  .calendar-body {
    grid-auto-rows: minmax(100px, auto);
  }
  
  .calendar-cell {
    min-height: 100px;
    height: 100%;
  }
}

.calendar-cell:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  z-index: 5;
  background-color: rgba(76, 175, 80, 0.03);
}

.date-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px dashed rgba(0,0,0,0.05);
}

.date-number {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.lunar-date {
  font-size: 11px;
  color: #777;
  margin-top: 3px;
  max-width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 任务信息样式 */
.task-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  margin-top: auto;
  background-color: rgba(255,255,255,0.8);
  padding: 6px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  width: 100%;
}

.task-info:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.task-name {
  font-weight: 700;
  margin-bottom: 5px;
  color: #333;
  max-width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shift-type {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  background-color: #f5f5f5;
  color: #333;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  max-width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 日期状态样式 */
.calendar-cell.today {
  background-color: rgba(25, 118, 210, 0.07);
  box-shadow: inset 0 0 0 3px rgba(25, 118, 210, 0.3);
}

.calendar-cell.other-month {
  opacity: 0.35;
}

/* 班次颜色 */
.calendar-cell.day-shift .shift-type {
  background-color: #e8f5e9;
  color: #2e7d32;
  box-shadow: 0 1px 3px rgba(46, 125, 50, 0.2);
}

.calendar-cell.night-shift .shift-type {
  background-color: #e3f2fd;
  color: #1565c0;
  box-shadow: 0 1px 3px rgba(21, 101, 192, 0.2);
}

.calendar-cell.rest-day .shift-type {
  background-color: #fff3e0;
  color: #e65100;
  box-shadow: 0 1px 3px rgba(230, 81, 0, 0.2);
}

/* 任务颜色 */
.calendar-cell.task-1 {
  border-left: 5px solid #f44336;
}

.calendar-cell.task-2 {
  border-left: 5px solid #2196f3;
}

.calendar-cell.task-3 {
  border-left: 5px solid #4caf50;
}

.calendar-cell.task-4 {
  border-left: 5px solid #ff9800;
}

.calendar-cell.task-5 {
  border-left: 5px solid #9c27b0;
}

.calendar-cell.task-6 {
  border-left: 5px solid #795548;
}

/* 周末单元格样式 */
.calendar-cell:nth-child(7n+1), 
.calendar-cell:nth-child(7n) {
  background-color: rgba(0,0,0,0.02);
}

@media (max-width: 768px) {
  .calendar-cell {
    padding: 4px;
    min-height: 65px; /* 移动端较小的最小高度 */
    height: auto; /* 根据内容自适应高度 */
  }

  .calendar-body {
    grid-template-rows: auto; /* 移动端根据内容自适应行高 */
  }

  .date-number {
    font-size: 14px;
  }

  .lunar-date {
    font-size: 9px;
    margin-top: 1px;
  }

  .task-info {
    font-size: 12px;
    padding: 3px;
  }

  .shift-type {
    padding: 2px 6px;
    font-size: 10px;
  }
  
  .calendar-header {
    padding: 12px 8px;
  }
  
  .month-display {
    font-size: 16px;
    min-width: 100px;
  }
  
  .task-name {
    margin-bottom: 3px;
    font-size: 11px;
  }
  
  /* 移动端按钮样式优化 */
  .today-btn {
    padding: 0 8px;
    height: 28px;
    font-size: 12px;
  }
  
  .btn-text {
    max-width: 36px;
  }
  
  .month-navigation {
    gap: 8px;
  }
}

/* 特别小的屏幕额外适配 */
@media (max-width: 480px) {
  .weekday-cell {
    padding: 8px 2px;
    font-size: 12px;
  }
  
  .date-number {
    font-size: 12px;
  }
  
  .calendar-cell {
    padding: 2px;
  }
  
  .date-header {
    margin-bottom: 4px;
    padding-bottom: 2px;
  }
  
  .task-info {
    padding: 2px;
  }
  
  /* 超小屏幕按钮样式进一步优化 */
  .calendar-header {
    padding: 8px 6px;
  }
  
  .month-display {
    min-width: 80px;
    font-size: 14px;
  }
  
  .today-btn {
    padding: 0 6px;
    height: 24px;
    width: 24px; /* 变成正方形按钮 */
  }
  
  .btn-text {
    display: none; /* 极小屏幕下隐藏文字 */
  }
}

/* 在超窄屏幕上进一步优化 */
@media (max-width: 360px) {
  .month-display {
    min-width: 70px;
    font-size: 12px;
  }
  
  .calendar-header {
    padding: 6px 4px;
  }
}
</style> 