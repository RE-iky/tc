#!/usr/bin/env node
/**
 * 统一启动脚本
 * 一键启动所有服务：bilibili-subtitle + bili_text + Express 后端 + 前端
 *
 * 服务端口：
 *   - bilibili-subtitle: 8001 (Python/FastAPI - 字幕提取，阿里云FunASR方案)
 *   - bili_text: 8000 (Python/FastAPI - 完整视频分析，火山引擎方案)
 *   - Express 后端: 3001 (Node.js/Express - 统一API网关)
 *   - 前端开发: 5173 (Vite)
 *
 * 字幕处理策略：
 *   1. 优先使用 bilibili-subtitle (8001) 获取B站官方字幕
 *   2. 失败则调用 FunASR 进行语音转录
 *   3. 需要完整视觉分析时降级到 bili_text (8000)
 */

import { spawn, exec } from 'child_process'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 配置
const BACKEND_PORT = process.env.PORT || 3001
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`
const FRONTEND_URL = 'http://localhost:5173'
const BILITEXT_URL = process.env.BILI_TEXT_API_URL || 'http://localhost:8000'
const BILISUBTITLE_URL = process.env.BILIBILI_SUBTITLE_API_URL || 'http://localhost:8001'
const CHECK_INTERVAL = 1000 // 1秒
const MAX_WAIT_TIME = 30000 // 30秒

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`)
  log(title, 'cyan')
  console.log(`${'='.repeat(60)}\n`)
}

// 检查端口是否被占用
async function checkPort(port) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`

    exec(cmd, (error, stdout) => {
      resolve(stdout.trim().length > 0)
    })
  })
}

// 检查服务是否运行
async function checkService(url, name) {
  try {
    await axios.get(url, { timeout: 2000 })
    return true
  } catch (error) {
    return false
  }
}

// 等待服务启动
async function waitForService(url, name, maxWaitTime = MAX_WAIT_TIME) {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    if (await checkService(url, name)) {
      log(`✓ ${name} 已就绪`, 'green')
      return true
    }
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL))
  }

  log(`✗ ${name} 启动超时`, 'red')
  return false
}

// 启动 Python 服务（统一方法）
async function startPythonService(name, port, scriptPath, healthPath) {
  const serviceUrl = `http://localhost:${port}`
  logSection(`🚀 启动 ${name} 服务 (端口 ${port})`)

  // 检查端口是否被占用
  const portInUse = await checkPort(port)
  if (portInUse) {
    log(`⚠ 端口 ${port} 已被占用，检查服务状态...`, 'yellow')

    // 检查服务是否已运行
    if (await checkService(`${serviceUrl}${healthPath}`, name)) {
      log(`✓ ${name} 服务已在运行`, 'green')
      return null
    }

    log(`⚠ 端口被占用但服务无响应，需要清理`, 'yellow')
    return null
  }

  // 检查 uv 是否安装
  try {
    await new Promise((resolve, reject) => {
      exec('uv --version', (error) => {
        if (error) reject(error)
        else resolve(true)
      })
    })
  } catch {
    log(`⚠ 未安装 uv 包管理器，请手动安装: https://docs.astral.sh/uv/`, 'yellow')
    log(`  跳过 ${name} 服务启动`, 'yellow')
    return null
  }

  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32'

    // Windows 下使用 python -m uvicorn
    const command = isWindows
      ? process.execPath || 'python'
      : 'uv'
    const args = isWindows
      ? ['-m', 'uvicorn', scriptPath, '--host', '0.0.0.0', '--port', port.toString()]
      : ['run', '--with', 'uvicorn[standard]', 'uvicorn', scriptPath, '--host', '0.0.0.0', '--port', port.toString()]

    log(`执行: ${command} ${args.join(' ')}`, 'blue')

    const proc = spawn(command, args, {
      cwd: dirname(scriptPath) === '.' ? __dirname : dirname(scriptPath),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })

    let started = false
    const procName = name

    proc.stdout.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        process.stdout.write(`[${procName}] ${output}\n`)
      }

      if (!started && (output.includes('Application startup complete') || output.includes('Uvicorn running'))) {
        log(`✓ ${name} 服务启动成功`, 'green')
        started = true
        resolve(proc)
      }
    })

    proc.stderr.on('data', (data) => {
      const error = data.toString().trim()
      if (error) {
        // 忽略常见的 Python 警告
        if (error.includes('UserWarning') || error.includes('DeprecationWarning') || error.includes('torch')) {
          return
        }
        process.stderr.write(`[${procName} Error] ${error}\n`)
      }

      if (!started && (error.includes('EADDRINUSE') || error.includes('端口已被占用'))) {
        log(`⚠ ${name} 端口已被占用`, 'yellow')
        resolve(null)
      }
    })

    proc.on('error', (error) => {
      log(`✗ ${name} 服务启动失败: ${error.message}`, 'red')
      resolve(null)
    })

    // 超时处理
    setTimeout(() => {
      if (!started) {
        log(`⚠ ${name} 服务启动超时`, 'yellow')
        resolve(null)
      }
    }, 30000)
  })
}

// 启动后端服务
async function startBackend() {
  logSection('🚀 启动 Express 后端服务')

  const backendPath = join(__dirname, 'server')

  return new Promise((resolve, reject) => {
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let started = false

    backend.stdout.on('data', (data) => {
      const output = data.toString()
      process.stdout.write(`[Backend] ${output}`)

      if (!started && output.includes('服务器运行在')) {
        log('✓ Express 后端服务启动成功', 'green')
        started = true
        resolve(backend)
      }
    })

    backend.stderr.on('data', (data) => {
      const error = data.toString()
      if (!started && error.includes('EADDRINUSE')) {
        log('⚠ Express 后端端口已被占用，可能已在运行', 'yellow')
        resolve(null)
      }
    })

    backend.on('error', (error) => {
      log(`✗ Express 后端启动失败: ${error.message}`, 'red')
      reject(error)
    })

    // 超时处理
    setTimeout(() => {
      if (!started) {
        log('⚠ Express 后端启动超时', 'yellow')
        resolve(null)
      }
    }, 15000)
  })
}

// 启动前端服务
function startFrontend() {
  logSection('🚀 启动前端开发服务')

  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    shell: true,
    stdio: 'inherit'
  })

  frontend.on('error', (error) => {
    log(`✗ 前端服务启动失败: ${error.message}`, 'red')
  })

  log('✓ 前端服务启动中...', 'green')
  return frontend
}

// 打印服务信息
function printServicesInfo() {
  console.log(`
${colors.green}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.green}║           无障碍AI教学平台 - 服务已就绪                    ║${colors.reset}
${colors.green}╠══════════════════════════════════════════════════════════════╣${colors.reset}
${colors.green}║                                                              ║${colors.reset}
${colors.cyan}  📖 bilibili-subtitle: ${colors.reset}http://localhost:8001           ${colors.green}║${colors.reset}
${colors.cyan}  📊 BiliText API:       ${colors.reset}http://localhost:8000              ${colors.green}║${colors.reset}
${colors.cyan}  🌐 Express 后端:        ${colors.reset}http://localhost:${BACKEND_PORT}              ${colors.green}║${colors.reset}
${colors.cyan}  🎨 前端开发:          ${colors.reset}http://localhost:5173             ${colors.green}║${colors.reset}
${colors.cyan}  📖 API 文档:          ${colors.reset}http://localhost:8001/docs         ${colors.green}║${colors.reset}
${colors.green}║                                                              ║${colors.reset}
${colors.green}╚══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.yellow}字幕处理策略:${colors.reset}
  1. 优先使用 bilibili-subtitle 获取B站官方字幕
  2. 失败则调用 FunASR 进行语音转录
  3. 需要完整视觉分析时降级到 bili_text

${colors.yellow}按 Ctrl+C 停止所有服务${colors.reset}
`)
}

// 主函数
async function main() {
  console.clear()
  logSection('🚀 无障碍AI教学平台 - 一键启动')

  const processes = []

  try {
    // 1. 启动 bilibili-subtitle 服务（字幕优先）
    const biliSub = await startPythonService(
      'bilibili-subtitle',
      8001,
      'main:app',
      '/health'
    )
    if (biliSub) processes.push(biliSub)

    // 等待 bilibili-subtitle 就绪
    if (biliSub) {
      await waitForService(`${BILISUBTITLE_URL}/health`, 'bilibili-subtitle', 20000)
    }

    // 2. 启动 BiliText 服务（完整分析，降级使用）
    const biliText = await startPythonService(
      'BiliText',
      8000,
      'bili_text.server.app:app',
      '/health'
    )
    if (biliText) processes.push(biliText)

    // 等待 BiliText 就绪
    if (biliText) {
      await waitForService(`${BILITEXT_URL}/health`, 'BiliText', 20000)
    }

    // 3. 启动 Express 后端
    const backend = await startBackend()
    if (backend) processes.push(backend)

    // 等待后端就绪
    await waitForService(`${BACKEND_URL}/health`, 'Express 后端', 15000)

    // 4. 启动前端
    const frontend = startFrontend()
    processes.push(frontend)

    // 打印服务信息
    printServicesInfo()

  } catch (error) {
    log(`\n启动过程中出现错误: ${error.message}`, 'red')
    log('请检查错误信息并重试', 'yellow')
  }

  // 处理退出
  const cleanup = async () => {
    log('\n\n正在停止所有服务...', 'yellow')

    for (const proc of processes) {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM')
      }
    }

    log('所有服务已停止', 'green')
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

// 运行
main().catch(error => {
  log(`启动失败: ${error.message}`, 'red')
  process.exit(1)
})
