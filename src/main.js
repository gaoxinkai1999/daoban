import { createApp } from 'vue'
import App from './App.vue'
import { useApiService } from './composables/useApiService'
import { createPinia } from 'pinia'
import { eventBus } from './utils/eventBus'

// 导入Vant样式
import 'vant/lib/index.css'
// 导入全局样式（确保在Vant样式之后导入，以便覆盖）
import './assets/global.css'

// 创建API服务实例
const apiService = useApiService()

// 创建Pinia实例
const pinia = createPinia()

// 创建Vue应用实例
const app = createApp(App)

// 使用Pinia
app.use(pinia)

// 全局属性
app.config.globalProperties.$api = apiService

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue错误:', err)
  console.error('错误位置:', info)
  // 使用eventBus发送错误事件，而不是Vue实例事件
  eventBus.emit('api-error', { message: err.message }, '应用错误', false)
}

// 挂载应用
app.mount('#app')
