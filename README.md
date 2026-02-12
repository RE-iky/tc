# 无障碍AI教学平台

为残障学习者提供可访问的AI学习体验。支持视障（读屏、高对比度、大字体）和听障（字幕、文字版内容）用户。

## 项目特性

- 完整的无障碍支持（WCAG 2.1 AA级）
- 视障用户优化（读屏软件、高对比度、大字体）
- 听障用户优化（视频字幕、文字版内容）
- 键盘导航友好
- 主题自动切换
- 响应式设计

## 技术栈

### 前端
- React 18 + TypeScript + Vite
- Zustand（状态管理）
- React Router（路由）

### 后端
- Node.js + Express（统一API网关）
- Python FastAPI（bilibili-subtitle 服务）
- Python FastAPI（bili_text 服务）

### AI 服务
- **bilibili-subtitle** (端口 8001): 字幕提取 + 阿里云 FunASR
- **bili_text** (端口 8000): 完整视频分析 + 火山引擎

## 快速开始

### 1. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Python 依赖（需要 uv 包管理器）
cd bilibili-subtitle
uv pip install -r requirements.txt
cd ../api
uv pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env
cp bilibili-subtitle/.env.example bilibili-subtitle/.env

# 编辑配置
# - server/.env: 配置 API 网关端口和外部服务地址
# - bilibili-subtitle/.env: 配置阿里云 API Key
```

### 3. 启动所有服务

```bash
# 一键启动所有服务（推荐）
node start-all.js

# 或者手动启动：
# 终端 1: 启动 bilibili-subtitle (字幕服务)
cd bilibili-subtitle
uvicorn main:app --host 0.0.0.0 --port 8001

# 终端 2: 启动 bili_text (可选，完整分析)
cd api
uvicorn bili_text.server.app:app --host 0.0.0.0 --port 8000

# 终端 3: 启动后端 API
cd server
npm run dev

# 终端 4: 启动前端
npm run dev
```

### 4. 访问应用

- 前端界面: http://localhost:5173
- API 文档: http://localhost:8001/docs

## 服务架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     无障碍AI教学平台                              │
├─────────────────────────────────────────────────────────────────┤
│  前端 (5173)                                                    │
│    │                                                            │
│    ▼                                                            │
│  Express 网关 (3001)  ◄── 统一API入口                           │
│    │                                                            │
│    ├──────────► /api/gateway/bilibili-subtitle (8001)          │
│    │              - 获取B站官方字幕                              │
│    │              - FunASR 语音转录                              │
│    │                                                            │
│    └──────────► /api/gateway/bilibili (8000)                   │
│                  - 完整视频分析                                  │
│                  - OCR + 场景描述                                │
│                  - 火山引擎方案                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 字幕处理策略

1. **优先 bilibili-subtitle (8001)**
   - 获取B站官方字幕
   - 失败则调用 FunASR 进行语音转录
   - 响应速度快，字幕质量高

2. **降级 bili_text (8000)**
   - 需要完整视觉分析时使用
   - OCR + 场景描述
   - 火山引擎方案

## 功能说明

### 视频分析

- **字幕提取**: 自动从B站视频获取字幕，支持中英文
- **画面分析**: OCR 文字识别 + 场景描述
- **术语提取**: 自动识别 AI 相关专业术语
- **内容总结**: 生成视频内容摘要

### 本地视频上传

支持上传本地视频文件（MP4/WebM/OGG，最大 2GB）：
1. 点击上传区域或拖拽文件
2. 系统自动处理视频
3. 可调用 AI 服务进行分析

### 无障碍支持

- **视障模式**: 读屏软件优化、高对比度、大字体
- **听障模式**: 完整字幕、文字版内容
- **键盘导航**: Tab/Enter/Esc 完整支持

## 项目结构

```
├── src/                    # 前端源码
│   ├── components/         # 可复用组件
│   │   ├── VideoPlayer.tsx    # 视频播放器
│   │   ├── OverlaySubtitle.tsx # 字幕覆盖层
│   │   ├── FileUpload.tsx     # 文件上传
│   │   └── ...
│   ├── pages/             # 页面组件
│   ├── services/          # 服务层
│   │   └── videoAnalysis.ts   # 视频分析服务
│   ├── store/             # 状态管理
│   └── types/             # TypeScript 类型
│
├── server/                 # Express 网关
│   └── src/
│       ├── routes/
│       │   ├── gateway.ts     # 网关路由
│       │   ├── upload.ts      # 上传路由
│       │   └── ...
│       └── index.ts
│
├── bilibili-subtitle/     # 字幕提取服务
│   ├── main.py
│   ├── subtitle_extractor.py
│   └── funasr_client.py
│
├── api/                    # 完整分析服务 (可选)
│   └── bili_text/
│
├── start-all.js            # 一键启动脚本
└── README.md
```

## 构建生产版本

```bash
# 构建前端
npm run build

# 预览生产版本
npm run preview
```

## 开发规范

### 代码风格
- TypeScript 严格模式
- 组件: PascalCase，文件: PascalCase.tsx
- hooks: camelCase (useXxx)
- CSS: BEM-like 命名

### 无障碍检查
```bash
npm run lint:a11y
```

### 代码检查
```bash
npm run lint
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
