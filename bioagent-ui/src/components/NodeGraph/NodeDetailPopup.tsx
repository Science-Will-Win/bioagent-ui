import React from 'react';
import { X, Clock, CheckCircle, AlertCircle, RotateCw, Play, Lightbulb, ArrowRight } from 'lucide-react';
import type { NodeData, NodeStatus, EdgeData } from '../../types';
import { NODE_CATEGORY_COLORS, getToolCategory } from '../../types';
import { useGraphStore } from '../../stores/graphStore';

const STATUS_LABELS: Record<NodeStatus, { label: string; color: string }> = {
  pending: { label: '대기 중', color: '#6B7280' },
  running: { label: '실행 중', color: '#3B82F6' },
  completed: { label: '완료', color: '#10B981' },
  failed: { label: '실패', color: '#EF4444' },
  retrying: { label: '재시도 중', color: '#F59E0B' },
};

export default function NodeDetailPopup() {
  const { popupNodeId, closePopup, nodes, edges } = useGraphStore();
  if (!popupNodeId) return null;

  const node = nodes.get(popupNodeId);
  if (!node) return null;

  const color = NODE_CATEGORY_COLORS[node.category] || NODE_CATEGORY_COLORS[getToolCategory(node.type)] || '#6B7280';
  const statusInfo = STATUS_LABELS[node.status];

  // 연결된 엣지 찾기
  const connectedEdges = Array.from(edges.values()).filter(
    e => e.sourceNode === node.id || e.targetNode === node.id
  );
  const incomingEdges = connectedEdges.filter(e => e.targetNode === node.id);
  const outgoingEdges = connectedEdges.filter(e => e.sourceNode === node.id);

  return (
    <>
      {/* Overlay (popup-overlay: backdrop blur) */}
      <div className="fixed inset-0 z-50 popup-overlay bg-black/40" onClick={closePopup} />

      {/* Popup — 중앙 정렬 (전체화면 확장 아님, A4 확정) */}
      <div
        className="fixed z-50 rounded-xl border shadow-2xl overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 480,
          maxHeight: '80vh',
          background: 'var(--popup-bg)',
          borderColor: 'var(--popup-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: color }}>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">{node.title}</span>
            {node.stepNumber != null && (
              <span className="text-white/70 text-xs">#{node.stepNumber}</span>
            )}
          </div>
          <button onClick={closePopup} className="text-white/80 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 52px)' }}>
          {/* Status + Meta */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                style={{ background: statusInfo.color + '20', color: statusInfo.color }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.color }} />
                {statusInfo.label}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                타입: {node.type}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                카테고리: {node.category}
              </span>
            </div>
            {node.durationMs != null && (
              <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={11} /> 실행 시간: {node.durationMs}ms
              </div>
            )}
            {node.toolDisplayName && (
              <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                도구: {node.toolDisplayName}
              </div>
            )}
          </div>

          {/* Input Summary */}
          {node.inputSummary && (
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>입력 요약</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{node.inputSummary}</p>
            </div>
          )}

          {/* Ports */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>포트</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Inputs */}
              <div>
                <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Input</div>
                {node.ports.inputs.length === 0 ? (
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>없음</div>
                ) : (
                  node.ports.inputs.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 text-xs mb-0.5">
                      <div className="w-2 h-2 rounded-full border" style={{ borderColor: color }} />
                      <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>({p.type})</span>
                    </div>
                  ))
                )}
              </div>
              {/* Outputs */}
              <div>
                <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Output</div>
                {node.ports.outputs.length === 0 ? (
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>없음</div>
                ) : (
                  node.ports.outputs.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 text-xs mb-0.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>({p.type})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Connections */}
          {connectedEdges.length > 0 && (
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>연결</h4>
              {incomingEdges.map(e => {
                const src = nodes.get(e.sourceNode);
                return (
                  <div key={e.id} className="flex items-center gap-1.5 text-xs mb-1">
                    <ArrowRight size={10} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {src?.title || e.sourceNode} → {node.title}
                    </span>
                    <span className="text-[9px] px-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {e.type}
                    </span>
                  </div>
                );
              })}
              {outgoingEdges.map(e => {
                const tgt = nodes.get(e.targetNode);
                return (
                  <div key={e.id} className="flex items-center gap-1.5 text-xs mb-1">
                    <ArrowRight size={10} style={{ color: 'var(--accent)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {node.title} → {tgt?.title || e.targetNode}
                    </span>
                    <span className="text-[9px] px-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {e.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Output Data */}
          {node.outputData && (
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>출력 데이터</h4>
              <pre
                className="text-[10px] leading-relaxed p-2 rounded overflow-x-auto"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {JSON.stringify(node.outputData, null, 2)}
              </pre>
            </div>
          )}

          {/* Output Summary */}
          {node.outputSummary && (
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>결과 요약</h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{node.outputSummary}</p>
            </div>
          )}

          {/* Thinking (전체 표시) */}
          {node.thinkingText && (
            <div className="px-4 py-3">
              <h4 className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                <Lightbulb size={12} /> AI 사고 과정
              </h4>
              <div
                className="text-xs leading-relaxed p-2 rounded"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {node.thinkingText}
                {node.thinkingStreaming && <span className="thinking-cursor" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
