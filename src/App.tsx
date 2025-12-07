import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProviderList from '@/components/ProviderList'
import ProviderForm from '@/components/ProviderForm'
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
  // 远程环境列表
  const [remoteEnvironments, setRemoteEnvironments] = useState<RemoteEnvironment[]>(getRemoteEnvironments())
  // 添加远程环境对话框
  const [showAddRemoteDialog, setShowAddRemoteDialog] = useState(false)
  const [newRemoteName, setNewRemoteName] = useState('')
  const [newRemoteHost, setNewRemoteHost] = useState('')
  const [newRemotePort, setNewRemotePort] = useState('22')
  const [newRemoteUsername, setNewRemoteUsername] = useState('')
  const [newRemoteSshKeyPath, setNewRemoteSshKeyPath] = useState('~/.ssh/id_rsa')

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

  // 一键应用配置
  const handleApplyConfig = (providerId: string) => {
    const result = applyProviderToCurrentEnv(activeTab, providerId, currentEnvMode, remoteEnvironments)
    
    if (result.success && result.script) {
      // 创建下载
      const blob = new Blob([result.script], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // 生成更有意义的文件名
      let filename = `apply-${activeTab}`
      let extension = 'sh'  // 默认 bash 脚本
      
      if (currentEnvMode === 'local') {
        filename += '-local'
      } else if (currentEnvMode === 'wsl') {
        filename += '-wsl'
        // 检查当前供应商的 WSL 配置
        const provider = providers.find(p => p.id === providerId)
        if (provider?.wslPaths?.applyMode === 'windows') {
          extension = 'ps1'  // PowerShell 脚本
        }
      } else if (isRemoteEnvMode(currentEnvMode)) {
        const remoteId = parseRemoteEnvMode(currentEnvMode)
        const remote = remoteEnvironments.find(r => r.id === remoteId)
        filename += `-${remote?.name || 'remote'}`
      }
      a.download = `${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      const runInstructions = extension === 'ps1' 
        ? '请在 PowerShell 中运行该脚本（右键 -> 使用 PowerShell 运行）'
        : '请在终端中运行该脚本'
      alert(`${result.message}\n\n脚本已下载，${runInstructions}`)
    } else {
      alert(result.message)
    }
  }

  // 添加远程环境
  const handleAddRemoteEnv = () => {
    setShowAddRemoteDialog(true)
  }

  // 确认添加远程环境
  const handleConfirmAddRemote = () => {
    if (!newRemoteName.trim() || !newRemoteHost.trim() || !newRemoteUsername.trim()) {
      alert('请填写完整的远程环境信息')
      return
    }
    
    addRemoteEnvironment({
      name: newRemoteName.trim(),
      host: newRemoteHost.trim(),
      port: parseInt(newRemotePort) || 22,
      username: newRemoteUsername.trim(),
      sshKeyPath: newRemoteSshKeyPath.trim() || '~/.ssh/id_rsa',
    })
    
    setRemoteEnvironments(getRemoteEnvironments())
    setShowAddRemoteDialog(false)
    // 重置表单
    setNewRemoteName('')
    setNewRemoteHost('')
    setNewRemotePort('22')
    setNewRemoteUsername('')
    setNewRemoteSshKeyPath('~/.ssh/id_rsa')
  }

  // 删除远程环境
  const handleDeleteRemoteEnv = (id: string) => {
    deleteRemoteEnvironment(id)
    setRemoteEnvironments(getRemoteEnvironments())
    
    // 如果当前选中的是被删除的远程环境，切换到本地
    if (currentEnvMode === getRemoteEnvMode(id)) {
      handleEnvModeChange('local')
    }
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
          // 远程环境管理
          remoteEnvironments={remoteEnvironments}
          onAddRemoteEnv={handleAddRemoteEnv}
          onDeleteRemoteEnv={handleDeleteRemoteEnv}
        />
      ) : (
        <ProviderForm
          provider={editingProvider}
          providerType={activeTab}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      )}

      {/* 添加远程环境对话框 */}
      {showAddRemoteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#252542] rounded-xl p-6 w-full max-w-md border border-[#3d3d5c]">
            <h3 className="text-lg font-semibold text-white mb-4">添加远程环境</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">环境名称 *</label>
                <input
                  type="text"
                  value={newRemoteName}
                  onChange={(e) => setNewRemoteName(e.target.value)}
                  placeholder="例如: 生产服务器"
                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#3d3d5c] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">主机地址 *</label>
                <input
                  type="text"
                  value={newRemoteHost}
                  onChange={(e) => setNewRemoteHost(e.target.value)}
                  placeholder="例如: 192.168.1.100 或 my-server.com"
                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#3d3d5c] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">端口</label>
                  <input
                    type="number"
                    value={newRemotePort}
                    onChange={(e) => setNewRemotePort(e.target.value)}
                    placeholder="22"
                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#3d3d5c] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">用户名 *</label>
                  <input
                    type="text"
                    value={newRemoteUsername}
                    onChange={(e) => setNewRemoteUsername(e.target.value)}
                    placeholder="root"
                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#3d3d5c] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">SSH 密钥路径</label>
                <input
                  type="text"
                  value={newRemoteSshKeyPath}
                  onChange={(e) => setNewRemoteSshKeyPath(e.target.value)}
                  placeholder="~/.ssh/id_rsa"
                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#3d3d5c] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRemoteDialog(false)
                  setNewRemoteName('')
                  setNewRemoteHost('')
                  setNewRemotePort('22')
                  setNewRemoteUsername('')
                  setNewRemoteSshKeyPath('~/.ssh/id_rsa')
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddRemote}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                添加
              </button>
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
