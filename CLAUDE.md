# 无障碍AI教学平台

## 项目概述
为残障学习者提供可访问的AI学习体验。支持视障（读屏、高对比度、大字体）和听障（字幕、文字版内容）用户。

## 技术栈
- **前端**: React 18 + TypeScript + Vite + Zustand + React Router
- **后端**: Python FastAPI + yt-dlp + FFmpeg + EasyOCR + 火山引擎API
- **无障碍**: WCAG 2.1 AA级，ARIA完整标注

## 核心功能
1. **用户认证**: 登录/注册 + 障碍类型选择（visual/hearing/other/none）
2. **视频分析**: Bilibili视频URL → 语音转录 + 画面文字 + 场景描述 + 术语提取
3. **视频播放**: 带字幕播放器 + AI分析面板（转录/总结/术语）
4. **作业系统**: 提交/批改流程
5. **图片对比**: AI生成图片的差异化文字描述

## 项目规范

### 代码风格
- TypeScript严格模式
- 组件: PascalCase, 文件: PascalCase.tsx
- hooks: camelCase (useXxx)
- CSS: BEM-like命名

### 无障碍要求
- 所有交互元素添加ARIA标签
- 语义化HTML（nav/main/article）
- 键盘导航完整（Tab/Enter/Esc）
- 焦点顺序符合逻辑

### Git规范
- 提交信息: 中文描述，格式 `[类型]: 描述`
- 功能分支: `feat/xxx`, `fix/xxx`, `docs/xxx`
- 禁止直接push main

### 文档驱动
- 功能开发前先更新PRD（`PRD_无障碍AI教学平台.md`）
- 复杂逻辑需在代码中添加注释
- API变更同步更新接口文档

## 常用命令
```bash
npm run dev          # 前端开发
npm run build        # 构建生产版
uv run pytest tests/ # 后端测试
uv run uvicorn ...   # 后端服务
```
