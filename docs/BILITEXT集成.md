# BiliText 服务集成

本项目集成了 `bili_text` 服务，用于 B 站视频内容提取和分析。

## 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                    无障碍AI教学平台                           │
├─────────────────────────────────────────────────────────────┤
│  前端 (localhost:5173)                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  Express 后端 (localhost:3001)                               │
│  - /api/bilibili/analyze     ← 提交分析任务                   │
│  - /api/bilibili/tasks/:id/status   ← 查询状态              │
│  - /api/bilibili/tasks/:id/result   ← 获取结果              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  BiliText API (localhost:8000)                              │
│  - bilibili 视频下载 (yt-dlp)                               │
│  - 音频提取 + 火山引擎 ASR 转录                              │
│  - EasyOCR 画面文字识别                                      │
│  - 豆包视觉模型画面描述                                     │
│  - 场景检测                                                 │
└─────────────────────────────────────────────────────────────┘
```

## 启动方式

### 方式一：使用统一启动脚本（推荐）

```bash
# 启动所有服务（后端 + 前端）
node start-all.js

# BiliText 服务需要单独启动
api\启动-bilibili分析服务.bat
```

### 方式二：分别启动

```bash
# 1. 启动 BiliText 服务
cd api
.venv\Scripts\uvicorn.exe bili_text.server.app:app --reload

# 2. 启动 Express 后端（新终端）
cd server
npm run dev

# 3. 启动前端（新终端）
npm run dev
```

## API 使用

### 1. 提交视频分析任务

```http
POST /api/bilibili/analyze
Content-Type: application/json

{
  "url": "https://www.bilibili.com/video/BVxxx",
  "options": {
    "audio_transcription": true,      // 语音转录
    "visual_analysis": "ocr",          // ocr | scene | description | all
    "frame_interval": 2.0,
    "language": "zh"
  }
}
```

**响应：**
```json
{
  "success": true,
  "message": "任务已创建",
  "data": {
    "taskId": "uuid-string",
    "status": "pending"
  }
}
```

### 2. 查询任务状态

```http
GET /api/bilibili/tasks/:taskId/status
```

**响应：**
```json
{
  "success": true,
  "data": {
    "taskId": "uuid-string",
    "status": "processing",
    "progress": 50,
    "message": "正在识别内容"
  }
}
```

`status`: `pending` → `processing` → `completed` / `failed`

### 3. 获取分析结果

```http
GET /api/bilibili/tasks/:taskId/result?format=json
GET /api/bilibili/tasks/:taskId/result?format=text
```

**JSON 响应示例：**
```json
{
  "video_info": {
    "title": "视频标题",
    "duration": 300,
    "uploader": "UP主名称",
    "description": "视频简介",
    "url": "https://www.bilibili.com/video/BVxxx"
  },
  "audio_transcript": [
    { "start": 0.0, "end": 3.5, "text": "大家好，欢迎来到..." }
  ],
  "visual_content": [
    { "timestamp": 0.0, "texts": ["第一章：引言"] }
  ],
  "scene_descriptions": [
    { "timestamp": 0.0, "description": "一个人站在白板前讲解" }
  ]
}
```

## 环境配置

### BiliText 环境变量（api/.env）

```env
# 火山引擎 ASR（语音转录）
VOLCENGINE_APP_ID=your_app_id
VOLCENGINE_ACCESS_TOKEN=your_access_token

# 视觉描述（豆包视觉模型）
VISION_API_KEY=your_api_key

# 其他配置
DEBUG=true
MAX_VIDEO_DURATION=3600
```

### Express 后端配置（server/.env）

```env
BILI_TEXT_API_URL=http://127.0.0.1:8000
```

## 依赖说明

| 服务 | 端口 | 说明 |
|------|------|------|
| BiliText API | 8000 | Python/FastAPI |
| Express 后端 | 3001/3002 | Node.js/Express |
| 前端 | 5173 | Vite |

## 文件变更

| 文件 | 说明 |
|------|------|
| `server/src/routes/bilibili.ts` | 新增路由 |
| `server/src/controllers/bilibiliController.ts` | 新增控制器 |
| `server/src/index.ts` | 注册新路由 |
| `src/types/index.ts` | 新增类型定义 |
| `api/启动-bilibili分析服务.bat` | 启动脚本 |
| `start-all.js` | 更新启动脚本 |
