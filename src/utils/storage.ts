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

// 从 SQL 格式导入
export function importProvidersSQL(sql: string): { success: boolean; count: number; error?: string } {
  try {
    const providers: ClaudeProvider[] = []
    let activeProviderId: string | null = null
    
    // 匹配 INSERT 语句
    const insertRegex = /INSERT INTO providers\s*\([^)]+\)\s*VALUES\s*\(([^;]+)\);/gi
    let match
    
    while ((match = insertRegex.exec(sql)) !== null) {
      const valuesStr = match[1]
      const values = parseInsertValues(valuesStr)
      
      if (values.length >= 6) {
        const id = uuidv4()
        let models = { main: '', haiku: '', sonnet: '', opus: '' }
        
        try {
          const modelsStr = values[5] || values[4]
          if (modelsStr) {
            models = JSON.parse(modelsStr)
          }
        } catch {
          models.main = values[4] || ''
        }
        
        const provider: ClaudeProvider = {
          id,
          type: 'claude',
          name: values[2] || values[1] || '未命名',
          notes: '',
          websiteUrl: '',
          apiKey: values[3] || values[2] || '',
          requestUrl: values[4] || values[3] || '',
          mainModel: models.main || '',
          haikuModel: models.haiku || '',
          sonnetModel: models.sonnet || '',
          opusModel: models.opus || '',
          configJson: {},
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        
        provider.configJson = generateConfigJson(provider)
        providers.push(provider)
        
        const isActiveIdx = values.length > 6 ? 6 : 5
        if (values[isActiveIdx] === '1' || values[isActiveIdx] === 1) {
          activeProviderId = id
        }
      }
    }
    
    if (providers.length > 0) {
      saveProviders(providers)
      if (activeProviderId) {
        setActiveProviderId(activeProviderId)
      }
      return { success: true, count: providers.length }
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
      const providers: ClaudeProvider[] = data.map(item => ({
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
        configJson: item.configJson || generateConfigJson(item),
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      }))
      
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
