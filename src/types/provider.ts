export interface ClaudeProvider {
  id: string
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  mainModel: string
  haikuModel: string
  sonnetModel: string
  opusModel: string
  configJson: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export interface ProviderFormData {
  name: string
  notes: string
  websiteUrl: string
  apiKey: string
  requestUrl: string
  mainModel: string
  haikuModel: string
  sonnetModel: string
  opusModel: string
}
