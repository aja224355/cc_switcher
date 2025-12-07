import { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, Copy, Download, Upload, Settings, ExternalLink, FileJson, Database, FileCode, Terminal } from 'lucide-react'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType } from '@/types/provider'

type Provider = ClaudeProvider | CodexProvider | GeminiProvider
type ExportFormat = 'json' | 'sql' | 'sql-all' | 'claude-settings' | 'codex-toml' | 'shell-env'

interface TabConfig {
  type: ProviderType
  label: string
  color: string
}

interface ProviderListProps {
  providers: Provider[]
  activeProviderId: string | null
  providerType: ProviderType
  tabs: TabConfig[]
  onTabChange: (type: ProviderType) => void
  onAdd: () => void
  onEdit: (provider: Provider) => void
  onDelete: (id: string) => void
  onActivate: (id: string) => void
  onExport: () => void
  onImport: () => void
  showExportMenu?: boolean
  onExportFormat?: (format: ExportFormat) => void
  onCloseExportMenu?: () => void
}

export default function ProviderList({
  providers,
  activeProviderId,
  providerType,
  tabs,
  onTabChange,
  onAdd,
  onEdit,
  onDelete,
  onActivate,
  onExport,
  onImport,
  showExportMenu = false,
  onExportFormat,
  onCloseExportMenu,
}: ProviderListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        onCloseExportMenu?.()
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu, onCloseExportMenu])

  const handleCopyConfig = (provider: Provider) => {
    const config = JSON.stringify(provider.configJson, null, 2)
    navigator.clipboard.writeText(config)
    setCopiedId(provider.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getProviderModel = (provider: Provider): string => {
    if (provider.type === 'claude') {
      return (provider as ClaudeProvider).mainModel
    } else if (provider.type === 'codex') {
      return (provider as CodexProvider).model
    } else {
      return (provider as GeminiProvider).model
    }
  }

  const getTabColor = () => {
    const tab = tabs.find(t => t.type === providerType)
    return tab?.color || '#e94560'
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="border-b border-[#3d3d5c] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" style={{ color: getTabColor() }} />
            <h1 className="text-xl font-semibold">配置管理</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onImport}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2d2d44] hover:bg-[#3d3d5c] rounded-lg transition-colors"
              title="支持 JSON 和 SQL 格式 (兼容 cc-switch)"
            >
              <Upload className="w-4 h-4" />
              导入
            </button>
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2d2d44] hover:bg-[#3d3d5c] rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
              {showExportMenu && onExportFormat && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#2d2d44] border border-[#3d3d5c] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b border-[#3d3d5c]">通用格式</div>
                  <button
                    onClick={() => onExportFormat('json')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                  >
                    <FileJson className="w-4 h-4 text-[#4da6ff]" />
                    <div>
                      <div className="font-medium">JSON 格式</div>
                      <div className="text-xs text-gray-500">标准配置格式</div>
                    </div>
                  </button>
                  <button
                    onClick={() => onExportFormat('sql')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                  >
                    <Database className="w-4 h-4 text-[#e94560]" />
                    <div>
                      <div className="font-medium">SQL 格式 (当前类型)</div>
                      <div className="text-xs text-gray-500">兼容 cc-switch</div>
                    </div>
                  </button>
                  <button
                    onClick={() => onExportFormat('sql-all')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                  >
                    <Database className="w-4 h-4 text-[#10b981]" />
                    <div>
                      <div className="font-medium">SQL 格式 (全部类型)</div>
                      <div className="text-xs text-gray-500">包含所有供应商</div>
                    </div>
                  </button>
                  
                  <div className="px-3 py-2 text-xs text-gray-500 border-t border-b border-[#3d3d5c]">官方格式 (当前激活)</div>
                  {providerType === 'claude' && (
                    <button
                      onClick={() => onExportFormat('claude-settings')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                    >
                      <FileCode className="w-4 h-4 text-[#e94560]" />
                      <div>
                        <div className="font-medium">settings.json</div>
                        <div className="text-xs text-gray-500">Claude Code 官方格式</div>
                      </div>
                    </button>
                  )}
                  {providerType === 'codex' && (
                    <button
                      onClick={() => onExportFormat('codex-toml')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                    >
                      <FileCode className="w-4 h-4 text-[#10b981]" />
                      <div>
                        <div className="font-medium">config.toml</div>
                        <div className="text-xs text-gray-500">Codex CLI 官方格式</div>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => onExportFormat('shell-env')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                  >
                    <Terminal className="w-4 h-4 text-[#f59e0b]" />
                    <div>
                      <div className="font-medium">Shell 环境变量</div>
                      <div className="text-xs text-gray-500">Bash/Zsh export 格式</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ backgroundColor: getTabColor() }}
            >
              <Plus className="w-4 h-4" />
              添加供应商
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#3d3d5c] px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => onTabChange(tab.type)}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                providerType === tab.type
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {providerType === tab.type && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: tab.color }}
                />
              )}
            </button>
          ))}
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
            <p className="text-gray-500 mb-6">点击上方按钮添加您的第一个 {tabs.find(t => t.type === providerType)?.label} 供应商配置</p>
            <button onClick={onAdd} className="btn-primary" style={{ backgroundColor: getTabColor() }}>
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
                    ? 'bg-[#1a1a2e]'
                    : ''
                }`}
                style={{
                  borderColor: activeProviderId === provider.id ? getTabColor() : undefined
                }}
              >
                {activeProviderId === provider.id && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 text-sm" style={{ color: getTabColor() }}>
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
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: getTabColor() }}
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
                      {getProviderModel(provider) && (
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">模型:</span>
                          <code className="bg-[#2d2d44] px-2 py-0.5 rounded text-xs" style={{ color: getTabColor() }}>
                            {getProviderModel(provider)}
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

        {/* Import/Export Info */}
        <div className="mt-4 card">
          <h3 className="text-lg font-semibold mb-4">导入/导出格式</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start gap-3">
              <FileJson className="w-5 h-5 text-[#4da6ff] mt-0.5" />
              <div>
                <p className="text-gray-300 font-medium">JSON 格式</p>
                <p className="text-gray-500">标准配置格式，包含完整的供应商信息</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-[#e94560] mt-0.5" />
              <div>
                <p className="text-gray-300 font-medium">SQL 格式</p>
                <p className="text-gray-500">
                  兼容 <a href="https://github.com/farion1231/cc-switch" target="_blank" rel="noopener noreferrer" className="text-[#e94560] hover:underline">cc-switch</a> 项目的数据库格式
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCode className="w-5 h-5 text-[#10b981] mt-0.5" />
              <div>
                <p className="text-gray-300 font-medium">官方格式</p>
                <p className="text-gray-500">
                  Claude: <code className="text-xs bg-[#2d2d44] px-1 rounded">~/.claude/settings.json</code><br />
                  Codex: <code className="text-xs bg-[#2d2d44] px-1 rounded">~/.codex/config.toml</code>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Terminal className="w-5 h-5 text-[#f59e0b] mt-0.5" />
              <div>
                <p className="text-gray-300 font-medium">Shell 环境变量</p>
                <p className="text-gray-500">
                  导出为 <code className="text-xs bg-[#2d2d44] px-1 rounded">export VAR=value</code> 格式
                </p>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              导入时会自动检测文件格式，支持 .json 和 .sql 文件
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
