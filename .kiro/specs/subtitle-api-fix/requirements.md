# 字幕生成API修复规格

## 概述

修复视频播放器中字幕生成功能的404错误,确保异步字幕生成任务能够正常创建和查询。

## 问题描述

### 已解决的问题 ✅
- ~~`POST /api/subtitles/jobs` 返回404错误~~ → 后端服务器已启动，API正常工作
- ~~前端无法创建字幕生成任务~~ → 任务创建成功，返回202状态码

### 当前问题 🔴
**本地STT服务未运行**
- 环境变量配置为 `USE_LOCAL_STT=true`
- STT服务地址: `http://127.0.0.1:9977/api`
- 连接错误: `ECONNREFUSED 127.0.0.1:9977`
- 导致字幕生成任务失败

### 错误日志
```
Error: connect ECONNREFUSED 127.0.0.1:9977
字幕生成失败: connect ECONNREFUSED 127.0.0.1:9977
```

## 当前状态分析

### 已实现的功能
1. ✅ 后端控制器 (`subtitleController.ts`) 已实现:
   - `createSubtitleJob` - 创建字幕生成任务
   - `getJobStatus` - 查询任务状态
   
2. ✅ 后端路由 (`subtitle.ts`) 已定义:
   - `POST /api/subtitles/jobs` - 创建任务
   - `GET /api/subtitles/jobs/:jobId` - 查询任务状态

3. ✅ 任务服务 (`jobService.ts`) 已实现:
   - 异步任务队列管理
   - 支持YouTube和Bilibili视频下载
   - 支持OpenAI Whisper API和本地STT服务
   - 音频压缩优化

4. ✅ 前端组件 (`VideoPlayer.tsx`) 已实现:
   - 创建任务的API调用
   - 轮询任务状态的逻辑

### 问题根源

经过代码审查,发现路由和控制器都已正确实现。404错误可能由以下原因导致:

1. **服务器未正确启动** - 后端服务可能没有运行
2. **路由注册问题** - `server/src/index.ts` 中路由可能未正确挂载
3. **CORS配置问题** - 跨域请求被阻止
4. **端口冲突** - 3001端口被占用

## 用户故事

### US-1: 作为听障用户,我希望能够为视频生成字幕
**优先级**: P0 (关键)

**验收标准**:
- [ ] 点击"生成字幕"按钮后,能够成功创建字幕生成任务
- [ ] 前端能够收到包含jobId的响应
- [ ] 不再出现404错误
- [ ] 控制台显示任务创建成功的日志

### US-2: 作为听障用户,我希望能够看到字幕生成的进度
**优先级**: P0 (关键)

**验收标准**:
- [ ] 前端能够通过jobId查询任务状态
- [ ] 任务状态包括: queued, running, done, error
- [ ] 显示任务进度百分比 (0-100)
- [ ] 任务完成后能够获取生成的字幕内容

### US-3: 作为系统管理员,我希望能够使用本地STT服务(支持CUDA加速)
**优先级**: P1 (重要)

**验收标准**:
- [ ] 环境变量正确配置本地STT服务URL
- [ ] 当OpenAI API不可用时,自动切换到本地STT
- [ ] 本地STT服务能够利用CUDA加速
- [ ] 字幕生成时间在可接受范围内(10分钟视频<5分钟处理)

## 技术要求

### 环境配置
1. **后端服务器**
   - 确保运行在 `http://localhost:3001`
   - 正确加载 `.env` 配置文件
   - CORS允许来自 `http://localhost:3000` 的请求

2. **本地STT服务** (可选,CUDA已安装)
   - 服务地址: `http://127.0.0.1:9977/api`
   - 环境变量: `STT_API_URL=http://127.0.0.1:9977/api`
   - 环境变量: `USE_LOCAL_STT=true` (如果优先使用本地服务)
   - 支持CUDA加速的Whisper模型

3. **FFmpeg**
   - 用于音频压缩和格式转换
   - 必须在系统PATH中可用

### API规范

#### 创建字幕生成任务
```
POST /api/subtitles/jobs
Content-Type: application/json

Request Body:
{
  "videoUrl": "https://www.bilibili.com/video/BV1xx411c7XZ",
  "language": "zh"
}

Response (202 Accepted):
{
  "success": true,
  "message": "字幕生成任务已创建",
  "data": {
    "jobId": "uuid-string",
    "status": "queued"
  }
}
```

#### 查询任务状态
```
GET /api/subtitles/jobs/:jobId

Response (200 OK):
{
  "success": true,
  "data": {
    "jobId": "uuid-string",
    "status": "done",  // queued | running | done | error
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:05:00.000Z",
    "progress": 100,
    "result": {
      "subtitle": "SRT格式字幕内容",
      "format": "srt",
      "mode": "real"
    },
    "error": null
  }
}
```

## 非功能性需求

### 性能要求
- 任务创建响应时间 < 500ms
- 任务状态查询响应时间 < 200ms
- 支持并发处理多个字幕生成任务
- 音频下载超时: 5分钟
- 字幕生成超时: 10分钟

### 可靠性要求
- 任务失败时提供清晰的错误信息
- 临时文件自动清理
- 服务重启后任务状态不丢失(可选,当前使用内存存储)

### 可用性要求
- 支持YouTube、Bilibili、直接音频URL
- 优雅降级: OpenAI API失败时切换到本地STT
- 音频文件大小限制: 25MB (压缩后)
- 视频时长限制: 建议10分钟以内

## 验证计划

### 单元测试
- [ ] 测试路由是否正确注册
- [ ] 测试控制器函数是否正确响应
- [ ] 测试任务服务的创建和查询功能

### 集成测试
- [ ] 测试完整的字幕生成流程
- [ ] 测试Bilibili视频下载
- [ ] 测试本地STT服务调用
- [ ] 测试错误处理和降级逻辑

### 手动测试
- [ ] 启动前后端服务
- [ ] 在VideoPlayer中点击"生成字幕"
- [ ] 验证任务创建成功
- [ ] 验证轮询状态正常
- [ ] 验证字幕显示正确

## 依赖项

### 必需
- Node.js 后端服务运行
- Express 路由正确配置
- CORS 中间件配置

### 可选
- OpenAI API Key (用于Whisper API)
- 本地STT服务 (CUDA加速)
- FFmpeg (音频压缩)

## 风险和缓解措施

### 风险1: 服务器未启动
**缓解**: 提供清晰的启动脚本和文档

### 风险2: 本地STT服务不可用
**缓解**: 自动降级到OpenAI API或演示模式

### 风险3: 音频文件过大
**缓解**: FFmpeg压缩 + 文件大小检查

### 风险4: CUDA配置问题
**缓解**: 提供CPU fallback选项

## 成功标准

1. ✅ 字幕生成功能完全可用,无404错误
2. ✅ 支持Bilibili视频字幕生成
3. ✅ 本地STT服务正常工作(如果配置)
4. ✅ 用户体验流畅,有清晰的进度反馈
5. ✅ 错误处理完善,提供有用的错误信息

## 后续优化

- 持久化任务队列(使用Redis或数据库)
- WebSocket实时推送任务进度
- 支持更多视频平台
- 字幕编辑和校对功能
- 批量字幕生成
