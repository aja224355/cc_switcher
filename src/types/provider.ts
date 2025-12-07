// 供应商类型
export type ProviderType = 'claude' | 'codex' | 'gemini'

// 基础供应商接口
export interface BaseProvider {
  id: string
  type: ProviderType
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  configJson: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

// Claude 供应商
export interface ClaudeProvider extends BaseProvider {
  type: 'claude'
  mainModel: string
  haikuModel: string
  sonnetModel: string
  opusModel: string
}

// Codex 供应商 (OpenAI)
export interface CodexProvider extends BaseProvider {
  type: 'codex'
  model: string
  authJson: Record<string, string>
}

// Gemini 供应商
export interface GeminiProvider extends BaseProvider {
  type: 'gemini'
  model: string
}

// 联合类型
export type Provider = ClaudeProvider | CodexProvider | GeminiProvider

// 表单数据类型
export interface ClaudeFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  mainModel: string
  haikuModel: string
  sonnetModel: string
  opusModel: string
}

export interface CodexFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  model: string
  authJson: string
}

export interface GeminiFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  model: string
}

// 保持向后兼容
export interface ProviderFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  mainModel: string
  haikuModel: string
  sonnetModel: string
  opusModel: string
  codexModel: string
}
