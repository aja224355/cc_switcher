import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProviderList from '@/components/ProviderList'
import ProviderForm from '@/components/ProviderForm'
import GlobalSettings from '@/components/GlobalSettings'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType, EnvironmentMode, EnvironmentActiveProviders, RemoteEnvironment } from '@/types/provider'
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  getActiveProviderId,
  setActiveProviderId,
  getCodexProviders,
  addCodexProvider,
  updateCodexProvider,
  deleteCodexProvider,
  getActiveProviderIdByType,
  setActiveProviderIdByType,
  getGeminiProviders,
  addGeminiProvider,
  updateGeminiProvider,
  deleteGeminiProvider,
  exportProvidersJSON,
  exportProvidersSQL,
  exportAllProvidersSQL,
  exportClaudeSettingsJson,
  exportCodexConfigToml,
  exportShellEnvVars,
  generateGeminiConfigJson,
  generateConnectionCommand,
  generateRemoteDeployScript,
  generateRemoteDeployScriptForEnv,
  generateWslApplyScript,
  generateWslScript,
  importProviders,
  getCurrentEnvironmentMode,
  setCurrentEnvironmentMode,
  getEnvActiveProviders,
  setEnvActiveProvider,
  applyProviderToCurrentEnv,
  getRemoteEnvironments,
  addRemoteEnvironment,
  deleteRemoteEnvironment,
  getRemoteEnvMode,
  isRemoteEnvMode,
  parseRemoteEnvMode,
} from '@/utils/storage'
import {
  checkAgentStatus,
  writeConfig,
  getSystemInfo,
  AgentInfo,
  SystemInfo,
} from '@/utils/localAgent'

type View = 'list' | 'form'
type ExportFormat = 'json' | 'sql' | 'sql-all' | 'claude-settings' | 'codex-toml' | 'shell-env' | 'connection-cmd' | 'deploy-script' | 'wsl-apply'

// 标签页配置 - 每个 provider 有独特的品牌色
const TABS: { type: ProviderType; label: string; color: string; bgColor: string; icon: string }[] = [
  { type: 'claude', label: 'Claude', color: '#e94560', bgColor: 'rgba(233, 69, 96, 0.1)', icon: '🔴' },
  { type: 'codex', label: 'Codex', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', icon: '🟢' },
  { type: 'gemini', label: 'Gemini', color: '#4da6ff', bgColor: 'rgba(77, 166, 255, 0.1)', icon: '🔵' },
]

function ConfigManager() {
  const [activeTab, setActiveTab] = useState<ProviderType>('claude')
  const [view, setView] = useState<View>('list')
  const [claudeProviders, setClaudeProviders] = useState<ClaudeProvider[]>([])
  const [codexProviders, setCodexProviders] = useState<CodexProvider[]>([])
  const [geminiProviders, setGeminiProviders] = useState<GeminiProvider[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingProvider, setEditingProvider] = useState<ClaudeProvider | CodexProvider | GeminiProvider | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 环境模式相关状态
  const [currentEnvMode, setCurrentEnvMode] = useState<EnvironmentMode>(getCurrentEnvironmentMode())
  const [envActiveProviders, setEnvActiveProviders] = useState<EnvironmentActiveProviders>(
    getEnvActiveProviders(activeTab)
  )
  // 远程环境列表（从全局设置读取）
  const [remoteEnvironments, setRemoteEnvironments] = useState<RemoteEnvironment[]>(getRemoteEnvironments())
  // 全局设置对话框
  const [showGlobalSettings, setShowGlobalSettings] = useState(false)

  useEffect(() => {
    loadProviders()
    setRemoteEnvironments(getRemoteEnvironments())
  }, [])

  useEffect(() => {
    setActiveId(getActiveProviderIdByType(activeTab))
    setEnvActiveProviders(getEnvActiveProviders(activeTab))
  }, [activeTab])

  const loadProviders = () => {
    setClaudeProviders(getProviders())
    setCodexProviders(getCodexProviders())
    setGeminiProviders(getGeminiProviders())
  }

  const getCurrentProviders = () => {
    switch (activeTab) {
      case 'claude': return claudeProviders
      case 'codex': return codexProviders
      case 'gemini': return geminiProviders
    }
  }

  const handleAdd = () => {
    setEditingProvider(null)
    setView('form')
  }

  const handleEdit = (provider: ClaudeProvider | CodexProvider | GeminiProvider) => {
    setEditingProvider(provider)
    setView('form')
  }

  const handleSave = (provider: ClaudeProvider | CodexProvider | GeminiProvider) => {
    if (editingProvider) {
      switch (activeTab) {
        case 'claude':
          updateProvider(provider as ClaudeProvider)
          break
        case 'codex':
          updateCodexProvider(provider as CodexProvider)
          break
        case 'gemini':
          updateGeminiProvider(provider as GeminiProvider)
          break
      }
    } else {
      switch (activeTab) {
        case 'claude':
          addProvider(provider as ClaudeProvider)
          break
        case 'codex':
          addCodexProvider(provider as CodexProvider)
          break
        case 'gemini':
          addGeminiProvider(provider as GeminiProvider)
          break
      }
    }
    loadProviders()
    setView('list')
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此配置吗？')) {
      switch (activeTab) {
        case 'claude':
          deleteProvider(id)
          break
        case 'codex':
          deleteCodexProvider(id)
          break
        case 'gemini':
          deleteGeminiProvider(id)
          break
      }
      loadProviders()
      setActiveId(getActiveProviderIdByType(activeTab))
    }
  }

  const handleActivate = (id: string) => {
    setActiveProviderIdByType(activeTab, id)
    setActiveId(id)
  }

  // 环境模式变更
  const handleEnvModeChange = (mode: EnvironmentMode) => {
    setCurrentEnvironmentMode(mode)
    setCurrentEnvMode(mode)
  }

  // 为特定环境模式设置激活的供应商
  const handleEnvActivate = (providerId: string, envMode: EnvironmentMode) => {
    setEnvActiveProvider(activeTab, envMode, providerId)
    setEnvActiveProviders(getEnvActiveProviders(activeTab))
    
    // 如果是当前环境模式，也更新旧的激活状态
    if (envMode === currentEnvMode) {
      setActiveId(providerId)
    }
  }

  // 本地代理状态
  const [agentStatus, setAgentStatus] = useState<AgentInfo | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  // 检查本地代理状态
  useEffect(() => {
    const checkAgent = async () => {
      const status = await checkAgentStatus()
      setAgentStatus(status)
      if (status) {
        const info = await getSystemInfo()
        setSystemInfo(info)
      }
    }
    checkAgent()
    // 每 10 秒检查一次
    const interval = setInterval(checkAgent, 10000)
    return () => clearInterval(interval)
  }, [])

  // 配置应用对话框状态
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configDialogContent, setConfigDialogContent] = useState<{
    configJson: string
    configPath: string
    envVars: string
    providerName: string
    providerType: ProviderType
  } | null>(null)

  // 一键应用配置 - 显示配置内容对话框
  const handleApplyConfig = async (providerId: string) => {
    const provider = getCurrentProviders().find(p => p.id === providerId)
    if (!provider) {
      alert('未找到供应商配置')
      return
    }

    // 根据 provider 类型生成配置内容
    let configJson = ''
    let configPath = ''
    let envVars = ''
    
    if (activeTab === 'claude') {
      configJson = exportClaudeSettingsJson(provider as ClaudeProvider)
      configPath = '~/.claude/settings.json'
      envVars = exportShellEnvVars(provider)
    } else if (activeTab === 'codex') {
      configJson = exportCodexConfigToml(provider as CodexProvider)
      configPath = '~/.codex/config.toml'
      envVars = exportShellEnvVars(provider)
    } else {
      configJson = JSON.stringify(generateGeminiConfigJson(provider as GeminiProvider), null, 2)
      configPath = '~/.gemini/settings.json'
      envVars = exportShellEnvVars(provider)
    }
    
    // 设置为激活的供应商
    setActiveProviderIdByType(activeTab, providerId)
    setActiveId(providerId)
    
    // 如果本地代理在运行，直接写入文件
    if (agentStatus) {
      setIsApplying(true)
      try {
        const result = await writeConfig(activeTab, configJson, { backup: true })
        if (result.success) {
          alert(`✅ 配置已成功写入！\n\n📁 路径: ${result.path}${result.backup ? `\n📦 备份: ${result.backup}` : ''}`)
          setIsApplying(false)
          return
        } else {
          console.error('写入失败:', result.error)
          // 失败时显示对话框
        }
      } catch (error) {
        console.error('代理通信失败:', error)
      }
      setIsApplying(false)
    }
    
    // 代理未运行或写入失败，显示配置对话框
    setConfigDialogContent({
      configJson,
      configPath,
      envVars,
      providerName: provider.name,
      providerType: activeTab
    })
    setShowConfigDialog(true)
  }
  
  // 复制到剪贴板
  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(successMsg)
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert(successMsg)
    }
  }
  
  // 下载脚本
  const handleDownloadScript = () => {
    if (!configDialogContent) return
    
    const result = applyProviderToCurrentEnv(activeTab, activeId!, currentEnvMode, remoteEnvironments)
    
    if (result.success && result.script) {
      const blob = new Blob([result.script], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      let extension = 'sh'
      if (currentEnvMode === 'wsl') {
        const provider = providers.find(p => p.id === activeId)
        if (provider?.wslPaths?.applyMode === 'windows') {
          extension = 'ps1'
        }
      }
      a.download = `apply-${activeTab}-config.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert('脚本已下载！请在终端中运行该脚本应用配置。')
    }
  }

  // 打开全局设置
  const handleOpenGlobalSettings = () => {
    setShowGlobalSettings(true)
  }

  // 全局设置变更回调
  const handleGlobalSettingsChange = () => {
    // 重新加载远程环境列表
    setRemoteEnvironments(getRemoteEnvironments())
  }

  const handleExport = (format: ExportFormat) => {
    setShowExportMenu(false)
    
    let data: string
    let mimeType: string
    let extension: string
    let filename: string
    
    const currentProviders = getCurrentProviders()
    const currentActiveId = getActiveProviderIdByType(activeTab)
    const activeProvider = currentProviders.find(p => p.id === currentActiveId) || currentProviders[0]
    
    switch (format) {
      case 'sql':
        data = exportProvidersSQL()
        mimeType = 'application/sql'
        extension = 'sql'
        filename = 'claude-code-providers'
        break
      case 'sql-all':
        data = exportAllProvidersSQL()
        mimeType = 'application/sql'
        extension = 'sql'
        filename = 'all-providers'
        break
      case 'claude-settings':
        if (activeTab !== 'claude' || !activeProvider) {
          alert('请先选择一个 Claude 供应商')
          return
        }
        data = exportClaudeSettingsJson(activeProvider as ClaudeProvider)
        mimeType = 'application/json'
        extension = 'json'
        filename = 'settings'
        break
      case 'codex-toml':
        if (activeTab !== 'codex' || !activeProvider) {
          alert('请先选择一个 Codex 供应商')
          return
        }
        data = exportCodexConfigToml(activeProvider as CodexProvider)
        mimeType = 'text/plain'
        extension = 'toml'
        filename = 'config'
        break
      case 'shell-env':
        if (!activeProvider) {
          alert('请先选择一个供应商')
          return
        }
        data = exportShellEnvVars(activeProvider)
        mimeType = 'text/plain'
        extension = 'sh'
        filename = `${activeTab}-env`
        break
      case 'connection-cmd':
        if (!activeProvider) {
          alert('请先选择一个供应商')
          return
        }
        data = generateConnectionCommand(activeProvider)
        mimeType = 'text/plain'
        extension = 'sh'
        filename = `${activeTab}-connect-${activeProvider.environmentMode}`
        break
      case 'deploy-script':
        if (!activeProvider) {
          alert('请先选择一个供应商')
          return
        }
        // 检查当前是否在远程环境模式
        if (!isRemoteEnvMode(currentEnvMode)) {
          alert('部署脚本仅适用于远程环境模式\n请先在环境面板中选择一个远程环境')
          return
        }
        {
          // 获取当前远程环境配置
          const remoteId = parseRemoteEnvMode(currentEnvMode)
          const remote = remoteEnvironments.find(r => r.id === remoteId)
          if (remote) {
            data = generateRemoteDeployScriptForEnv(activeProvider, remote)
          } else {
            data = generateRemoteDeployScript(activeProvider)
          }
        }
        mimeType = 'text/plain'
        extension = 'sh'
        filename = `deploy-${activeTab}-to-remote`
        break
      case 'wsl-apply':
        if (!activeProvider) {
          alert('请先选择一个供应商')
          return
        }
        {
          const wslResult = generateWslScript(activeProvider)
          data = wslResult.script
          mimeType = 'text/plain'
          extension = wslResult.type === 'powershell' ? 'ps1' : 'sh'
          filename = wslResult.filename.replace(/\.(ps1|sh)$/, '')
        }
        break
      default:
        data = exportProvidersJSON()
        mimeType = 'application/json'
        extension = 'json'
        filename = 'claude-code-providers'
    }
    
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const result = importProviders(content)
        if (result.success) {
          loadProviders()
          setActiveId(getActiveProviderIdByType(activeTab))
          
          // 构建详细的导入结果消息
          let detailMsg = ''
          if (result.details) {
            const parts = []
            if (result.details.claude > 0) parts.push(`Claude: ${result.details.claude}`)
            if (result.details.codex > 0) parts.push(`Codex: ${result.details.codex}`)
            if (result.details.gemini > 0) parts.push(`Gemini: ${result.details.gemini}`)
            if (parts.length > 0) {
              detailMsg = `\n\n详细统计:\n${parts.join('\n')}`
            }
          }
          
          alert(`导入成功！共导入 ${result.count} 个配置 (格式: ${result.format?.toUpperCase()})${detailMsg}`)
        } else {
          alert(`导入失败: ${result.error || '请检查文件格式'}`)
        }
      }
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.sql"
        className="hidden"
      />
      {view === 'list' ? (
        <ProviderList
          providers={getCurrentProviders()}
          activeProviderId={activeId}
          providerType={activeTab}
          tabs={TABS}
          onTabChange={setActiveTab}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onActivate={handleActivate}
          onExport={() => setShowExportMenu(true)}
          onImport={handleImport}
          showExportMenu={showExportMenu}
          onExportFormat={handleExport}
          onCloseExportMenu={() => setShowExportMenu(false)}
          // 环境模式相关
          currentEnvMode={currentEnvMode}
          envActiveProviders={envActiveProviders}
          onEnvModeChange={handleEnvModeChange}
          onEnvActivate={handleEnvActivate}
          onApplyConfig={handleApplyConfig}
          // 远程环境（从全局设置读取）
          remoteEnvironments={remoteEnvironments}
          onOpenGlobalSettings={handleOpenGlobalSettings}
          // 本地代理状态
          agentStatus={agentStatus}
          isApplying={isApplying}
        />
      ) : (
        <ProviderForm
          provider={editingProvider}
          providerType={activeTab}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      )}

      {/* 全局设置对话框 */}
      <GlobalSettings
        isOpen={showGlobalSettings}
        onClose={() => setShowGlobalSettings(false)}
        onSettingsChange={handleGlobalSettingsChange}
      />

      {/* 配置应用对话框 */}
      {showConfigDialog && configDialogContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252542] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-[#3d3d5c] flex flex-col">
            {/* 标题栏 */}
            <div 
              className="px-6 py-4 border-b border-[#3d3d5c] flex items-center justify-between"
              style={{ 
                backgroundColor: configDialogContent.providerType === 'claude' 
                  ? 'rgba(233, 69, 96, 0.1)' 
                  : configDialogContent.providerType === 'codex'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(77, 166, 255, 0.1)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {configDialogContent.providerType === 'claude' ? '🔴' : configDialogContent.providerType === 'codex' ? '🟢' : '🔵'}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">应用配置: {configDialogContent.providerName}</h3>
                  <p className="text-sm text-gray-400">
                    配置文件路径: <code className="text-xs bg-[#1a1a2e] px-2 py-0.5 rounded">{configDialogContent.configPath}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigDialog(false)}
                className="p-2 hover:bg-[#3d3d5c] rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 本地代理提示 */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-sm">
                    <p className="text-green-400 font-medium mb-1">推荐：使用本地代理实现一键应用</p>
                    <p className="text-gray-300">
                      启动本地代理程序后，可以直接将配置写入本地文件，无需手动复制。
                    </p>
                    <div className="mt-2 bg-[#0f0f1a] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-2">启动命令：</p>
                      <code className="text-green-400 text-xs">
                        cd local-agent && npm install && npm start
                      </code>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      代理运行后，点击 "直接应用" 按钮即可自动写入配置文件
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Windows 用户提示 */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="text-sm">
                    <p className="text-yellow-400 font-medium mb-1">手动应用配置 (代理未运行时)</p>
                    <p className="text-gray-300">
                      如果代理未运行，请按以下步骤手动操作：
                    </p>
                    <ol className="list-decimal list-inside mt-2 text-gray-400 space-y-1">
                      <li>复制下方的配置内容</li>
                      <li>
                        {configDialogContent.providerType === 'claude' && (
                          <>打开 <code className="bg-[#1a1a2e] px-1 rounded">%USERPROFILE%\.claude\</code> (Win+R 输入)</>
                        )}
                        {configDialogContent.providerType === 'codex' && (
                          <>打开 <code className="bg-[#1a1a2e] px-1 rounded">%USERPROFILE%\.codex\</code> (Win+R 输入)</>
                        )}
                        {configDialogContent.providerType === 'gemini' && (
                          <>打开 <code className="bg-[#1a1a2e] px-1 rounded">%USERPROFILE%\.gemini\</code> (Win+R 输入)</>
                        )}
                      </li>
                      <li>
                        用记事本创建或编辑 <code className="bg-[#1a1a2e] px-1 rounded">
                          {configDialogContent.providerType === 'codex' ? 'config.toml' : 'settings.json'}
                        </code>
                      </li>
                      <li>粘贴配置内容并保存</li>
                    </ol>
                    <p className="text-gray-500 text-xs mt-2">
                      提示：按 Win+R，输入 <code className="bg-[#1a1a2e] px-1 rounded">%USERPROFILE%\.claude</code> 可快速打开目录
                    </p>
                  </div>
                </div>
              </div>

              {/* 配置文件内容 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">
                    📄 配置文件内容 
                    <span className="text-gray-500 text-xs ml-2">({configDialogContent.configPath})</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(configDialogContent.configJson, '✅ 配置内容已复制到剪贴板！')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: configDialogContent.providerType === 'claude' 
                        ? 'rgba(233, 69, 96, 0.2)' 
                        : configDialogContent.providerType === 'codex'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(77, 166, 255, 0.2)',
                      color: configDialogContent.providerType === 'claude' 
                        ? '#e94560' 
                        : configDialogContent.providerType === 'codex'
                          ? '#10b981'
                          : '#4da6ff'
                    }}
                  >
                    📋 复制配置
                  </button>
                </div>
                <pre className="bg-[#0f0f1a] border border-[#3d3d5c] rounded-lg p-4 text-sm text-gray-300 overflow-x-auto max-h-60">
                  <code>{configDialogContent.configJson}</code>
                </pre>
              </div>

              {/* 环境变量 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-300">
                    🔧 环境变量 
                    <span className="text-gray-500 text-xs ml-2">(可选)</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(configDialogContent.envVars, '✅ 环境变量已复制到剪贴板！')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#3d3d5c] hover:bg-[#4d4d6c] text-gray-300 rounded-lg transition-colors"
                  >
                    📋 复制
                  </button>
                </div>
                <pre className="bg-[#0f0f1a] border border-[#3d3d5c] rounded-lg p-4 text-sm text-gray-300 overflow-x-auto max-h-40">
                  <code>{configDialogContent.envVars}</code>
                </pre>
                <p className="text-xs text-gray-500 mt-2">
                  可以将这些环境变量添加到 ~/.bashrc 或 ~/.zshrc 中
                </p>
              </div>

              {/* WSL 用户脚本 */}
              {currentEnvMode === 'wsl' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-300">
                      🐧 WSL 一键配置脚本
                    </h4>
                    <button
                      onClick={handleDownloadScript}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
                    >
                      📥 下载脚本
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">
                    下载脚本后在 WSL 终端中运行，可自动创建配置文件并设置环境变量。
                  </p>
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="px-6 py-4 border-t border-[#3d3d5c] flex items-center justify-between bg-[#1a1a2e]">
              <div className="text-sm text-gray-400">
                <span className="text-green-400">✓</span> 已设为当前激活的供应商
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadScript}
                  className="px-4 py-2 text-sm bg-[#3d3d5c] hover:bg-[#4d4d6c] text-gray-300 rounded-lg transition-colors"
                >
                  📥 下载完整脚本
                </button>
                <button
                  onClick={() => setShowConfigDialog(false)}
                  className="px-4 py-2 text-sm rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: configDialogContent.providerType === 'claude' 
                      ? '#e94560' 
                      : configDialogContent.providerType === 'codex'
                        ? '#10b981'
                        : '#4da6ff',
                    color: 'white'
                  }}
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<ConfigManager />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
