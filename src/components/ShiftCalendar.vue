<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <div class="calendar-controls">
        <van-button 
          type="primary" 
          size="small" 
          @click="previousMonth" 
          class="control-button"
        >
          上个月
        </van-button>
        <h2>{{ currentYear }}年{{ currentMonth + 1 }}月</h2>
        <van-button 
          type="primary" 
          size="small" 
          @click="nextMonth" 
          class="control-button"
        >
          下个月
        </van-button>
      </div>
      <div class="calendar-legend">
        <span v-for="task in tasks" :key="task.id" :class="['legend-item', task.taskClass]">
          {{ task.name }}
        </span>
      </div>
    </div>
    
    <div class="calendar-grid">
      <div class="calendar-weekdays">
        <span v-for="(day, index) in weekdays" :key="index">{{ day }}</span>
      </div>
      <div class="calendar-days">
        <div 
          v-for="day in days" 
          :key="day.date.toISOString()"
          :class="[
            'calendar-day', 
            { 'current-month': day.isCurrentMonth },
            { 'today': day.isToday },
            day.taskClass
          ]"
          @click="toggleDayDetails(day)"
        >
          <div class="day-number">{{ day.date.getDate() }}</div>
          <div class="day-info">
            <div class="day-task" v-if="day.taskName">{{ day.taskName }}</div>
            <div class="day-shift">{{ day.shift }}</div>
          </div>
          <div class="day-marks" v-if="hasMarks(day.date)">
            <div v-if="isMarked(day.date, 'leave')" class="mark-text mark-leave">调休</div>
            <div v-if="isMarked(day.date, 'double')" class="mark-text mark-double">双倍</div>
            <div v-if="isMarked(day.date, 'overtime')" class="mark-text mark-overtime">加班</div>
            <div v-if="isMarked(day.date, 'doubleOvertime')" class="mark-text mark-double-overtime">双倍加班</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 日期详情弹窗 -->
    <van-popup 
      v-model:show="showDayDetails" 
      position="bottom" 
      :style="{ height: '40%' }"
    >
      <div class="day-details" v-if="selectedDay">
        <div class="day-details-header">
          <h3>{{ formatDate(selectedDay.date) }}</h3>
          <van-button type="primary" size="small" @click="showDayDetails = false">关闭</van-button>
        </div>
        <div class="day-details-content">
          <div class="day-task-detail">
            <p><strong>班次:</strong> {{ selectedDay.taskName }} {{ selectedDay.shift }}</p>
            <p v-if="selectedDay.shift !== '休息'"><strong>休息时间:</strong> {{ getRestTime(selectedDay) }}</p>
            <p v-if="selectedDay.shift !== '休息'"><strong>就寝时间:</strong> {{ getSleepTime(selectedDay) }}</p>
          </div>
          <div class="day-marks-controls">
            <h4>标记</h4>
            <div class="mark-buttons">
              <van-button 
                :type="isMarked(selectedDay.date, 'leave') ? 'primary' : 'default'" 
                size="small" 
                @click="markDay(selectedDay.date, 'leave')"
              >
                调休/请假
              </van-button>
              <van-button 
                :type="isMarked(selectedDay.date, 'double') ? 'primary' : 'default'" 
                size="small" 
                @click="markDay(selectedDay.date, 'double')"
              >
                双倍工资
              </van-button>
              <van-button 
                :type="isMarked(selectedDay.date, 'overtime') ? 'primary' : 'default'" 
                size="small" 
                @click="markDay(selectedDay.date, 'overtime')"
              >
                加班
              </van-button>
              <van-button 
                :type="isMarked(selectedDay.date, 'doubleOvertime') ? 'primary' : 'default'" 
                size="small" 
                @click="markDay(selectedDay.date, 'doubleOvertime')"
              >
                双倍加班
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineProps, defineEmits } from 'vue';

// 定义组件属性
const props = defineProps({
  startDate: {
    type: Date,
    required: true
  },
  initialTaskId: {
    type: Number,
    default: 1
  },
  tasks: {
    type: Array,
    required: true
  },
  markedDates: {
    type: Object,
    default: () => ({})
  }
});

// 定义事件
const emit = defineEmits(['markDate']);

// 响应式状态
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const showDayDetails = ref(false);
const selectedDay = ref(null);

// 暴露属性给父组件
defineExpose({
  currentYear,
  currentMonth
});

// 计算属性
const weekdays = computed(() => ['日', '一', '二', '三', '四', '五', '六']);

// 计算当前月份的日历天数
const days = computed(() => {
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
  const { taskId, shift } = calculateShiftForDate(date);
  
  // 获取任务对象
  const task = props.tasks.find(t => t.id === taskId);
  
  return {
    date: date,
    isCurrentMonth: isCurrentMonth,
    isToday: date.getTime() === today.getTime(),
    taskId: taskId,
    taskName: task ? task.name : '未知',
    taskClass: task ? task.taskClass : '',
    shift: shift
  };
}

// 计算指定日期的班次和任务
function calculateShiftForDate(date) {
  // 确保startDate是日期对象
  const startDate = new Date(props.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  // 确保date是日期对象
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // 计算从startDate到targetDate的天数
  const msDiff = targetDate.getTime() - startDate.getTime();
  const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  
  // 倒班规则: 每18天一个完整循环，每个任务持续3天
  // 计算在18天循环中的位置 (0-17)
  const positionInCycle = ((daysDiff % 18) + 18) % 18;
  
  // 获取初始任务ID (1-6)
  const initialTaskId = props.initialTaskId || 1;
  
  // 计算任务偏移量
  const taskOffset = positionInCycle / 3 | 0; // 整除，得到0-5
  
  // 计算实际任务ID (1-6)
  let taskId = ((initialTaskId - 1 + taskOffset) % 6) + 1;
  
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
  
  return { taskId, shift };
}

// 切换到上个月
function previousMonth() {
  if (currentMonth.value === 0) {
    currentYear.value--;
    currentMonth.value = 11;
  } else {
    currentMonth.value--;
  }
}

// 切换到下个月
function nextMonth() {
  if (currentMonth.value === 11) {
    currentYear.value++;
    currentMonth.value = 0;
  } else {
    currentMonth.value++;
  }
}

// 打开日期详情
function toggleDayDetails(day) {
  selectedDay.value = day;
  showDayDetails.value = true;
}

// 格式化日期
function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 检查日期是否有标记
function hasMarks(date) {
  const dateKey = formatDateKey(date);
  return props.markedDates[dateKey] !== undefined;
}

// 检查特定标记
function isMarked(date, type) {
  const dateKey = formatDateKey(date);
  return props.markedDates[dateKey]?.[type] === true;
}

// 格式化日期键
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 标记日期
function markDay(date, type) {
  emit('markDate', date, type);
}

// 获取休息时间
function getRestTime(day) {
  if (day && day.taskId) {
    const task = props.tasks.find(t => t.id === day.taskId);
    return task ? task.restTime : '未知';
  }
  return '未知';
}

// 获取就寝时间
function getSleepTime(day) {
  if (day && day.taskId) {
    const task = props.tasks.find(t => t.id === day.taskId);
    return task ? task.sleepTime : '未知';
  }
  return '未知';
}

// 监听开始日期或初始任务ID的变化，更新日历
watch(() => [props.startDate, props.initialTaskId], () => {
  // 当startDate或initialTaskId改变时，重新计算日历
  // 日历会自动重新计算，因为days是计算属性
});

// 组件挂载后
onMounted(() => {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth();
});
</script>

<style scoped>
.calendar-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.calendar-header {
  padding: 16px 16px 8px;
}

.calendar-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.calendar-controls h2 {
  margin: 0;
  font-size: 1.2rem;
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.legend-item {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 4px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 4px;
  padding: 8px;
  flex: 1;
  overflow-y: auto;
}

.calendar-day {
  position: relative;
  min-height: 80px;
  padding: 8px 4px 4px;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  transform: scale(1.05);
  z-index: 1;
}

.calendar-day:not(.current-month) {
  opacity: 0.5;
}

.day-number {
  font-weight: bold;
  margin-bottom: 4px;
  text-align: center;
}

.day-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4px;
}

.day-task, .day-shift {
  font-size: 0.8rem;
  text-align: center;
}

.task-1 { background-color: #E6F7FF; }
.task-2 { background-color: #FFF7E6; }
.task-3 { background-color: #E6FFFB; }
.task-4 { background-color: #FCE6FF; }
.task-5 { background-color: #FFFBE6; }
.task-6 { background-color: #F5FFE6; }

.today {
  border: 2px solid #1890ff;
}

.day-marks {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: auto;
}

.mark-text {
  display: inline-block;
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
  width: 100%;
  text-align: center;
}

.mark-leave { 
  background-color: #722ed1;
  color: white;
}

.mark-double { 
  background-color: #fa8c16;
  color: white;
}

.mark-overtime { 
  background-color: #52c41a;
  color: white;
}

.mark-double-overtime { 
  background-color: #f5222d;
  color: white;
}

.day-details {
  padding: 16px;
}

.day-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.day-details-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-task-detail p {
  margin: 4px 0;
}

.day-marks-controls h4 {
  margin-bottom: 8px;
}

.mark-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .calendar-container {
    padding: 0;
    border-radius: 0;
    box-shadow: none;
    height: calc(100vh - 120px); /* 考虑顶部导航和底部菜单 */
    position: fixed;
    top: 120px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
  
  .calendar-header {
    padding: 8px 8px 4px;
  }
  
  .calendar-controls h2 {
    font-size: 1rem;
  }
  
  .calendar-legend {
    gap: 4px;
    margin-bottom: 4px;
  }
  
  .legend-item {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .calendar-weekdays span {
    font-size: 0.8rem;
  }
  
  .calendar-days {
    padding: 4px;
  }
  
  .calendar-day {
    min-height: 70px;
    padding: 4px 2px 2px;
  }
  
  .day-number {
    font-size: 0.8rem;
  }
  
  .day-task, .day-shift {
    font-size: 0.7rem;
  }
  
  .mark-text {
    font-size: 0.65rem;
    padding: 1px 2px;
  }
  
  .mark-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .day-details-header h3 {
    font-size: 1rem;
  }
  
  .day-task-detail p {
    font-size: 0.9rem;
  }
}
</style> 