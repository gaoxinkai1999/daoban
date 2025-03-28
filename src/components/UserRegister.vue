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
import apiService from '../services/api';

// 定义emit
const emit = defineEmits(['switch-to-login']);

// 数据
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

// 密码确认验证
function validatePasswordMatch(val) {
  return val === password.value;
}

// 提交表单
async function onSubmit() {
  loading.value = true;
  
  try {
    // 检查两次密码是否一致
    if (password.value !== confirmPassword.value) {
      showToast({
        type: 'fail',
        message: '两次密码输入不一致'
      });
      return;
    }
    
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
    
    // 清空表单
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
    
    // 延迟切换到登录视图
    setTimeout(() => {
      switchToLogin();
    }, 1500);
  } catch (error) {
    // 注册失败，显示错误消息
    showToast({
      type: 'fail',
      message: '注册失败：' + (error.response?.data?.message || error.message || '未知错误')
    });
  } finally {
    loading.value = false;
  }
}

// 切换到登录视图
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