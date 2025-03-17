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
        <van-button plain size="small" type="primary" @click="goToToday">
          <van-icon name="calendar-o"/>
          <span>今天</span>
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
            @click="handleDayClick(day)"
        >
          <div class="date-header">
            <div class="date-number">{{ day.date }}</div>
            <div class="lunar-date">{{ day.lunarDate }}</div>
          </div>

          <div v-if="day.task" class="task-info">
            <div class="task-name">{{ day.task.taskName }}</div>
            <div class="shift-type">{{ day.task.isDay ? '白班' : day.task.isNight ? '夜班' : '休息' }}</div>
            <div v-if="day.task.isNight" class="sleep-time">
              {{ day.task.sleepTime }}睡觉
            </div>
          </div>

          <div v-if="getDayMark(day.fullDate)" class="date-marks">
            <div
                v-for="markType in getMarkTypes(day.fullDate)"
                :key="markType"
                :class="`mark-${markType}`"
                class="date-mark"
            >
              {{ getMarkLabel(markType) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <van-action-sheet v-model:show="showDayDetails" :actions="dayActions" cancel-text="取消" close-on-click-action
                      @select="onActionSelect"/>

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
import {computed, onMounted, ref, watch} from 'vue';
import {useUserStore} from '@/stores/user';
import {storeToRefs} from 'pinia';
import {Solar} from 'lunar-javascript';

// 使用用户store
const userStore = useUserStore();
const {settings, markedDates} = storeToRefs(userStore);


// 响应式状态
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const showDayDetails = ref(false);
const selectedDay = ref(null);
const showMonthPicker = ref(false); // 月份选择器显示状态
const currentDateArray = ref([
  currentYear.value.toString(),
  (currentMonth.value + 1).toString().padStart(2, '0')
]); // 用于日期选择器的年月数组

// 从store中获取数据
const startDate = computed(() => settings.value.startDate);
const initialTaskId = computed(() => settings.value.initialTaskId);
const tasks = computed(() => settings.value.tasks);

// 操作菜单
const dayActions = computed(() => {
  if (!selectedDay.value) return [];

  return [
    {name: '标记休假', value: 'mark-leave'},
    {name: '标记加班', value: 'mark-overtime'},
    {name: '标记双倍工资', value: 'mark-double'},
    {name: '标记双倍加班', value: 'mark-doubleOvertime'}
  ];
});


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
      return term;
    }

    // 判断是否是农历节日
    const festivals = lunar.getFestivals();
    if (festivals.length > 0) {
      // 只取第一个节日，并缩短显示
      const festival = festivals[0];
      // 如果节日名称太长，取前2个字
      return festival.length > 2 ? festival.substring(0, 15) : festival;
    }

    // 判断是否是公历节日
    const solarFestivals = solar.getFestivals();
    if (solarFestivals.length > 0) {
      // 只取第一个节日，并缩短显示
      const festival = solarFestivals[0];
      // 如果节日名称太长，取前2个字
      return festival.length > 2 ? festival.substring(0, 15) : festival;
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
    // 设置任务和睡觉时间
    task: {
      taskName: task ? task.name : '未知',
      taskClass: task ? task.taskClass : '',
      isDay: isDay,
      isNight: isNight,
      isRest: isRest,
      sleepTime: task ? task.sleepTime : ''
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





// 格式化日期为键
function formatDateKey(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 标记日期
function markDay(date, type) {
  if (!date) return;

  // 确保日期格式统一（YYYY-MM-DD）
  const dateKey = formatDateKey(date);

  // 获取当前日期的标记
  let currentMarks = markedDates.value[dateKey] || {};

  // 如果当前不是对象，初始化为空对象
  if (typeof currentMarks !== 'object') {
    currentMarks = {};
  }

  // 切换指定类型的标记
  if (currentMarks[type]) {
    // 如果已有此标记，则移除
    currentMarks[type] = false;
  } else {
    // 如果没有此标记，则添加
    currentMarks[type] = true;
  }

  // 如果所有标记都为false，则删除该日期的整个标记对象
  const hasActiveMarks = Object.values(currentMarks).some(val => val === true);

  if (!hasActiveMarks) {
    delete markedDates.value[dateKey];
  } else {
    // 更新标记
    markedDates.value[dateKey] = currentMarks;
  }

  // 调用store的保存方法
  userStore.saveUserData();
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

  // 添加标记类
  const markTypes = getMarkTypes(day.fullDate);
  if (markTypes.length > 0) {
    markTypes.forEach(markType => {
      classes.push(`has-mark-${markType}`);
    });
  }

  return classes;
}

// 获取日期的标记
function getDayMark(date) {
  if (!date) return null;

  const dateKey = formatDateKey(date);
  return markedDates.value[dateKey];
}


// 处理日期点击
function handleDayClick(day) {
  selectedDay.value = day;
  showDayDetails.value = true;
}

// 处理动作选择
function onActionSelect(action) {
  if (!selectedDay.value) return;

  const date = selectedDay.value.fullDate;

  if (action.value.startsWith('mark-')) {
    // 标记类型
    const markType = action.value.split('-')[1];
    markDay(date, markType);
  }

  // 关闭动作面板
  showDayDetails.value = false;
}

// 跳转到今天
function goToToday() {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
}

// 获取标记的显示文本
function getMarkLabel(markType) {
  switch (markType) {
    case 'leave':
      return '休假';
    case 'overtime':
      return '加班';
    case 'double':
      return '双倍';
    case 'doubleOvertime':
      return '双倍加班';
    default:
      return markType;
  }
}

// 获取日期的所有标记类型数组
function getMarkTypes(date) {
  if (!date) return [];

  const dateKey = formatDateKey(date);
  const mark = markedDates.value[dateKey];

  if (!mark || typeof mark !== 'object') return [];

  return Object.keys(mark).filter(key => mark[key] === true);
}

// 处理月份选择
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
.shift-calendar {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.calendar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: #f9f9f9;
  position: sticky;
  top: 0;
  z-index: 30;
}

.month-navigation {
  display: flex;
  align-items: center;
}

.month-navigation span {
  margin: 0 16px;
  font-size: 1.2rem;
  font-weight: 500;
}

.buttons {
  display: flex;
  align-items: center;
}

.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  padding: 10px 0;
  background-color: #f9f9f9;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 60px;
  z-index: 29;
}

.weekday-cell {
  font-size: 0.9rem;
}

.calendar-body {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 6px;
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
}

.calendar-cell {
  position: relative;
  min-height: 85px;
  padding: 6px;
  border-radius: 8px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.calendar-cell:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.calendar-cell:not(.current-month) {
  opacity: 0.4;
}

.date-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4px;
  padding-bottom: 2px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.05);
}

.date-number {
  font-weight: bold;
  font-size: 0.95rem;
  text-align: center;
}

.lunar-date {
  font-size: 0.7rem;
  color: #888;
  text-align: center;
  margin-top: 1px;
}

.task-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.task-name, .shift-type {
  font-size: 0.8rem;
  text-align: center;
  margin-bottom: 2px;
  width: 100%;
}

.task-1 {
  background-color: #E6F7FF;
}

.task-2 {
  background-color: #FFF7E6;
}

.task-3 {
  background-color: #E6FFFB;
}

.task-4 {
  background-color: #FCE6FF;
}

.task-5 {
  background-color: #FFFBE6;
}

.task-6 {
  background-color: #F5FFE6;
}

.today {
  border: 2px solid #1890ff;
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.3);
}

.sleep-time {
  font-size: 0.7rem;
  text-align: center;
  color: #666;
}

/* 标记样式 */
.date-marks {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px dashed rgba(0, 0, 0, 0.05);
}

.date-mark {
  font-size: 0.65rem;
  padding: 1px 3px;
  border-radius: 3px;
  color: white;
  font-weight: bold;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.mark-leave {
  background-color: #f44336; /* 红色 - 休假 */
}

.mark-overtime {
  background-color: #4caf50; /* 绿色 - 加班 */
}

.mark-double {
  background-color: #ff9800; /* 橙色 - 双倍工资 */
}

.mark-doubleOvertime {
  background-color: #9c27b0; /* 紫色 - 双倍加班 */
}

@media (max-width: 768px) {
  .shift-calendar {
    border-radius: 0;
    box-shadow: none;
    height: auto;
    min-height: calc(100vh - 140px);
    background-color: transparent;
  }

  .calendar-header {
    padding: 10px 8px;
  }

  .month-navigation span {
    font-size: 1rem;
    margin: 0 8px;
  }

  .weekday-header {
    padding: 8px 0;
    top: 50px;
  }

  .weekday-cell {
    font-size: 0.8rem;
  }

  .calendar-body {
    padding: 8px 4px;
    grid-gap: 4px;
  }

  .calendar-cell {
    min-height: 75px;
    padding: 4px;
  }

  .date-header {
    margin-bottom: 2px;
    padding-bottom: 1px;
  }

  .date-number {
    font-size: 0.85rem;
  }

  .lunar-date {
    font-size: 0.6rem;
  }

  .task-name, .shift-type {
    font-size: 0.7rem;
  }

  .sleep-time {
    font-size: 0.65rem;
  }

  .date-marks {
    gap: 2px;
    padding-top: 2px;
  }

  .date-mark {
    font-size: 0.6rem;
    padding: 1px 2px;
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