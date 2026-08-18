// 生成 API 客户端：对齐 tommax-proto generation/v1 契约（lowerCamelCase）。
// Phase 1 直连 generation-svc + DevAuth 头；接网关/Casdoor 后仅改此文件。

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8080'
const DEV_USER = import.meta.env.VITE_DEV_USER ?? 'canvas-user'

export interface GenerationOutput {
  assetUrl: string
  mimeType: string
  width: number
  height: number
}

export interface Generation {
  id: string
  taskType: string
  modelKey: string
  prompt: string
  refAssetUrls: string[]
  params: Record<string, string>
  status: 'PENDING' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'
  progress: number
  outputs: GenerationOutput[]
  errorReason?: string
}

export interface ModelInfo {
  key: string
  label: string
  capability: string
  description: string
  tags: string[]
}

interface Envelope<T> {
  code: number
  message: string
  data: T
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-User': DEV_USER,
      ...init?.headers,
    },
  })
  const body = (await resp.json()) as Envelope<T>
  if (body.code !== 0) throw new Error(body.message || `请求失败(${body.code})`)
  return body.data
}

export const api = {
  listModels: () => request<{ items: ModelInfo[] }>('/v1/models'),

  submitGeneration: (input: {
    taskType: string
    modelKey: string
    prompt: string
    refAssetUrls?: string[]
    params?: Record<string, string>
    requestId?: string
  }) => request<Generation>('/v1/generations', { method: 'POST', body: JSON.stringify(input) }),

  getGeneration: (id: string) => request<Generation>(`/v1/generations/${id}`),

  cancelGeneration: (id: string) =>
    request<Generation>(`/v1/generations/${id}:cancel`, { method: 'POST' }),
}
