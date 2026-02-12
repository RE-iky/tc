# 字幕渲染问题诊断报告

## 问题描述

用户反馈：Whisper服务正常启动，但字幕不能被正常渲染在视频画面中。

## 系统架构分析

### 1. 前端架构 (React + TypeScript)

**关键文件：** `src/components/VideoPlayer.tsx`

**当前实现流程：**
```
用户点击"生成字幕"
  ↓
POST /api/subtitles/jobs (创建任务)
  ↓
轮询 GET /api/subtitles/jobs/{jobId} (检查状态)
  ↓
接收 SRT 字幕文本
  ↓
存储到 generatedSubtitle 状态
  ↓
显示为文字稿（在视频下方）
```

**代码位置：**
- 创建任务：`VideoPlayer.tsx:32-42`
- 轮询状态：`VideoPlayer.tsx:54-77`
- 接收字幕：`VideoPlayer.tsx:64`
- 显示文字稿：`VideoPlayer.tsx:178-189`

### 2. 后端架构 (Node.js + Express)

**关键文件：**
- `server/src/routes/subtitle.ts` - 路由定义
- `server/src/controllers/subtitleController.ts` - 控制器
- `server/src/services/jobService.ts` - 异步任务处理

**任务处理流程：**
```
接收任务请求
  ↓
下载视频音频 (YouTube/Bilibili/直接URL)
  ↓
使用 ffmpeg 压缩音频
  ↓
调用 STT 服务 (OpenAI API 或本地 Whisper)
  ↓
返回 SRT 格式字幕
```

**代码位置：**
- 任务创建：`jobService.ts:20-41`
- 音频下载：`jobService.ts:169-223`
- 音频压缩：`jobService.ts:228-246`
- STT 调用：`jobService.ts:338-371`

### 3. STT 服务 (Python + Whisper)

**服务地址：** `http://127.0.0.1:9977`

**API 端点：**
- 健康检查：`GET /health`
- 语音识别：`POST /api`

**参数：**
- `file`: 音频文件
- `language`: 语言代码 (zh/en)
- `model`: Whisper 模型 (base/small/medium/large)
- `response_format`: 响应格式 (srt/json/text)

## 问题定位

### 根本原因

**前端接收到 SRT 字幕文本后，只是将其显示为文字稿，没有将其转换为可以被 HTML5 video 的 `<track>` 元素使用的字幕文件 URL。**

### 详细分析

#### 当前实现（VideoPlayer.tsx）

```typescript
// 第 64 行：接收字幕文本
setGeneratedSubtitle(job.result.subtitle)

// 第 178-189 行：仅作为文字稿显示
{showTranscript && (video.transcript || generatedSubtitle) && (
  <section id="video-transcript" className="video-transcript">
    <h4>视频文字稿</h4>
    <div className="transcript-content">
      {video.transcript || generatedSubtitle}
    </div>
  </section>
)}
```

#### 缺失的实现

对于自定义视频（`platform === 'custom'`），代码中有 `<track>` 元素：

```typescript
// 第 105-113 行
{video.subtitleUrl && (
  <track
    kind="subtitles"
    src={video.subtitleUrl}  // ← 这里需要一个 URL
    srcLang="zh"
    label="中文字幕"
    default
  />
)}
```

**问题：** `generatedSubtitle` 是字符串文本，不是 URL，因此无法用于 `<track>` 元素。

### 缺失的环节

1. **SRT 文本 → Blob 转换**
   - 需要将 SRT 字符串转换为 Blob 对象

2. **Blob → URL 转换**
   - 需要使用 `URL.createObjectURL()` 创建 blob URL

3. **动态添加 track 元素**
   - 需要动态创建或更新 `<track>` 元素的 `src` 属性

4. **启用字幕显示**
   - 需要设置 `textTrack.mode = 'showing'`

## 验证测试

### 已创建的测试脚本

#### 1. `test_frontend_backend_flow.js`
**用途：** 测试前后端通信流程

**运行方法：**
```bash
cd whisper-test
node test_frontend_backend_flow.js
```

**测试内容：**
- 后端服务健康检查
- 创建字幕生成任务
- 轮询任务状态
- 验证 SRT 格式

#### 2. `test_subtitle_rendering.html`
**用途：** 测试字幕渲染到视频画面

**运行方法：**
```bash
# 在浏览器中打开
whisper-test/test_subtitle_rendering.html
```

**测试内容：**
- 测试1：使用预设 SRT 字幕
- 测试2：使用自定义 SRT 字幕
- 测试3：模拟前端字幕生成流程

#### 3. `test_stt_service.py`
**用途：** 测试本地 STT 服务

**运行方法：**
```bash
cd whisper-test
python test_stt_service.py
```

**测试内容：**
- STT 服务健康检查
- 音频转写功能
- SRT 格式验证

## 解决方案

### 方案1：修改前端 VideoPlayer 组件（推荐）

在 `VideoPlayer.tsx` 中添加以下功能：

**步骤1：** 添加状态管理
```typescript
const [subtitleBlobUrl, setSubtitleBlobUrl] = useState<string>('')
```

**步骤2：** 创建 Blob URL 的函数
```typescript
const createSubtitleBlobUrl = (srtText: string): string => {
  // 清理旧的 blob URL
  if (subtitleBlobUrl) {
    URL.revokeObjectURL(subtitleBlobUrl)
  }

  // 创建新的 blob URL
  const blob = new Blob([srtText], { type: 'text/vtt' })
  const url = URL.createObjectURL(blob)
  return url
}
```

**步骤3：** 在接收字幕后创建 blob URL
```typescript
// 在 handleGenerateSubtitle 函数中，第 64 行附近
if (job.status === 'done') {
  clearInterval(pollInterval)
  const subtitle = job.result.subtitle
  setGeneratedSubtitle(subtitle)

  // 创建 blob URL
  const blobUrl = createSubtitleBlobUrl(subtitle)
  setSubtitleBlobUrl(blobUrl)

  setShowTranscript(true)
  setGeneratingSubtitle(false)
}
```

**步骤4：** 修改 video 元素，添加动态 track
```typescript
// 在 renderPlayer 函数中
if (video.platform === 'custom') {
  return (
    <video
      controls
      className="video-element"
      aria-label={`播放视频: ${video.title}`}
    >
      <source src={video.embedUrl} type="video/mp4" />
      {(video.subtitleUrl || subtitleBlobUrl) && (
        <track
          kind="subtitles"
          src={video.subtitleUrl || subtitleBlobUrl}
          srcLang="zh"
          label="中文字幕"
          default
        />
      )}
      您的浏览器不支持视频播放
    </video>
  )
}
```

**步骤5：** 清理 blob URL
```typescript
useEffect(() => {
  return () => {
    if (subtitleBlobUrl) {
      URL.revokeObjectURL(subtitleBlobUrl)
    }
  }
}, [subtitleBlobUrl])
```

### 方案2：后端返回字幕文件 URL

**优点：** 前端实现更简单
**缺点：** 需要后端存储字幕文件

**实现步骤：**
1. 后端保存 SRT 文件到静态目录
2. 返回文件 URL 而不是文本
3. 前端直接使用 URL

### 方案3：使用第三方字幕库

使用 `react-player` 或 `video.js` 等库，它们提供更好的字幕支持。

## 推荐测试流程

### 第一步：验证 STT 服务
```bash
cd whisper-test
python test_stt_service.py
```

### 第二步：验证前后端通信
```bash
# 确保后端服务运行
cd server
npm run dev

# 在另一个终端运行测试
cd whisper-test
node test_frontend_backend_flow.js
```

### 第三步：验证字幕渲染
在浏览器中打开 `whisper-test/test_subtitle_rendering.html`，测试字幕是否能正确渲染到视频上。

### 第四步：修复前端代码
按照方案1修改 `VideoPlayer.tsx`，然后在实际应用中测试。

## 总结

**问题根源：** 前端接收到 SRT 字幕文本后，没有将其转换为 blob URL 并添加到 video 的 `<track>` 元素中。

**影响范围：** 仅影响前端字幕渲染，后端 STT 服务和字幕生成功能正常。

**解决难度：** 低 - 只需在前端添加 blob URL 转换逻辑。

**预计修复时间：** 30分钟内可完成修改和测试。
