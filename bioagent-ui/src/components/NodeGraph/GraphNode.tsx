import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, AlertCircle, RotateCw, CheckCircle, Clock, Play } from 'lucide-react';
import type { NodeData, NodeStatus, PortDef } from '../../types';
import { NODE_CATEGORY_COLORS, getToolCategory } from '../../types';
import { useGraphStore } from '../../stores/graphStore';

interface GraphNodeProps {
  node: NodeData;
  selected: boolean;
  zoom: number;
  onPortDragStart: (nodeId: string, portId: string, dir: 'in' | 'out', e: React.MouseEvent) => void;
  onPortHover: (nodeId: string, portId: string, rect: DOMRect | null) => void;
}

const STATUS_ICONS: Record<NodeStatus, React.ReactNode> = {
  pending: <Clock size={12} className="opacity-50" />,
  running: <Play size={12} className="text-blue-400" />,
  completed: <CheckCircle size={12} className="text-green-400" />,
  failed: <AlertCircle size={12} className="text-red-400" />,
  retrying: <RotateCw size={12} className="text-yellow-400 animate-spin" />,
};

const NODE_WIDTH = 220;
const HEADER_HEIGHT = 32;
const PORT_RADIUS = 6;

export default function GraphNode({ node, selected, zoom, onPortDragStart, onPortHover }: GraphNodeProps) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(node.title);
  const { updateNode, openPopup, selectNode } = useGraphStore();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const prevStatus = useRef(node.status);

  const color = NODE_CATEGORY_COLORS[node.category] || NODE_CATEGORY_COLORS[getToolCategory(node.type)] || '#6B7280';

  // ★ running → 아코디언 자동 펼침 / completed → 자동 접힘
  useEffect(() => {
    if (node.status === 'running' && prevStatus.current !== 'running') {
      setThinkingOpen(true);
    }
    if (node.status === 'completed' && prevStatus.current === 'running') {
      const timer = setTimeout(() => setThinkingOpen(false), 500);
      return () => clearTimeout(timer);
    }
    prevStatus.current = node.status;
  }, [node.status]);

  const handleHeaderDblClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTitleDraft(node.title);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }, [node.title]);

  const commitTitle = () => {
    if (titleDraft.trim()) updateNode(node.id, { title: titleDraft.trim() });
    setEditing(false);
  };

  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    if (e.detail === 2) return;
    e.stopPropagation();
    selectNode(node.id, e.ctrlKey || e.metaKey);
  }, [node.id, selectNode]);

  const handleNodeDblClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openPopup(node.id);
  }, [node.id, openPopup]);

  const portY = (index: number) => HEADER_HEIGHT + 8 + index * 22 + 11;

  const thinkingY = getThinkingY(node);
  const thinkingHeight = thinkingOpen ? Math.min(160, Math.max(60, (node.thinkingText?.length || 0) * 0.8)) : 20;
  const nodeHeight = getNodeHeight(node, thinkingOpen);

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={handleNodeClick}
      onDoubleClick={handleNodeDblClick}
      className="cursor-pointer"
      data-node-id={node.id}
    >
      {selected && (
        <rect x={-3} y={-3} width={NODE_WIDTH + 6} height={nodeHeight + 6}
          rx={10} ry={10} fill="none" stroke="#3B82F6" strokeWidth={2} opacity={0.7} />
      )}
      {node.status === 'running' && (
        <rect x={-2} y={-2} width={NODE_WIDTH + 4} height={nodeHeight + 4}
          rx={9} ry={9} fill="none" stroke={color} strokeWidth={2} opacity={0.5} className="node-running" />
      )}

      {/* Node body */}
      <rect width={NODE_WIDTH} height={nodeHeight} rx={8} ry={8}
        fill="var(--node-bg)" stroke={selected ? '#3B82F6' : 'var(--node-border)'} strokeWidth={selected ? 1.5 : 1} />

      {/* Header */}
      <rect width={NODE_WIDTH} height={HEADER_HEIGHT} rx={8} ry={8} fill={color} />
      <rect y={HEADER_HEIGHT - 8} width={NODE_WIDTH} height={8} fill={color} />

      {/* Flow anchors */}
      <circle cx={NODE_WIDTH / 2} cy={0} r={5} fill={color} stroke="var(--node-bg)" strokeWidth={1.5}
        className="port-circle" data-flow-anchor="top"
        onMouseDown={(e) => { e.stopPropagation(); onPortDragStart(node.id, '__header__', 'in', e); }} />
      <circle cx={NODE_WIDTH / 2} cy={nodeHeight} r={5} fill={color} stroke="var(--node-bg)" strokeWidth={1.5}
        className="port-circle" data-flow-anchor="bottom"
        onMouseDown={(e) => { e.stopPropagation(); onPortDragStart(node.id, '__header__', 'out', e); }} />

      {/* Header content */}
      <foreignObject x={0} y={0} width={NODE_WIDTH} height={HEADER_HEIGHT}>
        <div className="flex items-center gap-1.5 px-2.5 h-full" onDoubleClick={handleHeaderDblClick} data-drag-handle="true">
          {STATUS_ICONS[node.status]}
          {editing ? (
            <input ref={titleInputRef} value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 bg-white/20 text-white text-xs font-medium px-1 py-0.5 rounded outline-none"
              onClick={(e) => e.stopPropagation()} />
          ) : (
            <span className="text-xs font-semibold text-white truncate flex-1">{node.title}</span>
          )}
          {node.stepNumber != null && (
            <span className="text-[10px] text-white/70">#{node.stepNumber}</span>
          )}
        </div>
      </foreignObject>

      {/* Input Ports */}
      {node.ports.inputs.map((port, i) => {
        const y = portY(i);
        return (
          <g key={port.id}>
            <circle cx={0} cy={y} r={PORT_RADIUS} fill="var(--node-bg)" stroke={color} strokeWidth={1.5}
              className="port-circle"
              onMouseDown={(e) => { e.stopPropagation(); onPortDragStart(node.id, port.id, 'in', e); }}
              onMouseEnter={(e) => onPortHover(node.id, port.id, e.currentTarget.getBoundingClientRect())}
              onMouseLeave={() => onPortHover(node.id, port.id, null)} />
            <text x={PORT_RADIUS + 6} y={y + 3.5} fontSize={10} fill="var(--text-secondary)">{port.name}</text>
          </g>
        );
      })}

      {/* Output Ports */}
      {node.ports.outputs.map((port, i) => {
        const y = portY(i);
        return (
          <g key={port.id}>
            <circle cx={NODE_WIDTH} cy={y} r={PORT_RADIUS} fill="var(--node-bg)" stroke={color} strokeWidth={1.5}
              className="port-circle"
              onMouseDown={(e) => { e.stopPropagation(); onPortDragStart(node.id, port.id, 'out', e); }}
              onMouseEnter={(e) => onPortHover(node.id, port.id, e.currentTarget.getBoundingClientRect())}
              onMouseLeave={() => onPortHover(node.id, port.id, null)} />
            <text x={NODE_WIDTH - PORT_RADIUS - 6} y={y + 3.5} fontSize={10} fill="var(--text-secondary)" textAnchor="end">{port.name}</text>
          </g>
        );
      })}

      {/* Summary */}
      {node.inputSummary && (
        <text x={NODE_WIDTH / 2} y={portY(Math.max(node.ports.inputs.length, node.ports.outputs.length)) - 7}
          fontSize={9} fill="var(--text-secondary)" textAnchor="middle" opacity={0.7}>
          {node.inputSummary.length > 35 ? node.inputSummary.slice(0, 35) + '…' : node.inputSummary}
        </text>
      )}

      {/* ★ Thinking 아코디언 — running: 전체 표시, completed: 자동 접힘 */}
      {(node.thinkingText || node.thinkingStreaming) && (
        <foreignObject x={4} y={thinkingY} width={NODE_WIDTH - 8} height={thinkingOpen ? thinkingHeight + 4 : 20}>
          <div>
            <button
              className="flex items-center gap-1 text-[10px] w-full px-1 py-0.5 rounded"
              style={{ color: 'var(--accent)' }}
              onClick={(e) => { e.stopPropagation(); setThinkingOpen(!thinkingOpen); }}
            >
              {thinkingOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <Lightbulb size={10} />
              <span>Thinking</span>
              {node.thinkingStreaming && <span className="thinking-cursor text-[10px]" />}
            </button>
            {thinkingOpen && (
              <div className="text-[9px] leading-relaxed mt-0.5 px-1 overflow-y-auto"
                style={{ color: 'var(--text-secondary)', maxHeight: thinkingHeight - 16 }}>
                {node.thinkingText}
                {node.thinkingStreaming && <span className="thinking-cursor" />}
              </div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

function getThinkingY(node: NodeData): number {
  const portsCount = Math.max(node.ports.inputs.length, node.ports.outputs.length, 1);
  return HEADER_HEIGHT + 8 + portsCount * 22 + (node.inputSummary ? 16 : 0);
}

function getNodeHeight(node: NodeData, thinkingOpen: boolean): number {
  let h = getThinkingY(node);
  if (node.thinkingText || node.thinkingStreaming) {
    const thinkH = thinkingOpen ? Math.min(160, Math.max(60, (node.thinkingText?.length || 0) * 0.8)) : 20;
    h += thinkH + 4;
  }
  return h + 12;
}

export { NODE_WIDTH, HEADER_HEIGHT, getNodeHeight };
