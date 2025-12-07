import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, Copy, Download, Upload, Settings, ExternalLink } from 'lucide-react'
import { ClaudeProvider } from '@/types/provider'

interface ProviderListProps {
  providers: ClaudeProvider[]
  activeProviderId: string | null
  onAdd: () => void
  onEdit: (provider: ClaudeProvider) => void
  onDelete: (id: string) => void
  onActivate: (id: string) => void
  onExport: () => void
  onImport: () => void
}

export default function ProviderList({
  providers,
  activeProviderId,
  onAdd,
  onEdit,
  onDelete,
  onActivate,
  onExport,
  onImport,
}: ProviderListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyConfig = (provider: ClaudeProvider) => {
    const config = JSON.stringify(provider.configJson, null, 2)
    navigator.clipboard.writeText(config)
    setCopiedId(provider.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="border-b border-[#3d3d5c] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#e94560]" />
            <h1 className="text-xl font-semibold">Claude Code 配置管理</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onImport}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2d2d44] hover:bg-[#3d3d5c] rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              导入
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2d2d44] hover:bg-[#3d3d5c] rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#e94560] hover:bg-[#d63850] rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加供应商
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {providers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2d2d44] flex items-center justify-center">
              <Settings className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-medium text-gray-300 mb-2">暂无配置</h2>
            <p className="text-gray-500 mb-6">点击上方按钮添加您的第一个 Claude Code 供应商配置</p>
            <button onClick={onAdd} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-2" />
              添加供应商
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`card relative ${
                  activeProviderId === provider.id
                    ? 'border-[#e94560] bg-[#1a1a2e]'
                    : ''
                }`}
              >
                {activeProviderId === provider.id && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 text-[#e94560] text-sm">
                    <Check className="w-4 h-4" />
                    当前使用
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{provider.name || '未命名供应商'}</h3>
                      {provider.websiteUrl && (
                        <a
                          href={provider.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#e94560] hover:text-[#f39c12] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {provider.notes && (
                      <p className="text-gray-400 text-sm mb-3">{provider.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {provider.requestUrl && (
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">端点:</span>
                          <code className="bg-[#2d2d44] px-2 py-0.5 rounded text-xs">
                            {provider.requestUrl}
                          </code>
                        </span>
                      )}
                      {provider.mainModel && (
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">模型:</span>
                          <code className="bg-[#2d2d44] px-2 py-0.5 rounded text-xs">
                            {provider.mainModel}
                          </code>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#3d3d5c]">
                  {activeProviderId !== provider.id && (
                    <button
                      onClick={() => onActivate(provider.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#0f3460] hover:bg-[#1a4a7a] text-[#4da6ff] rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      使用此配置
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyConfig(provider)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#2d2d44] hover:bg-[#3d3d5c] rounded transition-colors"
                  >
                    {copiedId === provider.id ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制配置
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onEdit(provider)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#2d2d44] hover:bg-[#3d3d5c] rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => onDelete(provider.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#3d1a1a] hover:bg-[#4d2a2a] text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold mb-4">使用说明</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>1. 点击"添加供应商"创建新的 Claude Code 配置</p>
            <p>2. 填写 API Key 和请求地址等信息</p>
            <p>3. 点击"使用此配置"激活配置</p>
            <p>4. 复制生成的配置 JSON 到 Claude Code 的配置文件中</p>
            <div className="mt-4 p-4 bg-[#0f0f1a] rounded-lg">
              <p className="text-gray-300 mb-2">配置文件位置：</p>
              <code className="text-[#e94560]">~/.claude/settings.json</code>
              <p className="text-gray-500 mt-2 text-xs">
                Windows WSL: /home/用户名/.claude/settings.json<br />
                Linux: ~/.claude/settings.json
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
