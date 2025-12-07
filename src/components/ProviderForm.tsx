import { useState, useEffect } from 'react'
import { ArrowLeft, Lightbulb, Zap, ExternalLink } from 'lucide-react'
import { ClaudeProvider, ProviderFormData } from '@/types/provider'
import { generateConfigJson } from '@/utils/storage'
import { v4 as uuidv4 } from 'uuid'

interface ProviderFormProps {
  provider?: ClaudeProvider | null
  onSave: (provider: ClaudeProvider) => void
  onCancel: () => void
}

const initialFormData: ProviderFormData = {
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

export default function ProviderForm({ provider, onSave, onCancel }: ProviderFormProps) {
  const [formData, setFormData] = useState<ProviderFormData>(initialFormData)
  const [writeToGlobal, setWriteToGlobal] = useState(false)

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        notes: provider.notes,
        websiteUrl: provider.websiteUrl,
        apiKey: provider.apiKey,
        requestUrl: provider.requestUrl,
        mainModel: provider.mainModel,
        haikuModel: provider.haikuModel,
        sonnetModel: provider.sonnetModel,
        opusModel: provider.opusModel,
      })
    }
  }, [provider])

  const handleChange = (field: keyof ProviderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const now = Date.now()
    const newProvider: ClaudeProvider = {
      id: provider?.id || uuidv4(),
      ...formData,
      configJson: generateConfigJson({ ...formData, id: '', configJson: {}, createdAt: 0, updatedAt: 0 } as ClaudeProvider),
      createdAt: provider?.createdAt || now,
      updatedAt: now,
    }
    onSave(newProvider)
  }

  const configJson = generateConfigJson({ ...formData, id: '', configJson: {}, createdAt: 0, updatedAt: 0 } as ClaudeProvider)

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
            {provider ? '编辑' : '添加'} Claude Code 供应商
          </h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Row 1: Name and Notes */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="input-label">供应商名称</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：Claude 官方"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">备注</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：公司专用账号"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
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
              value={formData.websiteUrl}
              onChange={(e) => handleChange('websiteUrl', e.target.value)}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="input-label">API Key</label>
            <input
              type="password"
              className="input-field bg-[#3d2a1a] border-[#f39c12]"
              placeholder="只需要填这里，下方配置会自动填充"
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
            />
          </div>

          {/* Request URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">请求地址</label>
              <button className="flex items-center gap-1 text-sm text-[#e94560] hover:text-[#f39c12] transition-colors">
                <Zap className="w-4 h-4" />
                管理与测速
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="https://your-api-endpoint.com"
              value={formData.requestUrl}
              onChange={(e) => handleChange('requestUrl', e.target.value)}
            />
            <div className="warning-box mt-3">
              <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>填写兼容 Claude API 的服务端点地址，不要以斜杠结尾</span>
            </div>
          </div>

          {/* Model Settings */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="input-label">主模型</label>
              <input
                type="text"
                className="input-field"
                placeholder="claude-3-5-sonnet-20241022"
                value={formData.mainModel}
                onChange={(e) => handleChange('mainModel', e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Haiku 默认模型</label>
              <input
                type="text"
                className="input-field"
                placeholder="claude-3-haiku-20240307"
                value={formData.haikuModel}
                onChange={(e) => handleChange('haikuModel', e.target.value)}
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
                value={formData.sonnetModel}
                onChange={(e) => handleChange('sonnetModel', e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Opus 默认模型</label>
              <input
                type="text"
                className="input-field"
                placeholder="claude-3-opus-20240229"
                value={formData.opusModel}
                onChange={(e) => handleChange('opusModel', e.target.value)}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            可选：指定默认使用的 Claude 模型，留空则使用系统默认。
          </p>

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
                <button className="text-sm text-[#e94560] hover:text-[#f39c12] transition-colors flex items-center gap-1">
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
