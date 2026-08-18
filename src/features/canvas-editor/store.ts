// 画布编辑器 store：节点/边状态 + 连线驱动生成（docs/06 §A.2）。
// Phase 1 画布仅存内存（canvas-svc 落地后接持久化）。
import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'
import { api, type Generation } from '../../shared/api/client'

export interface TextData {
  kind: 'text'
  content: string
  [key: string]: unknown
}

export interface GenData {
  kind: 'image' | 'video'
  prompt: string
  modelKey: string
  status: 'IDLE' | 'GENERATING' | 'SUCCEEDED' | 'FAILED'
  progress: number
  taskId?: string
  assetUrl?: string
  error?: string
  [key: string]: unknown
}

export type CanvasNode = Node<TextData | GenData>

let seq = 1
const nextId = () => `n${Date.now()}-${seq++}`

interface CanvasState {
  nodes: CanvasNode[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (conn: Connection) => void
  addNode: (kind: 'text' | 'image' | 'video', position: { x: number; y: number }) => void
  updateNodeData: (id: string, patch: Record<string, unknown>) => void
  removeNode: (id: string) => void
  generate: (nodeId: string) => Promise<void>
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [
    {
      id: 'demo-text',
      type: 'text',
      position: { x: 60, y: 180 },
      data: { kind: 'text', content: '清晨逆光的香水瓶特写，雾气缓慢流动' },
    },
    {
      id: 'demo-image',
      type: 'gen',
      position: { x: 420, y: 140 },
      data: { kind: 'image', prompt: '', modelKey: 'mock-image-v1', status: 'IDLE', progress: 0 },
    },
    {
      id: 'demo-video',
      type: 'gen',
      position: { x: 820, y: 160 },
      data: { kind: 'video', prompt: '缓慢推近', modelKey: 'mock-video-v1', status: 'IDLE', progress: 0 },
    },
  ],
  edges: [
    { id: 'e1', source: 'demo-text', target: 'demo-image' },
    { id: 'e2', source: 'demo-image', target: 'demo-video' },
  ],

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (conn) => set({ edges: addEdge(conn, get().edges) }),

  addNode: (kind, position) => {
    const id = nextId()
    const node: CanvasNode =
      kind === 'text'
        ? { id, type: 'text', position, data: { kind: 'text', content: '' } }
        : {
            id,
            type: 'gen',
            position,
            data: {
              kind,
              prompt: '',
              modelKey: kind === 'image' ? 'mock-image-v1' : 'mock-video-v1',
              status: 'IDLE',
              progress: 0,
            },
          }
    set({ nodes: [...get().nodes, node] })
  },

  updateNodeData: (id, patch) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...(n.data as Record<string, unknown>), ...patch } as TextData | GenData } : n,
      ),
    }),

  removeNode: (id) =>
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    }),

  // 连线驱动生成（docs/06 §A.2）：只看一跳入边收集上游；text→prompt 槽、image→参考图槽。
  generate: async (nodeId) => {
    const { nodes, edges, updateNodeData } = get()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node || node.data.kind === 'text') return
    const data = node.data as GenData

    const upstream = edges
      .filter((e) => e.target === nodeId)
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter((n): n is CanvasNode => !!n)

    const promptParts = upstream
      .filter((n) => n.data.kind === 'text')
      .sort((a, b) => a.position.y - b.position.y)
      .map((n) => (n.data as TextData).content.trim())
      .filter(Boolean)
    if (data.prompt.trim()) promptParts.push(data.prompt.trim())
    const prompt = promptParts.join('，')

    const refAssetUrls = upstream
      .filter((n) => n.data.kind === 'image' && (n.data as GenData).assetUrl)
      .map((n) => (n.data as GenData).assetUrl as string)

    const isVideo = data.kind === 'video'
    const hasRef = refAssetUrls.length > 0
    const taskType = isVideo
      ? hasRef ? 'video.img2video' : 'video.text2video'
      : hasRef ? 'image.ref2img' : 'image.text2img'
    // 模型与任务类型对齐（目录里 capability 一一对应）。
    const modelKey = isVideo
      ? hasRef ? 'mock-video-v1' : 'mock-video-text-v1'
      : hasRef ? 'mock-image-ref-v1' : 'mock-image-v1'

    if (!prompt && !hasRef) {
      updateNodeData(nodeId, { status: 'FAILED', error: '请连接文本/图片节点，或在面板填写提示词' })
      return
    }

    updateNodeData(nodeId, { status: 'GENERATING', progress: 0, error: undefined, modelKey })
    try {
      const task = await api.submitGeneration({
        taskType,
        modelKey,
        prompt,
        refAssetUrls,
        params: isVideo ? { durationSec: '3', width: '768', height: '432' } : { width: '768', height: '768' },
      })
      updateNodeData(nodeId, { taskId: task.id })
      await poll(task.id, nodeId, updateNodeData)
    } catch (err) {
      updateNodeData(nodeId, { status: 'FAILED', error: err instanceof Error ? err.message : '提交失败' })
    }
  },
}))

async function poll(
  taskId: string,
  nodeId: string,
  update: CanvasState['updateNodeData'],
): Promise<void> {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 1500))
    let task: Generation
    try {
      task = await api.getGeneration(taskId)
    } catch {
      continue // 网络抖动继续轮询
    }
    if (task.status === 'SUCCEEDED') {
      update(nodeId, { status: 'SUCCEEDED', progress: 100, assetUrl: task.outputs[0]?.assetUrl })
      return
    }
    if (task.status === 'FAILED' || task.status === 'CANCELED') {
      update(nodeId, { status: 'FAILED', error: task.errorReason || '生成失败' })
      return
    }
    update(nodeId, { progress: task.progress })
  }
  update(nodeId, { status: 'FAILED', error: '轮询超时' })
}
