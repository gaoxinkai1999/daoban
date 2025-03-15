# 倒班日历应用重构说明

## 主要更新

本次重构将应用从Vue 2 + Vant 2升级到了Vue 3 + Vant 4 + Pinia，主要变化包括：

1. **框架升级**：
   - Vue 2 -> Vue 3.3.11
   - Vant 2 -> Vant 4.8.6
   - 新增Pinia 2.1.7作为状态管理工具
   - 添加Vue Router 4.2.5用于路由管理

2. **API变更**：
   - 使用Vue 3的Composition API替代Options API
   - 使用`<script setup>`语法简化组件代码
   - 使用`ref`, `computed`, `watch`等响应式API
   - 使用`defineProps`, `defineEmits`, `defineExpose`替代Vue 2的props, events和expose选项

3. **组件重构**：
   - 所有组件使用Composition API重写
   - Vant组件使用新的slot语法 (template #slot-name)
   - 使用v-model:show替代v-model用于弹窗显示控制

4. **状态管理**：
   - 使用Pinia替代Vuex和直接的组件状态
   - 创建了用户和设置的Pinia store
   - 抽离了业务逻辑到store中

5. **工具更新**：
   - 添加mitt作为事件总线，替代Vue 2的$emit/$on
   - 创建全局事件总线用于组件间通信
   - 使用composables封装API调用

6. **错误处理**：
   - 实现了全局错误处理机制
   - 使用事件总线传递错误信息

## 升级步骤

1. 替换package.json：
   ```
   mv package.json.new package.json
   ```

2. 安装新依赖：
   ```
   npm install
   ```

3. 启动开发服务器：
   ```
   npm run serve
   ```

## 主要文件变更

- **src/main.js**: 更新为Vue 3的应用创建方式
- **src/stores/**: 新增Pinia stores
  - **user.js**: 用户和设置相关的状态管理
- **src/composables/**: 新增组合式函数
  - **useApiService.js**: API调用封装
- **src/utils/**: 工具函数
  - **eventBus.js**: 基于mitt的事件总线
- **src/components/**: 组件重构
  - 所有组件使用Composition API重写
  - 更新了Vant组件的使用方式

## 注意事项

1. Vue 3 + Vant 4对浏览器的兼容性要求更高，不再支持IE11
2. Vue 3的响应式系统变化较大，需要注意ref和reactive的使用区别
3. 组件间通信方式变化，不再使用$parent/$root等方式
4. Vant 4的样式需要单独引入，使用了按需引入方式 