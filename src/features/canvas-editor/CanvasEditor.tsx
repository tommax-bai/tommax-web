import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCanvasStore } from './store'
import { TextNode } from './nodes/TextNode'
import { GenNode } from './nodes/GenNode'

const nodeTypes = { text: TextNode, gen: GenNode }

function CanvasInner() {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const onNodesChange = useCanvasStore((s) => s.onNodesChange)
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange)
  const onConnect = useCanvasStore((s) => s.onConnect)
  const addNode = useCanvasStore((s) => s.addNode)
  const { screenToFlowPosition } = useReactFlow()

  const addAt = useCallback(
    (kind: 'text' | 'image' | 'video') => {
      const pos = screenToFlowPosition({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 120,
      })
      addNode(kind, pos)
    },
    [addNode, screenToFlowPosition],
  )

  return (
    <div className="canvas-root">
      <header className="topbar">
        <span className="brand">Tommax 画布</span>
        <span className="hint">连线驱动生成：文本 → 图片 → 视频；拖动连接点建立连线</span>
      </header>
      <aside className="toolbar">
        <button onClick={() => addAt('text')}>＋ 文本</button>
        <button onClick={() => addAt('image')}>＋ AI 图片</button>
        <button onClick={() => addAt('video')}>＋ AI 视频</button>
      </aside>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export function CanvasEditor() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
