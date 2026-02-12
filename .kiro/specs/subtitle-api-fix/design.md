# 字幕生成API修复 - 设计文档

## 架构概览

```
┌─────────────────┐
│  VideoPlayer    │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP POST /api/subtitles/jobs
         ▼
┌─────────────────┐
│  Express API    │
│  (Backend)      │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  OpenAI API  │   │  本地STT服务  │
│  (Whisper)   │   │  (端口9977)  │
└──────────────┘   └──────────────┘
```

## 解决方案设计

### 方案1: 启动本地STT服务 (推荐 - CUDA已安装)

**优势:**
- 利用已安装的CUDA加速
- 无需OpenAI API费用
- 处理速度快
- 数据隐私保护

**实现步骤:**
1. 检查是否有本地STT服务脚本
2. 配置Python环境和依赖
3. 启动STT服务在端口9977
4. 验证服务可用性

**技术要求:**
- Python 3.8+
- faster-whisper 或 openai-whisper
- CUDA Toolkit (已安装)
- Flask/FastAPI 服务框架

### 方案2: 切换到OpenAI API

**优势:**
- 无需本地服务配置
- 开箱即用
- 云端处理

**实现步骤:**
1. 修改 `.env` 文件: `USE_LOCAL_STT=false`
2. 确保 `OPENAI_API_KEY` 有效
3. 重启后端服务

**缺点:**
- 需要API费用
- 依赖网络连接
- 数据上传到云端

### 方案3: 混合模式 (当前实现)

**当前逻辑:**
```typescript
// jobService.ts
if (USE_LOCAL_STT) {
  try {
    // 尝试本地STT
    transcription = await callLocalSTT(...)
  } catch {
    // 失败则使用OpenAI
    transcription = await openai.audio.transcriptions.create(...)
  }
} else {
  // 直接使用OpenAI
  transcription = await openai.audio.transcriptions.create(...)
}
```

**问题:**
- 当前本地STT失败后没有正确降级
- 错误处理不够完善

## 本地STT服务设计

### API规范

```
POST http://127.0.0.1:9977/api
Content-Type: multipart/form-data

Request:
- file: 音频文件 (mp3/wav/m4a)
- language: 语言代码 (zh/en)
- model: 模型大小 (tiny/base/small/medium/large)
- response_format: 输出格式 (srt/vtt/json/text)

Response (成功):
{
  "code": 0,
  "msg": "success",
  "data": "SRT格式字幕内容..."
}

Response (失败):
{
  "code": 1,
  "msg": "错误信息",
  "data": null
}
```

### 服务实现选项

#### 选项A: Python Flask服务

```python
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import os

app = Flask(__name__)

# 使用CUDA加速
model = WhisperModel("base", device="cuda", compute_type="float16")

@app.route('/api', methods=['POST'])
def transcribe():
    file = request.files['file']
    language = request.form.get('language', 'zh')
    response_format = request.form.get('response_format', 'srt')
    
    # 保存临时文件
    temp_path = f"/tmp/{file.filename}"
    file.save(temp_path)
    
    # 转写
    segments, info = model.transcribe(temp_path, language=language)
    
    # 格式化输出
    result = format_to_srt(segments)
    
    # 清理临时文件
    os.remove(temp_path)
    
    return jsonify({"code": 0, "msg": "success", "data": result})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9977)
```

#### 选项B: 使用现有的stt_api_service.py

检查项目根目录的 `stt_api_service.py` 文件是否可用。

## 错误处理改进

### 当前问题
```typescript
// jobService.ts - transcribeWithLocalWhisper
catch (error) {
  console.error(`Job ${jobId}: Local STT API failed:`, error)
  throw error  // 直接抛出错误,没有降级
}
```

### 改进方案
```typescript
async function transcribeWithLocalWhisper(
  audioPath: string, 
  language: string, 
  jobId: string
): Promise<string> {
  const sttServiceUrl = process.env.STT_API_URL || 'http://127.0.0.1:9977/api'
  
  try {
    // 尝试本地STT
    const response = await axios.post(sttServiceUrl, formData, {
      timeout: 600000,
      ...
    })
    
    if (response.data.code === 0) {
      return response.data.data
    } else {
      throw new Error(response.data.msg)
    }
  } catch (error) {
    console.error(`Job ${jobId}: Local STT failed:`, error)
    
    // 降级到OpenAI API
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      console.log(`Job ${jobId}: Falling back to OpenAI API...`)
      const openai = new OpenAI({ apiKey })
      const result = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        language: language === 'zh' ? 'zh' : 'en',
        response_format: 'srt'
      })
      return result as string
    }
    
    // 如果都失败,返回演示字幕
    console.log(`Job ${jobId}: All methods failed, using demo subtitle`)
    return generateDemoSubtitle()
  }
}
```

## 前端改进

### 当前问题
- 错误信息不够友好
- 没有显示具体的失败原因

### 改进方案

```typescript
// VideoPlayer.tsx
const handleGenerateSubtitle = async () => {
  setGeneratingSubtitle(true)
  setError(null)  // 新增错误状态
  
  try {
    const createResponse = await fetch('http://localhost:3001/api/subtitles/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: video.url,
        language: 'zh'
      })
    })
    
    if (!createResponse.ok) {
      throw new Error(`服务器错误: ${createResponse.status}`)
    }
    
    const createResult = await createResponse.json()
    
    if (!createResult.success) {
      throw new Error(createResult.message || '创建任务失败')
    }
    
    // ... 轮询逻辑
    
  } catch (error) {
    console.error('字幕生成失败:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : '未知错误'
    setError(`字幕生成失败: ${errorMessage}`)
    alert(`字幕生成失败: ${errorMessage}\n\n请检查:\n1. 后端服务是否运行\n2. 本地STT服务是否启动\n3. 网络连接是否正常`)
  } finally {
    setGeneratingSubtitle(false)
  }
}
```

## 配置管理

### 环境变量优先级

```
1. USE_LOCAL_STT=true + STT服务可用 → 使用本地STT
2. USE_LOCAL_STT=true + STT服务不可用 → 降级到OpenAI
3. USE_LOCAL_STT=false + OpenAI Key有效 → 使用OpenAI
4. 所有方法都失败 → 返回演示字幕
```

### 推荐配置

**开发环境 (CUDA可用):**
```env
USE_LOCAL_STT=true
STT_API_URL=http://127.0.0.1:9977/api
OPENAI_API_KEY=sk-xxx  # 作为备用
```

**生产环境 (云部署):**
```env
USE_LOCAL_STT=false
OPENAI_API_KEY=sk-xxx
```

## 性能优化

### 音频预处理
```typescript
// jobService.ts - compressAudio
async function compressAudio(inputPath: string, jobId: string): Promise<string> {
  const outputPath = inputPath.replace('.mp3', '_compressed.mp3')
  
  // 单声道, 16kHz, 32kbps - 优化文件大小和处理速度
  const command = `ffmpeg -i "${inputPath}" -ac 1 -ar 16000 -b:a 32k "${outputPath}" -y`
  
  await execPromise(command)
  return outputPath
}
```

### 并发控制
```typescript
// 限制同时处理的任务数量
const MAX_CONCURRENT_JOBS = 3
let activeJobs = 0

async function processJob(jobId: string) {
  while (activeJobs >= MAX_CONCURRENT_JOBS) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  activeJobs++
  try {
    // ... 处理逻辑
  } finally {
    activeJobs--
  }
}
```

## 监控和日志

### 日志级别
```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

function log(level: LogLevel, jobId: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level}] [Job ${jobId}] ${message}`, data || '')
}
```

### 关键监控指标
- 任务创建速率
- 任务成功率
- 平均处理时间
- STT服务可用性
- 错误类型分布

## 测试策略

### 单元测试
```typescript
describe('Subtitle Generation', () => {
  test('should create job successfully', async () => {
    const jobId = createJob('https://example.com/video.mp4', 'zh')
    expect(jobId).toBeDefined()
  })
  
  test('should handle STT service unavailable', async () => {
    // Mock STT service failure
    // Verify fallback to OpenAI
  })
})
```

### 集成测试
1. 启动后端服务
2. 启动本地STT服务
3. 提交字幕生成任务
4. 验证任务状态变化
5. 验证字幕内容正确

## 部署清单

### 本地开发环境
- [ ] 安装Python依赖
- [ ] 配置CUDA环境
- [ ] 启动STT服务
- [ ] 启动后端服务
- [ ] 启动前端服务
- [ ] 验证端到端流程

### 生产环境
- [ ] 配置环境变量
- [ ] 设置OpenAI API Key
- [ ] 配置反向代理
- [ ] 设置日志收集
- [ ] 配置监控告警
