<template>
  <div class="salary-settings">
    <div class="settings-header" v-if="month">
      <h2 v-if="typeof month === 'string'">{{ month.split('-')[0] }}年{{ month.split('-')[1] }}月专属工资设置</h2>
      <h2 v-else>{{ month.year }}年{{ month.month + 1 }}月专属工资设置</h2>
      <div class="settings-description">
        填写本月专属的工资项目，留空则沿用默认设置
      </div>
    </div>
    <div class="settings-header" v-else>
      <h2>默认工资设置</h2>
      <div class="settings-description">
        设置基础工资项目，作为所有月份的默认值
      </div>
    </div>

    <van-form class="settings-form" @submit="saveSettings">
      <div class="form-grid">
        <div class="form-item">
          <van-field
            v-model="formData.baseSalary"
            type="digit"
            label="底薪"
            placeholder="基本工资"
            :rules="[{ required: true, message: '请输入底薪' }]"
          >
            <template #right-icon>
              <div class="field-unit">元/月</div>
            </template>
          </van-field>
        </div>
        
        <div class="form-item">
          <van-field
            v-model="formData.performance"
            type="digit"
            label="绩效"
            placeholder="绩效工资"
            :rules="[{ required: true, message: '请输入绩效' }]"
          >
            <template #right-icon>
              <div class="field-unit">元/月</div>
            </template>
          </van-field>
        </div>
        
        <div class="form-item">
          <van-field
            v-model="formData.seniority"
            type="digit"
            label="工龄"
            placeholder="工龄工资"
            :rules="[{ required: true, message: '请输入工龄' }]"
          >
            <template #right-icon>
              <div class="field-unit">元/月</div>
            </template>
          </van-field>
        </div>
        
        <div class="form-item">
          <van-field
            v-model="formData.education"
            type="digit"
            label="学历补贴"
            placeholder="学历补贴"
            :rules="[{ required: true, message: '请输入学历补贴' }]"
          >
            <template #right-icon>
              <div class="field-unit">元/月</div>
            </template>
          </van-field>
        </div>
        
        <div class="form-item">
          <van-field
            v-model="formData.insurance"
            type="digit"
            label="保险"
            placeholder="保险扣款"
            :rules="[{ required: true, message: '请输入保险' }]"
          >
            <template #right-icon>
              <div class="field-unit">元/月</div>
            </template>
          </van-field>
        </div>
      </div>

      <div class="settings-footer">
        <van-button round type="primary" native-type="submit" block size="large">
          保存设置
        </van-button>
        
        <van-button 
          v-if="month && canReset" 
          round 
          type="danger" 
          block
          size="large"
          @click="resetToDefault"
          class="reset-button"
        >
          恢复默认设置
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { showToast } from 'vant';

// 定义props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      baseSalary: 5000,
      performance: 800,
      seniority: 500,
      insurance: 600,
      education: 0
    })
  },
  month: {
    type: [Object, String],
    default: null
  },
  monthlySalarySettings: {
    type: Object,
    default: () => ({})
  }
});

// 定义事件
const emit = defineEmits(['update:modelValue', 'saved']);

// 状态
const formData = ref({ ...props.modelValue });
const canReset = ref(false);

// 当前月份键，用于本地存储
const monthKey = computed(() => {
  if (!props.month) return null;
  
  if (typeof props.month === 'string') {
    // 如果是字符串格式，直接返回
    console.log(`月份键(字符串格式): ${props.month}`);
    return props.month;
  }
  
  // 确保月份是数字并且是两位数格式
  const year = Number(props.month.year);
  const month = Number(props.month.month);
  const formattedMonth = String(month + 1).padStart(2, '0');
  const key = `${year}-${formattedMonth}`;
  
  console.log(`计算月份键 - 原始数据:`, props.month);
  console.log(`计算月份键 - 格式化后: ${key}`);
  return key;
});

// 检查是否有月度设置
onMounted(() => {
  if (props.month) {
    // 通过props判断是否有月度设置
    const monthKeyStr = monthKey.value;
    
    // 详细记录月份信息
    console.log('当前月份信息:', {
      month: props.month,
      monthKey: monthKeyStr,
      monthlySettings: props.monthlySalarySettings
    });
    
    // 检查monthlySalarySettings中是否包含当前月份的数据
    const hasMonthlySetting = props.monthlySalarySettings && 
                          Object.prototype.hasOwnProperty.call(props.monthlySalarySettings, monthKeyStr);
    
    console.log(`检查月份 ${monthKeyStr} 是否有专属工资设置:`, hasMonthlySetting);
    
    if (hasMonthlySetting) {
      console.log(`${monthKeyStr} 月专属工资设置:`, props.monthlySalarySettings[monthKeyStr]);
    } else {
      console.log(`${monthKeyStr} 月使用默认工资设置:`, props.modelValue);
    }
    
    canReset.value = !!hasMonthlySetting;
  }
});

// 保存设置
function saveSettings() {
  console.log('保存前的表单数据:', formData.value);
  
  // 过滤掉空值并转换为数字
  const filteredData = Object.entries(formData.value).reduce((acc, [key, value]) => {
    // 确保数值有效
    let numValue = parseFloat(value);
    // 如果无效则设为0
    if (isNaN(numValue)) {
      console.warn(`字段 ${key} 值 "${value}" 无效，设为0`);
      numValue = 0;
    }
    acc[key] = numValue;
    return acc;
  }, {});
  
  console.log('过滤后的数据:', filteredData);
  
  // 更新表单数据
  formData.value = { ...filteredData };
  
  // 发出更新事件
  emit('update:modelValue', { ...formData.value });
  
  // 根据是否有月份参数决定保存方式
  if (props.month) {
    // 处理月份对象
    let monthObj;
    
    if (typeof props.month === 'string') {
      // 如果是字符串格式 "YYYY-MM"，则解析
      const parts = props.month.split('-');
      monthObj = { 
        year: Number(parts[0]), 
        month: Number(parts[1]) - 1 
      };
      console.log(`从字符串解析的月份对象: 年=${monthObj.year}, 月=${monthObj.month}`);
    } else {
      // 确保月份数据为数字类型
      monthObj = {
        year: Number(props.month.year),
        month: Number(props.month.month)
      };
      console.log(`转换为数字的月份对象: 年=${monthObj.year}, 月=${monthObj.month}`);
    }
    
    // 格式化月份键用于日志
    const monthKey = `${monthObj.year}-${String(monthObj.month + 1).padStart(2, '0')}`;
    console.log(`保存月度工资设置 - 月份键: ${monthKey}, 数据:`, { ...formData.value });
    
    // 深拷贝数据避免引用问题
    const formDataCopy = JSON.parse(JSON.stringify(formData.value));
    
    // 触发saved事件
    emit('saved', {
      month: monthObj,
      salarySettings: formDataCopy
    });
    
    // 标记该月有自定义设置
    canReset.value = true;
    
    // 显示成功消息
    showToast({
      type: 'success',
      message: `已保存${monthObj.year}年${monthObj.month + 1}月工资设置`
    });
  } else {
    // 默认设置
    console.log('保存默认工资设置:', { ...formData.value });
    
    // 深拷贝数据避免引用问题
    const formDataCopy = JSON.parse(JSON.stringify(formData.value));
    
    emit('saved', {
      month: null,
      salarySettings: formDataCopy
    });
    
    showToast({
      type: 'success',
      message: '已保存默认工资设置'
    });
  }
}

// 重置为默认设置
function resetToDefault() {
  if (props.month) {
    console.log('重置月度设置，原始月份数据:', props.month);
    
    // 处理月份对象
    let monthObj;
    
    if (typeof props.month === 'string') {
      // 如果是字符串格式 "YYYY-MM"，则解析
      const parts = props.month.split('-');
      monthObj = { 
        year: Number(parts[0]), 
        month: Number(parts[1]) - 1 
      };
      console.log(`从字符串解析的月份对象: 年=${monthObj.year}, 月=${monthObj.month}`);
    } else {
      // 确保月份数据为数字类型
      monthObj = {
        year: Number(props.month.year),
        month: Number(props.month.month)
      };
      console.log(`转换为数字的月份对象: 年=${monthObj.year}, 月=${monthObj.month}`);
    }
    
    // 格式化后的月份键
    const key = `${monthObj.year}-${String(monthObj.month + 1).padStart(2, '0')}`;
    console.log(`重置月度工资设置，月份键: ${key}`);
    
    // 触发事件删除该月的自定义设置
    emit('saved', {
      month: monthObj,
      salarySettings: null // 传null表示删除该月设置
    });
    
    // 重置状态
    canReset.value = false;
    
    showToast({
      type: 'success',
      message: '已恢复默认工资设置'
    });
  }
}
</script>

<style scoped>
.salary-settings {
  padding: 0 8px;
  max-width: 600px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 24px;
  text-align: center;
}

.settings-header h2 {
  font-size: 20px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 8px;
}

.settings-description {
  font-size: 14px;
  color: #7d7e80;
  line-height: 1.5;
}

.settings-form {
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.form-item {
  position: relative;
}

.field-unit {
  font-size: 12px;
  color: #969799;
}

.settings-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reset-button {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .salary-settings {
    padding: 0;
  }
  
  .settings-form {
    padding: 12px;
    border-radius: 8px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .settings-header h2 {
    font-size: 18px;
  }
}
</style> 