<template>
  <div class="shift-settings">
    <h2>倒班设置</h2>
    
    <div class="settings-container">
      <div class="setting-section">
        <h3>快速设置（根据今天的班次调整）</h3>
        <div class="setting-item">
          <label>今天的任务：</label>
          <select v-model="todayTaskId" @change="adjustBasedOnToday">
            <option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.name }}</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>今天的班次：</label>
          <select v-model="todayShiftType" @change="adjustBasedOnToday">
            <option value="day">白班</option>
            <option value="night">夜班</option>
            <option value="rest">休息日</option>
          </select>
        </div>
      </div>
      
      <div class="info-section">
        <h3>任务睡觉时间</h3>
        <div class="info-item">
          <span class="info-label">一采:</span>
          <span class="info-value">23:00睡觉</span>
        </div>
        <div class="info-item">
          <span class="info-label">二采:</span>
          <span class="info-value">02:00睡觉</span>
        </div>
        <div class="info-item">
          <span class="info-label">三采:</span>
          <span class="info-value">21:00睡觉</span>
        </div>
        <div class="info-item">
          <span class="info-label">一休:</span>
          <span class="info-value">21:00睡觉</span>
        </div>
        <div class="info-item">
          <span class="info-label">二休:</span>
          <span class="info-value">02:00睡觉</span>
        </div>
        <div class="info-item">
          <span class="info-label">三休:</span>
          <span class="info-value">23:00睡觉</span>
        </div>
        <div class="info-item info-note">
          <span class="info-value">* 睡觉时间仅在夜班时显示</span>
        </div>
      </div>
      
      <div class="settings-actions">
        <button @click="saveSettings" class="save-button">保存设置</button>
        <button @click="resetToDefault" class="reset-button">恢复默认</button>
        <button @click="goToSalarySettings" class="salary-button">工资设置</button>
      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from 'vant';

export default {
  name: 'ShiftSettings',
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      todayTaskId: 1,
      todayShiftType: 'day',
      // 固定的任务配置
      tasks: [
        { id: 1, name: '一采', restTime: '3小时', sleepTime: '23:00', taskClass: 'task-1' },
        { id: 2, name: '二采', restTime: '2小时', sleepTime: '02:00', taskClass: 'task-2' },
        { id: 3, name: '三采', restTime: '休息', sleepTime: '21:00', taskClass: 'task-3' },
        { id: 4, name: '一休', restTime: '休息', sleepTime: '21:00', taskClass: 'task-4' },
        { id: 5, name: '二休', restTime: '休息', sleepTime: '02:00', taskClass: 'task-5' },
        { id: 6, name: '三休', restTime: '休息', sleepTime: '23:00', taskClass: 'task-6' }
      ]
    };
  },
  created() {
    // 初始化从父组件接收的数据
    if (this.value && this.value.initialTaskId) {
      this.todayTaskId = this.value.initialTaskId;
    }
  },
  methods: {
    adjustBasedOnToday() {
      // 使用18天循环模式计算设置
      const today = new Date();
      const taskId = parseInt(this.todayTaskId);
      
      // 验证任务ID
      if (isNaN(taskId) || taskId < 1 || taskId > 6) {
        console.error('无效的任务ID:', this.todayTaskId);
        return;
      }
      
      // 根据18天循环模式计算开始日期
      /*
       * 18天循环: 
       * 0-2天: 任务1(一采)的白班、夜班、休息日
       * 3-5天: 任务2(二采)的白班、夜班、休息日
       * 以此类推...
       */
      
      // 每个任务用3天，计算当前任务在循环中的起始位置
      const taskStartPosition = (taskId - 1) * 3;
      
      // 根据班次类型计算当前在这3天中的位置
      let dayOffset = 0;
      if (this.todayShiftType === 'day') {
        dayOffset = 0; // 白班是每个任务的第一天
      } else if (this.todayShiftType === 'night') {
        dayOffset = 1; // 夜班是每个任务的第二天
      } else if (this.todayShiftType === 'rest') {
        dayOffset = 2; // 休息日是每个任务的第三天
      }
      
      // 当前位置 = 任务起始位置 + 班次偏移
      const currentPosition = taskStartPosition + dayOffset;
      
      // 计算开始日期
      // 开始日期 = 今天 - currentPosition
      let startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0); // 确保是当天的零点
      startDate.setDate(startDate.getDate() - currentPosition);
      
      console.log(`计算设置: 今天是${this.tasks.find(t => t.id === taskId).name}的${this.todayShiftType}，` + 
                  `在18天循环中的位置是${currentPosition}，` +
                  `开始日期=${startDate.toISOString()}`);
      
      // 更新设置
      this.emitSettingsChange(startDate);
    },
    
    emitSettingsChange(startDate) {
      // 验证
      if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.error('无效的开始日期:', startDate);
        startDate = new Date(); // 使用今天作为后备
        startDate.setHours(0, 0, 0, 0); // 确保是当天的零点
      }
      
      this.$emit('input', {
        startDate,
        initialTaskId: 1, // 固定为1，因为我们总是从一采开始计算
        tasks: this.tasks
      });
    },
    
    saveSettings() {
      // 使用18天循环模式保存设置
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 确保是当天的零点
      const taskId = parseInt(this.todayTaskId);
      
      // 验证任务ID
      if (isNaN(taskId) || taskId < 1 || taskId > 6) {
        console.error('无效的任务ID');
        showToast({
          type: 'fail',
          message: '请选择有效的任务'
        });
        return;
      }
      
      // 计算在18天循环中的位置
      const taskStartPosition = (taskId - 1) * 3;
      
      // 根据班次类型计算偏移
      let dayOffset = 0;
      if (this.todayShiftType === 'day') {
        dayOffset = 0; // 白班是第一天
      } else if (this.todayShiftType === 'night') {
        dayOffset = 1; // 夜班是第二天
      } else if (this.todayShiftType === 'rest') {
        dayOffset = 2; // 休息日是第三天
      }
      
      // 计算当前位置和开始日期
      const currentPosition = taskStartPosition + dayOffset;
      let startDate = new Date(today);
      startDate.setDate(startDate.getDate() - currentPosition);
      
      // 验证计算出的开始日期
      if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.error('计算得到无效的开始日期:', startDate);
        showToast({
          type: 'fail',
          message: '设置保存失败: 日期计算错误'
        });
        return;
      }
      
      // 创建新的设置对象
      const settings = {
        startDate: startDate,  // 保持为Date对象
        initialTaskId: 1       // 固定为1，因为循环总是从一采开始
      };
      
      console.log('保存设置:', settings, 
                 `(今天是${this.tasks.find(t => t.id === taskId).name}的${this.todayShiftType}，` +
                 `18天循环位置=${currentPosition})`);
                 
      // 触发保存事件，传递设置对象给父组件
      this.$emit('saved', settings);
    },
    
    resetToDefault() {
      // 恢复默认设置
      this.todayTaskId = 1;
      this.todayShiftType = 'day';
      
      const defaultStartDate = new Date();
      defaultStartDate.setHours(0, 0, 0, 0); // 确保是当天的零点
      this.emitSettingsChange(defaultStartDate);
    },
    
    formatDateForInput(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    goToSalarySettings() {
      this.$emit('goToSalarySettings');
    }
  }
};
</script>

<style scoped>
.shift-settings {
  max-width: 100%;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

.settings-container {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

.setting-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.setting-section h3, .info-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #4caf50;
}

.setting-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.setting-item label {
  min-width: 100px;
  margin-right: 1rem;
  font-weight: bold;
}

.setting-item select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.info-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.info-item {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.info-label {
  min-width: 100px;
  font-weight: bold;
}

.info-value {
  color: #333;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.save-button,
.reset-button,
.salary-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
}

.save-button {
  background: #4caf50;
  color: white;
}

.reset-button {
  background: #f44336;
  color: white;
}

.salary-button {
  background: #2196F3;
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

.info-note {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .settings-container {
    padding: 0.5rem;
  }
  
  .setting-section, .info-section {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .setting-item label {
    margin-bottom: 0.25rem;
    margin-right: 0;
  }
  
  .setting-item select {
    width: 100%;
  }
  
  .info-item {
    margin-bottom: 0.25rem;
  }
  
  .settings-actions {
    flex-direction: column;
  }
  
  .save-button, .reset-button, .salary-button {
    width: 100%;
    margin: 0.25rem 0;
    padding: 0.75rem;
  }
}
</style> 