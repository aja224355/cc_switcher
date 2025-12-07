// 供应商类型
export type ProviderType = 'claude' | 'codex' | 'gemini'

// 环境模式
export type EnvironmentMode = 'local' | 'wsl' | 'remote'

// 认证模式
export type AuthMode = 'plan' | 'apikey'

// SSH Remote 配置
export interface SSHRemote {
  id: string
  name: string
  host: string
  port: number
  username: string
  sshKeyPath: string
  isActive: boolean
  // 可选：在远程服务器或 WSL 中使用的工作目录（例如代码仓库路径）
  workingDirectory?: string
}

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
  // 认证模式
  authMode: AuthMode
  // 环境配置
  environmentMode: EnvironmentMode
  sshRemotes: SSHRemote[]
  activeRemoteId: string | null
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

// SSH Remote 表单数据
export interface SSHRemoteFormData {
  name: string
  host: string
  port: string
  username: string
  sshKeyPath: string
}

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
  authMode: AuthMode
  environmentMode: EnvironmentMode
  sshRemotes: SSHRemote[]
  activeRemoteId: string | null
}

export interface CodexFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  model: string
  authJson: string
  authMode: AuthMode
  environmentMode: EnvironmentMode
  sshRemotes: SSHRemote[]
  activeRemoteId: string | null
}

export interface GeminiFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  model: string
  authMode: AuthMode
  environmentMode: EnvironmentMode
  sshRemotes: SSHRemote[]
  activeRemoteId: string | null
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
