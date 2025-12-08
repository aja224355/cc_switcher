import { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, Copy, Download, Upload, Settings, ExternalLink, FileJson, Database, FileCode, Terminal, Play, Rocket, Monitor, Box, Server, Zap, PlusCircle, X } from 'lucide-react'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType, EnvironmentMode, EnvironmentActiveProviders, RemoteEnvironment } from '@/types/provider'

type Provider = ClaudeProvider | CodexProvider | GeminiProvider
type ExportFormat = 'json' | 'sql' | 'sql-all' | 'claude-settings' | 'codex-toml' | 'shell-env' | 'connection-cmd' | 'deploy-script' | 'wsl-apply'

interface TabConfig {
  type: ProviderType
  label: string
  color: string
  bgColor?: string
  icon?: string
}

interface AgentStatus {
  status: string
  version: string
  environment: string
  home: string
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
  // 远程环境（从全局设置读取）
  remoteEnvironments?: RemoteEnvironment[]
  // 打开全局设置
  onOpenGlobalSettings?: () => void
  // 本地代理状态
  agentStatus?: AgentStatus | null
  isApplying?: boolean
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
  envActiveProviders = { local: null, wsl: null },
  onEnvModeChange,
  onEnvActivate,
  onApplyConfig,
  remoteEnvironments = [],
  onOpenGlobalSettings,
  agentStatus,
  isApplying = false,
}: ProviderListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [showEnvPanel, setShowEnvPanel] = useState(true)

  // 辅助函数：判断是否为远程环境
  const isRemoteMode = (mode: EnvironmentMode) => mode.startsWith('remote:')
  const getRemoteId = (mode: EnvironmentMode) => mode.startsWith('remote:') ? mode.substring(7) : null
  const getRemoteEnvMode = (remoteId: string): EnvironmentMode => `remote:${remoteId}` as EnvironmentMode

  // 获取当前环境模式的显示名称
  const getEnvModeLabel = (mode: EnvironmentMode): string => {
    if (mode === 'local') return '本地'
    if (mode === 'wsl') return 'WSL'
    const remoteId = getRemoteId(mode)
    if (remoteId) {
      const remote = remoteEnvironments.find(r => r.id === remoteId)
      return remote ? remote.name : 'Remote'
    }
    return mode
  }

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

  const getTabBgColor = () => {
    const tab = tabs.find(t => t.type === providerType)
    return tab?.bgColor || 'rgba(233, 69, 96, 0.1)'
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="border-b border-[#3d3d5c] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: getTabBgColor() }}
            >
              {tabs.find(t => t.type === providerType)?.icon}
            </div>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                配置管理
                <span 
                  className="text-sm px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: getTabBgColor(),
                    color: getTabColor()
                  }}
                >
                  {tabs.find(t => t.type === providerType)?.label}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 本地代理状态指示器 */}
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                agentStatus 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
              }`}
              title={agentStatus 
                ? `本地代理运行中 (${agentStatus.environment})\n路径: ${agentStatus.home}` 
                : '本地代理未运行 - 无法直接写入配置文件'
              }
            >
              <span className={`w-2 h-2 rounded-full ${agentStatus ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              {agentStatus ? (
                <>
                  <Zap className="w-3 h-3" />
                  代理已连接
                </>
              ) : (
                <>
                  <Server className="w-3 h-3" />
                  代理未连接
                </>
              )}
            </div>
            {/* 全局设置按钮 */}
            {onOpenGlobalSettings && (
              <button
                onClick={onOpenGlobalSettings}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                title="全局设置 - 配置 WSL 路径和远程环境"
              >
                <Settings className="w-4 h-4" />
                设置
              </button>
            )}
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
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => onTabChange(tab.type)}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative rounded-t-lg flex items-center gap-2 ${
                providerType === tab.type
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              style={{
                backgroundColor: providerType === tab.type ? (tab.bgColor || 'transparent') : 'transparent',
              }}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
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
                <p className="text-xs text-gray-500">为本地、WSL、多个 Remote 分别设置激活的供应商</p>
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
                  {getEnvModeLabel(currentEnvMode)}
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
              {/* 环境模式切换按钮 - 本地和WSL */}
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
              </div>

              {/* 远程环境列表 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">远程环境</span>
                  {onOpenGlobalSettings && (
                    <button
                      onClick={onOpenGlobalSettings}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      管理
                    </button>
                  )}
                </div>
                {remoteEnvironments.length === 0 ? (
                  <div 
                    className="text-xs text-gray-500 p-3 border border-dashed border-[#3d3d5c] rounded-lg text-center cursor-pointer hover:border-purple-500/50 hover:text-purple-400 transition-colors"
                    onClick={onOpenGlobalSettings}
                  >
                    暂无远程环境，点击管理进行配置
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {remoteEnvironments.map((remote) => {
                      const remoteMode = getRemoteEnvMode(remote.id)
                      const isActive = currentEnvMode === remoteMode
                      return (
                        <button
                          key={remote.id}
                          onClick={() => onEnvModeChange?.(remoteMode)}
                          className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                            isActive
                              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                              : 'border-[#3d3d5c] hover:border-blue-500/50 text-gray-400 hover:text-blue-400'
                          }`}
                        >
                          <Server className="w-4 h-4" />
                          <span className="font-medium text-sm">{remote.name}</span>
                          <span className="text-xs opacity-60">({remote.host})</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {/* 各环境模式激活的供应商 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
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
              </div>

              {/* 远程环境激活的供应商 */}
              {remoteEnvironments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {remoteEnvironments.map((remote) => {
                    const remoteMode = getRemoteEnvMode(remote.id)
                    const isCurrentMode = currentEnvMode === remoteMode
                    const activeProviderId = envActiveProviders[remoteMode as keyof EnvironmentActiveProviders]
                    const activeProvider = activeProviderId ? providers.find(p => p.id === activeProviderId) : null
                    
                    return (
                      <div 
                        key={remote.id}
                        className={`p-3 rounded-lg border ${
                          isCurrentMode
                            ? 'border-blue-500/50 bg-blue-500/5' 
                            : 'border-[#3d3d5c] bg-[#1a1a2e]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Server className="w-3 h-3 text-blue-400" />
                            <span className={`text-xs font-medium ${
                              isCurrentMode ? 'text-blue-400' : 'text-gray-500'
                            }`}>
                              {remote.name}
                            </span>
                          </div>
                          {isCurrentMode && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                              当前
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-2 truncate" title={`${remote.username}@${remote.host}:${remote.port}`}>
                          {remote.username}@{remote.host}
                        </div>
                        {activeProvider ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Check className="w-4 h-4 flex-shrink-0 text-blue-400" />
                              <span className="text-sm text-white truncate">{activeProvider.name}</span>
                            </div>
                            {onApplyConfig && isCurrentMode && (
                              <button
                                onClick={() => onApplyConfig(activeProvider.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                title="一键应用配置"
                              >
                                <Zap className="w-3 h-3" />
                                应用
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">未设置供应商</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
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
            {providers.map((provider) => {
              const tabConfig = tabs.find(t => t.type === providerType)
              const providerBgColor = tabConfig?.bgColor || 'transparent'
              
              return (
              <div
                key={provider.id}
                className={`card relative transition-all duration-200 hover:shadow-lg ${
                  activeProviderId === provider.id
                    ? 'bg-[#1a1a2e]'
                    : ''
                }`}
                style={{
                  borderColor: activeProviderId === provider.id ? getTabColor() : undefined,
                  borderLeftWidth: '4px',
                  borderLeftColor: getTabColor(),
                  background: activeProviderId === provider.id ? providerBgColor : undefined,
                }}
              >
                {activeProviderId === provider.id && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full" 
                    style={{ 
                      color: getTabColor(),
                      backgroundColor: providerBgColor,
                    }}>
                    <Check className="w-4 h-4" />
                    当前使用
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Provider 类型徽章 */}
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: providerBgColor,
                          color: getTabColor(),
                          border: `1px solid ${getTabColor()}30`
                        }}
                      >
                        {tabConfig?.icon} {tabConfig?.label}
                      </span>
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
                <div className="flex items-center flex-wrap gap-2 mt-3">
                  <span className="text-xs text-gray-500">环境模式:</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    provider.environmentMode === 'local' 
                      ? 'bg-green-500/20 text-green-400'
                      : provider.environmentMode === 'wsl'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {getEnvModeLabel(provider.environmentMode)}
                  </span>
                  {/* 显示该供应商是哪些环境的激活配置 */}
                  {(() => {
                    const activatedEnvs: { mode: EnvironmentMode; label: string; color: string }[] = []
                    if (envActiveProviders.local === provider.id) {
                      activatedEnvs.push({ mode: 'local', label: '本地', color: 'green' })
                    }
                    if (envActiveProviders.wsl === provider.id) {
                      activatedEnvs.push({ mode: 'wsl', label: 'WSL', color: 'orange' })
                    }
                    // 检查远程环境
                    remoteEnvironments.forEach(remote => {
                      const remoteMode = getRemoteEnvMode(remote.id)
                      if (envActiveProviders[remoteMode as keyof EnvironmentActiveProviders] === provider.id) {
                        activatedEnvs.push({ mode: remoteMode, label: remote.name, color: 'blue' })
                      }
                    })
                    
                    if (activatedEnvs.length === 0) return null
                    
                    return (
                      <div className="flex items-center flex-wrap gap-1 ml-2">
                        <span className="text-xs text-gray-500">已激活于:</span>
                        {activatedEnvs.map(env => (
                          <span 
                            key={env.mode}
                            className={`text-xs px-1.5 py-0.5 rounded border ${
                              env.color === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                              env.color === 'orange' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {env.label}
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#3d3d5c]">
                  {/* 设为当前环境模式的激活配置 */}
                  {envActiveProviders[currentEnvMode as keyof EnvironmentActiveProviders] !== provider.id && onEnvActivate && (
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
                      设为{getEnvModeLabel(currentEnvMode)}激活
                    </button>
                  )}
                  {/* 一键应用配置 */}
                  {envActiveProviders[currentEnvMode as keyof EnvironmentActiveProviders] === provider.id && onApplyConfig && (
                    <button
                      onClick={() => onApplyConfig(provider.id)}
                      disabled={isApplying}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                        agentStatus 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                      } ${isApplying ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={agentStatus ? '配置将直接写入本地文件' : '配置将显示在对话框中供手动复制'}
                    >
                      {isApplying ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          应用中...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          {agentStatus ? '直接应用' : '应用配置'}
                        </>
                      )}
                    </button>
                  )}
                  {/* 旧的激活按钮保留向后兼容 */}
                  {activeProviderId !== provider.id && !onEnvActivate && (
                    <button
                      onClick={() => onActivate(provider.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors"
                      style={{ 
                        backgroundColor: `${getTabColor()}20`,
                        color: getTabColor()
                      }}
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
            )})}
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-8 card" style={{ borderLeftWidth: '4px', borderLeftColor: getTabColor() }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span style={{ color: getTabColor() }}>{tabs.find(t => t.type === providerType)?.icon}</span>
            {tabs.find(t => t.type === providerType)?.label} 使用说明
          </h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>1. 点击"添加供应商"创建新的 {tabs.find(t => t.type === providerType)?.label} 配置</p>
            <p>2. 填写 API Key 和请求地址等信息</p>
            <p>3. 点击 <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${getTabColor()}20`, color: getTabColor() }}>⚡ 一键应用配置</span> 按钮</p>
            <p>4. 在弹出的对话框中复制配置内容</p>
            <p>5. 将配置粘贴到对应的配置文件中</p>
            
            {/* Windows 11 提示 */}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 font-medium mb-2">💡 Windows 11 用户快速指南</p>
              <div className="space-y-2 text-xs text-gray-400">
                <p>1. 按 <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] rounded">Win + R</kbd> 打开运行对话框</p>
                {providerType === 'claude' && (
                  <p>2. 输入 <code className="bg-[#1a1a2e] px-1 rounded text-[#e94560]">%USERPROFILE%\.claude</code> 并回车</p>
                )}
                {providerType === 'codex' && (
                  <p>2. 输入 <code className="bg-[#1a1a2e] px-1 rounded text-[#10b981]">%USERPROFILE%\.codex</code> 并回车</p>
                )}
                {providerType === 'gemini' && (
                  <p>2. 输入 <code className="bg-[#1a1a2e] px-1 rounded text-[#4da6ff]">%USERPROFILE%\.gemini</code> 并回车</p>
                )}
                <p>3. 如果目录不存在，请手动创建</p>
                {providerType === 'claude' && (
                  <p>4. 用记事本打开或创建 <code className="bg-[#1a1a2e] px-1 rounded">settings.json</code>，粘贴配置</p>
                )}
                {providerType === 'codex' && (
                  <p>4. 用记事本打开或创建 <code className="bg-[#1a1a2e] px-1 rounded">config.toml</code>，粘贴配置</p>
                )}
                {providerType === 'gemini' && (
                  <p>4. 用记事本打开或创建 <code className="bg-[#1a1a2e] px-1 rounded">settings.json</code>，粘贴配置</p>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#0f0f1a] rounded-lg">
              <p className="text-gray-300 mb-2">配置文件位置：</p>
              {providerType === 'claude' && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🪟</span>
                    <code className="text-[#e94560]">%USERPROFILE%\.claude\settings.json</code>
                  </div>
                  <p className="text-gray-500 text-xs">
                    即: C:\Users\你的用户名\.claude\settings.json
                  </p>
                  <div className="flex items-center gap-2 mt-3 mb-2">
                    <span className="text-lg">🐧</span>
                    <code className="text-[#e94560]">~/.claude/settings.json</code>
                  </div>
                  <p className="text-gray-500 text-xs">
                    WSL/Linux 路径
                  </p>
                </>
              )}
              {providerType === 'codex' && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🪟</span>
                    <code className="text-[#10b981]">%USERPROFILE%\.codex\config.toml</code>
                  </div>
                  <p className="text-gray-500 text-xs">
                    即: C:\Users\你的用户名\.codex\config.toml
                  </p>
                  <div className="flex items-center gap-2 mt-3 mb-2">
                    <span className="text-lg">🐧</span>
                    <code className="text-[#10b981]">~/.codex/config.toml</code>
                  </div>
                  <p className="text-gray-500 text-xs">
                    WSL/Linux 路径
                  </p>
                </>
              )}
              {providerType === 'gemini' && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🪟</span>
                    <code className="text-[#4da6ff]">%USERPROFILE%\.gemini\settings.json</code>
                  </div>
                  <p className="text-gray-500 text-xs">
                    环境变量: GEMINI_API_KEY, GOOGLE_GEMINI_BASE_URL
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Import/Export Info */}
        <div className="mt-4 card">
          <h3 className="text-lg font-semibold mb-4">导入/导出格式</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start gap-3">
              <FileJson className="w-5 h-5 mt-0.5" style={{ color: getTabColor() }} />
              <div>
                <p className="text-gray-300 font-medium">JSON 格式</p>
                <p className="text-gray-500">标准配置格式，包含完整的供应商信息</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 mt-0.5" style={{ color: getTabColor() }} />
              <div>
                <p className="text-gray-300 font-medium">SQL 格式</p>
                <p className="text-gray-500">
                  兼容 <a href="https://github.com/farion1231/cc-switch" target="_blank" rel="noopener noreferrer" style={{ color: getTabColor() }} className="hover:underline">cc-switch</a> 项目的数据库格式
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCode className="w-5 h-5 mt-0.5" style={{ color: getTabColor() }} />
              <div>
                <p className="text-gray-300 font-medium">官方格式</p>
                <p className="text-gray-500">
                  <span className="text-[#e94560]">🔴 Claude:</span> <code className="text-xs bg-[#2d2d44] px-1 rounded">~/.claude/settings.json</code><br />
                  <span className="text-[#10b981]">🟢 Codex:</span> <code className="text-xs bg-[#2d2d44] px-1 rounded">~/.codex/config.toml</code><br />
                  <span className="text-[#4da6ff]">🔵 Gemini:</span> <code className="text-xs bg-[#2d2d44] px-1 rounded">~/.gemini/settings.json</code>
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
