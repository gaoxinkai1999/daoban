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
import { ref, computed, onMounted, watch } from 'vue';
import { showToast } from 'vant';
import { useUserStore } from '../stores/user';
import { storeToRefs } from 'pinia';

// 定义props - 保留month prop用于确定编辑哪个月份的设置
const props = defineProps({
  month: {
    type: [Object, String],
    default: null
  }
});

// 使用用户store
const userStore = useUserStore();
// 使用storeToRefs获取响应式引用
const { salarySettings, monthlySalarySettings } = storeToRefs(userStore);

// 状态
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

// 获取当前编辑的设置数据
const currentSettings = computed(() => {
  // 如果是编辑特定月份
  if (props.month) {
    const key = monthKey.value;
    console.log('查找月份设置:', key);
    
    // 从月独立设置数组中查找对应月份的设置
    if (monthlySalarySettings.value && Array.isArray(monthlySalarySettings.value)) {
      const monthSetting = monthlySalarySettings.value.find(
        item => item.month === key
      );
      
      if (monthSetting) {
        console.log(`找到 ${key} 月的专属设置:`, monthSetting);
        return monthSetting;
      }
    }
    
    console.log(`未找到 ${key} 月的专属设置，使用默认设置`);
  }
  
  // 默认使用全局设置
  console.log('使用默认工资设置:', salarySettings.value);
  return salarySettings.value;
});

// 表单数据
const formData = ref({});

// 监听currentSettings变化，更新表单数据
watch(currentSettings, (newValue) => {
  formData.value = { ...newValue };
}, { immediate: true });

// 初始化检查
onMounted(() => {
  if (props.month) {
    // 检查是否有月度设置
    const key = monthKey.value;
    
    // 详细记录月份信息
    console.log('当前月份信息:', {
      month: props.month,
      monthKey: key
    });
    
    // 检查是否有该月的专属设置
    let hasMonthlySetting = false;
    
    if (monthlySalarySettings.value && 
        Array.isArray(monthlySalarySettings.value)) {
      
      hasMonthlySetting = monthlySalarySettings.value.some(
        item => item.month === key
      );
    }
    
    console.log(`检查月份 ${key} 是否有专属工资设置:`, hasMonthlySetting);
    
    if (hasMonthlySetting) {
      const monthSetting = monthlySalarySettings.value.find(
        item => item.month === key
      );
      console.log(`${key} 月专属工资设置:`, monthSetting);
    } else {
      console.log(`${key} 月使用默认工资设置:`, salarySettings.value);
    }
    
    canReset.value = hasMonthlySetting;
  }
});

// 保存设置
function saveSettings() {
  // 记录原始表单数据
  console.log('保存前的原始表单数据:', formData.value);
  
  // 数据验证和格式化
  const processedData = validateAndFormatData(formData.value);
  
  // 更新表单数据为处理后的数据
  formData.value = { ...processedData };
  
  // 直接使用store保存数据
  if (props.month) {
    saveMonthlySettings(processedData);
  } else {
    saveGlobalSettings(processedData);
  }
}

/**
 * 验证并格式化表单数据
 * @param {Object} data - 原始表单数据
 * @returns {Object} 处理后的数据
 */
function validateAndFormatData(data) {
  // 转换所有字段为有效数字
  return Object.entries(data).reduce((acc, [key, value]) => {
    // 尝试解析为数字
    let numValue = parseFloat(value);
    
    // 如果非有效数字，设置为0
    if (isNaN(numValue)) {
      console.warn(`字段 ${key} 值 "${value}" 无效，设为0`);
      numValue = 0;
    }
    
    acc[key] = numValue;
    return acc;
  }, {});
}

/**
 * 保存月份特定工资设置
 * @param {Object} settingsData - 已处理的工资设置数据
 */
function saveMonthlySettings(settingsData) {
  // 标准化月份对象
  const monthObject = normalizeMonthObject(props.month);
  
  // 构建月份键 (YYYY-MM格式)
  const monthKey = `${monthObject.year}-${String(monthObject.month + 1).padStart(2, '0')}`;
  console.log(`保存月度工资设置 - 月份键: ${monthKey}`, settingsData);
  
  // 创建深拷贝，避免引用问题
  const settingsCopy = JSON.parse(JSON.stringify(settingsData));
  
  // 添加month字段到设置数据中
  settingsCopy.month = monthKey;
  
  // 调用store方法更新月度设置
  const success = userStore.updateMonthlySalarySettings({
    type: 'monthly',
    settings: settingsCopy
  });
  
  // 根据结果显示消息
  if (success) {
    // 标记该月有自定义设置
    canReset.value = true;
    
    showToast({
      type: 'success',
      message: `已保存${monthObject.year}年${monthObject.month + 1}月工资设置`
    });
    
    // 如果是在弹窗中打开的，则关闭弹窗
    closePopupIfNeeded();
  } else {
    showToast({
      type: 'fail',
      message: `保存${monthObject.year}年${monthObject.month + 1}月工资设置失败`
    });
  }
}

/**
 * 保存全局默认工资设置
 * @param {Object} settingsData - 已处理的工资设置数据
 */
function saveGlobalSettings(settingsData) {
  console.log('保存默认工资设置:', settingsData);
  
  // 创建深拷贝，避免引用问题
  const settingsCopy = JSON.parse(JSON.stringify(settingsData));
  
  // 调用store方法更新默认设置
  const success = userStore.updateMonthlySalarySettings({
    type: 'default',
    settings: settingsCopy
  });
  
  // 根据结果显示消息
  if (success) {
    showToast({
      type: 'success',
      message: '已保存默认工资设置'
    });
    
    // 关闭设置页面，返回到工资计算页面
    navigateToSalaryCalculator();
  } else {
    showToast({
      type: 'fail',
      message: '保存默认工资设置失败'
    });
  }
}

/**
 * 标准化月份对象格式
 * @param {Object|String} monthInput - 月份输入（对象或字符串）
 * @returns {Object} 标准化的月份对象 {year: Number, month: Number}
 */
function normalizeMonthObject(monthInput) {
  if (typeof monthInput === 'string') {
    // 解析字符串格式 "YYYY-MM"
    const parts = monthInput.split('-');
    return { 
      year: Number(parts[0]), 
      month: Number(parts[1]) - 1  // 转换为JS 0-11月份格式
    };
  } else {
    // 确保对象格式的月份数据为数字类型
    return {
      year: Number(monthInput.year),
      month: Number(monthInput.month)
    };
  }
}

// 重置为默认设置
function resetToDefault() {
  if (!props.month) return;
  
  console.log('重置月度设置，原始月份数据:', props.month);
  
  // 标准化月份对象
  const monthObject = normalizeMonthObject(props.month);
  
  // 构建月份键 (YYYY-MM格式)
  const monthKey = `${monthObject.year}-${String(monthObject.month + 1).padStart(2, '0')}`;
  console.log(`重置月度工资设置，月份键: ${monthKey}`);
  
  // 调用store方法删除月度设置
  const success = userStore.updateMonthlySalarySettings({
    type: 'remove',
    monthKey: monthKey
  });
  
  if (success) {
    // 重置表单数据为默认值
    formData.value = { ...salarySettings.value };
    
    // 重置状态
    canReset.value = false;
    
    showToast({
      type: 'success',
      message: '已恢复默认工资设置'
    });
  } else {
    showToast({
      type: 'fail',
      message: '恢复默认工资设置失败'
    });
  }
}

/**
 * 关闭弹窗（如果组件在弹窗中打开）
 */
function closePopupIfNeeded() {
  // 检查父元素中是否有弹窗相关元素
  const popupContainer = document.querySelector('.van-popup');
  if (popupContainer) {
    // 获取关闭按钮
    const closeButton = popupContainer.querySelector('.van-icon-cross');
    if (closeButton) {
      // 触发点击事件关闭弹窗
      closeButton.click();
    } else {
      console.warn('未找到弹窗关闭按钮');
    }
  } else {
    console.log('组件不在弹窗中打开');
  }
}

/**
 * 导航到工资计算页面
 */
function navigateToSalaryCalculator() {
  // 如果是在App.vue中以独立页面方式打开的
  const tabs = document.querySelectorAll('.tab');
  const salaryTab = Array.from(tabs).find(tab => tab.textContent.trim() === '工资计算');
  
  if (salaryTab) {
    // 触发点击事件切换到工资计算Tab
    salaryTab.click();
  } else {
    console.warn('未找到工资计算Tab');
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