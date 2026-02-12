# 无障碍AI教学平台 - 测试计划

> 版本: 1.0.0
> 日期: 2026-02-12
> 状态: 待执行

---

## 1. 测试目标

确保所有核心功能可以投入生产环境：
- 视频上传与播放
- AI字幕提取与分析
- 无障碍功能
- 服务稳定性

---

## 2. 测试环境

### 2.1 端口配置

| 服务 | 端口 | URL | 状态 |
|------|------|-----|------|
| 前端 | 5173 | http://localhost:5173 | 待启动 |
| Express网关 | 3001 | http://localhost:3001 | 待启动 |
| bilibili-subtitle | 8001 | http://localhost:8001 | 待启动 |
| bili_text | 8000 | http://localhost:8000 | 可选 |

### 2.2 启动命令

```bash
# 方式一：一键启动（推荐）
node start-all.js

# 方式二：手动启动
# 终端1: bilibili-subtitle
cd bilibili-subtitle && uvicorn main:app --port 8001

# 终端2: Express网关
cd server && npm run dev

# 终端3: 前端
npm run dev
```

---

## 3. 测试用例

### 3.1 视频上传测试

| 用例ID | 用例名称 | 前置条件 | 测试步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|--------|
| VU-001 | MP4文件上传 | 前端运行 | 1. 打开首页<br>2. 点击上传区域<br>3. 选择MP4文件<br>4. 确认上传 | 文件成功上传，显示在列表中 | P0 |
| VU-002 | 拖拽上传 | 前端运行 | 1. 打开首页<br>2. 拖拽视频文件到上传区域 | 文件成功上传 | P0 |
| VU-003 | 文件格式验证 | 前端运行 | 1. 上传非视频文件 | 显示"Format error" | P1 |
| VU-004 | 文件大小验证 | 前端运行 | 1. 上传>2GB文件 | 显示"File too large" | P1 |
| VU-005 | 上传进度显示 | 前端运行 | 1. 上传中等大小视频 | 显示上传进度 | P2 |

### 3.2 视频播放测试

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| VP-001 | 本地视频播放 | 1. 点击视频列表中的视频<br>2. 点击播放按钮 | 视频正常播放 | P0 |
| VP-002 | 在线视频播放 | 1. 导入B站视频URL<br>2. 点击播放 | iframe嵌入播放 | P0 |
| VP-003 | 播放控制 | 1. 播放视频<br>2. 测试暂停/继续/进度调整 | 控制正常响应 | P1 |

### 3.3 AI字幕提取测试

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| AI-001 | B站官方字幕提取 | 1. 导入有字幕的B站视频<br>2. 点击"AI分析视频" | 成功提取字幕 | P0 |
| AI-002 | FunASR转录 | 1. 导入无字幕B站视频<br>2. 点击"AI分析视频" | 调用FunASR生成字幕 | P1 |
| AI-003 | 字幕显示 | 1. 分析完成后播放视频 | 字幕随时间显示 | P0 |
| AI-004 | 术语提取 | 1. 分析AI相关视频 | 显示术语列表 | P1 |

### 3.4 视频删除测试

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| DEL-001 | 删除确认对话框 | 1. 点击删除按钮 | 弹出确认对话框 | P0 |
| DEL-002 | 删除本地视频 | 1. 确认删除本地视频<br>2. 检查uploads目录 | 文件从磁盘删除 | P0 |
| DEL-003 | 删除在线视频 | 1. 确认删除在线视频 | 仅从列表移除 | P1 |
| DEL-004 | 删除取消 | 1. 点击取消删除 | 视频保留在列表 | P2 |

### 3.5 无障碍功能测试

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| A11Y-001 | 键盘导航 | 1. 仅使用Tab键导航 | 可访问所有功能 | P0 |
| A11Y-ARIA | ARIA标签 | 1. 使用NVDA/JAWS检查 | 屏幕朗读正常 | P1 |
| A11Y-003 | 高对比度模式 | 1. 启用高对比度 | 样式正确切换 | P1 |
| A11Y-004 | 大字体模式 | 1. 启用大字体 | 字体正确放大 | P2 |

---

## 4. Mock 服务配置

### 4.1 bilibili-subtitle Mock

**文件**: `server/tests/mocks/bilibiliSubtitle.ts`

```typescript
import { Request, Response } from 'express'

// Mock B站官方字幕
const mockBilibiliSubtitle = {
  source: 'bilibili',
  subtitle_srt: `1
00:00:00,000 --> 00:00:05,000
欢迎观看AI人工智能教程

2
00:00:05,000 --> 00:00:10,000
本视频将介绍机器学习基础`
}

// Mock FunASR转录
const mockFunasrSubtitle = {
  source: 'funasr',
  subtitle_srt: `1
00:00:00,000 --> 00:00:03,000
这是FunASR自动生成的字幕`
}

export const mockBilibiliSubtitle = (req: Request, res: Response) => {
  const url = req.body.url

  // 根据URL返回不同的mock响应
  if (url.includes('with-subtitles')) {
    res.json({
      success: true,
      data: mockBilibiliSubtitle
    })
  } else {
    res.json({
      success: true,
      data: mockFunasrSubtitle
    })
  }
}

export const mockHealthCheck = (req: Request, res: Response) => {
  res.json({ status: 'ok' })
}
```

### 4.2 bili_text Mock

**文件**: `server/tests/mocks/biliText.ts`

```typescript
import { Request, Response } from 'express'

const mockAnalysisResult = {
  taskId: 'mock-task-123',
  status: 'completed',
  visual_content: [
    { timestamp: 0.5, texts: ['屏幕显示: Python代码编辑器'] },
    { timestamp: 2.0, texts: ['PPT标题: 机器学习入门'] }
  ],
  scene_descriptions: [
    { timestamp: 0.0, description: '讲师在屏幕前讲解' },
    { timestamp: 3.0, description: '切换到代码演示画面' }
  ]
}

export const mockAnalyze = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { taskId: mockAnalysisResult.taskId }
  })
}

export const mockTaskStatus = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'completed' }
  })
}

export const mockTaskResult = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockAnalysisResult
  })
}
```

### 4.3 测试脚本

**文件**: `server/tests/integration.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'

// 导入mock路由
import { mockBilibiliSubtitle, mockHealthCheck } from './mocks/bilibiliSubtitle'
import { mockAnalyze, mockTaskStatus, mockTaskResult } from './mocks/biliText'

describe('视频分析服务集成测试', () => {
  let app: express.Express

  beforeEach(() => {
    app = express()
    app.use(express.json())

    // 配置mock路由
    app.get('/health', mockHealthCheck)
    app.post('/api/gateway/subtitle', mockBilibiliSubtitle)
    app.post('/api/gateway/bilibili/analyze', mockAnalyze)
    app.get('/api/gateway/bilibili/tasks/:taskId/status', mockTaskStatus)
    app.get('/api/gateway/bilibili/tasks/:taskId/result', mockTaskResult)
  })

  describe('健康检查', () => {
    it('应该返回健康状态', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body.status).toBe('ok')
    })
  })

  describe('字幕提取', () => {
    it('应该返回B站官方字幕', async () => {
      const response = await request(app)
        .post('/api/gateway/subtitle')
        .send({ url: 'https://www.bilibili.com/video/BV1234/' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.subtitle_srt).toBeDefined()
    })
  })

  describe('视频分析', () => {
    it('应该返回任务ID', async () => {
      const response = await request(app)
        .post('/api/gateway/bilibili/analyze')
        .send({ url: 'https://www.bilibili.com/video/BV1234/' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.taskId).toBeDefined()
    })

    it('应该返回完成状态', async () => {
      const response = await request(app)
        .get('/api/gateway/bilibili/tasks/mock-task-123/status')
        .expect(200)

      expect(response.body.data.status).toBe('completed')
    })

    it('应该返回分析结果', async () => {
      const response = await request(app)
        .get('/api/gateway/bilibili/tasks/mock-task-123/result')
        .expect(200)

      expect(response.body.data.visual_content).toBeDefined()
      expect(response.body.data.scene_descriptions).toBeDefined()
    })
  })
})
```

---

## 5. 前端Mock配置

### 5.1 MSW 配置

**文件**: `src/api/__mocks__/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // 健康检查
  http.get('http://localhost:3001/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  // 字幕提取
  http.post('http://localhost:3001/api/gateway/subtitle', async ({ request }) => {
    const body = await request.json() as { videoUrl: string }

    if (body.videoUrl.includes('no-subtitles')) {
      return HttpResponse.json({
        success: true,
        data: {
          source: 'funasr',
          subtitle_srt: '1\n00:00:00,000 --> 00:00:05,000\n这是自动生成的字幕'
        }
      })
    }

    return HttpResponse.json({
      success: true,
      data: {
        source: 'bilibili',
        subtitle_srt: '1\n00:00:00,000 --> 00:00:05,000\n官方字幕示例'
      }
    })
  }),

  // 视频列表
  http.get('http://localhost:3001/api/videos', () => {
    return HttpResponse.json({
      success: true,
      data: []
    })
  }),

  // 视频上传
  http.post('http://localhost:3001/api/videos/upload', async ({ request }) => {
    // 模拟上传成功
    return HttpResponse.json({
      success: true,
      message: '视频上传成功',
      data: {
        id: 'mock-video-123',
        title: '测试视频',
        platform: 'custom',
        url: '/api/videos/file/test.mp4',
        localPath: '/path/to/test.mp4',
        isLocal: true
      }
    })
  })
]
```

---

## 6. 测试执行清单

### 6.1 启动前检查

- [ ] Node.js 版本 >= 18
- [ ] npm 依赖已安装
- [ ] Python 依赖已安装 (uv)
- [ ] 端口 3001, 5173, 8001 可用

### 6.2 手动测试步骤

```
1. [ ] 启动所有服务
2. [ ] 访问 http://localhost:5173
3. [ ] 测试视频上传 (MP4文件)
4. [ ] 测试视频播放
5. [ ] 测试AI字幕提取 (B站URL)
6. [ ] 测试视频删除
7. [ ] 测试键盘导航
8. [ ] 检查浏览器控制台无错误
```

### 6.3 自动化测试

```bash
# 运行后端测试
cd server && npm test

# 运行前端测试
npm test
```

---

## 7. 风险评估

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| bilibili-subtitle服务不可用 | 无法提取字幕 | 中 | 显示友好错误提示 |
| FunASR API限流 | 字幕生成延迟 | 低 | 添加重试机制 |
| 本地存储空间不足 | 上传失败 | 低 | 添加存储检查 |
| 内存存储重启丢失 | 数据丢失 | 中 | 建议使用数据库 |

---

## 8. 后续优化

- [ ] 添加数据库持久化 (PostgreSQL/MongoDB)
- [ ] 添加用户认证和权限控制
- [ ] 添加视频转码和压缩
- [ ] 添加CDN加速
- [ ] 添加监控和日志系统
