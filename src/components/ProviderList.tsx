import { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, Copy, Download, Upload, Settings, ExternalLink, FileJson, Database, FileCode, Terminal, Play, Rocket, Monitor, Box, Server, Zap } from 'lucide-react'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType, EnvironmentMode, EnvironmentActiveProviders } from '@/types/provider'

type Provider = ClaudeProvider | CodexProvider | GeminiProvider
type ExportFormat = 'json' | 'sql' | 'sql-all' | 'claude-settings' | 'codex-toml' | 'shell-env' | 'connection-cmd' | 'deploy-script' | 'wsl-apply'

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
  // 新增: 环境模式相关
  currentEnvMode?: EnvironmentMode
  envActiveProviders?: EnvironmentActiveProviders
  onEnvModeChange?: (mode: EnvironmentMode) => void
  onEnvActivate?: (providerId: string, envMode: EnvironmentMode) => void
  onApplyConfig?: (providerId: string) => void
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
  currentEnvMode = 'local',
  envActiveProviders = { local: null, wsl: null, remote: null },
  onEnvModeChange,
  onEnvActivate,
  onApplyConfig,
}: ProviderListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [showEnvPanel, setShowEnvPanel] = useState(true)

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
                  <button
                    onClick={() => onExportFormat('connection-cmd')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left border-t border-[#3d3d5c]"
                  >
                    <Play className="w-4 h-4 text-[#06b6d4]" />
                    <div>
                      <div className="font-medium">连接命令</div>
                      <div className="text-xs text-gray-500">本地/WSL/SSH 启动命令</div>
                    </div>
                  </button>
                  <button
                    onClick={() => onExportFormat('wsl-apply')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                  >
                    <Box className="w-4 h-4 text-[#f59e0b]" />
                    <div>
                      <div className="font-medium">WSL 应用脚本</div>
                      <div className="text-xs text-gray-500">在 WSL 环境中应用配置</div>
                    </div>
                  </button>
                  <button
                    onClick={() => onExportFormat('deploy-script')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3d3d5c] transition-colors text-left"
                  >
                    <Rocket className="w-4 h-4 text-[#ec4899]" />
                    <div>
                      <div className="font-medium">远程部署脚本</div>
                      <div className="text-xs text-gray-500">一键同步配置到远程服务器</div>
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

      {/* 环境模式选择面板 */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="card mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowEnvPanel(!showEnvPanel)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">环境模式配置</h3>
                <p className="text-xs text-gray-500">为本地、WSL、Remote 分别设置激活的供应商</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 当前环境模式指示器 */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">当前:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentEnvMode === 'local' ? 'bg-green-500/20 text-green-400' :
                  currentEnvMode === 'wsl' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {currentEnvMode === 'local' ? '本地' : currentEnvMode === 'wsl' ? 'WSL' : 'Remote'}
                </span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${showEnvPanel ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {showEnvPanel && (
            <div className="mt-4 pt-4 border-t border-[#3d3d5c]">
              {/* 环境模式切换按钮 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onEnvModeChange?.('local')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    currentEnvMode === 'local'
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-[#3d3d5c] hover:border-green-500/50 text-gray-400 hover:text-green-400'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="font-medium">本地</span>
                </button>
                <button
                  onClick={() => onEnvModeChange?.('wsl')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    currentEnvMode === 'wsl'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-[#3d3d5c] hover:border-orange-500/50 text-gray-400 hover:text-orange-400'
                  }`}
                >
                  <Box className="w-5 h-5" />
                  <span className="font-medium">WSL</span>
                </button>
                <button
                  onClick={() => onEnvModeChange?.('remote')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    currentEnvMode === 'remote'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-[#3d3d5c] hover:border-blue-500/50 text-gray-400 hover:text-blue-400'
                  }`}
                >
                  <Server className="w-5 h-5" />
                  <span className="font-medium">Remote</span>
                </button>
              </div>
              
              {/* 各环境模式激活的供应商 */}
              <div className="grid grid-cols-3 gap-4">
                {/* 本地环境 */}
                <div 
                  className={`p-3 rounded-lg border ${
                    currentEnvMode === 'local' 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : 'border-[#3d3d5c] bg-[#1a1a2e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${
                      currentEnvMode === 'local' ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      本地环境
                    </span>
                    {currentEnvMode === 'local' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        当前
                      </span>
                    )}
                  </div>
                  {envActiveProviders.local && providers.find(p => p.id === envActiveProviders.local) ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 flex-shrink-0 text-green-400" />
                        <span className="text-sm text-white truncate">{providers.find(p => p.id === envActiveProviders.local)?.name}</span>
                      </div>
                      {onApplyConfig && currentEnvMode === 'local' && (
                        <button
                          onClick={() => onApplyConfig(envActiveProviders.local!)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          title="一键应用配置"
                        >
                          <Zap className="w-3 h-3" />
                          应用
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">未设置</div>
                  )}
                </div>

                {/* WSL 环境 */}
                <div 
                  className={`p-3 rounded-lg border ${
                    currentEnvMode === 'wsl' 
                      ? 'border-orange-500/50 bg-orange-500/5' 
                      : 'border-[#3d3d5c] bg-[#1a1a2e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${
                      currentEnvMode === 'wsl' ? 'text-orange-400' : 'text-gray-500'
                    }`}>
                      WSL环境
                    </span>
                    {currentEnvMode === 'wsl' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        当前
                      </span>
                    )}
                  </div>
                  {envActiveProviders.wsl && providers.find(p => p.id === envActiveProviders.wsl) ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 flex-shrink-0 text-orange-400" />
                        <span className="text-sm text-white truncate">{providers.find(p => p.id === envActiveProviders.wsl)?.name}</span>
                      </div>
                      {onApplyConfig && currentEnvMode === 'wsl' && (
                        <button
                          onClick={() => onApplyConfig(envActiveProviders.wsl!)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                          title="一键应用配置"
                        >
                          <Zap className="w-3 h-3" />
                          应用
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">未设置</div>
                  )}
                </div>

                {/* Remote 环境 */}
                <div 
                  className={`p-3 rounded-lg border ${
                    currentEnvMode === 'remote' 
                      ? 'border-blue-500/50 bg-blue-500/5' 
                      : 'border-[#3d3d5c] bg-[#1a1a2e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${
                      currentEnvMode === 'remote' ? 'text-blue-400' : 'text-gray-500'
                    }`}>
                      Remote环境
                    </span>
                    {currentEnvMode === 'remote' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        当前
                      </span>
                    )}
                  </div>
                  {envActiveProviders.remote && providers.find(p => p.id === envActiveProviders.remote) ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 flex-shrink-0 text-blue-400" />
                        <span className="text-sm text-white truncate">{providers.find(p => p.id === envActiveProviders.remote)?.name}</span>
                      </div>
                      {onApplyConfig && currentEnvMode === 'remote' && (
                        <button
                          onClick={() => onApplyConfig(envActiveProviders.remote!)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="一键应用配置"
                        >
                          <Zap className="w-3 h-3" />
                          应用
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">未设置</div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                💡 提示：点击下方供应商卡片的 "设为激活" 按钮，将其设为当前环境模式的激活供应商
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
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

                {/* 环境模式标签 */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-gray-500">环境模式:</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    provider.environmentMode === 'local' 
                      ? 'bg-green-500/20 text-green-400'
                      : provider.environmentMode === 'wsl'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {provider.environmentMode === 'local' ? '本地' : provider.environmentMode === 'wsl' ? 'WSL' : 'Remote'}
                  </span>
                  {/* 显示该供应商是哪些环境的激活配置 */}
                  {(envActiveProviders.local === provider.id || 
                    envActiveProviders.wsl === provider.id || 
                    envActiveProviders.remote === provider.id) && (
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-xs text-gray-500">已激活于:</span>
                      {envActiveProviders.local === provider.id && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30">本地</span>
                      )}
                      {envActiveProviders.wsl === provider.id && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">WSL</span>
                      )}
                      {envActiveProviders.remote === provider.id && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">Remote</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#3d3d5c]">
                  {/* 设为当前环境模式的激活配置 */}
                  {envActiveProviders[currentEnvMode] !== provider.id && onEnvActivate && (
                    <button
                      onClick={() => onEnvActivate(provider.id, currentEnvMode)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                        currentEnvMode === 'local' 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          : currentEnvMode === 'wsl'
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      设为{currentEnvMode === 'local' ? '本地' : currentEnvMode === 'wsl' ? 'WSL' : 'Remote'}激活
                    </button>
                  )}
                  {/* 一键应用配置 */}
                  {envActiveProviders[currentEnvMode] === provider.id && onApplyConfig && (
                    <button
                      onClick={() => onApplyConfig(provider.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      一键应用配置
                    </button>
                  )}
                  {/* 旧的激活按钮保留向后兼容 */}
                  {activeProviderId !== provider.id && !onEnvActivate && (
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
