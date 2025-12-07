// 供应商类型
export type ProviderType = 'claude' | 'codex' | 'gemini'

// 环境模式 - local/wsl 是固定的，remote:xxx 是动态的远程环境
export type EnvironmentMode = 'local' | 'wsl' | `remote:${string}`

// 远程环境配置（用于管理多个远程服务器）
export interface RemoteEnvironment {
  id: string
  name: string           // 显示名称，如 "生产服务器"、"测试服务器"
  host: string
  port: number
  username: string
  sshKeyPath: string
  workingDirectory?: string
  createdAt: number
}

// 按环境模式存储的激活供应商配置
export interface EnvironmentActiveProviders {
  local: string | null      // 本地环境激活的供应商 ID
  wsl: string | null        // WSL 环境激活的供应商 ID  
  // 远程环境使用动态键，格式为 "remote:环境ID"
  [key: `remote:${string}`]: string | null
}

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

// Claude Code 权限配置
export interface ClaudePermissionConfig {
  allow?: string[]
  deny?: string[]
}

// Claude Code Hook 配置
export interface ClaudeHookConfig {
  preToolExecution?: string
  postToolExecution?: string
}

// Claude 供应商
export interface ClaudeProvider extends BaseProvider {
  type: 'claude'
  mainModel: string
  haikuModel: string
  sonnetModel: string
  opusModel: string
  // Claude Code 特有配置
  permissions?: ClaudePermissionConfig
  hooks?: ClaudeHookConfig
}

// Codex 审批策略 (官方值: on-request, never, untrusted, on-failure)
export type CodexApprovalPolicy = 'on-request' | 'never' | 'untrusted' | 'on-failure'

// Codex 沙箱模式 (官方值: off, workspace-write, read-only, danger-full-access)
export type CodexSandboxMode = 'off' | 'workspace-write' | 'read-only' | 'danger-full-access'

// Codex Profile 配置 (支持 config.toml 中的 profiles)
export interface CodexProfile {
  model?: string
  model_provider?: string
  approval_policy?: CodexApprovalPolicy
  sandbox_mode?: CodexSandboxMode
  model_reasoning_effort?: 'low' | 'medium' | 'high'
  model_reasoning_summary?: 'auto' | 'always' | 'never'
}

// Codex 供应商 (OpenAI)
export interface CodexProvider extends BaseProvider {
  type: 'codex'
  model: string
  authJson: Record<string, string>
  // Codex 特有配置 (匹配 ~/.codex/config.toml)
  approvalPolicy?: CodexApprovalPolicy
  sandboxMode?: CodexSandboxMode
  modelProvider?: string
  // 高级配置
  modelContextWindow?: number
  modelReasoningEffort?: 'low' | 'medium' | 'high'
  modelReasoningSummary?: 'auto' | 'always' | 'never'
  // Profile 支持
  profiles?: Record<string, CodexProfile>
  activeProfile?: string
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
  // Codex 特有配置
  approvalPolicy?: CodexApprovalPolicy
  sandboxMode?: CodexSandboxMode
  modelProvider?: string
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
