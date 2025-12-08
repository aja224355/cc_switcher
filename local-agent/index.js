#!/usr/bin/env node

/**
 * CC Switcher Local Agent
 * 
 * 本地代理程序，用于接收来自 Web UI 的配置请求并写入本地文件
 * 
 * 使用方法:
 *   1. npm install
 *   2. npm start 或 node index.js
 *   3. 在 Web UI 中使用 "一键应用配置" 功能
 * 
 * 端口: 默认 17532 (可通过环境变量 PORT 修改)
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

const app = express()
const PORT = process.env.PORT || 17532  // 默认端口

// 中间件
app.use(cors({
  origin: true,  // 允许所有来源 (本地开发)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}))
app.use(express.json())

// 获取用户目录
const HOME = os.homedir()

// 配置文件路径映射
const CONFIG_PATHS = {
  claude: {
    windows: path.join(HOME, '.claude'),
    wsl: null,  // WSL 路径需要特殊处理
    linux: path.join(HOME, '.claude'),
    darwin: path.join(HOME, '.claude'),
    settingsFile: 'settings.json'
  },
  codex: {
    windows: path.join(HOME, '.codex'),
    wsl: null,
    linux: path.join(HOME, '.codex'),
    darwin: path.join(HOME, '.codex'),
    settingsFile: 'config.toml'
  },
  gemini: {
    windows: path.join(HOME, '.gemini'),
    wsl: null,
    linux: path.join(HOME, '.gemini'),
    darwin: path.join(HOME, '.gemini'),
    settingsFile: 'settings.json'
  }
}

// 检测运行环境
function detectEnvironment() {
  const platform = os.platform()
  
  // 检测是否在 WSL 中运行
  if (platform === 'linux') {
    try {
      const release = fs.readFileSync('/proc/version', 'utf8')
      if (release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl')) {
        return 'wsl'
      }
    } catch {
      // 忽略错误
    }
  }
  
  return platform  // 'win32', 'linux', 'darwin'
}

// 获取 Windows 用户目录 (在 WSL 中)
function getWindowsHome() {
  try {
    const result = execSync('cmd.exe /c "echo %USERPROFILE%"', { encoding: 'utf8' })
    const winPath = result.trim().replace(/\\/g, '/')
    // 转换 Windows 路径到 WSL 路径
    const match = winPath.match(/^([A-Za-z]):(.*)$/)
    if (match) {
      return `/mnt/${match[1].toLowerCase()}${match[2]}`
    }
  } catch {
    // 忽略错误
  }
  return null
}

// 获取配置文件路径
function getConfigPath(providerType, targetEnv = null) {
  const env = targetEnv || detectEnvironment()
  const config = CONFIG_PATHS[providerType]
  
  if (!config) {
    throw new Error(`未知的供应商类型: ${providerType}`)
  }
  
  let basePath
  
  if (env === 'wsl') {
    // WSL 环境下，默认写入 WSL 的 home 目录
    // 但也可以选择写入 Windows 用户目录
    basePath = path.join(HOME, `.${providerType}`)
  } else if (env === 'win32' || env === 'windows') {
    basePath = config.windows
  } else if (env === 'darwin') {
    basePath = config.darwin
  } else {
    basePath = config.linux
  }
  
  return {
    dir: basePath,
    file: path.join(basePath, config.settingsFile)
  }
}

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📁 创建目录: ${dirPath}`)
  }
}

// 备份原有配置
function backupConfig(filePath) {
  if (fs.existsSync(filePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${filePath}.backup.${timestamp}`
    fs.copyFileSync(filePath, backupPath)
    console.log(`📦 备份原配置: ${backupPath}`)
    return backupPath
  }
  return null
}

// ============================================
// API 路由
// ============================================

// 健康检查
app.get('/health', (req, res) => {
  const env = detectEnvironment()
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: env,
    home: HOME,
    platform: os.platform(),
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  })
})

// 获取系统信息
app.get('/info', (req, res) => {
  const env = detectEnvironment()
  const paths = {}
  
  for (const [type, _] of Object.entries(CONFIG_PATHS)) {
    try {
      const configPath = getConfigPath(type)
      paths[type] = {
        dir: configPath.dir,
        file: configPath.file,
        exists: fs.existsSync(configPath.file)
      }
    } catch (e) {
      paths[type] = { error: e.message }
    }
  }
  
  res.json({
    environment: env,
    home: HOME,
    windowsHome: env === 'wsl' ? getWindowsHome() : null,
    paths,
    platform: os.platform(),
    arch: os.arch()
  })
})

// 读取配置
app.get('/config/:type', (req, res) => {
  const { type } = req.params
  const { target } = req.query  // 可选: 'wsl', 'windows', 'linux'
  
  try {
    const configPath = getConfigPath(type, target)
    
    if (!fs.existsSync(configPath.file)) {
      return res.json({
        success: true,
        exists: false,
        path: configPath.file,
        content: null
      })
    }
    
    const content = fs.readFileSync(configPath.file, 'utf8')
    
    res.json({
      success: true,
      exists: true,
      path: configPath.file,
      content
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 写入配置
app.post('/config/:type', (req, res) => {
  const { type } = req.params
  const { content, backup = true, target } = req.body
  
  if (!content) {
    return res.status(400).json({
      success: false,
      error: '缺少配置内容'
    })
  }
  
  try {
    const configPath = getConfigPath(type, target)
    
    // 确保目录存在
    ensureDir(configPath.dir)
    
    // 备份原配置
    let backupPath = null
    if (backup) {
      backupPath = backupConfig(configPath.file)
    }
    
    // 写入新配置
    fs.writeFileSync(configPath.file, content, 'utf8')
    console.log(`✅ 写入配置: ${configPath.file}`)
    
    res.json({
      success: true,
      path: configPath.file,
      backup: backupPath,
      message: `配置已成功写入 ${configPath.file}`
    })
  } catch (error) {
    console.error(`❌ 写入失败:`, error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 设置环境变量 (创建 .env 文件或导出脚本)
app.post('/env/:type', (req, res) => {
  const { type } = req.params
  const { vars, format = 'shell' } = req.body  // vars: { KEY: value }
  
  if (!vars || typeof vars !== 'object') {
    return res.status(400).json({
      success: false,
      error: '缺少环境变量'
    })
  }
  
  try {
    const configPath = getConfigPath(type)
    ensureDir(configPath.dir)
    
    let content = ''
    let filename = ''
    
    if (format === 'shell') {
      // 生成 shell 脚本
      content = '#!/bin/bash\n# CC Switcher 环境变量设置\n\n'
      for (const [key, value] of Object.entries(vars)) {
        content += `export ${key}="${value}"\n`
      }
      filename = 'env.sh'
    } else if (format === 'powershell') {
      // 生成 PowerShell 脚本
      content = '# CC Switcher 环境变量设置\n\n'
      for (const [key, value] of Object.entries(vars)) {
        content += `$env:${key} = "${value}"\n`
      }
      filename = 'env.ps1'
    } else if (format === 'dotenv') {
      // 生成 .env 文件
      for (const [key, value] of Object.entries(vars)) {
        content += `${key}=${value}\n`
      }
      filename = '.env'
    }
    
    const filePath = path.join(configPath.dir, filename)
    fs.writeFileSync(filePath, content, 'utf8')
    
    // 如果是 shell 脚本，设置执行权限
    if (format === 'shell' && os.platform() !== 'win32') {
      fs.chmodSync(filePath, '755')
    }
    
    console.log(`✅ 写入环境变量: ${filePath}`)
    
    res.json({
      success: true,
      path: filePath,
      format,
      message: `环境变量已写入 ${filePath}`
    })
  } catch (error) {
    console.error(`❌ 写入失败:`, error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 批量应用配置
app.post('/apply', (req, res) => {
  const { configs } = req.body
  // configs: [{ type: 'claude', content: '...', backup: true }, ...]
  
  if (!Array.isArray(configs) || configs.length === 0) {
    return res.status(400).json({
      success: false,
      error: '缺少配置列表'
    })
  }
  
  const results = []
  
  for (const config of configs) {
    try {
      const configPath = getConfigPath(config.type, config.target)
      ensureDir(configPath.dir)
      
      let backupPath = null
      if (config.backup !== false) {
        backupPath = backupConfig(configPath.file)
      }
      
      fs.writeFileSync(configPath.file, config.content, 'utf8')
      console.log(`✅ 写入配置: ${configPath.file}`)
      
      results.push({
        type: config.type,
        success: true,
        path: configPath.file,
        backup: backupPath
      })
    } catch (error) {
      console.error(`❌ 写入 ${config.type} 失败:`, error)
      results.push({
        type: config.type,
        success: false,
        error: error.message
      })
    }
  }
  
  const allSuccess = results.every(r => r.success)
  
  res.json({
    success: allSuccess,
    results,
    message: allSuccess 
      ? '所有配置已成功应用' 
      : '部分配置应用失败'
  })
})

// 列出备份
app.get('/backups/:type', (req, res) => {
  const { type } = req.params
  
  try {
    const configPath = getConfigPath(type)
    
    if (!fs.existsSync(configPath.dir)) {
      return res.json({
        success: true,
        backups: []
      })
    }
    
    const files = fs.readdirSync(configPath.dir)
    const backups = files
      .filter(f => f.includes('.backup.'))
      .map(f => ({
        name: f,
        path: path.join(configPath.dir, f),
        created: fs.statSync(path.join(configPath.dir, f)).mtime
      }))
      .sort((a, b) => b.created - a.created)
    
    res.json({
      success: true,
      backups
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 恢复备份
app.post('/restore/:type', (req, res) => {
  const { type } = req.params
  const { backupFile } = req.body
  
  if (!backupFile) {
    return res.status(400).json({
      success: false,
      error: '缺少备份文件名'
    })
  }
  
  try {
    const configPath = getConfigPath(type)
    const backupPath = path.join(configPath.dir, backupFile)
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: '备份文件不存在'
      })
    }
    
    // 备份当前配置
    backupConfig(configPath.file)
    
    // 恢复
    fs.copyFileSync(backupPath, configPath.file)
    console.log(`✅ 已恢复备份: ${backupFile}`)
    
    res.json({
      success: true,
      message: `已恢复备份 ${backupFile}`,
      path: configPath.file
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  const env = detectEnvironment()
  
  console.log('')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║           CC Switcher Local Agent v1.0.0                     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`🚀 服务已启动: http://localhost:${PORT}`)
  console.log('')
  console.log('📍 系统信息:')
  console.log(`   运行环境: ${env}`)
  console.log(`   用户目录: ${HOME}`)
  console.log(`   平台: ${os.platform()} ${os.arch()}`)
  console.log('')
  console.log('📂 配置文件路径:')
  
  for (const [type, _] of Object.entries(CONFIG_PATHS)) {
    try {
      const p = getConfigPath(type)
      const exists = fs.existsSync(p.file) ? '✓' : '✗'
      console.log(`   ${type}: ${p.file} [${exists}]`)
    } catch {
      console.log(`   ${type}: 错误`)
    }
  }
  
  console.log('')
  console.log('📡 API 端点:')
  console.log(`   GET  /health        - 健康检查`)
  console.log(`   GET  /info          - 系统信息`)
  console.log(`   GET  /config/:type  - 读取配置`)
  console.log(`   POST /config/:type  - 写入配置`)
  console.log(`   POST /env/:type     - 设置环境变量`)
  console.log(`   POST /apply         - 批量应用配置`)
  console.log(`   GET  /backups/:type - 列出备份`)
  console.log(`   POST /restore/:type - 恢复备份`)
  console.log('')
  console.log('💡 在浏览器中打开 CC Switcher Web UI，即可使用一键应用功能')
  console.log('')
  console.log('按 Ctrl+C 停止服务...')
  console.log('')
})
