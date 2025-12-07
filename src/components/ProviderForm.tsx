import { useState, useEffect } from 'react'
import { ArrowLeft, Lightbulb, Zap, ExternalLink, Plus, Trash2, Monitor, Server, Key, CreditCard, KeyRound } from 'lucide-react'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType, SSHRemote, EnvironmentMode, AuthMode, WslPathConfig, WslApplyMode } from '@/types/provider'
import { generateConfigJson, generateCodexConfigJson, generateGeminiConfigJson } from '@/utils/storage'
import { v4 as uuidv4 } from 'uuid'

type Provider = ClaudeProvider | CodexProvider | GeminiProvider

interface ProviderFormProps {
  provider?: Provider | null
  providerType: ProviderType
  onSave: (provider: Provider) => void
  onCancel: () => void
}

// Claude 表单数据
interface ClaudeFormData {
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
  wslPaths: WslPathConfig
}

// Codex 表单数据
interface CodexFormData {
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
  wslPaths: WslPathConfig
}

// Gemini 表单数据
interface GeminiFormData {
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
  wslPaths: WslPathConfig
}

// 默认 WSL 路径配置
const defaultWslPaths: WslPathConfig = {
  applyMode: 'windows',  // 默认从 Windows 直接写入
  distroName: 'Ubuntu',
  wslUsername: '',       // 用户需要填写自己的 WSL 用户名
  claudeConfigPath: '~/.claude',
  codexConfigPath: '~/.codex',
  bashrcPath: '~/.bashrc',
  windowsBasePath: '\\\\wsl.localhost\\Ubuntu',
}

const initialClaudeFormData: ClaudeFormData = {
  name: '',
  notes: '',
  websiteUrl: '',
  apiKey: '',
  requestUrl: '',
  mainModel: '',
  haikuModel: '',
  sonnetModel: '',
  opusModel: '',
  authMode: 'apikey',
  environmentMode: 'local',
  sshRemotes: [],
  activeRemoteId: null,
  wslPaths: { ...defaultWslPaths },
}

const initialCodexFormData: CodexFormData = {
  name: '',
  notes: '',
  websiteUrl: '',
  apiKey: '',
  requestUrl: '',
  model: '',
  authJson: '',
  authMode: 'apikey',
  environmentMode: 'local',
  sshRemotes: [],
  activeRemoteId: null,
  wslPaths: { ...defaultWslPaths },
}

const initialGeminiFormData: GeminiFormData = {
  name: '',
  notes: '',
  websiteUrl: '',
  apiKey: '',
  requestUrl: '',
  model: '',
  authMode: 'apikey',
  environmentMode: 'local',
  sshRemotes: [],
  activeRemoteId: null,
  wslPaths: { ...defaultWslPaths },
}

export default function ProviderForm({ provider, providerType, onSave, onCancel }: ProviderFormProps) {
  const [claudeFormData, setClaudeFormData] = useState<ClaudeFormData>(initialClaudeFormData)
  const [codexFormData, setCodexFormData] = useState<CodexFormData>(initialCodexFormData)
  const [geminiFormData, setGeminiFormData] = useState<GeminiFormData>(initialGeminiFormData)
  const [writeToGlobal, setWriteToGlobal] = useState(false)

  useEffect(() => {
    if (provider) {
      if (provider.type === 'claude') {
        const p = provider as ClaudeProvider
        setClaudeFormData({
          name: p.name,
          notes: p.notes,
          websiteUrl: p.websiteUrl,
          apiKey: p.apiKey,
          requestUrl: p.requestUrl,
          mainModel: p.mainModel,
          haikuModel: p.haikuModel,
          sonnetModel: p.sonnetModel,
          opusModel: p.opusModel,
          authMode: p.authMode || 'apikey',
          environmentMode: p.environmentMode || 'local',
          sshRemotes: p.sshRemotes || [],
          activeRemoteId: p.activeRemoteId || null,
          wslPaths: p.wslPaths || { ...defaultWslPaths },
        })
      } else if (provider.type === 'codex') {
        const p = provider as CodexProvider
        setCodexFormData({
          name: p.name,
          notes: p.notes,
          websiteUrl: p.websiteUrl,
          apiKey: p.apiKey,
          requestUrl: p.requestUrl,
          model: p.model,
          authJson: JSON.stringify(p.authJson || {}, null, 2),
          authMode: p.authMode || 'apikey',
          environmentMode: p.environmentMode || 'local',
          sshRemotes: p.sshRemotes || [],
          activeRemoteId: p.activeRemoteId || null,
          wslPaths: p.wslPaths || { ...defaultWslPaths },
        })
      } else if (provider.type === 'gemini') {
        const p = provider as GeminiProvider
        setGeminiFormData({
          name: p.name,
          notes: p.notes,
          websiteUrl: p.websiteUrl,
          apiKey: p.apiKey,
          requestUrl: p.requestUrl,
          model: p.model,
          authMode: p.authMode || 'apikey',
          environmentMode: p.environmentMode || 'local',
          sshRemotes: p.sshRemotes || [],
          activeRemoteId: p.activeRemoteId || null,
          wslPaths: p.wslPaths || { ...defaultWslPaths },
        })
      }
    }
  }, [provider])

  const handleClaudeChange = (field: keyof ClaudeFormData, value: string | EnvironmentMode | AuthMode | SSHRemote[] | WslPathConfig | null) => {
    setClaudeFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCodexChange = (field: keyof CodexFormData, value: string | EnvironmentMode | AuthMode | SSHRemote[] | WslPathConfig | null) => {
    setCodexFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGeminiChange = (field: keyof GeminiFormData, value: string | EnvironmentMode | AuthMode | SSHRemote[] | WslPathConfig | null) => {
    setGeminiFormData(prev => ({ ...prev, [field]: value }))
  }
  
  // WSL 路径更新辅助函数
  const handleWslPathChange = (field: keyof WslPathConfig | 'wslUsername', value: string | WslApplyMode) => {
    const currentData = getCurrentFormData()
    const handler = getCurrentHandler()
    handler('wslPaths', {
      ...currentData.wslPaths,
      [field]: value
    })
  }

  // SSH Remote 管理函数
  const getCurrentFormData = () => {
    if (providerType === 'claude') return claudeFormData
    if (providerType === 'codex') return codexFormData
    return geminiFormData
  }

  const getCurrentHandler = () => {
    if (providerType === 'claude') return handleClaudeChange
    if (providerType === 'codex') return handleCodexChange
    return handleGeminiChange
  }

  const addSSHRemote = () => {
    const newRemote: SSHRemote = {
      id: uuidv4(),
      name: '',
      host: '',
      port: 22,
      username: '',
      sshKeyPath: '',
      isActive: false,
    }
    const handler = getCurrentHandler()
    const currentData = getCurrentFormData()
    handler('sshRemotes' as any, [...currentData.sshRemotes, newRemote])
  }

  const updateSSHRemote = (id: string, field: keyof SSHRemote, value: string | number | boolean) => {
    const handler = getCurrentHandler()
    const currentData = getCurrentFormData()
    const updatedRemotes = currentData.sshRemotes.map(remote =>
      remote.id === id ? { ...remote, [field]: value } : remote
    )
    handler('sshRemotes' as any, updatedRemotes)
  }

  const removeSSHRemote = (id: string) => {
    const handler = getCurrentHandler()
    const currentData = getCurrentFormData()
    const updatedRemotes = currentData.sshRemotes.filter(remote => remote.id !== id)
    handler('sshRemotes' as any, updatedRemotes)
    if (currentData.activeRemoteId === id) {
      handler('activeRemoteId' as any, null)
    }
  }

  const setActiveRemote = (id: string | null) => {
    const handler = getCurrentHandler()
    handler('activeRemoteId' as any, id)
  }

  const handleSubmit = () => {
    const now = Date.now()
    
    if (providerType === 'claude') {
      const newProvider: ClaudeProvider = {
        id: provider?.id || uuidv4(),
        type: 'claude',
        name: claudeFormData.name,
        notes: claudeFormData.notes,
        websiteUrl: claudeFormData.websiteUrl,
        apiKey: claudeFormData.apiKey,
        requestUrl: claudeFormData.requestUrl,
        mainModel: claudeFormData.mainModel,
        haikuModel: claudeFormData.haikuModel,
        sonnetModel: claudeFormData.sonnetModel,
        opusModel: claudeFormData.opusModel,
        authMode: claudeFormData.authMode,
        environmentMode: claudeFormData.environmentMode,
        sshRemotes: claudeFormData.sshRemotes,
        activeRemoteId: claudeFormData.activeRemoteId,
        wslPaths: claudeFormData.wslPaths,
        configJson: generateConfigJson({ ...claudeFormData, id: '', type: 'claude', configJson: {}, createdAt: 0, updatedAt: 0, authMode: claudeFormData.authMode, environmentMode: claudeFormData.environmentMode, sshRemotes: claudeFormData.sshRemotes, activeRemoteId: claudeFormData.activeRemoteId } as ClaudeProvider),
        createdAt: provider?.createdAt || now,
        updatedAt: now,
      }
      onSave(newProvider)
    } else if (providerType === 'codex') {
      let authJson = {}
      try {
        authJson = codexFormData.authJson ? JSON.parse(codexFormData.authJson) : {}
      } catch {
        authJson = {}
      }
      const newProvider: CodexProvider = {
        id: provider?.id || uuidv4(),
        type: 'codex',
        name: codexFormData.name,
        notes: codexFormData.notes,
        websiteUrl: codexFormData.websiteUrl,
        apiKey: codexFormData.apiKey,
        requestUrl: codexFormData.requestUrl,
        model: codexFormData.model,
        authJson,
        authMode: codexFormData.authMode,
        environmentMode: codexFormData.environmentMode,
        sshRemotes: codexFormData.sshRemotes,
        activeRemoteId: codexFormData.activeRemoteId,
        wslPaths: codexFormData.wslPaths,
        configJson: generateCodexConfigJson({ ...codexFormData, authJson }),
        createdAt: provider?.createdAt || now,
        updatedAt: now,
      }
      onSave(newProvider)
    } else if (providerType === 'gemini') {
      const newProvider: GeminiProvider = {
        id: provider?.id || uuidv4(),
        type: 'gemini',
        name: geminiFormData.name,
        notes: geminiFormData.notes,
        websiteUrl: geminiFormData.websiteUrl,
        apiKey: geminiFormData.apiKey,
        requestUrl: geminiFormData.requestUrl,
        model: geminiFormData.model,
        authMode: geminiFormData.authMode,
        environmentMode: geminiFormData.environmentMode,
        sshRemotes: geminiFormData.sshRemotes,
        activeRemoteId: geminiFormData.activeRemoteId,
        wslPaths: geminiFormData.wslPaths,
        configJson: generateGeminiConfigJson(geminiFormData),
        createdAt: provider?.createdAt || now,
        updatedAt: now,
      }
      onSave(newProvider)
    }
  }

  const getConfigJson = () => {
    if (providerType === 'claude') {
      return generateConfigJson({ ...claudeFormData, id: '', type: 'claude', configJson: {}, createdAt: 0, updatedAt: 0, authMode: claudeFormData.authMode, environmentMode: claudeFormData.environmentMode, sshRemotes: claudeFormData.sshRemotes, activeRemoteId: claudeFormData.activeRemoteId } as ClaudeProvider)
    } else if (providerType === 'codex') {
      let authJson = {}
      try {
        authJson = codexFormData.authJson ? JSON.parse(codexFormData.authJson) : {}
      } catch {
        authJson = {}
      }
      return generateCodexConfigJson({ ...codexFormData, authJson })
    } else {
      return generateGeminiConfigJson(geminiFormData)
    }
  }

  const getTabColor = () => {
    switch (providerType) {
      case 'claude': return '#e94560'
      case 'codex': return '#10b981'
      case 'gemini': return '#4da6ff'
    }
  }

  const getTabBgColor = () => {
    switch (providerType) {
      case 'claude': return 'rgba(233, 69, 96, 0.1)'
      case 'codex': return 'rgba(16, 185, 129, 0.1)'
      case 'gemini': return 'rgba(77, 166, 255, 0.1)'
    }
  }

  const getTabIcon = () => {
    switch (providerType) {
      case 'claude': return '🔴'
      case 'codex': return '🟢'
      case 'gemini': return '🔵'
    }
  }

  const getTabLabel = () => {
    switch (providerType) {
      case 'claude': return 'Claude'
      case 'codex': return 'Codex'
      case 'gemini': return 'Gemini'
    }
  }

  const configJson = getConfigJson()

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="border-b border-[#3d3d5c] px-6 py-4" style={{ backgroundColor: getTabBgColor() }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[#2d2d44] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: getTabBgColor(),
                color: getTabColor(),
                border: `1px solid ${getTabColor()}50`
              }}
            >
              {getTabIcon()} {getTabLabel()}
            </span>
            <h1 className="text-xl font-semibold">
              {provider ? '编辑' : '添加'}供应商
            </h1>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Common Fields: Name and Notes */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="input-label">供应商名称</label>
              <input
                type="text"
                className="input-field"
                placeholder={`例如：${getTabLabel()} 官方`}
                value={providerType === 'claude' ? claudeFormData.name : providerType === 'codex' ? codexFormData.name : geminiFormData.name}
                onChange={(e) => {
                  if (providerType === 'claude') handleClaudeChange('name', e.target.value)
                  else if (providerType === 'codex') handleCodexChange('name', e.target.value)
                  else handleGeminiChange('name', e.target.value)
                }}
              />
            </div>
            <div>
              <label className="input-label">备注</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：公司专用账号"
                value={providerType === 'claude' ? claudeFormData.notes : providerType === 'codex' ? codexFormData.notes : geminiFormData.notes}
                onChange={(e) => {
                  if (providerType === 'claude') handleClaudeChange('notes', e.target.value)
                  else if (providerType === 'codex') handleCodexChange('notes', e.target.value)
                  else handleGeminiChange('notes', e.target.value)
                }}
              />
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="input-label">官网链接</label>
            <input
              type="text"
              className="input-field"
              placeholder="https://"
              value={providerType === 'claude' ? claudeFormData.websiteUrl : providerType === 'codex' ? codexFormData.websiteUrl : geminiFormData.websiteUrl}
              onChange={(e) => {
                if (providerType === 'claude') handleClaudeChange('websiteUrl', e.target.value)
                else if (providerType === 'codex') handleCodexChange('websiteUrl', e.target.value)
                else handleGeminiChange('websiteUrl', e.target.value)
              }}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="input-label">API Key</label>
            <input
              type="password"
              className="input-field bg-[#3d2a1a] border-[#f39c12]"
              placeholder="只需要填这里，下方配置会自动填充"
              value={providerType === 'claude' ? claudeFormData.apiKey : providerType === 'codex' ? codexFormData.apiKey : geminiFormData.apiKey}
              onChange={(e) => {
                if (providerType === 'claude') handleClaudeChange('apiKey', e.target.value)
                else if (providerType === 'codex') handleCodexChange('apiKey', e.target.value)
                else handleGeminiChange('apiKey', e.target.value)
              }}
            />
          </div>

          {/* Request URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">请求地址</label>
              <button className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity" style={{ color: getTabColor() }}>
                <Zap className="w-4 h-4" />
                管理与测速
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="https://your-api-endpoint.com"
              value={providerType === 'claude' ? claudeFormData.requestUrl : providerType === 'codex' ? codexFormData.requestUrl : geminiFormData.requestUrl}
              onChange={(e) => {
                if (providerType === 'claude') handleClaudeChange('requestUrl', e.target.value)
                else if (providerType === 'codex') handleCodexChange('requestUrl', e.target.value)
                else handleGeminiChange('requestUrl', e.target.value)
              }}
            />
            <div className="warning-box mt-3">
              <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>填写兼容 {getTabLabel()} API 的服务端点地址，不要以斜杠结尾</span>
            </div>
          </div>

          {/* Claude-specific Model Settings */}
          {providerType === 'claude' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="input-label">主模型</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="claude-3-5-sonnet-20241022"
                    value={claudeFormData.mainModel}
                    onChange={(e) => handleClaudeChange('mainModel', e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">Haiku 默认模型</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="claude-3-haiku-20240307"
                    value={claudeFormData.haikuModel}
                    onChange={(e) => handleClaudeChange('haikuModel', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Sonnet 默认模型</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="claude-3-5-sonnet-20241022"
                    value={claudeFormData.sonnetModel}
                    onChange={(e) => handleClaudeChange('sonnetModel', e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">Opus 默认模型</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="claude-3-opus-20240229"
                    value={claudeFormData.opusModel}
                    onChange={(e) => handleClaudeChange('opusModel', e.target.value)}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500">
                可选：指定默认使用的 Claude 模型，留空则使用系统默认。
              </p>
            </>
          )}

          {/* Codex-specific Model Settings */}
          {providerType === 'codex' && (
            <>
              <div>
                <label className="input-label">模型</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="codex-mini-latest"
                  value={codexFormData.model}
                  onChange={(e) => handleCodexChange('model', e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">认证 JSON (可选)</label>
                <textarea
                  className="input-field min-h-[100px] font-mono text-sm"
                  placeholder='{"token": "your-token"}'
                  value={codexFormData.authJson}
                  onChange={(e) => handleCodexChange('authJson', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  可选：额外的认证信息，JSON 格式
                </p>
              </div>
            </>
          )}

          {/* Gemini-specific Model Settings */}
          {providerType === 'gemini' && (
            <>
              <div>
                <label className="input-label">模型</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="gemini-pro"
                  value={geminiFormData.model}
                  onChange={(e) => handleGeminiChange('model', e.target.value)}
                />
              </div>

              <p className="text-sm text-gray-500">
                可选：指定默认使用的 Gemini 模型，留空则使用系统默认。
              </p>
            </>
          )}

          {/* Authentication Mode Selection */}
          <div className="border-t border-[#3d3d5c] pt-6">
            <label className="input-label mb-3">认证方式</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  const handler = getCurrentHandler()
                  handler('authMode' as any, 'plan')
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  getCurrentFormData().authMode === 'plan'
                    ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-white'
                    : 'border-[#3d3d5c] bg-[#2d2d44] text-gray-400 hover:border-gray-500'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">官方 Plan 订阅</div>
                  <div className="text-xs opacity-70">使用官方订阅账号</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const handler = getCurrentHandler()
                  handler('authMode' as any, 'apikey')
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  getCurrentFormData().authMode === 'apikey'
                    ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-white'
                    : 'border-[#3d3d5c] bg-[#2d2d44] text-gray-400 hover:border-gray-500'
                }`}
              >
                <KeyRound className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">API Key</div>
                  <div className="text-xs opacity-70">使用 API 密钥认证</div>
                </div>
              </button>
            </div>
            {getCurrentFormData().authMode === 'plan' && (
              <div className="warning-box mt-3">
                <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>使用官方 Plan 订阅时，无需填写 API Key，系统将使用您的订阅账号进行认证</span>
              </div>
            )}
          </div>

          {/* Environment Mode Selection */}
          <div className="border-t border-[#3d3d5c] pt-6">
            <label className="input-label mb-3">当前环境</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  const handler = getCurrentHandler()
                  handler('environmentMode' as any, 'local')
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  getCurrentFormData().environmentMode === 'local'
                    ? 'border-[#e94560] bg-[#e94560]/10 text-white'
                    : 'border-[#3d3d5c] bg-[#2d2d44] text-gray-400 hover:border-gray-500'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">本地 (Local)</div>
                  <div className="text-xs opacity-70">在当前电脑本地运行</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const handler = getCurrentHandler()
                  handler('environmentMode' as any, 'wsl')
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  getCurrentFormData().environmentMode === 'wsl'
                    ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-white'
                    : 'border-[#3d3d5c] bg-[#2d2d44] text-gray-400 hover:border-gray-500'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">WSL</div>
                  <div className="text-xs opacity-70">通过 WSL 环境运行</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const handler = getCurrentHandler()
                  handler('environmentMode' as any, 'remote')
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  getCurrentFormData().environmentMode === 'remote'
                    ? 'border-[#10b981] bg-[#10b981]/10 text-white'
                    : 'border-[#3d3d5c] bg-[#2d2d44] text-gray-400 hover:border-gray-500'
                }`}
              >
                <Server className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">SSH Remote</div>
                  <div className="text-xs opacity-70">通过 SSH 连接远程服务器</div>
                </div>
              </button>
            </div>
          </div>

          {/* WSL 路径配置 - 当选择 WSL 环境时显示 */}
          {getCurrentFormData().environmentMode === 'wsl' && (
            <div className="border border-[#8b5cf6]/30 rounded-lg p-4 bg-[#8b5cf6]/5">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-[#8b5cf6]" />
                <label className="text-sm font-medium text-[#8b5cf6]">
                  WSL 配置
                </label>
              </div>
              
              <div className="space-y-4">
                {/* 应用方式选择 */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">应用方式</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleWslPathChange('applyMode', 'windows')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        getCurrentFormData().wslPaths.applyMode === 'windows'
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white'
                          : 'border-[#3d3d5c] bg-[#2d2d44] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-sm">从 Windows 写入</div>
                      <div className="text-xs opacity-70 mt-1">通过 \\wsl$\ 路径直接写入配置</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWslPathChange('applyMode', 'bash')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        getCurrentFormData().wslPaths.applyMode === 'bash'
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 text-white'
                          : 'border-[#3d3d5c] bg-[#2d2d44] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-sm">在 WSL 内执行</div>
                      <div className="text-xs opacity-70 mt-1">生成 Bash 脚本在 WSL 终端运行</div>
                    </button>
                  </div>
                </div>

                {/* Windows 模式配置 */}
                {getCurrentFormData().wslPaths.applyMode === 'windows' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">WSL 发行版名称 *</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          placeholder="Ubuntu"
                          value={getCurrentFormData().wslPaths.distroName || ''}
                          onChange={(e) => {
                            const distroName = e.target.value
                            handleWslPathChange('distroName', distroName)
                            // 自动更新 Windows 基路径
                            if (distroName) {
                              handleWslPathChange('windowsBasePath', `\\\\wsl.localhost\\${distroName}`)
                            }
                          }}
                        />
                        <p className="text-xs text-gray-600 mt-1">如: Ubuntu, Debian, Ubuntu-22.04</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">WSL 用户名 *</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          placeholder="your_username"
                          value={(getCurrentFormData().wslPaths as any).wslUsername || ''}
                          onChange={(e) => handleWslPathChange('wslUsername' as any, e.target.value)}
                        />
                        <p className="text-xs text-gray-600 mt-1">WSL 中的 Linux 用户名</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Windows 访问路径 (自动生成)</label>
                      <input
                        type="text"
                        className="input-field text-sm bg-[#1a1a2e]"
                        placeholder="\\wsl.localhost\Ubuntu"
                        value={getCurrentFormData().wslPaths.windowsBasePath || ''}
                        onChange={(e) => handleWslPathChange('windowsBasePath', e.target.value)}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        也可使用 <code className="text-purple-400">\\wsl$\{getCurrentFormData().wslPaths.distroName || 'Ubuntu'}</code>
                      </p>
                    </div>
                  </>
                )}
                
                {/* 配置文件路径 */}
                <div className="pt-2 border-t border-[#3d3d5c]">
                  <label className="text-xs text-gray-400 mb-2 block">配置文件路径 (Linux 格式)</label>
                  
                  {providerType === 'claude' && (
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 mb-1 block">Claude 配置目录</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        placeholder="~/.claude"
                        value={getCurrentFormData().wslPaths.claudeConfigPath}
                        onChange={(e) => handleWslPathChange('claudeConfigPath', e.target.value)}
                      />
                      <p className="text-xs text-gray-600 mt-1">settings.json 将保存到此目录</p>
                    </div>
                  )}
                  
                  {providerType === 'codex' && (
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 mb-1 block">Codex 配置目录</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        placeholder="~/.codex"
                        value={getCurrentFormData().wslPaths.codexConfigPath}
                        onChange={(e) => handleWslPathChange('codexConfigPath', e.target.value)}
                      />
                      <p className="text-xs text-gray-600 mt-1">config.toml 将保存到此目录</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Shell 配置文件路径</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="~/.bashrc"
                      value={getCurrentFormData().wslPaths.bashrcPath}
                      onChange={(e) => handleWslPathChange('bashrcPath', e.target.value)}
                    />
                    <p className="text-xs text-gray-600 mt-1">环境变量将追加到此文件 (zsh 用户可改为 ~/.zshrc)</p>
                  </div>
                </div>
              </div>
              
              {/* 提示信息 */}
              <div className="mt-4 p-3 bg-[#1a1a2e] rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-400">
                    {getCurrentFormData().wslPaths.applyMode === 'windows' ? (
                      <>
                        <p className="font-medium text-yellow-500 mb-1">Windows 模式说明</p>
                        <ul className="space-y-1">
                          <li>• 直接从 Windows 写入 WSL 文件系统，无需打开 WSL 终端</li>
                          <li>• 通过 <code className="text-purple-400">\\wsl.localhost\</code> 或 <code className="text-purple-400">\\wsl$\</code> 路径访问</li>
                          <li>• 需要正确的 WSL 用户名来定位 home 目录</li>
                          <li>• 生成 PowerShell 脚本，双击或在 PowerShell 中运行</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-yellow-500 mb-1">Bash 模式说明</p>
                        <ul className="space-y-1">
                          <li>• 使用 <code className="text-purple-400">~</code> 表示 WSL 用户主目录</li>
                          <li>• 可使用绝对路径如 <code className="text-purple-400">/home/user/.config/claude</code></li>
                          <li>• 生成 Bash 脚本，需在 WSL 终端中执行</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SSH Remote Configuration */}
          {getCurrentFormData().environmentMode === 'remote' && (
            <div className="border border-[#3d3d5c] rounded-lg p-4 bg-[#2d2d44]/50">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  SSH Remote 配置
                </label>
                <button
                  type="button"
                  onClick={addSSHRemote}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] transition-colors text-white"
                >
                  <Plus className="w-4 h-4" />
                  添加 Remote
                </button>
              </div>

              {getCurrentFormData().sshRemotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无 SSH Remote 配置</p>
                  <p className="text-xs mt-1">点击上方按钮添加远程服务器</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getCurrentFormData().sshRemotes.map((remote, index) => (
                    <div
                      key={remote.id}
                      className={`border rounded-lg p-4 transition-all ${
                        getCurrentFormData().activeRemoteId === remote.id
                          ? 'border-[#10b981] bg-[#10b981]/5'
                          : 'border-[#3d3d5c] bg-[#1a1a2e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="activeRemote"
                            checked={getCurrentFormData().activeRemoteId === remote.id}
                            onChange={() => setActiveRemote(remote.id)}
                            className="w-4 h-4 text-[#10b981]"
                          />
                          <span className="text-sm font-medium text-gray-300">
                            Remote #{index + 1}
                          </span>
                          {getCurrentFormData().activeRemoteId === remote.id && (
                            <span className="text-xs px-2 py-0.5 rounded bg-[#10b981] text-white">
                              当前激活
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSSHRemote(remote.id)}
                          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">名称</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            placeholder="例如：开发服务器"
                            value={remote.name}
                            onChange={(e) => updateSSHRemote(remote.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">主机地址</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            placeholder="192.168.1.100 或 hostname"
                            value={remote.host}
                            onChange={(e) => updateSSHRemote(remote.id, 'host', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">端口</label>
                          <input
                            type="number"
                            className="input-field text-sm"
                            placeholder="22"
                            value={remote.port}
                            onChange={(e) => updateSSHRemote(remote.id, 'port', parseInt(e.target.value) || 22)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">用户名</label>
                          <input
                            type="text"
                            className="input-field text-sm"
                            placeholder="root"
                            value={remote.username}
                            onChange={(e) => updateSSHRemote(remote.id, 'username', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                            <Key className="w-3 h-3" />
                            SSH Key 路径
                          </label>
                          <input
                            type="text"
                            className="input-field text-sm font-mono"
                            placeholder="~/.ssh/id_rsa"
                            value={remote.sshKeyPath}
                            onChange={(e) => updateSSHRemote(remote.id, 'sshKeyPath', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            WSL 工作目录（可选）
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="input-field text-sm font-mono flex-1"
                              placeholder="例如：/mnt/c/Users/you/project 或 \\wsl$\\Ubuntu\\home\\you\\project"
                              value={remote.workingDirectory ?? ''}
                              onChange={(e) => updateSSHRemote(remote.id, 'workingDirectory', e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-secondary whitespace-nowrap"
                            >
                              选择文件夹
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            建议填写 WSL 中代码所在目录，方便在其他工具中保持一致的路径配置
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="warning-box mt-4">
                <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>确保 SSH Key 已添加到远程服务器的 authorized_keys 中</span>
              </div>
            </div>
          )}

          {/* Config JSON Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">配置 JSON</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={writeToGlobal}
                    onChange={(e) => setWriteToGlobal(e.target.checked)}
                    className="rounded border-gray-600 bg-[#2d2d44]"
                  />
                  写入通用配置
                </label>
                <button className="text-sm hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: getTabColor() }}>
                  编辑通用配置
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="bg-[#0f0f1a] rounded-lg p-4 font-mono text-sm overflow-x-auto border border-[#3d3d5c]">
              <pre className="text-gray-300">
                {JSON.stringify(configJson, null, 2)}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button onClick={onCancel} className="btn-secondary">
              取消
            </button>
            <button 
              onClick={handleSubmit} 
              className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: getTabColor() }}
            >
              {provider ? '保存修改' : '添加供应商'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
