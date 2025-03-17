<template>
  <div class="login-container">
    <h2 class="login-title">登录系统</h2>
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
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
        <div class="register-link">
          没有账号？<a href="#" @click.prevent="switchToRegister">立即注册</a>
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
const emit = defineEmits(['login-success', 'switch-to-register']);

// 数据
const username = ref('');
const password = ref('');
const loading = ref(false);

// 提交表单
async function onSubmit() {
  loading.value = true;
  
  try {
    // 使用API服务发送登录请求
    await apiService.auth.login({
      username: username.value,
      password: password.value
    });
    
    // 登录成功
    showToast({
      type: 'success',
      message: '登录成功'
    });
    
    // 向父组件发送登录成功事件
    emit('login-success', {
      username: username.value
    });
    
    // 清空表单
    username.value = '';
    password.value = '';
  } catch (error) {
    // 登录失败，显示错误消息
    showToast({
      type: 'fail',
      message: '登录失败：' + (error.response?.data?.message || error.message || '未知错误')
    });
  } finally {
    loading.value = false;
  }
}

// 切换到注册视图
function switchToRegister() {
  emit('switch-to-register');
}
</script>

<style scoped>
.login-container {
  padding: 20px;
  max-width: 600px;
  margin: 40px auto;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #323233;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #4caf50;
  text-decoration: none;
}
</style> 