import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useCanvasStore, type CanvasNode, type GenData } from '../store'

export const GenNode = memo(function GenNode({ id, data }: NodeProps<CanvasNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)
  const removeNode = useCanvasStore((s) => s.removeNode)
  const generate = useCanvasStore((s) => s.generate)
  const d = data as GenData
  const isVideo = d.kind === 'video'
  const busy = d.status === 'GENERATING'

  return (
    <div className={`node node-gen ${d.status === 'FAILED' ? 'node-error' : ''}`}>
      <div className="node-header">
        <span className="node-title">{isVideo ? 'AI 生成视频' : 'AI 生成图片'}</span>
        <button className="node-close" onClick={() => removeNode(id)} title="删除节点">×</button>
      </div>

      <div className="node-preview">
        {d.status === 'SUCCEEDED' && d.assetUrl ? (
          isVideo ? (
            <video src={d.assetUrl} controls loop muted playsInline />
          ) : (
            <img src={d.assetUrl} alt="生成结果" />
          )
        ) : busy ? (
          <div className="node-progress">
            <div className="spinner" />
            <span>{d.progress}%</span>
          </div>
        ) : (
          <div className="node-placeholder">
            {isVideo ? '连接图片/文本节点 → 生成' : '连接文本节点 → 生成'}
          </div>
        )}
      </div>

      <input
        className="nodrag node-prompt"
        value={d.prompt}
        placeholder="补充提示词（可选）"
        onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
      />

      {d.error && <div className="node-error-msg">{d.error}</div>}

      <button className="node-generate nodrag" disabled={busy} onClick={() => void generate(id)}>
        {busy ? '生成中…' : d.status === 'SUCCEEDED' ? '重新生成' : '立即生成'}
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
})
