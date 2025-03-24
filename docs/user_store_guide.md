# 用户状态管理模块文档

## 模块概述
本模块使用Pinia实现用户状态管理，主要包含以下功能：
- 用户认证状态管理（登录/登出）
- 本地数据持久化存储
- 工资设置管理
- 数据同步与错误处理

## 核心状态变量
```javascript
const username = ref('');     // 当前登录用户名
const isLoggedIn = ref(false); // 登录状态标识

// 工资配置相关
const salarySettings = ref({});      // 默认工资设置
const monthlySalarySettings = ref([]); // 按月独立配置
```

## 主要方法说明

### 认证相关
```javascript
async function login(userData) { /*...*/ }    // 用户登录
async function logout() { /*...*/ }           // 用户登出
async function register(userData) { /*...*/ } // 用户注册
```

### 数据持久化
```javascript
function initFromLocalStorage() { /*...*/ }  // 从本地存储初始化
function saveToLocalStorage() { /*...*/ }    // 保存到本地存储
function reset() { /*...*/ }                 // 重置状态
```

### 工资配置管理
```javascript
function updateDefaultSalarySettings(settings) { /*...*/ }  // 更新全局默认设置
function updateMonthlySalary(monthlySettings) { /*...*/ }   // 更新月度配置
function removeMonthlySalary(monthKey) { /*...*/ }          // 删除月度配置
```

### 数据同步
```javascript
async function loadUserData(retryCount = 0) { /*...*/ }  // 加载用户数据（含重试机制）
async function saveUserData(showSuccess = false) { /*...*/ } // 保存用户数据
```

## 错误处理机制
1. 本地存储失败时显示错误提示
2. API调用失败自动重试（loadUserData）
3. 关键操作异常捕获与友好提示
4. 数据保存防抖处理（saveUserData）

## 依赖关系
- 使用localStorage进行状态持久化
- 通过apiService与后端API交互
- 集成toast消息提示系统
