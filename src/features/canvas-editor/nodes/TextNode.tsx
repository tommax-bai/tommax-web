import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useCanvasStore, type CanvasNode, type TextData } from '../store'

export const TextNode = memo(function TextNode({ id, data }: NodeProps<CanvasNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)
  const removeNode = useCanvasStore((s) => s.removeNode)
  const d = data as TextData
  return (
    <div className="node node-text">
      <div className="node-header">
        <span className="node-title">文本</span>
        <button className="node-close" onClick={() => removeNode(id)} title="删除节点">×</button>
      </div>
      <textarea
        className="nodrag"
        value={d.content}
        placeholder="输入提示词或创意描述…"
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
        rows={4}
      />
      <Handle type="source" position={Position.Right} />
    </div>
  )
})
