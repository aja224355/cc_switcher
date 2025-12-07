import { Provider, ProviderType, ClaudeProvider, CodexProvider, GeminiProvider } from '@/types/provider'
import { v4 as uuidv4 } from 'uuid'

// 存储键
const STORAGE_KEYS = {
  claude: 'claude-code-providers',
  codex: 'codex-providers',
  gemini: 'gemini-providers',
}
const ACTIVE_PROVIDER_KEYS = {
  claude: 'claude-code-active-provider',
  codex: 'codex-active-provider',
  gemini: 'gemini-active-provider',
}

// cc-switch SQL 格式的配置接口
export interface CCSwitchConfig {
  id: number
  name: string
  apiKey: string
  apiUrl: string
  models: string
  isActive: number
  createdAt: string
  updatedAt: string
}

// 通用获取供应商
export function getProvidersByType<T extends Provider>(type: ProviderType): T[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS[type])
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 保持向后兼容
export function getProviders(): ClaudeProvider[] {
  return getProvidersByType<ClaudeProvider>('claude')
}

export function getCodexProviders(): CodexProvider[] {
  return getProvidersByType<CodexProvider>('codex')
}

export function getGeminiProviders(): GeminiProvider[] {
  return getProvidersByType<GeminiProvider>('gemini')
}

// 通用保存供应商
export function saveProvidersByType<T extends Provider>(type: ProviderType, providers: T[]): void {
  localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(providers))
}

export function saveProviders(providers: ClaudeProvider[]): void {
  saveProvidersByType('claude', providers)
}

export function saveCodexProviders(providers: CodexProvider[]): void {
  saveProvidersByType('codex', providers)
}

export function saveGeminiProviders(providers: GeminiProvider[]): void {
  saveProvidersByType('gemini', providers)
}

// 通用添加供应商
export function addProviderByType<T extends Provider>(type: ProviderType, provider: T): void {
  const providers = getProvidersByType<T>(type)
  providers.push(provider)
  saveProvidersByType(type, providers)
}

export function addProvider(provider: ClaudeProvider): void {
  addProviderByType('claude', provider)
}

export function addCodexProvider(provider: CodexProvider): void {
  addProviderByType('codex', provider)
}

export function addGeminiProvider(provider: GeminiProvider): void {
  addProviderByType('gemini', provider)
}

// 通用更新供应商
export function updateProviderByType<T extends Provider>(type: ProviderType, provider: T): void {
  const providers = getProvidersByType<T>(type)
  const index = providers.findIndex(p => p.id === provider.id)
  if (index !== -1) {
    providers[index] = { ...provider, updatedAt: Date.now() }
    saveProvidersByType(type, providers)
  }
}

export function updateProvider(provider: ClaudeProvider): void {
  updateProviderByType('claude', provider)
}

export function updateCodexProvider(provider: CodexProvider): void {
  updateProviderByType('codex', provider)
}

export function updateGeminiProvider(provider: GeminiProvider): void {
  updateProviderByType('gemini', provider)
}

// 通用删除供应商
export function deleteProviderByType(type: ProviderType, id: string): void {
  const providers = getProvidersByType(type)
  saveProvidersByType(type, providers.filter(p => p.id !== id))
  
  if (getActiveProviderIdByType(type) === id) {
    setActiveProviderIdByType(type, null)
  }
}

export function deleteProvider(id: string): void {
  deleteProviderByType('claude', id)
}

export function deleteCodexProvider(id: string): void {
  deleteProviderByType('codex', id)
}

export function deleteGeminiProvider(id: string): void {
  deleteProviderByType('gemini', id)
}

// 通用激活供应商
export function getActiveProviderIdByType(type: ProviderType): string | null {
  return localStorage.getItem(ACTIVE_PROVIDER_KEYS[type])
}

export function getActiveProviderId(): string | null {
  return getActiveProviderIdByType('claude')
}

export function setActiveProviderIdByType(type: ProviderType, id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PROVIDER_KEYS[type], id)
  } else {
    localStorage.removeItem(ACTIVE_PROVIDER_KEYS[type])
  }
}

export function setActiveProviderId(id: string | null): void {
  setActiveProviderIdByType('claude', id)
}

// 导出为 JSON 格式
export function exportProvidersJSON(): string {
  const providers = getProviders()
  return JSON.stringify(providers, null, 2)
}

// 导出为 cc-switch 兼容的 SQL 格式
export function exportProvidersSQL(): string {
  const providers = getProviders()
  const activeId = getActiveProviderId()
  
  let sql = `-- Claude Code Switch 配置导出
-- 导出时间: ${new Date().toISOString()}
-- 格式兼容: cc-switch (https://github.com/farion1231/cc-switch)

DROP TABLE IF EXISTS providers;
CREATE TABLE providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT DEFAULT 'claude',
  name TEXT NOT NULL,
  apiKey TEXT NOT NULL,
  apiUrl TEXT NOT NULL,
  models TEXT,
  isActive INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

`
  
  providers.forEach((provider, index) => {
    const models = JSON.stringify({
      main: provider.mainModel,
      haiku: provider.haikuModel,
      sonnet: provider.sonnetModel,
      opus: provider.opusModel
    })
    const isActive = provider.id === activeId ? 1 : 0
    const createdAt = new Date(provider.createdAt).toISOString()
    const updatedAt = new Date(provider.updatedAt).toISOString()
    
    sql += `INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (${index + 1}, 'claude', '${escapeSql(provider.name)}', '${escapeSql(provider.apiKey)}', '${escapeSql(provider.requestUrl)}', '${escapeSql(models)}', ${isActive}, '${createdAt}', '${updatedAt}');\n`
  })
  
  return sql
}

// SQL 字符串转义
function escapeSql(str: string): string {
  return str.replace(/'/g, "''")
}

// 从 SQL 格式导入 (支持多类型)
export function importProvidersSQL(sql: string): { success: boolean; count: number; error?: string; details?: { claude: number; codex: number; gemini: number } } {
  try {
    const claudeProviders: ClaudeProvider[] = []
    const codexProviders: CodexProvider[] = []
    const geminiProviders: GeminiProvider[] = []
    let claudeActiveId: string | null = null
    let codexActiveId: string | null = null
    let geminiActiveId: string | null = null
    
    // 匹配 INSERT 语句
    const insertRegex = /INSERT INTO providers\s*\([^)]+\)\s*VALUES\s*\(([^;]+)\);/gi
    let match
    
    while ((match = insertRegex.exec(sql)) !== null) {
      const valuesStr = match[1]
      const values = parseInsertValues(valuesStr)
      
      if (values.length >= 6) {
        const id = uuidv4()
        const providerType = (values[1] || 'claude').toLowerCase().replace(/['"]/g, '') as ProviderType
        
        // 解析 models JSON
        let modelsData: Record<string, string> = {}
        try {
          const modelsStr = values[5] || values[4]
          if (modelsStr) {
            modelsData = JSON.parse(modelsStr)
          }
        } catch {
          modelsData = { main: values[4] || '' }
        }
        
        const baseProvider = {
          id,
          name: values[2] || values[1] || '未命名',
          notes: '',
          websiteUrl: '',
          apiKey: values[3] || values[2] || '',
          requestUrl: values[4] || values[3] || '',
          configJson: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
          authMode: 'apikey' as const,
          environmentMode: 'local' as const,
          sshRemotes: [],
          activeRemoteId: null
        }
        
        const isActiveIdx = values.length > 6 ? 6 : 5
        const isActive = values[isActiveIdx] === '1' || values[isActiveIdx] === 1
        
        if (providerType === 'codex') {
          const provider: CodexProvider = {
            ...baseProvider,
            type: 'codex',
            model: modelsData.main || '',
            authJson: {},
            approvalPolicy: (modelsData.approvalPolicy as CodexProvider['approvalPolicy']) || undefined,
            sandboxMode: (modelsData.sandboxMode as CodexProvider['sandboxMode']) || undefined,
            modelProvider: modelsData.modelProvider || undefined
          }
          provider.configJson = generateCodexConfigJson(provider)
          codexProviders.push(provider)
          if (isActive) codexActiveId = id
        } else if (providerType === 'gemini') {
          const provider: GeminiProvider = {
            ...baseProvider,
            type: 'gemini',
            model: modelsData.main || ''
          }
          provider.configJson = generateGeminiConfigJson(provider)
          geminiProviders.push(provider)
          if (isActive) geminiActiveId = id
        } else {
          // Default to claude
          const provider: ClaudeProvider = {
            ...baseProvider,
            type: 'claude',
            mainModel: modelsData.main || '',
            haikuModel: modelsData.haiku || '',
            sonnetModel: modelsData.sonnet || '',
            opusModel: modelsData.opus || ''
          }
          provider.configJson = generateConfigJson(provider)
          claudeProviders.push(provider)
          if (isActive) claudeActiveId = id
        }
      }
    }
    
    const totalCount = claudeProviders.length + codexProviders.length + geminiProviders.length
    
    if (totalCount > 0) {
      if (claudeProviders.length > 0) {
        saveProviders(claudeProviders)
        if (claudeActiveId) setActiveProviderId(claudeActiveId)
      }
      if (codexProviders.length > 0) {
        saveCodexProviders(codexProviders)
        if (codexActiveId) setActiveProviderIdByType('codex', codexActiveId)
      }
      if (geminiProviders.length > 0) {
        saveGeminiProviders(geminiProviders)
        if (geminiActiveId) setActiveProviderIdByType('gemini', geminiActiveId)
      }
      
      return { 
        success: true, 
        count: totalCount,
        details: {
          claude: claudeProviders.length,
          codex: codexProviders.length,
          gemini: geminiProviders.length
        }
      }
    }
    
    return { success: false, count: 0, error: '未找到有效的配置数据' }
  } catch (error) {
    return { success: false, count: 0, error: String(error) }
  }
}

// 解析 INSERT VALUES
function parseInsertValues(valuesStr: string): string[] {
  const values: string[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let i = 0
  
  while (i < valuesStr.length) {
    const char = valuesStr[i]
    
    if (!inString) {
      if (char === "'" || char === '"') {
        inString = true
        stringChar = char
      } else if (char === ',') {
        values.push(current.trim())
        current = ''
        i++
        continue
      } else {
        current += char
      }
    } else {
      if (char === stringChar) {
        // 检查是否是转义的引号
        if (i + 1 < valuesStr.length && valuesStr[i + 1] === stringChar) {
          current += char
          i++
        } else {
          inString = false
        }
      } else {
        current += char
      }
    }
    i++
  }
  
  if (current.trim()) {
    values.push(current.trim())
  }
  
  return values
}

// 从 JSON 格式导入
export function importProvidersJSON(json: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(json)
    
    if (Array.isArray(data)) {
      // 验证并处理每个 provider
      const providers: ClaudeProvider[] = data.map(item => {
        const provider: ClaudeProvider = {
          id: item.id || uuidv4(),
          type: 'claude' as const,
          name: item.name || '未命名',
          notes: item.notes || '',
          websiteUrl: item.websiteUrl || '',
          apiKey: item.apiKey || '',
          requestUrl: item.requestUrl || '',
          mainModel: item.mainModel || '',
          haikuModel: item.haikuModel || '',
          sonnetModel: item.sonnetModel || '',
          opusModel: item.opusModel || '',
          configJson: {},
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
          authMode: item.authMode || 'apikey',
          environmentMode: item.environmentMode || 'local',
          sshRemotes: item.sshRemotes || [],
          activeRemoteId: item.activeRemoteId || null
        }
        provider.configJson = item.configJson || generateConfigJson(provider)
        return provider
      })
      
      saveProviders(providers)
      return { success: true, count: providers.length }
    }
    
    return { success: false, count: 0, error: '无效的 JSON 格式' }
  } catch (error) {
    return { success: false, count: 0, error: String(error) }
  }
}

// 自动检测格式并导入
export function importProviders(content: string): { success: boolean; count: number; error?: string; format?: string } {
  const trimmed = content.trim()
  
  // 检测是否为 SQL 格式
  if (trimmed.includes('CREATE TABLE') || trimmed.includes('INSERT INTO')) {
    const result = importProvidersSQL(content)
    return { ...result, format: 'sql' }
  }
  
  // 尝试 JSON 格式
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const result = importProvidersJSON(content)
    return { ...result, format: 'json' }
  }
  
  return { success: false, count: 0, error: '无法识别的文件格式', format: 'unknown' }
}

// 保留旧的导出函数名以保持兼容
export function exportProviders(): string {
  return exportProvidersJSON()
}

export function generateConfigJson(provider: ClaudeProvider): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  
  if (provider.requestUrl) {
    config.apiBaseUrl = provider.requestUrl
  }
  if (provider.apiKey) {
    config.apiKey = provider.apiKey
  }
  if (provider.mainModel) {
    config.model = provider.mainModel
  }
  if (provider.haikuModel) {
    config.haikuModel = provider.haikuModel
  }
  if (provider.sonnetModel) {
    config.sonnetModel = provider.sonnetModel
  }
  if (provider.opusModel) {
    config.opusModel = provider.opusModel
  }
  
  return config
}

export function generateCodexConfigJson(data: { apiKey: string; requestUrl: string; model: string; authJson?: Record<string, unknown> }): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  
  if (data.requestUrl) {
    config.apiBaseUrl = data.requestUrl
  }
  if (data.apiKey) {
    config.apiKey = data.apiKey
  }
  if (data.model) {
    config.model = data.model
  }
  if (data.authJson && Object.keys(data.authJson).length > 0) {
    config.auth = data.authJson
  }
  
  return config
}

export function generateGeminiConfigJson(data: { apiKey: string; requestUrl: string; model: string }): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  
  if (data.requestUrl) {
    config.apiBaseUrl = data.requestUrl
  }
  if (data.apiKey) {
    config.apiKey = data.apiKey
  }
  if (data.model) {
    config.model = data.model
  }
  
  return config
}

// ============================================
// 官方格式导出功能
// ============================================

// 导出为 Claude Code 官方 settings.json 格式
// 官方文档: https://docs.claude.com/en/docs/claude-code/settings
export function exportClaudeSettingsJson(provider: ClaudeProvider): string {
  const settings: Record<string, unknown> = {
    env: {
      // 注意：官方使用 ANTHROPIC_AUTH_TOKEN 而非 ANTHROPIC_API_KEY
      ANTHROPIC_BASE_URL: provider.requestUrl || 'https://api.anthropic.com',
      ANTHROPIC_AUTH_TOKEN: provider.apiKey,
      ANTHROPIC_MODEL: provider.mainModel,
      ...(provider.haikuModel && { ANTHROPIC_DEFAULT_HAIKU_MODEL: provider.haikuModel }),
      ...(provider.sonnetModel && { ANTHROPIC_DEFAULT_SONNET_MODEL: provider.sonnetModel }),
      ...(provider.opusModel && { ANTHROPIC_DEFAULT_OPUS_MODEL: provider.opusModel }),
    }
  }
  
  if (provider.permissions) {
    settings.permissions = provider.permissions
  }
  
  if (provider.hooks) {
    settings.hooks = provider.hooks
  }
  
  return JSON.stringify(settings, null, 2)
}

// 导出为 Codex 官方 config.toml 格式
// 官方文档: https://developers.openai.com/codex/local-config/
export function exportCodexConfigToml(provider: CodexProvider): string {
  const lines: string[] = [
    `# Codex CLI Configuration`,
    `# Generated by cc_switcher`,
    `# Provider: ${provider.name}`,
    `# Config file location: ~/.codex/config.toml`,
    ``,
    `################################################################################`,
    `# Core Model Selection`,
    `################################################################################`,
    ``,
    `# Primary model used by Codex`,
    `model = "${provider.model || 'gpt-5.1-codex-max'}"`,
    ``,
    `# Provider id selected from [model_providers]`,
    `model_provider = "${provider.modelProvider || 'openai'}"`,
  ]
  
  lines.push(``)
  lines.push(`################################################################################`)
  lines.push(`# Approval & Sandbox`)
  lines.push(`################################################################################`)
  lines.push(``)
  
  // approval_policy: on-request | never | untrusted | on-failure
  lines.push(`# Control when Codex pauses for approval before executing commands`)
  lines.push(`# Values: on-request | never | untrusted | on-failure`)
  if (provider.approvalPolicy) {
    lines.push(`approval_policy = "${provider.approvalPolicy}"`)
  } else {
    lines.push(`approval_policy = "on-request"`)
  }
  
  lines.push(``)
  // sandbox_mode: off | workspace-write | read-only | none
  lines.push(`# Sandbox policy for filesystem and network access`)
  lines.push(`# Values: off | workspace-write | read-only | none`)
  if (provider.sandboxMode) {
    lines.push(`sandbox_mode = "${provider.sandboxMode}"`)
  } else {
    lines.push(`sandbox_mode = "workspace-write"`)
  }
  
  // Model reasoning settings
  if (provider.modelReasoningEffort || provider.modelReasoningSummary) {
    lines.push(``)
    lines.push(`################################################################################`)
    lines.push(`# Model Reasoning`)
    lines.push(`################################################################################`)
    lines.push(``)
    if (provider.modelReasoningEffort) {
      lines.push(`model_reasoning_effort = "${provider.modelReasoningEffort}"`)
    }
    if (provider.modelReasoningSummary) {
      lines.push(`model_reasoning_summary = "${provider.modelReasoningSummary}"`)
    }
  }
  
  if (provider.modelContextWindow) {
    lines.push(`model_context_window = ${provider.modelContextWindow}`)
  }
  
  // Model providers section
  lines.push(``)
  lines.push(`################################################################################`)
  lines.push(`# Model Providers`)
  lines.push(`################################################################################`)
  lines.push(``)
  lines.push(`[model_providers.openai]`)
  lines.push(`name = "OpenAI"`)
  if (provider.requestUrl && provider.requestUrl !== 'https://api.openai.com/v1') {
    lines.push(`base_url = "${provider.requestUrl}"`)
  } else {
    lines.push(`base_url = "https://api.openai.com/v1"`)
  }
  lines.push(`env_key = "OPENAI_API_KEY"`)
  lines.push(`wire_api = "responses"`)
  
  // Profiles section
  if (provider.profiles && Object.keys(provider.profiles).length > 0) {
    lines.push(``)
    lines.push(`################################################################################`)
    lines.push(`# Profiles`)
    lines.push(`################################################################################`)
    
    for (const [profileName, profile] of Object.entries(provider.profiles)) {
      lines.push(``)
      lines.push(`[profiles.${profileName}]`)
      if (profile.model) lines.push(`model = "${profile.model}"`)
      if (profile.model_provider) lines.push(`model_provider = "${profile.model_provider}"`)
      if (profile.approval_policy) lines.push(`approval_policy = "${profile.approval_policy}"`)
      if (profile.sandbox_mode) lines.push(`sandbox_mode = "${profile.sandbox_mode}"`)
      if (profile.model_reasoning_effort) lines.push(`model_reasoning_effort = "${profile.model_reasoning_effort}"`)
    }
  }
  
  return lines.join('\n')
}

// 导出为 Shell 环境变量格式
export function exportShellEnvVars(provider: ClaudeProvider | CodexProvider | GeminiProvider): string {
  const lines: string[] = [
    `#!/bin/bash`,
    `# Environment variables for ${provider.name}`,
    `# Generated by cc_switcher`,
    `# Usage: source this file or add to ~/.bashrc / ~/.zshrc`,
    ``,
  ]
  
  if (provider.type === 'claude') {
    const claude = provider as ClaudeProvider
    lines.push(`export ANTHROPIC_BASE_URL="${claude.requestUrl || 'https://api.anthropic.com'}"`)
    // 注意：官方使用 ANTHROPIC_AUTH_TOKEN，但 ANTHROPIC_API_KEY 也兼容
    lines.push(`export ANTHROPIC_AUTH_TOKEN="${claude.apiKey}"`)
    lines.push(`export ANTHROPIC_API_KEY="${claude.apiKey}"  # 兼容性别名`)
    if (claude.mainModel) lines.push(`export ANTHROPIC_MODEL="${claude.mainModel}"`)
    if (claude.haikuModel) lines.push(`export ANTHROPIC_DEFAULT_HAIKU_MODEL="${claude.haikuModel}"`)
    if (claude.sonnetModel) lines.push(`export ANTHROPIC_DEFAULT_SONNET_MODEL="${claude.sonnetModel}"`)
    if (claude.opusModel) lines.push(`export ANTHROPIC_DEFAULT_OPUS_MODEL="${claude.opusModel}"`)
  } else if (provider.type === 'codex') {
    const codex = provider as CodexProvider
    lines.push(`export OPENAI_API_KEY="${codex.apiKey}"`)
    if (codex.requestUrl) lines.push(`export OPENAI_BASE_URL="${codex.requestUrl}"`)
    if (codex.model) lines.push(`export OPENAI_MODEL="${codex.model}"`)
  } else if (provider.type === 'gemini') {
    const gemini = provider as GeminiProvider
    lines.push(`export GOOGLE_API_KEY="${gemini.apiKey}"`)
    if (gemini.requestUrl) lines.push(`export GOOGLE_API_BASE_URL="${gemini.requestUrl}"`)
    if (gemini.model) lines.push(`export GOOGLE_MODEL="${gemini.model}"`)
  }
  
  return lines.join('\n')
}

// 导出所有供应商为多种格式
export interface ExportOptions {
  format: 'json' | 'sql' | 'claude-settings' | 'codex-toml' | 'shell-env'
  providerType?: ProviderType
  providerId?: string
}

export function exportProvidersByFormat(options: ExportOptions): string {
  const { format, providerType, providerId } = options
  
  switch (format) {
    case 'json':
      return exportProvidersJSON()
    case 'sql':
      return exportProvidersSQL()
    case 'claude-settings': {
      const claudeProviders = getProviders()
      const provider = providerId 
        ? claudeProviders.find(p => p.id === providerId)
        : claudeProviders.find(p => p.id === getActiveProviderId()) || claudeProviders[0]
      return provider ? exportClaudeSettingsJson(provider) : '// No Claude provider found'
    }
    case 'codex-toml': {
      const codexProviders = getCodexProviders()
      const provider = providerId
        ? codexProviders.find(p => p.id === providerId)
        : codexProviders.find(p => p.id === getActiveProviderIdByType('codex')) || codexProviders[0]
      return provider ? exportCodexConfigToml(provider) : '# No Codex provider found'
    }
    case 'shell-env': {
      const type = providerType || 'claude'
      if (type === 'claude') {
        const providers = getProviders()
        const provider = providerId
          ? providers.find(p => p.id === providerId)
          : providers.find(p => p.id === getActiveProviderId()) || providers[0]
        return provider ? exportShellEnvVars(provider) : '# No provider found'
      } else if (type === 'codex') {
        const providers = getCodexProviders()
        const provider = providerId
          ? providers.find(p => p.id === providerId)
          : providers.find(p => p.id === getActiveProviderIdByType('codex')) || providers[0]
        return provider ? exportShellEnvVars(provider) : '# No provider found'
      } else {
        const providers = getGeminiProviders()
        const provider = providerId
          ? providers.find(p => p.id === providerId)
          : providers.find(p => p.id === getActiveProviderIdByType('gemini')) || providers[0]
        return provider ? exportShellEnvVars(provider) : '# No provider found'
      }
    }
    default:
      return exportProvidersJSON()
  }
}

// 导出所有类型供应商的 SQL
export function exportAllProvidersSQL(): string {
  const claudeProviders = getProviders()
  const codexProviders = getCodexProviders()
  const geminiProviders = getGeminiProviders()
  
  const claudeActiveId = getActiveProviderId()
  const codexActiveId = getActiveProviderIdByType('codex')
  const geminiActiveId = getActiveProviderIdByType('gemini')
  
  let sql = `-- Claude Code Switch 配置导出 (全部类型)
-- 导出时间: ${new Date().toISOString()}
-- 格式兼容: cc-switch (https://github.com/farion1231/cc-switch)

DROP TABLE IF EXISTS providers;
CREATE TABLE providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT DEFAULT 'claude',
  name TEXT NOT NULL,
  apiKey TEXT NOT NULL,
  apiUrl TEXT NOT NULL,
  models TEXT,
  isActive INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

`
  
  let index = 1
  
  // Claude providers
  claudeProviders.forEach((provider) => {
    const models = JSON.stringify({
      main: provider.mainModel,
      haiku: provider.haikuModel,
      sonnet: provider.sonnetModel,
      opus: provider.opusModel
    })
    const isActive = provider.id === claudeActiveId ? 1 : 0
    const createdAt = new Date(provider.createdAt).toISOString()
    const updatedAt = new Date(provider.updatedAt).toISOString()
    
    sql += `INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (${index++}, 'claude', '${escapeSql(provider.name)}', '${escapeSql(provider.apiKey)}', '${escapeSql(provider.requestUrl)}', '${escapeSql(models)}', ${isActive}, '${createdAt}', '${updatedAt}');\n`
  })
  
  // Codex providers
  codexProviders.forEach((provider) => {
    const models = JSON.stringify({
      main: provider.model,
      approvalPolicy: provider.approvalPolicy,
      sandboxMode: provider.sandboxMode,
      modelProvider: provider.modelProvider
    })
    const isActive = provider.id === codexActiveId ? 1 : 0
    const createdAt = new Date(provider.createdAt).toISOString()
    const updatedAt = new Date(provider.updatedAt).toISOString()
    
    sql += `INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (${index++}, 'codex', '${escapeSql(provider.name)}', '${escapeSql(provider.apiKey)}', '${escapeSql(provider.requestUrl)}', '${escapeSql(models)}', ${isActive}, '${createdAt}', '${updatedAt}');\n`
  })
  
  // Gemini providers
  geminiProviders.forEach((provider) => {
    const models = JSON.stringify({ main: provider.model })
    const isActive = provider.id === geminiActiveId ? 1 : 0
    const createdAt = new Date(provider.createdAt).toISOString()
    const updatedAt = new Date(provider.updatedAt).toISOString()
    
    sql += `INSERT INTO providers (id, type, name, apiKey, apiUrl, models, isActive, createdAt, updatedAt) VALUES (${index++}, 'gemini', '${escapeSql(provider.name)}', '${escapeSql(provider.apiKey)}', '${escapeSql(provider.requestUrl)}', '${escapeSql(models)}', ${isActive}, '${createdAt}', '${updatedAt}');\n`
  })
  
  return sql
}
