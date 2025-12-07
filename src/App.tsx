import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProviderList from '@/components/ProviderList'
import ProviderForm from '@/components/ProviderForm'
import { ClaudeProvider, CodexProvider, GeminiProvider, ProviderType } from '@/types/provider'
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
  importProviders,
} from '@/utils/storage'

type View = 'list' | 'form'
type ExportFormat = 'json' | 'sql'

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

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    setActiveId(getActiveProviderIdByType(activeTab))
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

  const handleExport = (format: ExportFormat) => {
    setShowExportMenu(false)
    const isSQL = format === 'sql'
    const data = isSQL ? exportProvidersSQL() : exportProvidersJSON()
    const mimeType = isSQL ? 'application/sql' : 'application/json'
    const extension = isSQL ? 'sql' : 'json'
    
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claude-code-providers.${extension}`
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
