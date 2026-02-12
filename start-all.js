#!/usr/bin/env node
/**
 * 统一启动脚本
 * 一键启动所有服务：bili_text API + Express 后端 + 前端
 *
 * 服务端口：
 *   - BiliText API: 8000 (Python/FastAPI - B站视频分析)
 *   - Express 后端: 3001/3002 (Node.js/Express)
 *   - 前端开发: 5173 (Vite)
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
const BILITEXT_URL = 'http://localhost:8000'
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

// 启动 BiliText 服务
async function startBiliText() {
  logSection('🚀 启动 BiliText 服务 (端口 8000)')

  // 检查是否已在运行
  const biliTextRunning = await checkService(`${BILITEXT_URL}/health`, 'BiliText')
  if (biliTextRunning) {
    log('✓ BiliText 服务已在运行', 'green')
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
    log('⚠ 未安装 uv 包管理器，请手动安装: https://docs.astral.sh/uv/', 'yellow')
    log('  跳过 BiliText 服务启动', 'yellow')
    return null
  }

  return new Promise((resolve, reject) => {
    const biliTextPath = join(__dirname, 'api')
    const isWindows = process.platform === 'win32'

    // Windows 下使用 uvicorn.exe，非 Windows 使用 uv run
    const command = isWindows
      ? '.venv\\Scripts\\uvicorn.exe'
      : 'uv'
    const args = isWindows
      ? ['bili_text.server.app:app', '--host', '0.0.0.0', '--port', '8000', '--reload']
      : ['run', '--with', 'uvicorn[standard]', 'uvicorn', 'bili_text.server.app:app', '--host', '0.0.0.0', '--port', '8000']

    log(`执行: ${command} ${args.join(' ')}`, 'blue')

    const biliText = spawn(command, args, {
      cwd: biliTextPath,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    })

    let started = false

    biliText.stdout.on('data', (data) => {
      const output = data.toString()
      process.stdout.write(`[BiliText] ${output}`)

      if (!started && (output.includes('Application startup complete') || output.includes('Uvicorn running'))) {
        log('✓ BiliText 服务启动成功', 'green')
        started = true
        resolve(biliText)
      }
    })

    biliText.stderr.on('data', (data) => {
      const error = data.toString()
      if (!started && error.includes('EADDRINUSE')) {
        log('⚠ BiliText 端口已被占用', 'yellow')
        resolve(null)
        return
      }
      // 忽略常见的 Python 警告
      if (error.includes('UserWarning') || error.includes('DeprecationWarning') || error.includes('torch')) {
        return
      }
      process.stderr.write(`[BiliText Error] ${error}`)
    })

    biliText.on('error', (error) => {
      log(`✗ BiliText 服务启动失败: ${error.message}`, 'red')
      reject(error)
    })

    // 超时处理
    setTimeout(() => {
      if (!started) {
        log('⚠ BiliText 服务启动超时', 'yellow')
        resolve(null)
      }
    }, 20000)
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
${colors.cyan}  📊 BiliText API:  ${colors.reset}http://localhost:8000              ${colors.green}║${colors.reset}
${colors.cyan}  🌐 Express 后端:   ${colors.reset}http://localhost:${BACKEND_PORT}              ${colors.green}║${colors.reset}
${colors.cyan}  🎨 前端开发:     ${colors.reset}http://localhost:5173             ${colors.green}║${colors.reset}
${colors.cyan}  📖 API 文档:     ${colors.reset}http://localhost:8000/docs            ${colors.green}║${colors.reset}
${colors.green}║                                                              ║${colors.reset}
${colors.green}╚══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.yellow}按 Ctrl+C 停止所有服务${colors.reset}
`)
}

// 主函数
async function main() {
  console.clear()
  logSection('🚀 无障碍AI教学平台 - 一键启动')

  const processes = []

  try {
    // 1. 启动 BiliText 服务
    const biliText = await startBiliText()
    if (biliText) processes.push(biliText)

    // 等待 BiliText 就绪
    if (biliText) {
      await waitForService(`${BILITEXT_URL}/health`, 'BiliText', 20000)
    }

    // 2. 启动 Express 后端
    const backend = await startBackend()
    if (backend) processes.push(backend)

    // 等待后端就绪
    await waitForService(`${BACKEND_URL}/health`, 'Express 后端', 15000)

    // 3. 启动前端
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
