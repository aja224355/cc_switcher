/**
 * Local Agent Service
 * 
 * 用于与本地代理程序通信，实现配置文件的读写操作
 */

import { getGlobalSettings } from '@/utils/storage'

// 动态获取代理 URL
function getAgentUrl(): string {
  const settings = getGlobalSettings()
  return `http://localhost:${settings.agentPort || 17532}`
}

const TIMEOUT = 3000  // 3秒超时

export interface AgentInfo {
  status: string
  version: string
  environment: string  // 'win32', 'linux', 'darwin', 'wsl'
  home: string
  platform: string
  hostname: string
  timestamp: string
}

export interface ConfigPath {
  dir: string
  file: string
  exists: boolean
}

export interface SystemInfo {
  environment: string
  home: string
  windowsHome: string | null
  paths: {
    claude: ConfigPath
    codex: ConfigPath
    gemini: ConfigPath
  }
  platform: string
  arch: string
}

export interface ConfigResult {
  success: boolean
  exists?: boolean
  path?: string
  content?: string | null
  error?: string
}

export interface WriteResult {
  success: boolean
  path?: string
  backup?: string | null
  message?: string
  error?: string
}

export interface BackupFile {
  name: string
  path: string
  created: string
}

// 检查代理是否在运行
export async function checkAgentStatus(): Promise<AgentInfo | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
    
    const response = await fetch(`${getAgentUrl()}/health`, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      return await response.json()
    }
    return null
  } catch {
    return null
  }
}

// 获取系统信息
export async function getSystemInfo(): Promise<SystemInfo | null> {
  try {
    const response = await fetch(`${getAgentUrl()}/info`)
    if (response.ok) {
      return await response.json()
    }
    return null
  } catch {
    return null
  }
}

// 读取配置
export async function readConfig(
  type: 'claude' | 'codex' | 'gemini',
  target?: string
): Promise<ConfigResult> {
  try {
    const url = new URL(`${getAgentUrl()}/config/${type}`)
    if (target) {
      url.searchParams.set('target', target)
    }
    
    const response = await fetch(url.toString())
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '连接本地代理失败'
    }
  }
}

// 写入配置
export async function writeConfig(
  type: 'claude' | 'codex' | 'gemini',
  content: string,
  options: { backup?: boolean; target?: string } = {}
): Promise<WriteResult> {
  try {
    const response = await fetch(`${getAgentUrl()}/config/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        backup: options.backup ?? true,
        target: options.target
      })
    })
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '连接本地代理失败'
    }
  }
}

// 设置环境变量
export async function setEnvVars(
  type: 'claude' | 'codex' | 'gemini',
  vars: Record<string, string>,
  format: 'shell' | 'powershell' | 'dotenv' = 'shell'
): Promise<WriteResult> {
  try {
    const response = await fetch(`${AGENT_URL}/env/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vars, format })
    })
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '连接本地代理失败'
    }
  }
}

// 批量应用配置
export async function applyConfigs(
  configs: Array<{
    type: 'claude' | 'codex' | 'gemini'
    content: string
    backup?: boolean
    target?: string
  }>
): Promise<{
  success: boolean
  results: Array<{
    type: string
    success: boolean
    path?: string
    backup?: string | null
    error?: string
  }>
  message: string
}> {
  try {
    const response = await fetch(`${AGENT_URL}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ configs })
    })
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      results: [],
      message: error instanceof Error ? error.message : '连接本地代理失败'
    }
  }
}

// 列出备份
export async function listBackups(
  type: 'claude' | 'codex' | 'gemini'
): Promise<{
  success: boolean
  backups: BackupFile[]
  error?: string
}> {
  try {
    const response = await fetch(`${AGENT_URL}/backups/${type}`)
    return await response.json()
  } catch (error) {
    return {
      success: false,
      backups: [],
      error: error instanceof Error ? error.message : '连接本地代理失败'
    }
  }
}

// 恢复备份
export async function restoreBackup(
  type: 'claude' | 'codex' | 'gemini',
  backupFile: string
): Promise<WriteResult> {
  try {
    const response = await fetch(`${AGENT_URL}/restore/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ backupFile })
    })
    
    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '连接本地代理失败'
    }
  }
}

// 自动检测并应用配置 (带 UI 友好的结果)
export async function autoApplyConfig(
  type: 'claude' | 'codex' | 'gemini',
  content: string
): Promise<{
  success: boolean
  method: 'agent' | 'clipboard' | 'download'
  message: string
  path?: string
}> {
  // 首先检查代理是否在运行
  const agentStatus = await checkAgentStatus()
  
  if (agentStatus) {
    // 代理在运行，直接写入
    const result = await writeConfig(type, content, { backup: true })
    
    if (result.success) {
      return {
        success: true,
        method: 'agent',
        message: `✅ 配置已直接写入 ${result.path}${result.backup ? '\n📦 原配置已备份' : ''}`,
        path: result.path
      }
    } else {
      return {
        success: false,
        method: 'agent',
        message: `❌ 写入失败: ${result.error}`
      }
    }
  }
  
  // 代理未运行，尝试复制到剪贴板
  try {
    await navigator.clipboard.writeText(content)
    return {
      success: true,
      method: 'clipboard',
      message: '📋 配置已复制到剪贴板\n\n代理程序未运行，请手动将配置粘贴到配置文件中'
    }
  } catch {
    // 剪贴板也失败，使用下载
    return {
      success: true,
      method: 'download',
      message: '无法自动应用配置，请下载配置文件'
    }
  }
}
