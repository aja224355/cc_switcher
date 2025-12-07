import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProviderList from '@/components/ProviderList'
import ProviderForm from '@/components/ProviderForm'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType, EnvironmentMode, EnvironmentActiveProviders } from '@/types/provider'
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
  generateWslApplyScript,
  importProviders,
  getCurrentEnvironmentMode,
  setCurrentEnvironmentMode,
  getEnvActiveProviders,
  setEnvActiveProvider,
  applyProviderToCurrentEnv,
} from '@/utils/storage'

type View = 'list' | 'form'
type ExportFormat = 'json' | 'sql' | 'sql-all' | 'claude-settings' | 'codex-toml' | 'shell-env' | 'connection-cmd' | 'deploy-script' | 'wsl-apply'

// 标签页配置
const TABS: { type: ProviderType; label: string; color: string }[] = [
  { type: 'claude', label: 'Claude', color: '#e94560' },
  { type: 'codex', label: 'Codex', color: '#10b981' },
  { type: 'gemini', label: 'Gemini', color: '#4da6ff' },
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

  useEffect(() => {
    loadProviders()
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
    const result = applyProviderToCurrentEnv(activeTab, providerId)
    
    if (result.success && result.script) {
      // 创建下载
      const blob = new Blob([result.script], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `apply-${activeTab}-${currentEnvMode}.sh`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert(`${result.message}\n\n脚本已下载，请在终端中运行。`)
    } else {
      alert(result.message)
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
        if (activeProvider.environmentMode !== 'remote') {
          alert('部署脚本仅适用于 Remote 环境模式\n请先将环境模式切换为 "Remote" 并配置 SSH 服务器')
          return
        }
        data = generateRemoteDeployScript(activeProvider)
        mimeType = 'text/plain'
        extension = 'sh'
        filename = `deploy-${activeTab}-to-remote`
        break
      case 'wsl-apply':
        if (!activeProvider) {
          alert('请先选择一个供应商')
          return
        }
        data = generateWslApplyScript(activeProvider)
        mimeType = 'text/plain'
        extension = 'sh'
        filename = `apply-${activeTab}-to-wsl`
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
          alert(`导入成功！共导入 ${result.count} 个配置 (格式: ${result.format?.toUpperCase()})`)
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
        />
      ) : (
        <ProviderForm
          provider={editingProvider}
          providerType={activeTab}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
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
