<template>
  <div class="attendance-manager">
    <h2>出勤管理</h2>
    
    <div class="attendance-container">
      <div class="month-selector">
        <button @click="prevMonth">&lt;</button>
        <span>{{ currentYear }}年{{ currentMonth + 1 }}月</span>
        <button @click="nextMonth">&gt;</button>
      </div>
      
      <div class="attendance-summary">
        <div class="summary-card">
          <div class="summary-title">当月出勤天数</div>
          <div class="summary-value">{{ attendanceDays.toFixed(1) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">其中请假天数</div>
          <div class="summary-value">{{ leaveDays.toFixed(1) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">其中加班天数</div>
          <div class="summary-value">{{ overtimeDays.toFixed(1) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">其中双倍天数</div>
          <div class="summary-value">{{ doubleDays.toFixed(1) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">预计工资</div>
          <div class="summary-value">{{ calculatedSalary.toFixed(2) }}元</div>
        </div>
      </div>
      
      <div class="attendance-details">
        <div class="attendance-table">
          <div class="table-header">
            <div class="header-cell">日期</div>
            <div class="header-cell">班次</div>
            <div class="header-cell">出勤天数</div>
            <div class="header-cell">标记</div>
          </div>
          <div v-for="(day, index) in monthDays" :key="index" class="table-row">
            <div class="cell date-cell">{{ formatDate(day.date) }}</div>
            <div class="cell shift-cell" :class="day.shiftInfo ? day.shiftInfo.taskClass : ''">
              {{ day.shiftInfo ? `${day.shiftInfo.taskName}${getShiftTypeText(day.shiftInfo)}` : '-' }}
            </div>
            <div class="cell days-cell">{{ formatAttendanceDays(day) }}</div>
            <div class="cell mark-cell">
              <div class="mark-buttons">
                <button 
                  :class="['mark-button', 'leave-button', day.isMarkedLeave ? 'active' : '']" 
                  @click="toggleMarkDay(day, 'leave')"
                >
                  请假
                </button>
                <button 
                  :class="['mark-button', 'overtime-button', day.isMarkedOvertime ? 'active' : '']" 
                  @click="toggleMarkDay(day, 'overtime')"
                >
                  加班
                </button>
                <button 
                  :class="['mark-button', 'double-button', day.isMarkedDouble ? 'active' : '']" 
                  @click="toggleMarkDay(day, 'double')"
                >
                  双倍
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AttendanceManager',
  props: {
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
    }
  },
  data() {
    const today = new Date();
    return {
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth(),
      attendancePerShift: 1.5 // 每个班次的出勤天数
    };
  },
  computed: {
    // 获取当月所有日期
    monthDays() {
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const days = [];
      
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(this.currentYear, this.currentMonth, i);
        const shiftInfo = this.getShiftInfo(date);
        const dateKey = this.formatDateKey(date);
        const markInfo = this.markedDates[dateKey] || {};
        
        days.push({
          date,
          shiftInfo,
          isMarkedLeave: markInfo.type === 'leave',
          isMarkedDouble: markInfo.type === 'double',
          isMarkedOvertime: markInfo.type === 'overtime'
        });
      }
      
      return days;
    },
    
    // 当月出勤天数
    attendanceDays() {
      return this.monthDays.reduce((total, day) => {
        return total + this.calculateAttendanceDays(day);
      }, 0);
    },
    
    // 请假天数
    leaveDays() {
      return this.monthDays.reduce((total, day) => {
        if (day.isMarkedLeave) {
          return total + (day.shiftInfo ? this.attendancePerShift : 0);
        }
        return total;
      }, 0);
    },
    
    // 加班天数
    doubleDays() {
      return this.monthDays.reduce((total, day) => {
        if (day.isMarkedDouble) {
          return total + (day.shiftInfo && !day.shiftInfo.isRest ? this.attendancePerShift : 0);
        }
        return total;
      }, 0);
    },
    
    // 加班天数
    overtimeDays() {
      return this.monthDays.reduce((total, day) => {
        if (day.isMarkedOvertime) {
          return total + (day.shiftInfo && !day.shiftInfo.isRest ? this.attendancePerShift : 0);
        }
        return total;
      }, 0);
    },
    
    // 计算工资
    calculatedSalary() {
      // 根据公式: (底薪/30)*出勤天数+绩效+工龄-保险
      const baseDailySalary = this.salarySettings.baseSalary / 30;
      const attendanceSalary = baseDailySalary * this.attendanceDays;
      
      return attendanceSalary + 
             this.salarySettings.performance + 
             this.salarySettings.seniority - 
             this.salarySettings.insurance;
    }
  },
  methods: {
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentYear--;
        this.currentMonth = 11;
      } else {
        this.currentMonth--;
      }
    },
    
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentYear++;
        this.currentMonth = 0;
      } else {
        this.currentMonth++;
      }
    },
    
    formatDate(date) {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    
    formatDateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    getShiftTypeText(shiftInfo) {
      if (shiftInfo.isDay) return '白班';
      if (shiftInfo.isNight) return '夜班';
      if (shiftInfo.isRest) return '休息日';
      return '';
    },
    
    formatAttendanceDays(day) {
      if (!day.shiftInfo || day.shiftInfo.isRest) {
        return '0.0';
      }
      
      let days = this.attendancePerShift;
      
      if (day.isMarkedLeave) {
        days = 0;
      } else if (day.isMarkedDouble) {
        days = this.attendancePerShift * 2;
      } else if (day.isMarkedOvertime) {
        days = this.attendancePerShift * 2;
      }
      
      return days.toFixed(1);
    },
    
    calculateAttendanceDays(day) {
      if (!day.shiftInfo || day.shiftInfo.isRest) {
        return 0;
      }
      
      if (day.isMarkedLeave) {
        return 0;
      } else if (day.isMarkedDouble) {
        return this.attendancePerShift * 2;
      } else if (day.isMarkedOvertime) {
        return this.attendancePerShift * 2;
      } else {
        return this.attendancePerShift;
      }
    },
    
    toggleMarkDay(day, type) {
      // 使用eslint-disable-next-line禁用下一行的no-unused-vars警告
      // eslint-disable-next-line no-unused-vars
      const dateKey = this.formatDateKey(day.date);
      
      this.$parent.markDate(day.date, type);
      
      if (type === 'leave') {
        day.isMarkedLeave = !day.isMarkedLeave;
        if (day.isMarkedLeave) {
          day.isMarkedDouble = false;
          day.isMarkedOvertime = false;
        }
      } else if (type === 'double') {
        day.isMarkedDouble = !day.isMarkedDouble;
        if (day.isMarkedDouble) {
          day.isMarkedLeave = false;
          day.isMarkedOvertime = false;
        }
      } else if (type === 'overtime') {
        day.isMarkedOvertime = !day.isMarkedOvertime;
        if (day.isMarkedOvertime) {
          day.isMarkedLeave = false;
          day.isMarkedDouble = false;
        }
      }
    },
    
    // 从ShiftCalendar.vue复制的班次计算逻辑
    getShiftInfo(date) {
      // 计算从开始日期到当前日期的总天数
      const startDateCopy = new Date(this.startDate);
      startDateCopy.setHours(0, 0, 0, 0);
      
      const dateCopy = new Date(date);
      dateCopy.setHours(0, 0, 0, 0);
      
      const msDiff = dateCopy.getTime() - startDateCopy.getTime();
      const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
      
      // 18天完整循环：
      // 每个任务连续3天（白班→夜班→休息日），然后切换到下一个任务
      
      // 计算在18天循环中的位置 (0-17)
      const position = ((daysDiff % 18) + 18) % 18;
      
      // 计算当前任务ID (1-6)
      const taskId = Math.floor(position / 3) + 1;
      
      // 计算当前班次类型
      const cyclePosition = position % 3;
      
      // 添加防错处理
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) {
        return null;
      }
      
      // 确定是白班、夜班还是休息日
      const isDay = cyclePosition === 0;
      const isRest = cyclePosition === 2;
      const isNight = cyclePosition === 1;
      
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
  }
};
</script>

<style scoped>
.attendance-manager {
  max-width: 100%;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

.attendance-container {
  background: #f8f9fa;
  padding: 1.2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.month-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}

.month-selector button {
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  margin: 0 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.month-selector button:hover {
  background: #e0e0e0;
}

.month-selector span {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
}

.attendance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.8rem;
}

.summary-card {
  background: white;
  padding: 1.2rem;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  text-align: center;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-3px);
}

.summary-title {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.7rem;
}

.summary-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #4caf50;
}

.attendance-details {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  background: #f5f5f5;
  font-weight: bold;
}

.header-cell {
  padding: 0.9rem;
  text-align: center;
  border-bottom: 1px solid #eee;
  color: #444;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.table-row:hover {
  background: #f9f9f9;
}

.table-row:last-child {
  border-bottom: none;
}

.cell {
  padding: 0.8rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-cell {
  font-weight: bold;
  color: #333;
}

.shift-cell {
  border-radius: 6px;
  margin: 0 0.5rem;
  min-width: 70px;
}

.mark-buttons {
  display: flex;
  gap: 0.5rem;
}

.mark-button {
  padding: 0.3rem 0.7rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  font-weight: 500;
}

.leave-button {
  background: #ffebee;
  color: #c62828;
}

.overtime-button {
  background: #fff3e0;
  color: #e65100;
}

.double-button {
  background: #e3f2fd;
  color: #0d47a1;
}

.mark-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.mark-button.active {
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.leave-button.active {
  background: #ef5350;
  color: white;
}

.overtime-button.active {
  background: #ff9800;
  color: white;
}

.double-button.active {
  background: #2196f3;
  color: white;
}

/* 任务颜色类 */
.task-1 {
  background: #e3f2fd;
  color: #0d47a1;
}

.task-2 {
  background: #e8f5e9;
  color: #1b5e20;
}

.task-3 {
  background: #fff9c4;
  color: #f57f17;
}

.task-4 {
  background: #ffebee;
  color: #b71c1c;
}

.task-5 {
  background: #e8eaf6;
  color: #1a237e;
}

.task-6 {
  background: #f3e5f5;
  color: #4a148c;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .attendance-container {
    padding: 0.8rem;
  }
  
  .attendance-summary {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.8rem;
  }
  
  .summary-card {
    padding: 0.8rem;
  }
  
  .summary-value {
    font-size: 1.4rem;
  }
  
  .header-cell, .cell {
    padding: 0.6rem 0.3rem;
    font-size: 0.85rem;
  }
  
  .mark-buttons {
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .mark-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .table-header, .table-row {
    grid-template-columns: 0.8fr 1fr 0.6fr 0.8fr;
  }
}
</style> 