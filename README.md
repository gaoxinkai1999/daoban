# 倒班日历

一个帮助倒班工人管理班次、计算工资的Vue 3应用。

## 项目说明

倒班日历应用帮助倒班工人以可视化方式管理班次安排，自动计算工资，并提供灵活的配置选项。

## 技术栈

- Vue 3 - 前端框架
- Vant - UI组件库
- Pinia - 状态管理
- Axios - 网络请求

## 项目优化

最近的代码重构完成了以下优化：

1. **移除mitt事件总线**：使用更直接的组件通信和状态管理
2. **移除全局错误控制器**：简化错误处理逻辑，使用Vant通知组件直接展示错误
3. **统一API管理**：
   - 所有API请求统一在`services/api.js`中管理
   - 标准化请求和响应拦截器
   - 优化错误处理流程
4. **性能优化**：
   - 使用debounce减少频繁保存请求
   - 移除不必要的状态计算和日志
5. **代码质量**：
   - 添加完整的中文注释
   - 优化类型检查和数据验证
   - 简化组件结构

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run serve

# 构建生产版本
npm run build
```

## 功能

- 班次日历：可视化查看和管理倒班安排
- 工资计算：根据班次自动计算工资
- 灵活配置：自定义班次周期、工资结构
- 账户功能：支持用户注册、登录，保存个人设置

## 功能特点

- **倒班模式**: 上12小时，休息24小时的倒班模式
- **任务循环**: 六个任务（一采、二采、三采、一休、二休、三休）依次循环
- **白/夜班区分**: 每个任务包含一个白班和一个夜班，然后是一天休息日
- **夜班休息提醒**: 根据不同任务有不同的休息时间和睡觉时间
  - 一采: 休息3小时，23点睡
  - 二采: 休息2小时，2点睡
  - 其他任务: 9点睡
- **农历显示**: 日历中显示农历日期和农历节日
- **快速班次设置**: 根据今天的实际班次和任务自动调整整个日历
- **数据持久化**: 设置会保存在本地，下次打开应用时自动载入

## 使用方法

1. 打开应用后，默认显示当前月份的日历视图，包含阳历和农历日期
2. 点击任意日期可以查看详细的倒班信息和农历信息
3. 点击顶部的"设置"标签可以进入设置页面
4. 在设置页面，只需选择今天的实际班次和任务，系统会自动调整整个日历
5. 点击"保存设置"保存更改并返回日历视图

## 班次循环说明

每个任务包含两个班次和一个休息日，完整循环为：
- 第一天：白班
- 第二天：夜班
- 第三天：休息日
- 然后循环到下一个任务

例如：一采白班 → 一采夜班 → 休息日 → 二采白班 → 二采夜班 → 休息日 → 依此类推。

## 定制化

如果您的倒班模式与默认设置不同，可以在设置页面进行调整，所有的设置将被保存到本地浏览器中。
