import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProviderList from '@/components/ProviderList'
import ProviderForm from '@/components/ProviderForm'
import { ClaudeProvider } from '@/types/provider'
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  getActiveProviderId,
  setActiveProviderId,
  exportProviders,
  importProviders,
} from '@/utils/storage'

type View = 'list' | 'form'

function ConfigManager() {
  const [view, setView] = useState<View>('list')
  const [providers, setProviders] = useState<ClaudeProvider[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingProvider, setEditingProvider] = useState<ClaudeProvider | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProviders(getProviders())
    setActiveId(getActiveProviderId())
  }, [])

  const handleAdd = () => {
    setEditingProvider(null)
    setView('form')
  }

  const handleEdit = (provider: ClaudeProvider) => {
    setEditingProvider(provider)
    setView('form')
  }

  const handleSave = (provider: ClaudeProvider) => {
    if (editingProvider) {
      updateProvider(provider)
    } else {
      addProvider(provider)
    }
    setProviders(getProviders())
    setView('list')
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此配置吗？')) {
      deleteProvider(id)
      setProviders(getProviders())
      setActiveId(getActiveProviderId())
    }
  }

  const handleActivate = (id: string) => {
    setActiveProviderId(id)
    setActiveId(id)
  }

  const handleExport = () => {
    const data = exportProviders()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'claude-code-providers.json'
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
        if (importProviders(content)) {
          setProviders(getProviders())
          alert('导入成功！')
        } else {
          alert('导入失败，请检查文件格式')
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
        accept=".json"
        className="hidden"
      />
      {view === 'list' ? (
        <ProviderList
          providers={providers}
          activeProviderId={activeId}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onActivate={handleActivate}
          onExport={handleExport}
          onImport={handleImport}
        />
      ) : (
        <ProviderForm
          provider={editingProvider}
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
