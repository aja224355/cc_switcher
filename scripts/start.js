#!/usr/bin/env node

/**
 * CC Switcher 一键启动脚本 (Node.js 版本)
 * 跨平台支持 Windows / Linux / macOS
 */

import { spawn, exec } from 'child_process'
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { platform } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
}

// ASCII Logo
function showLogo() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████╗ ██████╗    ███████╗██╗    ██╗██╗████████╗██████╗  ║
║    ██╔════╝██╔════╝    ██╔════╝██║    ██║██║╚══██╔══╝██╔════╝ ║
║    ██║     ██║         ███████╗██║ █╗ ██║██║   ██║   ██║      ║
║    ██║     ██║         ╚════██║██║███╗██║██║   ██║   ██║      ║
║    ╚██████╗╚██████╗    ███████║╚███╔███╔╝██║   ██║   ╚██████╗ ║
║     ╚═════╝ ╚═════╝    ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝ ║
║                                                               ║
║           Claude / Codex / Gemini 配置管理工具                ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`)
}

// 检查依赖是否已安装
function checkDependencies() {
  const mainModules = join(rootDir, 'node_modules')
  const agentModules = join(rootDir, 'local-agent', 'node_modules')
  
  return {
    main: existsSync(mainModules),
    agent: existsSync(agentModules)
  }
}

// 安装依赖
function installDependencies(path, name) {
  return new Promise((resolve, reject) => {
    log.info(`安装 ${name} 依赖...`)
    
    const npm = platform() === 'win32' ? 'npm.cmd' : 'npm'
    const proc = spawn(npm, ['install'], {
      cwd: path,
      stdio: 'inherit',
      shell: true
    })
    
    proc.on('close', (code) => {
      if (code === 0) {
        log.success(`${name} 依赖安装完成`)
        resolve()
      } else {
        reject(new Error(`${name} 依赖安装失败 (code: ${code})`))
      }
    })
    
    proc.on('error', reject)
  })
}

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const cmd = platform() === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} 2>/dev/null || ss -tuln | grep :${port}`
    
    exec(cmd, (error, stdout) => {
      resolve(stdout.trim().length > 0)
    })
  })
}

// 启动本地代理
async function startAgent() {
  const agentDir = join(rootDir, 'local-agent')
  const pidFile = join(rootDir, '.agent.pid')
  
  // 检查端口
  if (await checkPort(17532)) {
    log.warn('端口 17532 已被占用，本地代理可能已在运行')
    return null
  }
  
  log.info('启动本地代理 (端口 17532)...')
  
  const node = platform() === 'win32' ? 'node.exe' : 'node'
  const agent = spawn(node, ['index.js'], {
    cwd: agentDir,
    detached: platform() !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  })
  
  // 保存 PID
  writeFileSync(pidFile, agent.pid.toString())
  
  // 如果在 Unix 系统，让子进程独立运行
  if (platform() !== 'win32') {
    agent.unref()
  }
  
  // 等待启动
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  log.success(`本地代理已启动 (PID: ${agent.pid})`)
  return agent
}

// 停止本地代理
function stopAgent() {
  const pidFile = join(rootDir, '.agent.pid')
  
  if (existsSync(pidFile)) {
    try {
      const pid = parseInt(readFileSync(pidFile, 'utf8'))
      if (platform() === 'win32') {
        exec(`taskkill /PID ${pid} /F`, () => {})
      } else {
        process.kill(pid)
      }
      log.success('本地代理已停止')
    } catch (e) {
      // 进程可能已经不存在
    }
    unlinkSync(pidFile)
  }
}

// 启动 Web UI
function startWebUI() {
  return new Promise((resolve, reject) => {
    log.info('启动 Web UI (端口 5173)...')
    
    console.log(`
${colors.green}════════════════════════════════════════════════════════════════${colors.reset}

  🌐 Web UI:        ${colors.cyan}http://localhost:5173${colors.reset}
  🔌 本地代理:      ${colors.cyan}http://localhost:17532${colors.reset}

  💡 提示: 按 ${colors.yellow}Ctrl+C${colors.reset} 停止所有服务

${colors.green}════════════════════════════════════════════════════════════════${colors.reset}
`)
    
    const npm = platform() === 'win32' ? 'npm.cmd' : 'npm'
    const webui = spawn(npm, ['run', 'dev'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    })
    
    webui.on('close', (code) => {
      resolve(code)
    })
    
    webui.on('error', reject)
  })
}

// 主函数
async function main() {
  showLogo()
  
  // 检查依赖
  console.log(`${colors.blue}[1/4]${colors.reset} 检查 Node.js 环境...`)
  log.success(`Node.js ${process.version}`)
  
  const deps = checkDependencies()
  
  // 安装主项目依赖
  console.log(`\n${colors.blue}[2/4]${colors.reset} 检查 Web UI 依赖...`)
  if (!deps.main) {
    await installDependencies(rootDir, 'Web UI')
  } else {
    log.success('Web UI 依赖已安装')
  }
  
  // 安装代理依赖
  console.log(`\n${colors.blue}[3/4]${colors.reset} 检查本地代理依赖...`)
  if (!deps.agent) {
    await installDependencies(join(rootDir, 'local-agent'), '本地代理')
  } else {
    log.success('本地代理依赖已安装')
  }
  
  // 启动服务
  console.log(`\n${colors.blue}[4/4]${colors.reset} 启动服务...`)
  
  // 捕获退出信号
  const cleanup = () => {
    console.log(`\n${colors.yellow}正在停止服务...${colors.reset}`)
    stopAgent()
    process.exit(0)
  }
  
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  
  // 启动代理
  await startAgent()
  
  // 启动 Web UI (阻塞)
  await startWebUI()
  
  // 清理
  stopAgent()
}

main().catch(err => {
  log.error(err.message)
  process.exit(1)
})
