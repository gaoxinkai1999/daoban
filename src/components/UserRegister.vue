<template>
  <div class="register-container">
    <h2 class="register-title">注册账号</h2>
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
        <van-field
          v-model="confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validatePasswordMatch, message: '两次输入的密码不一致' }
          ]"
        />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          注册
        </van-button>
        <div class="login-link">
          已有账号？<a href="#" @click.prevent="switchToLogin">返回登录</a>
        </div>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { showToast } from 'vant';
import { useApiService } from '../composables/useApiService';

// 获取API服务
const apiService = useApiService();

// 定义emit
const emit = defineEmits(['switch-to-login']);

// 响应式数据
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

// 验证密码是否匹配
function validatePasswordMatch() {
  return password.value === confirmPassword.value;
}

// 提交表单
async function onSubmit() {
  loading.value = true;
  
  try {
    // 使用API服务发送注册请求
    await apiService.auth.register({
      username: username.value,
      password: password.value
    });
    
    // 注册成功
    showToast({
      type: 'success',
      message: '注册成功，请登录'
    });
    
    // 切换到登录页面
    setTimeout(() => {
      emit('switch-to-login');
    }, 1000);
  } catch (error) {
    // 显示错误信息
    let errorMsg = '注册失败';
    
    // 如果有具体错误信息，则显示
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMsg = error.response.data;
      } else if (error.response.data.message) {
        errorMsg = error.response.data.message;
      }
    } else if (error.code === 'ERR_NETWORK') {
      errorMsg = '网络连接失败，请检查网络';
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    showToast({
      type: 'fail',
      message: errorMsg
    });
    console.error('注册错误:', error);
  } finally {
    loading.value = false;
  }
}

// 切换到登录页面
function switchToLogin() {
  emit('switch-to-login');
}
</script>

<style scoped>
.register-container {
  padding: 20px;
  max-width: 600px;
  margin: 40px auto;
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
  color: #323233;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #4caf50;
  text-decoration: none;
}
</style> 