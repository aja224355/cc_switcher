import { useState, useEffect } from 'react'
import { ArrowLeft, Lightbulb, Zap, ExternalLink } from 'lucide-react'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType } from '@/types/provider'
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
}

// Gemini 表单数据
interface GeminiFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  model: string
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
}

const initialCodexFormData: CodexFormData = {
  name: '',
  notes: '',
  websiteUrl: '',
  apiKey: '',
  requestUrl: '',
  model: '',
  authJson: '',
}

const initialGeminiFormData: GeminiFormData = {
  name: '',
  notes: '',
  websiteUrl: '',
  apiKey: '',
  requestUrl: '',
  model: '',
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
        })
      }
    }
  }, [provider])

  const handleClaudeChange = (field: keyof ClaudeFormData, value: string) => {
    setClaudeFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCodexChange = (field: keyof CodexFormData, value: string) => {
    setCodexFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGeminiChange = (field: keyof GeminiFormData, value: string) => {
    setGeminiFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const now = Date.now()
    
    if (providerType === 'claude') {
      const newProvider: ClaudeProvider = {
        id: provider?.id || uuidv4(),
        type: 'claude',
        ...claudeFormData,
        configJson: generateConfigJson({ ...claudeFormData, id: '', type: 'claude', configJson: {}, createdAt: 0, updatedAt: 0 } as ClaudeProvider),
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
        configJson: generateCodexConfigJson({ ...codexFormData, authJson }),
        createdAt: provider?.createdAt || now,
        updatedAt: now,
      }
      onSave(newProvider)
    } else if (providerType === 'gemini') {
      const newProvider: GeminiProvider = {
        id: provider?.id || uuidv4(),
        type: 'gemini',
        ...geminiFormData,
        configJson: generateGeminiConfigJson(geminiFormData),
        createdAt: provider?.createdAt || now,
        updatedAt: now,
      }
      onSave(newProvider)
    }
  }

  const getConfigJson = () => {
    if (providerType === 'claude') {
      return generateConfigJson({ ...claudeFormData, id: '', type: 'claude', configJson: {}, createdAt: 0, updatedAt: 0 } as ClaudeProvider)
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
      <div className="border-b border-[#3d3d5c] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[#2d2d44] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">
            {provider ? '编辑' : '添加'} <span style={{ color: getTabColor() }}>{getTabLabel()}</span> 供应商
          </h1>
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
            <button onClick={handleSubmit} className="btn-primary">
              {provider ? '保存修改' : '添加供应商'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
