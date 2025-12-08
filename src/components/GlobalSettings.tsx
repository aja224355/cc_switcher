import { useState, useEffect } from 'react'
import {
  Settings,
  Monitor,
  Terminal,
  Server,
  Save,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  FolderOpen,
  HardDrive,
  ExternalLink,
} from 'lucide-react'
import {
  GlobalSettings as GlobalSettingsType,
  WslPathConfig,
  RemoteEnvironment,
  WslApplyMode,
} from '@/types/provider'
import {
  getGlobalSettings,
  saveGlobalSettings,
  defaultGlobalSettings,
} from '@/utils/storage'
import {
  checkAgentStatus,
  openFolder,
  AgentInfo,
} from '@/utils/localAgent'
import { v4 as uuidv4 } from 'uuid'

interface GlobalSettingsProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange?: () => void
}

export default function GlobalSettings({ isOpen, onClose, onSettingsChange }: GlobalSettingsProps) {
  const [settings, setSettings] = useState<GlobalSettingsType>(defaultGlobalSettings)
  const [activeTab, setActiveTab] = useState<'local' | 'wsl' | 'remote'>('local')
  const [editingRemoteId, setEditingRemoteId] = useState<string | null>(null)
  const [newRemote, setNewRemote] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    sshKeyPath: '~/.ssh/id_rsa',
    workingDirectory: '',
  })
  const [showAddRemote, setShowAddRemote] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [agentConnected, setAgentConnected] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSettings(getGlobalSettings())
      setHasChanges(false)
      // 检查代理状态
      checkAgentStatus().then(status => {
        setAgentConnected(!!status)
      })
    }
  }, [isOpen])

  // 打开文件夹
  const handleOpenFolder = async (folderPath: string) => {
    if (!agentConnected) {
      alert('本地代理未连接，无法打开文件夹。\n\n请先运行 npm start 启动本地代理。')
      return
    }
    
    const result = await openFolder(folderPath)
    if (!result.success) {
      alert(`打开文件夹失败: ${result.error}`)
    }
  }

  const handleSave = () => {
    saveGlobalSettings(settings)
    setHasChanges(false)
    onSettingsChange?.()
    onClose()
  }

  const updateSettings = <K extends keyof GlobalSettingsType>(
    key: K,
    value: GlobalSettingsType[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateWslConfig = (key: keyof WslPathConfig, value: string | WslApplyMode) => {
    setSettings(prev => ({
      ...prev,
      wslConfig: { ...prev.wslConfig, [key]: value },
    }))
    setHasChanges(true)
  }

  const updateLocalPaths = (key: keyof GlobalSettingsType['localPaths'], value: string) => {
    setSettings(prev => ({
      ...prev,
      localPaths: { ...prev.localPaths, [key]: value },
    }))
    setHasChanges(true)
  }

  // 远程环境管理
  const addRemoteEnvironment = () => {
    if (!newRemote.name.trim() || !newRemote.host.trim()) return

    const newEnv: RemoteEnvironment = {
      id: uuidv4(),
      name: newRemote.name.trim(),
      host: newRemote.host.trim(),
      port: parseInt(newRemote.port) || 22,
      username: newRemote.username.trim(),
      sshKeyPath: newRemote.sshKeyPath.trim() || '~/.ssh/id_rsa',
      workingDirectory: newRemote.workingDirectory.trim() || undefined,
      createdAt: Date.now(),
    }

    setSettings(prev => ({
      ...prev,
      remoteEnvironments: [...prev.remoteEnvironments, newEnv],
    }))
    setHasChanges(true)
    setShowAddRemote(false)
    setNewRemote({
      name: '',
      host: '',
      port: '22',
      username: '',
      sshKeyPath: '~/.ssh/id_rsa',
      workingDirectory: '',
    })
  }

  const updateRemoteEnvironment = (id: string, updates: Partial<RemoteEnvironment>) => {
    setSettings(prev => ({
      ...prev,
      remoteEnvironments: prev.remoteEnvironments.map(env =>
        env.id === id ? { ...env, ...updates } : env
      ),
    }))
    setHasChanges(true)
  }

  const deleteRemoteEnvironment = (id: string) => {
    if (!confirm('确定要删除这个远程环境吗？')) return
    
    setSettings(prev => ({
      ...prev,
      remoteEnvironments: prev.remoteEnvironments.filter(env => env.id !== id),
    }))
    setHasChanges(true)
  }

  if (!isOpen) return null

  const tabConfig = [
    { id: 'local' as const, label: '本地配置', icon: Monitor, color: '#10b981' },
    { id: 'wsl' as const, label: 'WSL 配置', icon: Terminal, color: '#f59e0b' },
    { id: 'remote' as const, label: '远程环境', icon: Server, color: '#8b5cf6' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#252542] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#3d3d5c] flex flex-col">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-[#3d3d5c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">全局设置</h2>
              <p className="text-sm text-gray-400">配置路径和远程环境（全局生效）</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3d3d5c] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="border-b border-[#3d3d5c] px-6">
          <div className="flex gap-2">
            {tabConfig.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                }}
              >
                <tab.icon className="w-4 h-4" style={{ color: activeTab === tab.id ? tab.color : undefined }} />
                {tab.label}
                {activeTab === tab.id && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 本地配置 */}
          {activeTab === 'local' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <HardDrive className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-green-400 font-medium mb-1">本地环境配置</p>
                  <p className="text-gray-300">
                    配置 Claude、Codex、Gemini 在本地系统的配置文件路径。可手动输入路径，或点击"打开"按钮在文件资源管理器中查看。
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                  agentConnected 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${agentConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                  {agentConnected ? '代理已连接' : '代理未连接'}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                    <span className="text-red-400">🔴</span> Claude 配置路径
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.localPaths.claudeConfigPath}
                      onChange={e => updateLocalPaths('claudeConfigPath', e.target.value)}
                      placeholder="~/.claude"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => handleOpenFolder(settings.localPaths.claudeConfigPath)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                        agentConnected 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      }`}
                      title={agentConnected ? '在文件资源管理器中打开' : '需要本地代理才能打开文件夹'}
                    >
                      <ExternalLink className="w-4 h-4" />
                      打开
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Windows: %USERPROFILE%\.claude | Linux/macOS: ~/.claude
                  </p>
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                    <span className="text-green-400">🟢</span> Codex 配置路径
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.localPaths.codexConfigPath}
                      onChange={e => updateLocalPaths('codexConfigPath', e.target.value)}
                      placeholder="~/.codex"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => handleOpenFolder(settings.localPaths.codexConfigPath)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                        agentConnected 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      }`}
                      title={agentConnected ? '在文件资源管理器中打开' : '需要本地代理才能打开文件夹'}
                    >
                      <ExternalLink className="w-4 h-4" />
                      打开
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Windows: %USERPROFILE%\.codex | Linux/macOS: ~/.codex
                  </p>
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                    <span className="text-blue-400">🔵</span> Gemini 配置路径
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.localPaths.geminiConfigPath}
                      onChange={e => updateLocalPaths('geminiConfigPath', e.target.value)}
                      placeholder="~/.gemini"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => handleOpenFolder(settings.localPaths.geminiConfigPath)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                        agentConnected 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      }`}
                      title={agentConnected ? '在文件资源管理器中打开' : '需要本地代理才能打开文件夹'}
                    >
                      <ExternalLink className="w-4 h-4" />
                      打开
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Windows: %USERPROFILE%\.gemini | Linux/macOS: ~/.gemini
                  </p>
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    本地代理端口
                  </h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={settings.agentPort}
                      onChange={e => updateSettings('agentPort', parseInt(e.target.value) || 17532)}
                      placeholder="17532"
                      className="input w-32"
                    />
                    <div className={`flex items-center gap-2 text-xs ${agentConnected ? 'text-green-400' : 'text-gray-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${agentConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                      {agentConnected ? '代理已连接' : '代理未连接'}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    本地代理程序运行端口，默认 17532
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* WSL 配置 */}
          {activeTab === 'wsl' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <Terminal className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-400 font-medium mb-1">WSL 环境配置</p>
                  <p className="text-gray-300">
                    配置 Windows Subsystem for Linux 的路径和设置（全局生效，无需每个供应商单独配置）
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="card">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">应用方式</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="applyMode"
                        checked={settings.wslConfig.applyMode === 'windows'}
                        onChange={() => updateWslConfig('applyMode', 'windows')}
                        className="w-4 h-4 text-yellow-500"
                      />
                      <span className="text-sm text-gray-300">从 Windows 直接写入</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="applyMode"
                        checked={settings.wslConfig.applyMode === 'bash'}
                        onChange={() => updateWslConfig('applyMode', 'bash')}
                        className="w-4 h-4 text-yellow-500"
                      />
                      <span className="text-sm text-gray-300">在 WSL 内执行脚本</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    推荐使用 "从 Windows 直接写入"，更简单可靠
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">WSL 发行版名称</h3>
                    <input
                      type="text"
                      value={settings.wslConfig.distroName}
                      onChange={e => updateWslConfig('distroName', e.target.value)}
                      placeholder="Ubuntu"
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      如 Ubuntu、Debian、Ubuntu-22.04
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">WSL 用户名</h3>
                    <input
                      type="text"
                      value={settings.wslConfig.wslUsername || ''}
                      onChange={e => updateWslConfig('wslUsername', e.target.value)}
                      placeholder="your-username"
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      用于计算 home 目录路径
                    </p>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">WSL 配置文件路径</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                        <span className="text-red-400">🔴</span> Claude 配置目录
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.wslConfig.claudeConfigPath}
                          onChange={e => updateWslConfig('claudeConfigPath', e.target.value)}
                          placeholder="~/.claude"
                          className="input flex-1"
                        />
                        <button
                          onClick={() => handleOpenFolder(settings.wslConfig.claudeConfigPath)}
                          className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                            agentConnected 
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' 
                              : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                          }`}
                          title={agentConnected ? '打开文件夹' : '需要本地代理'}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                        <span className="text-green-400">🟢</span> Codex 配置目录
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.wslConfig.codexConfigPath}
                          onChange={e => updateWslConfig('codexConfigPath', e.target.value)}
                          placeholder="~/.codex"
                          className="input flex-1"
                        />
                        <button
                          onClick={() => handleOpenFolder(settings.wslConfig.codexConfigPath)}
                          className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                            agentConnected 
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' 
                              : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                          }`}
                          title={agentConnected ? '打开文件夹' : '需要本地代理'}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                        <span className="text-blue-400">🔵</span> Gemini 配置目录
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.wslConfig.geminiConfigPath}
                          onChange={e => updateWslConfig('geminiConfigPath', e.target.value)}
                          placeholder="~/.gemini"
                          className="input flex-1"
                        />
                        <button
                          onClick={() => handleOpenFolder(settings.wslConfig.geminiConfigPath)}
                          className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                            agentConnected 
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' 
                              : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                          }`}
                          title={agentConnected ? '打开文件夹' : '需要本地代理'}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">bashrc 路径</label>
                      <input
                        type="text"
                        value={settings.wslConfig.bashrcPath}
                        onChange={e => updateWslConfig('bashrcPath', e.target.value)}
                        placeholder="~/.bashrc"
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Windows UNC 路径前缀（可选）</h3>
                  <input
                    type="text"
                    value={settings.wslConfig.windowsBasePath || ''}
                    onChange={e => updateWslConfig('windowsBasePath', e.target.value)}
                    placeholder="留空自动计算，如 \\wsl$\Ubuntu"
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    通常留空即可，系统会自动使用 \\wsl$\{'{发行版名称}'} 或 \\wsl.localhost\{'{发行版名称}'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 远程环境 */}
          {activeTab === 'remote' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <Server className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-purple-400 font-medium mb-1">远程 SSH 环境</p>
                  <p className="text-gray-300">
                    配置远程服务器 SSH 连接信息（全局生效，所有供应商共享）
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRemote(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加远程环境
                </button>
              </div>

              {/* 远程环境列表 */}
              <div className="space-y-3">
                {settings.remoteEnvironments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无远程环境配置</p>
                    <p className="text-sm">点击上方按钮添加远程服务器</p>
                  </div>
                ) : (
                  settings.remoteEnvironments.map(env => (
                    <div
                      key={env.id}
                      className="card border-l-4 border-l-purple-500"
                    >
                      {editingRemoteId === env.id ? (
                        // 编辑模式
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">名称</label>
                              <input
                                type="text"
                                value={env.name}
                                onChange={e => updateRemoteEnvironment(env.id, { name: e.target.value })}
                                className="input w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">主机</label>
                              <input
                                type="text"
                                value={env.host}
                                onChange={e => updateRemoteEnvironment(env.id, { host: e.target.value })}
                                className="input w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">端口</label>
                              <input
                                type="number"
                                value={env.port}
                                onChange={e => updateRemoteEnvironment(env.id, { port: parseInt(e.target.value) || 22 })}
                                className="input w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">用户名</label>
                              <input
                                type="text"
                                value={env.username}
                                onChange={e => updateRemoteEnvironment(env.id, { username: e.target.value })}
                                className="input w-full"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-400 mb-1 block">SSH 密钥路径</label>
                              <input
                                type="text"
                                value={env.sshKeyPath}
                                onChange={e => updateRemoteEnvironment(env.id, { sshKeyPath: e.target.value })}
                                className="input w-full"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs text-gray-400 mb-1 block">工作目录（可选）</label>
                              <input
                                type="text"
                                value={env.workingDirectory || ''}
                                onChange={e => updateRemoteEnvironment(env.id, { workingDirectory: e.target.value || undefined })}
                                placeholder="/home/user/projects"
                                className="input w-full"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => setEditingRemoteId(null)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              完成编辑
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 显示模式
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-medium">{env.name}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {env.username}@{env.host}:{env.port}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              密钥: {env.sshKeyPath}
                              {env.workingDirectory && ` | 工作目录: ${env.workingDirectory}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingRemoteId(env.id)}
                              className="p-2 hover:bg-[#3d3d5c] rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRemoteEnvironment(env.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 添加远程环境对话框 */}
              {showAddRemote && (
                <div className="card border-2 border-dashed border-purple-500/50">
                  <h3 className="text-white font-medium mb-4">添加远程环境</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">名称 *</label>
                      <input
                        type="text"
                        value={newRemote.name}
                        onChange={e => setNewRemote(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="生产服务器"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">主机 *</label>
                      <input
                        type="text"
                        value={newRemote.host}
                        onChange={e => setNewRemote(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="192.168.1.100"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">端口</label>
                      <input
                        type="number"
                        value={newRemote.port}
                        onChange={e => setNewRemote(prev => ({ ...prev, port: e.target.value }))}
                        placeholder="22"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">用户名</label>
                      <input
                        type="text"
                        value={newRemote.username}
                        onChange={e => setNewRemote(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="root"
                        className="input w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">SSH 密钥路径</label>
                      <input
                        type="text"
                        value={newRemote.sshKeyPath}
                        onChange={e => setNewRemote(prev => ({ ...prev, sshKeyPath: e.target.value }))}
                        placeholder="~/.ssh/id_rsa"
                        className="input w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">工作目录（可选）</label>
                      <input
                        type="text"
                        value={newRemote.workingDirectory}
                        onChange={e => setNewRemote(prev => ({ ...prev, workingDirectory: e.target.value }))}
                        placeholder="/home/user/projects"
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowAddRemote(false)}
                      className="px-3 py-1.5 text-sm bg-[#3d3d5c] hover:bg-[#4d4d6c] text-gray-300 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={addRemoteEnvironment}
                      disabled={!newRemote.name.trim() || !newRemote.host.trim()}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-[#3d3d5c] flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {hasChanges && (
              <span className="flex items-center gap-2 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                有未保存的更改
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-[#3d3d5c] hover:bg-[#4d4d6c] text-gray-300 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
