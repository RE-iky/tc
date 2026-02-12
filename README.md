# 无障碍AI教学平台

为残障学习者提供可访问的AI学习体验

## 项目特性

- ✅ 完整的无障碍支持（WCAG 2.1 AA级）
- ✅ 视障用户优化（读屏软件、高对比度、大字体）
- ✅ 听障用户优化（字幕、文字版内容）
- ✅ 键盘导航友好
- ✅ 主题自动切换
- ✅ 响应式设计

## 技术栈

- React 18
- TypeScript
- Vite
- Zustand（状态管理）
- React Router（路由）

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── components/     # 可复用组件
├── pages/          # 页面组件
│   ├── Login.tsx
│   ├── AccessibilitySelection.tsx
│   └── Home.tsx
├── store/          # 状态管理
│   └── accessibility.ts
├── styles/         # 全局样式
│   ├── index.css
│   └── themes.css
├── types/          # TypeScript类型定义
├── utils/          # 工具函数
├── App.tsx         # 主应用组件
└── main.tsx        # 入口文件
```

## 无障碍功能

### 视障支持
- 完整的ARIA标签
- 语义化HTML
- 读屏软件优化
- 高对比度模式
- 大字体显示

### 听障支持
- 视频字幕
- 文字版内容
- 视觉提示

### 键盘导航
- Tab键切换焦点
- Enter键确认
- Esc键取消
- 跳转到主内容链接

## 开发规范

### 无障碍检查

```bash
npm run lint:a11y
```

### 代码检查

```bash
npm run lint
```

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT
