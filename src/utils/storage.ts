import { ClaudeProvider } from '@/types/provider'

const STORAGE_KEY = 'claude-code-providers'
const ACTIVE_PROVIDER_KEY = 'claude-code-active-provider'

export function getProviders(): ClaudeProvider[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveProviders(providers: ClaudeProvider[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

export function addProvider(provider: ClaudeProvider): void {
  const providers = getProviders()
  providers.push(provider)
  saveProviders(providers)
}

export function updateProvider(provider: ClaudeProvider): void {
  const providers = getProviders()
  const index = providers.findIndex(p => p.id === provider.id)
  if (index !== -1) {
    providers[index] = { ...provider, updatedAt: Date.now() }
    saveProviders(providers)
  }
}

export function deleteProvider(id: string): void {
  const providers = getProviders()
  saveProviders(providers.filter(p => p.id !== id))
  
  // Clear active if deleted
  if (getActiveProviderId() === id) {
    setActiveProviderId(null)
  }
}

export function getActiveProviderId(): string | null {
  return localStorage.getItem(ACTIVE_PROVIDER_KEY)
}

export function setActiveProviderId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PROVIDER_KEY, id)
  } else {
    localStorage.removeItem(ACTIVE_PROVIDER_KEY)
  }
}

export function exportProviders(): string {
  const providers = getProviders()
  return JSON.stringify(providers, null, 2)
}

export function importProviders(json: string): boolean {
  try {
    const providers = JSON.parse(json)
    if (Array.isArray(providers)) {
      saveProviders(providers)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function generateConfigJson(provider: ClaudeProvider): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  
  if (provider.requestUrl) {
    config.apiBaseUrl = provider.requestUrl
  }
  if (provider.apiKey) {
    config.apiKey = provider.apiKey
  }
  if (provider.mainModel) {
    config.model = provider.mainModel
  }
  if (provider.haikuModel) {
    config.haikuModel = provider.haikuModel
  }
  if (provider.sonnetModel) {
    config.sonnetModel = provider.sonnetModel
  }
  if (provider.opusModel) {
    config.opusModel = provider.opusModel
  }
  
  return config
}
