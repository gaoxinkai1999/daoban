import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

/**
 * 导入样式文件
 */
// 导入Vant样式
import 'vant/lib/index.css'
// 导入全局样式（确保在Vant样式之后导入，以便覆盖）
import './assets/global.css'

/**
 * 创建Pinia实例 - Vue 3状态管理
 */
const pinia = createPinia()

/**
 * 创建Vue应用实例
 */
const app = createApp(App)

/**
 * 注册全局插件和属性
 */
// 使用Pinia
app.use(pinia)

/**
 * 挂载应用到DOM
 */
app.mount('#app')
