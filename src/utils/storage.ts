import { Provider, ProviderType, ClaudeProvider, CodexProvider, GeminiProvider, EnvironmentMode, EnvironmentActiveProviders, RemoteEnvironment, WslPathConfig } from '@/types/provider'
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

// 按环境模式存储激活的供应商
const ENV_ACTIVE_PROVIDER_KEYS = {
  claude: 'claude-env-active-providers',
  codex: 'codex-env-active-providers',
  gemini: 'gemini-env-active-providers',
}

// 当前活跃环境模式
const CURRENT_ENV_MODE_KEY = 'current-environment-mode'

// 远程环境列表存储键
const REMOTE_ENVIRONMENTS_KEY = 'remote-environments'

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

// ============================================
// 远程环境管理
// ============================================

// 获取所有远程环境
export function getRemoteEnvironments(): RemoteEnvironment[] {
  try {
    const data = localStorage.getItem(REMOTE_ENVIRONMENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 保存所有远程环境
export function saveRemoteEnvironments(envs: RemoteEnvironment[]): void {
  localStorage.setItem(REMOTE_ENVIRONMENTS_KEY, JSON.stringify(envs))
}

// 添加远程环境
export function addRemoteEnvironment(env: Omit<RemoteEnvironment, 'id' | 'createdAt'>): RemoteEnvironment {
  const envs = getRemoteEnvironments()
  const newEnv: RemoteEnvironment = {
    ...env,
    id: uuidv4(),
    createdAt: Date.now(),
  }
  envs.push(newEnv)
  saveRemoteEnvironments(envs)
  return newEnv
}

// 更新远程环境
export function updateRemoteEnvironment(id: string, updates: Partial<Omit<RemoteEnvironment, 'id' | 'createdAt'>>): RemoteEnvironment | null {
  const envs = getRemoteEnvironments()
  const index = envs.findIndex(e => e.id === id)
  if (index === -1) return null
  
  envs[index] = { ...envs[index], ...updates }
  saveRemoteEnvironments(envs)
  return envs[index]
}

// 删除远程环境
export function deleteRemoteEnvironment(id: string): boolean {
  const envs = getRemoteEnvironments()
  const filtered = envs.filter(e => e.id !== id)
  if (filtered.length === envs.length) return false
  
  saveRemoteEnvironments(filtered)
  return true
}

// 获取远程环境的环境模式字符串
export function getRemoteEnvMode(remoteId: string): EnvironmentMode {
  return `remote:${remoteId}` as EnvironmentMode
}

// 从环境模式字符串解析远程环境 ID
export function parseRemoteEnvMode(mode: EnvironmentMode): string | null {
  if (mode.startsWith('remote:')) {
    return mode.substring(7)
  }
  return null
}

// 判断是否是远程环境模式
export function isRemoteEnvMode(mode: EnvironmentMode): boolean {
  return mode.startsWith('remote:')
}

// ============================================
// 按环境模式管理激活的供应商
// ============================================

// 获取当前环境模式
export function getCurrentEnvironmentMode(): EnvironmentMode {
  const mode = localStorage.getItem(CURRENT_ENV_MODE_KEY)
  return (mode as EnvironmentMode) || 'local'
}

// 设置当前环境模式
export function setCurrentEnvironmentMode(mode: EnvironmentMode): void {
  localStorage.setItem(CURRENT_ENV_MODE_KEY, mode)
}

// 获取某个供应商类型下，各环境模式激活的供应商
export function getEnvActiveProviders(type: ProviderType): EnvironmentActiveProviders {
  try {
    const data = localStorage.getItem(ENV_ACTIVE_PROVIDER_KEYS[type])
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // ignore
  }
  return { local: null, wsl: null }
}

// 设置某个环境模式下激活的供应商
export function setEnvActiveProvider(type: ProviderType, envMode: EnvironmentMode, providerId: string | null): void {
  const envProviders = getEnvActiveProviders(type)
  envProviders[envMode] = providerId
  localStorage.setItem(ENV_ACTIVE_PROVIDER_KEYS[type], JSON.stringify(envProviders))
  
  // 同时更新旧的激活 ID（保持向后兼容）
  if (envMode === getCurrentEnvironmentMode()) {
    setActiveProviderIdByType(type, providerId)
  }
}

// 获取某个环境模式下激活的供应商 ID
export function getEnvActiveProviderId(type: ProviderType, envMode: EnvironmentMode): string | null {
  const envProviders = getEnvActiveProviders(type)
  return envProviders[envMode]
}

// 获取当前环境模式下激活的供应商
export function getCurrentEnvActiveProvider<T extends Provider>(type: ProviderType): T | null {
  const currentMode = getCurrentEnvironmentMode()
  const providerId = getEnvActiveProviderId(type, currentMode)
  if (!providerId) return null
  
  const providers = getProvidersByType<T>(type)
  return providers.find(p => p.id === providerId) || null
}

// 一键应用配置到当前环境
export function applyProviderToCurrentEnv(
  type: ProviderType, 
  providerId: string, 
  currentEnvMode?: EnvironmentMode,
  remoteEnvironments?: RemoteEnvironment[]
): { success: boolean; message: string; script?: string } {
  const providers = getProvidersByType<ClaudeProvider | CodexProvider | GeminiProvider>(type)
  const provider = providers.find(p => p.id === providerId)
  
  if (!provider) {
    return { success: false, message: '未找到供应商配置' }
  }
  
  // 使用传入的环境模式，否则使用当前环境模式
  const envMode = currentEnvMode || getCurrentEnvironmentMode()
  
  // 设置为该环境模式下的激活供应商
  setEnvActiveProvider(type, envMode, providerId)
  
  // 生成应用脚本
  let script = ''
  let message = ''
  
  if (envMode === 'local') {
    // 本地模式：生成环境变量设置命令
    script = exportShellEnvVars(provider)
    message = `已将 "${provider.name}" 设为本地环境的激活供应商。\n\n请在终端中执行以下命令应用配置：\nsource <导出的脚本文件>`
  } else if (envMode === 'wsl') {
    // WSL 模式：根据配置生成对应脚本
    const wslResult = generateWslScript(provider)
    script = wslResult.script
    const scriptType = wslResult.type === 'powershell' ? 'PowerShell 脚本 (.ps1)' : 'Bash 脚本 (.sh)'
    message = `已将 "${provider.name}" 设为 WSL 环境的激活供应商。\n\n已生成${scriptType}，${wslResult.type === 'powershell' ? '在 Windows PowerShell 中运行' : '在 WSL 终端中运行'}即可应用配置。`
  } else if (isRemoteEnvMode(envMode)) {
    // 远程模式：生成远程部署脚本
    const remoteId = parseRemoteEnvMode(envMode)
    const remote = remoteEnvironments?.find(r => r.id === remoteId)
    
    if (remote) {
      // 使用远程环境的配置生成部署脚本
      script = generateRemoteDeployScriptForEnv(provider, remote)
      message = `已将 "${provider.name}" 设为远程环境 "${remote.name}" 的激活供应商。\n\n请运行导出的脚本部署配置到 ${remote.host}。`
    } else {
      // 如果供应商配置了自己的 SSH 信息
      script = generateRemoteDeployScript(provider)
      message = `已将 "${provider.name}" 设为远程环境的激活供应商。\n\n请运行导出的脚本部署配置到远程服务器。`
    }
  }
  
  return { success: true, message, script }
}

// 生成 WSL 应用脚本
export function generateWslApplyScript(provider: ClaudeProvider | CodexProvider | GeminiProvider): string {
  // 获取自定义 WSL 路径或使用默认值
  const wslPaths = provider.wslPaths || {
    claudeConfigPath: '~/.claude',
    codexConfigPath: '~/.codex',
    bashrcPath: '~/.bashrc'
  }
  
  const lines: string[] = [
    '#!/bin/bash',
    '# ============================================',
    '# WSL 环境配置应用脚本',
    `# 供应商: ${provider.name}`,
    '# Generated by cc_switcher',
    '# ============================================',
    '',
    '# 配置路径（可自定义）',
    `CLAUDE_CONFIG_DIR="${wslPaths.claudeConfigPath}"`,
    `CODEX_CONFIG_DIR="${wslPaths.codexConfigPath}"`,
    `BASHRC_PATH="${wslPaths.bashrcPath}"`,
    '',
    '# 检测是否在 WSL 环境中',
    'if [ -z "$WSL_DISTRO_NAME" ]; then',
    '  echo "警告: 当前不在 WSL 环境中，尝试通过 wsl 命令执行..."',
    '  wsl bash -c "$(cat $0)"',
    '  exit $?',
    'fi',
    '',
    'echo "正在 WSL ($WSL_DISTRO_NAME) 中应用配置..."',
    `echo "Claude 配置目录: $CLAUDE_CONFIG_DIR"`,
    `echo "Codex 配置目录: $CODEX_CONFIG_DIR"`,
    `echo "Bashrc 路径: $BASHRC_PATH"`,
    '',
  ]
  
  if (provider.type === 'claude') {
    const claude = provider as ClaudeProvider
    lines.push('# 创建 Claude 配置目录')
    lines.push('mkdir -p "$CLAUDE_CONFIG_DIR"')
    lines.push('')
    lines.push('# 写入 settings.json')
    lines.push('cat > "$CLAUDE_CONFIG_DIR/settings.json" << \'EOF\'')
    lines.push(exportClaudeSettingsJson(claude))
    lines.push('EOF')
    lines.push('')
    lines.push('# 设置环境变量 (检查是否已存在)')
    lines.push('grep -q "ANTHROPIC_AUTH_TOKEN" "$BASHRC_PATH" || echo \'export ANTHROPIC_AUTH_TOKEN="' + claude.apiKey + '"\' >> "$BASHRC_PATH"')
    lines.push('grep -q "ANTHROPIC_BASE_URL" "$BASHRC_PATH" || echo \'export ANTHROPIC_BASE_URL="' + (claude.requestUrl || 'https://api.anthropic.com') + '"\' >> "$BASHRC_PATH"')
  } else if (provider.type === 'codex') {
    const codex = provider as CodexProvider
    lines.push('# 创建 Codex 配置目录')
    lines.push('mkdir -p "$CODEX_CONFIG_DIR"')
    lines.push('')
    lines.push('# 写入 config.toml')
    lines.push('cat > "$CODEX_CONFIG_DIR/config.toml" << \'EOF\'')
    lines.push(exportCodexConfigToml(codex))
    lines.push('EOF')
    lines.push('')
    lines.push('# 设置环境变量 (检查是否已存在)')
    lines.push('grep -q "OPENAI_API_KEY" "$BASHRC_PATH" || echo \'export OPENAI_API_KEY="' + codex.apiKey + '"\' >> "$BASHRC_PATH"')
  } else {
    const gemini = provider as GeminiProvider
    lines.push('# 设置 Gemini 环境变量 (检查是否已存在)')
    lines.push('grep -q "GOOGLE_API_KEY" "$BASHRC_PATH" || echo \'export GOOGLE_API_KEY="' + gemini.apiKey + '"\' >> "$BASHRC_PATH"')
    if (gemini.requestUrl) {
      lines.push('grep -q "GOOGLE_API_BASE_URL" "$BASHRC_PATH" || echo \'export GOOGLE_API_BASE_URL="' + gemini.requestUrl + '"\' >> "$BASHRC_PATH"')
    }
  }
  
  lines.push('')
  lines.push('echo ""')
  lines.push('echo "✅ 配置已应用到 WSL 环境"')
  lines.push('echo "请运行 source $BASHRC_PATH 或重新打开终端以生效"')
  
  return lines.join('\\n')
}

// 生成 Windows PowerShell 脚本 - 从 Windows 直接写入 WSL 文件系统
export function generateWslWindowsScript(provider: ClaudeProvider | CodexProvider | GeminiProvider): string {
  const wslPaths = provider.wslPaths || {
    applyMode: 'windows',
    distroName: 'Ubuntu',
    wslUsername: '',
    claudeConfigPath: '~/.claude',
    codexConfigPath: '~/.codex',
    bashrcPath: '~/.bashrc',
    windowsBasePath: '\\\\wsl.localhost\\Ubuntu'
  }

  const distroName = wslPaths.distroName || 'Ubuntu'
  const wslUsername = wslPaths.wslUsername || '$env:USERNAME'
  const windowsBase = wslPaths.windowsBasePath || `\\\\wsl.localhost\\${distroName}`
  
  // 将 Linux 路径转换为 Windows UNC 路径
  const convertPath = (linuxPath: string): string => {
    if (linuxPath.startsWith('~')) {
      // ~/path -> \\wsl.localhost\Ubuntu\home\username\path
      return `${windowsBase}\\home\\${wslUsername}${linuxPath.substring(1).replace(/\//g, '\\')}`
    } else if (linuxPath.startsWith('/')) {
      // /absolute/path -> \\wsl.localhost\Ubuntu\absolute\path
      return `${windowsBase}${linuxPath.replace(/\//g, '\\')}`
    }
    return linuxPath
  }

  const lines: string[] = [
    '# ============================================',
    '# WSL 配置应用脚本 (PowerShell)',
    `# 供应商: ${provider.name}`,
    `# 目标发行版: ${distroName}`,
    '# Generated by cc_switcher',
    '# ============================================',
    '',
    '# 配置参数',
    `$DistroName = "${distroName}"`,
    `$WslUsername = "${wslPaths.wslUsername || ''}"`,
    `$WindowsBasePath = "${windowsBase}"`,
    '',
    '# 检查 WSL 用户名是否设置',
    'if ([string]::IsNullOrEmpty($WslUsername)) {',
    '    Write-Host "错误: 未设置 WSL 用户名" -ForegroundColor Red',
    '    Write-Host "请在应用中配置 WSL 用户名后重新导出脚本" -ForegroundColor Yellow',
    '    exit 1',
    '}',
    '',
    '# 检查 WSL 发行版是否存在',
    'Write-Host "正在检查 WSL 发行版 $DistroName ..." -ForegroundColor Cyan',
    'if (-not (Test-Path "$WindowsBasePath")) {',
    '    Write-Host "错误: 无法访问 WSL 路径: $WindowsBasePath" -ForegroundColor Red',
    '    Write-Host "请确保:" -ForegroundColor Yellow',
    '    Write-Host "  1. WSL 已安装并正在运行" -ForegroundColor Yellow',
    '    Write-Host "  2. 发行版名称正确 (当前: $DistroName)" -ForegroundColor Yellow',
    '    Write-Host "  3. 尝试在文件资源管理器中访问 $WindowsBasePath" -ForegroundColor Yellow',
    '    exit 1',
    '}',
    '',
    'Write-Host "开始写入配置到 WSL ($DistroName) ..." -ForegroundColor Green',
    '',
  ]

  if (provider.type === 'claude') {
    const claude = provider as ClaudeProvider
    const configDir = convertPath(wslPaths.claudeConfigPath)
    const settingsJson = {
      env: {
        ANTHROPIC_BASE_URL: claude.requestUrl || 'https://api.anthropic.com',
        ANTHROPIC_AUTH_TOKEN: claude.apiKey,
        ANTHROPIC_MODEL: claude.mainModel,
        ...(claude.haikuModel && { ANTHROPIC_DEFAULT_HAIKU_MODEL: claude.haikuModel }),
        ...(claude.sonnetModel && { ANTHROPIC_DEFAULT_SONNET_MODEL: claude.sonnetModel }),
        ...(claude.opusModel && { ANTHROPIC_DEFAULT_OPUS_MODEL: claude.opusModel }),
      }
    }
    
    lines.push('# 1. 创建 Claude 配置目录')
    lines.push(`$ClaudeConfigDir = "${configDir}"`)
    lines.push('Write-Host "[1/3] 创建目录: $ClaudeConfigDir" -ForegroundColor Cyan')
    lines.push('if (-not (Test-Path $ClaudeConfigDir)) {')
    lines.push('    New-Item -ItemType Directory -Path $ClaudeConfigDir -Force | Out-Null')
    lines.push('}')
    lines.push('')
    lines.push('# 2. 写入 settings.json')
    lines.push('Write-Host "[2/3] 写入 settings.json ..." -ForegroundColor Cyan')
    lines.push(`$SettingsJson = @'`)
    lines.push(JSON.stringify(settingsJson, null, 2))
    lines.push(`'@`)
    lines.push('$SettingsJson | Out-File -FilePath "$ClaudeConfigDir\\settings.json" -Encoding UTF8 -Force')
    lines.push('')
  } else if (provider.type === 'codex') {
    const codex = provider as CodexProvider
    const configDir = convertPath(wslPaths.codexConfigPath)
    const configToml = [
      `model = "${codex.model || 'gpt-5-codex'}"`,
      `model_provider = "${(codex as any).modelProvider || 'openai'}"`,
      `approval_policy = "${(codex as any).approvalPolicy || 'on-request'}"`,
      `sandbox_mode = "${(codex as any).sandboxMode || 'workspace-write'}"`,
      '',
      '[model_providers.openai]',
      'name = "OpenAI"',
      `base_url = "${codex.requestUrl || 'https://api.openai.com/v1'}"`,
      'env_key = "OPENAI_API_KEY"',
      'wire_api = "responses"'
    ].join('\n')
    
    lines.push('# 1. 创建 Codex 配置目录')
    lines.push(`$CodexConfigDir = "${configDir}"`)
    lines.push('Write-Host "[1/3] 创建目录: $CodexConfigDir" -ForegroundColor Cyan')
    lines.push('if (-not (Test-Path $CodexConfigDir)) {')
    lines.push('    New-Item -ItemType Directory -Path $CodexConfigDir -Force | Out-Null')
    lines.push('}')
    lines.push('')
    lines.push('# 2. 写入 config.toml')
    lines.push('Write-Host "[2/3] 写入 config.toml ..." -ForegroundColor Cyan')
    lines.push(`$ConfigToml = @'`)
    lines.push(configToml)
    lines.push(`'@`)
    lines.push('$ConfigToml | Out-File -FilePath "$CodexConfigDir\\config.toml" -Encoding UTF8 -Force')
    lines.push('')
  } else {
    lines.push('# Gemini 配置')
    lines.push('Write-Host "[1/3] Gemini 主要使用环境变量配置" -ForegroundColor Cyan')
    lines.push('')
  }

  // 添加环境变量到 bashrc/zshrc
  const bashrcPath = convertPath(wslPaths.bashrcPath)
  
  lines.push('# 3. 设置环境变量')
  lines.push(`$BashrcPath = "${bashrcPath}"`)
  lines.push('Write-Host "[3/3] 更新环境变量: $BashrcPath" -ForegroundColor Cyan')
  lines.push('')
  lines.push('if (Test-Path $BashrcPath) {')
  lines.push('    $BashrcContent = Get-Content $BashrcPath -Raw')
  lines.push('} else {')
  lines.push('    $BashrcContent = ""')
  lines.push('}')
  lines.push('')

  if (provider.type === 'claude') {
    const claude = provider as ClaudeProvider
    lines.push('# 添加 Claude 环境变量')
    lines.push(`if ($BashrcContent -notmatch "ANTHROPIC_AUTH_TOKEN") {`)
    lines.push(`    Add-Content -Path $BashrcPath -Value 'export ANTHROPIC_AUTH_TOKEN="${claude.apiKey}"'`)
    lines.push('}')
    lines.push(`if ($BashrcContent -notmatch "ANTHROPIC_BASE_URL") {`)
    lines.push(`    Add-Content -Path $BashrcPath -Value 'export ANTHROPIC_BASE_URL="${claude.requestUrl || 'https://api.anthropic.com'}"'`)
    lines.push('}')
  } else if (provider.type === 'codex') {
    const codex = provider as CodexProvider
    lines.push('# 添加 Codex 环境变量')
    lines.push(`if ($BashrcContent -notmatch "OPENAI_API_KEY") {`)
    lines.push(`    Add-Content -Path $BashrcPath -Value 'export OPENAI_API_KEY="${codex.apiKey}"'`)
    lines.push('}')
  } else {
    const gemini = provider as GeminiProvider
    lines.push('# 添加 Gemini 环境变量')
    lines.push(`if ($BashrcContent -notmatch "GOOGLE_API_KEY") {`)
    lines.push(`    Add-Content -Path $BashrcPath -Value 'export GOOGLE_API_KEY="${gemini.apiKey}"'`)
    lines.push('}')
    if (gemini.requestUrl) {
      lines.push(`if ($BashrcContent -notmatch "GOOGLE_API_BASE_URL") {`)
      lines.push(`    Add-Content -Path $BashrcPath -Value 'export GOOGLE_API_BASE_URL="${gemini.requestUrl}"'`)
      lines.push('}')
    }
  }

  lines.push('')
  lines.push('Write-Host "" -ForegroundColor Green')
  lines.push('Write-Host "============================================" -ForegroundColor Green')
  lines.push('Write-Host "✅ 配置已成功写入 WSL!" -ForegroundColor Green')
  lines.push('Write-Host "============================================" -ForegroundColor Green')
  lines.push('Write-Host ""')
  lines.push('Write-Host "下一步操作:" -ForegroundColor Yellow')
  lines.push('Write-Host "  1. 打开 WSL 终端 (wsl 或从开始菜单)" -ForegroundColor Cyan')
  lines.push(`Write-Host "  2. 运行: source ${wslPaths.bashrcPath}" -ForegroundColor Cyan`)
  lines.push(`Write-Host "  3. 运行: ${provider.type}" -ForegroundColor Cyan`)
  lines.push('Write-Host ""')
  lines.push('Write-Host "或者直接在此 PowerShell 中运行:" -ForegroundColor Yellow')
  lines.push(`Write-Host "  wsl -d ${distroName} bash -c 'source ${wslPaths.bashrcPath} && ${provider.type}'" -ForegroundColor Cyan`)
  lines.push('')
  lines.push('Read-Host "按 Enter 键退出"')
  
  return lines.join('\r\n')
}

// 根据 applyMode 选择生成哪种脚本
export function generateWslScript(provider: ClaudeProvider | CodexProvider | GeminiProvider): { script: string; type: 'bash' | 'powershell'; filename: string } {
  const applyMode = provider.wslPaths?.applyMode || 'bash'
  
  if (applyMode === 'windows') {
    return {
      script: generateWslWindowsScript(provider),
      type: 'powershell',
      filename: `apply-wsl-${provider.name.replace(/\\s+/g, '-')}.ps1`
    }
  } else {
    return {
      script: generateWslApplyScript(provider),
      type: 'bash',
      filename: `apply-wsl-${provider.name.replace(/\\s+/g, '-')}.sh`
    }
  }
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
  
  // 如果有活跃的 SSH Remote，添加 MCP SSH 服务器配置
  if (provider.environmentMode === 'remote' && provider.activeRemoteId && provider.sshRemotes.length > 0) {
    const activeRemote = provider.sshRemotes.find(r => r.id === provider.activeRemoteId)
    if (activeRemote) {
      settings.mcpServers = {
        'ssh-remote': {
          command: 'ssh',
          args: [
            '-o', 'StrictHostKeyChecking=no',
            '-i', activeRemote.sshKeyPath || '~/.ssh/id_rsa',
            '-p', String(activeRemote.port || 22),
            `${activeRemote.username}@${activeRemote.host}`,
            ...(activeRemote.workingDirectory ? ['cd', activeRemote.workingDirectory, '&&'] : []),
            'claude'
          ]
        }
      }
    }
  }
  
  return JSON.stringify(settings, null, 2)
}

// 生成远程服务器配置部署脚本
// 该脚本可以在本地运行，自动将配置同步到远程服务器
export function generateRemoteDeployScript(provider: ClaudeProvider | CodexProvider | GeminiProvider): string {
  if (provider.environmentMode !== 'remote' || !provider.activeRemoteId || provider.sshRemotes.length === 0) {
    return '# 错误: 未配置 SSH Remote，请先添加远程服务器配置'
  }
  
  const activeRemote = provider.sshRemotes.find(r => r.id === provider.activeRemoteId)
  if (!activeRemote) {
    return '# 错误: 未找到激活的远程服务器配置'
  }
  
  const sshKey = activeRemote.sshKeyPath ? `-i ${activeRemote.sshKeyPath}` : ''
  const port = activeRemote.port !== 22 ? `-p ${activeRemote.port}` : ''
  const sshTarget = `${activeRemote.username}@${activeRemote.host}`
  
  const lines: string[] = [
    '#!/bin/bash',
    '# ============================================',
    '# 远程服务器配置部署脚本',
    `# 目标服务器: ${activeRemote.name || activeRemote.host}`,
    '# Generated by cc_switcher',
    '# ============================================',
    '',
    '# 颜色定义',
    'RED="\\033[0;31m"',
    'GREEN="\\033[0;32m"',
    'YELLOW="\\033[1;33m"',
    'NC="\\033[0m" # No Color',
    '',
    'echo -e "${GREEN}开始部署配置到远程服务器...${NC}"',
    '',
    '# 1. 测试 SSH 连接',
    'echo -e "${YELLOW}[1/4] 测试 SSH 连接...${NC}"',
    `if ! ssh ${sshKey} ${port} -o ConnectTimeout=10 ${sshTarget} "echo 'SSH 连接成功'"; then`,
    '  echo -e "${RED}SSH 连接失败，请检查网络和 SSH 配置${NC}"',
    '  exit 1',
    'fi',
    '',
    '# 2. 创建远程配置目录',
    'echo -e "${YELLOW}[2/4] 创建远程配置目录...${NC}"',
  ]
  
  if (provider.type === 'claude') {
    const claudeProvider = provider as ClaudeProvider
    const settingsJson = {
      env: {
        ANTHROPIC_BASE_URL: claudeProvider.requestUrl || 'https://api.anthropic.com',
        ANTHROPIC_AUTH_TOKEN: claudeProvider.apiKey,
        ANTHROPIC_MODEL: claudeProvider.mainModel,
        ...(claudeProvider.haikuModel && { ANTHROPIC_DEFAULT_HAIKU_MODEL: claudeProvider.haikuModel }),
        ...(claudeProvider.sonnetModel && { ANTHROPIC_DEFAULT_SONNET_MODEL: claudeProvider.sonnetModel }),
        ...(claudeProvider.opusModel && { ANTHROPIC_DEFAULT_OPUS_MODEL: claudeProvider.opusModel }),
      }
    }
    
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "mkdir -p ~/.claude"`)
    lines.push('')
    lines.push('# 3. 写入配置文件')
    lines.push('echo -e "${YELLOW}[3/4] 写入 Claude 配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat > ~/.claude/settings.json << 'EOF'`)
    lines.push(JSON.stringify(settingsJson, null, 2))
    lines.push('EOF"')
    lines.push('')
    lines.push('# 4. 验证配置')
    lines.push('echo -e "${YELLOW}[4/4] 验证配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat ~/.claude/settings.json | head -5"`)
  } else if (provider.type === 'codex') {
    const codexProvider = provider as CodexProvider
    const configToml = [
      `model = "${codexProvider.model || 'gpt-5-codex'}"`,
      `model_provider = "${codexProvider.modelProvider || 'openai'}"`,
      `approval_policy = "${codexProvider.approvalPolicy || 'on-request'}"`,
      `sandbox_mode = "${codexProvider.sandboxMode || 'workspace-write'}"`,
      '',
      '[model_providers.openai]',
      'name = "OpenAI"',
      `base_url = "${codexProvider.requestUrl || 'https://api.openai.com/v1'}"`,
      'env_key = "OPENAI_API_KEY"',
      'wire_api = "responses"'
    ].join('\n')
    
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "mkdir -p ~/.codex"`)
    lines.push('')
    lines.push('# 3. 写入配置文件')
    lines.push('echo -e "${YELLOW}[3/4] 写入 Codex 配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat > ~/.codex/config.toml << 'EOF'`)
    lines.push(configToml)
    lines.push('EOF"')
    lines.push('')
    lines.push('# 设置环境变量 (添加到 ~/.bashrc)')
    lines.push('echo -e "${YELLOW}设置 OPENAI_API_KEY 环境变量...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "grep -q 'OPENAI_API_KEY' ~/.bashrc || echo 'export OPENAI_API_KEY=\"${codexProvider.apiKey}\"' >> ~/.bashrc"`)
    lines.push('')
    lines.push('# 4. 验证配置')
    lines.push('echo -e "${YELLOW}[4/4] 验证配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat ~/.codex/config.toml | head -5"`)
  } else {
    // Gemini
    const geminiProvider = provider as GeminiProvider
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "mkdir -p ~/.gemini"`)
    lines.push('')
    lines.push('# 3. 设置环境变量')
    lines.push('echo -e "${YELLOW}[3/4] 设置 Gemini 环境变量...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "grep -q 'GOOGLE_API_KEY' ~/.bashrc || echo 'export GOOGLE_API_KEY=\"${geminiProvider.apiKey}\"' >> ~/.bashrc"`)
    if (geminiProvider.requestUrl) {
      lines.push(`ssh ${sshKey} ${port} ${sshTarget} "grep -q 'GOOGLE_API_BASE_URL' ~/.bashrc || echo 'export GOOGLE_API_BASE_URL=\"${geminiProvider.requestUrl}\"' >> ~/.bashrc"`)
    }
    lines.push('')
    lines.push('# 4. 验证配置')
    lines.push('echo -e "${YELLOW}[4/4] 验证环境变量...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "source ~/.bashrc && echo GOOGLE_API_KEY is set: \\$GOOGLE_API_KEY | cut -c1-30"`)
  }
  
  lines.push('')
  lines.push('echo -e "${GREEN}✅ 配置部署完成！${NC}"')
  lines.push('echo ""')
  lines.push('echo -e "${YELLOW}现在可以连接到远程服务器运行:${NC}"')
  if (activeRemote.workingDirectory) {
    lines.push(`echo "  ssh ${sshKey} ${port} ${sshTarget} -t 'cd ${activeRemote.workingDirectory} && ${provider.type}'"`)
  } else {
    lines.push(`echo "  ssh ${sshKey} ${port} ${sshTarget} -t '${provider.type}'"`)
  }
  
  return lines.join('\n')
}

// 使用独立远程环境配置生成部署脚本
export function generateRemoteDeployScriptForEnv(
  provider: ClaudeProvider | CodexProvider | GeminiProvider,
  remote: RemoteEnvironment
): string {
  const sshKey = remote.sshKeyPath ? `-i ${remote.sshKeyPath}` : ''
  const port = remote.port !== 22 ? `-p ${remote.port}` : ''
  const sshTarget = `${remote.username}@${remote.host}`
  
  const lines: string[] = [
    '#!/bin/bash',
    '# ============================================',
    '# 远程服务器配置部署脚本',
    `# 目标服务器: ${remote.name} (${remote.host})`,
    '# Generated by cc_switcher',
    '# ============================================',
    '',
    '# 颜色定义',
    'RED="\\033[0;31m"',
    'GREEN="\\033[0;32m"',
    'YELLOW="\\033[1;33m"',
    'NC="\\033[0m" # No Color',
    '',
    'echo -e "${GREEN}开始部署配置到远程服务器 ' + remote.name + '...${NC}"',
    '',
    '# 1. 测试 SSH 连接',
    'echo -e "${YELLOW}[1/4] 测试 SSH 连接...${NC}"',
    `if ! ssh ${sshKey} ${port} -o ConnectTimeout=10 ${sshTarget} "echo 'SSH 连接成功'"; then`,
    '  echo -e "${RED}SSH 连接失败，请检查网络和 SSH 配置${NC}"',
    '  exit 1',
    'fi',
    '',
    '# 2. 创建远程配置目录',
    'echo -e "${YELLOW}[2/4] 创建远程配置目录...${NC}"',
  ]
  
  if (provider.type === 'claude') {
    const claudeProvider = provider as ClaudeProvider
    const settingsJson = {
      env: {
        ANTHROPIC_BASE_URL: claudeProvider.requestUrl || 'https://api.anthropic.com',
        ANTHROPIC_AUTH_TOKEN: claudeProvider.apiKey,
        ANTHROPIC_MODEL: claudeProvider.mainModel,
        ...(claudeProvider.haikuModel && { ANTHROPIC_DEFAULT_HAIKU_MODEL: claudeProvider.haikuModel }),
        ...(claudeProvider.sonnetModel && { ANTHROPIC_DEFAULT_SONNET_MODEL: claudeProvider.sonnetModel }),
        ...(claudeProvider.opusModel && { ANTHROPIC_DEFAULT_OPUS_MODEL: claudeProvider.opusModel }),
      }
    }
    
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "mkdir -p ~/.claude"`)
    lines.push('')
    lines.push('# 3. 写入配置文件')
    lines.push('echo -e "${YELLOW}[3/4] 写入 Claude 配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat > ~/.claude/settings.json << 'EOF'`)
    lines.push(JSON.stringify(settingsJson, null, 2))
    lines.push('EOF"')
    lines.push('')
    lines.push('# 4. 验证配置')
    lines.push('echo -e "${YELLOW}[4/4] 验证配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat ~/.claude/settings.json | head -5"`)
  } else if (provider.type === 'codex') {
    const codexProvider = provider as CodexProvider
    const configToml = [
      `model = "${codexProvider.model || 'gpt-5-codex'}"`,
      `model_provider = "${codexProvider.modelProvider || 'openai'}"`,
      `approval_policy = "${codexProvider.approvalPolicy || 'on-request'}"`,
      `sandbox_mode = "${codexProvider.sandboxMode || 'workspace-write'}"`,
      '',
      '[model_providers.openai]',
      'name = "OpenAI"',
      `base_url = "${codexProvider.requestUrl || 'https://api.openai.com/v1'}"`,
      'env_key = "OPENAI_API_KEY"',
      'wire_api = "responses"'
    ].join('\n')
    
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "mkdir -p ~/.codex"`)
    lines.push('')
    lines.push('# 3. 写入配置文件')
    lines.push('echo -e "${YELLOW}[3/4] 写入 Codex 配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat > ~/.codex/config.toml << 'EOF'`)
    lines.push(configToml)
    lines.push('EOF"')
    lines.push('')
    lines.push('# 设置环境变量 (添加到 ~/.bashrc)')
    lines.push('echo -e "${YELLOW}设置 OPENAI_API_KEY 环境变量...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "grep -q 'OPENAI_API_KEY' ~/.bashrc || echo 'export OPENAI_API_KEY=\\"${codexProvider.apiKey}\\"' >> ~/.bashrc"`)
    lines.push('')
    lines.push('# 4. 验证配置')
    lines.push('echo -e "${YELLOW}[4/4] 验证配置文件...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "cat ~/.codex/config.toml | head -5"`)
  } else {
    // Gemini
    const geminiProvider = provider as GeminiProvider
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "mkdir -p ~/.gemini"`)
    lines.push('')
    lines.push('# 3. 设置环境变量')
    lines.push('echo -e "${YELLOW}[3/4] 设置 Gemini 环境变量...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "grep -q 'GOOGLE_API_KEY' ~/.bashrc || echo 'export GOOGLE_API_KEY=\\"${geminiProvider.apiKey}\\"' >> ~/.bashrc"`)
    if (geminiProvider.requestUrl) {
      lines.push(`ssh ${sshKey} ${port} ${sshTarget} "grep -q 'GOOGLE_API_BASE_URL' ~/.bashrc || echo 'export GOOGLE_API_BASE_URL=\\"${geminiProvider.requestUrl}\\"' >> ~/.bashrc"`)
    }
    lines.push('')
    lines.push('# 4. 验证配置')
    lines.push('echo -e "${YELLOW}[4/4] 验证环境变量...${NC}"')
    lines.push(`ssh ${sshKey} ${port} ${sshTarget} "source ~/.bashrc && echo GOOGLE_API_KEY is set: \\$GOOGLE_API_KEY | cut -c1-30"`)
  }
  
  lines.push('')
  lines.push('echo -e "${GREEN}✅ 配置部署完成！${NC}"')
  lines.push('echo ""')
  lines.push('echo -e "${YELLOW}现在可以连接到远程服务器运行:${NC}"')
  if (remote.workingDirectory) {
    lines.push(`echo "  ssh ${sshKey} ${port} ${sshTarget} -t 'cd ${remote.workingDirectory} && ${provider.type}'"`)
  } else {
    lines.push(`echo "  ssh ${sshKey} ${port} ${sshTarget} -t '${provider.type}'"`)
  }
  
  return lines.join('\n')
}

// 生成环境特定的连接命令
export function generateConnectionCommand(provider: ClaudeProvider | CodexProvider | GeminiProvider): string {
  const lines: string[] = []
  
  if (provider.environmentMode === 'local') {
    lines.push('# 本地环境 - 直接运行')
    if (provider.type === 'claude') {
      lines.push('claude')
    } else if (provider.type === 'codex') {
      lines.push('codex')
    } else {
      lines.push('gemini')
    }
  } else if (provider.environmentMode === 'wsl') {
    lines.push('# WSL 环境 - 通过 WSL 运行')
    lines.push('# 方式一: 直接进入 WSL')
    lines.push('wsl')
    if (provider.type === 'claude') {
      lines.push('claude')
    } else if (provider.type === 'codex') {
      lines.push('codex')
    }
    lines.push('')
    lines.push('# 方式二: 单行命令')
    if (provider.type === 'claude') {
      lines.push('wsl bash -lc "claude"')
    } else if (provider.type === 'codex') {
      lines.push('wsl bash -lc "codex"')
    }
    
    // 如果有 SSH Remote 配置（用于 WSL 内部的远程目录）
    if (provider.activeRemoteId && provider.sshRemotes.length > 0) {
      const activeRemote = provider.sshRemotes.find(r => r.id === provider.activeRemoteId)
      if (activeRemote?.workingDirectory) {
        lines.push('')
        lines.push('# 方式三: 指定工作目录')
        lines.push(`wsl bash -lc "cd ${activeRemote.workingDirectory} && ${provider.type === 'claude' ? 'claude' : 'codex'}"`)
      }
    }
  } else if (provider.environmentMode === 'remote') {
    lines.push('# SSH Remote 环境 - 通过 SSH 连接远程服务器')
    
    if (provider.activeRemoteId && provider.sshRemotes.length > 0) {
      const activeRemote = provider.sshRemotes.find(r => r.id === provider.activeRemoteId)
      if (activeRemote) {
        const sshKey = activeRemote.sshKeyPath ? `-i ${activeRemote.sshKeyPath}` : ''
        const port = activeRemote.port !== 22 ? `-p ${activeRemote.port}` : ''
        const workDir = activeRemote.workingDirectory ? `cd ${activeRemote.workingDirectory} &&` : ''
        
        lines.push('')
        lines.push(`# 连接到: ${activeRemote.name || activeRemote.host}`)
        lines.push(`ssh ${sshKey} ${port} ${activeRemote.username}@${activeRemote.host} -t "${workDir} ${provider.type === 'claude' ? 'claude' : 'codex'}"`)
        
        lines.push('')
        lines.push('# 带端口转发（用于 Web UI 访问）')
        lines.push(`ssh ${sshKey} ${port} -L 8080:localhost:8080 ${activeRemote.username}@${activeRemote.host} -t "${workDir} ${provider.type === 'claude' ? 'claude' : 'codex'}"`)
        
        lines.push('')
        lines.push('# 使用 tmux 保持会话')
        lines.push(`ssh ${sshKey} ${port} ${activeRemote.username}@${activeRemote.host} -t "tmux new-session -A -s claude '${workDir} ${provider.type === 'claude' ? 'claude' : 'codex'}'"`)
      }
    } else {
      lines.push('# 未配置 SSH Remote，请先添加远程服务器配置')
    }
  }
  
  return lines.join('\n')
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
  // sandbox_mode: off | workspace-write | read-only | danger-full-access
  lines.push(`# Sandbox policy for filesystem and network access`)
  lines.push(`# Values: off | workspace-write | read-only | danger-full-access`)
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
    `# Environment mode: ${provider.environmentMode}`,
    `# Usage: source this file or add to ~/.bashrc / ~/.zshrc`,
    ``,
  ]
  
  // 添加环境模式信息
  if (provider.environmentMode === 'wsl') {
    lines.push(`# ============================================`)
    lines.push(`# WSL 环境配置`)
    lines.push(`# ============================================`)
    lines.push(`# 确保在 WSL 内部执行此脚本`)
    lines.push(``)
  } else if (provider.environmentMode === 'remote' && provider.activeRemoteId && provider.sshRemotes.length > 0) {
    const activeRemote = provider.sshRemotes.find(r => r.id === provider.activeRemoteId)
    if (activeRemote) {
      lines.push(`# ============================================`)
      lines.push(`# SSH Remote 环境配置`)
      lines.push(`# 远程服务器: ${activeRemote.name || activeRemote.host}`)
      lines.push(`# ============================================`)
      lines.push(`# 需要在远程服务器上执行此脚本`)
      lines.push(`# SSH 连接命令: ssh ${activeRemote.username}@${activeRemote.host}`)
      lines.push(``)
    }
  }
  
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
