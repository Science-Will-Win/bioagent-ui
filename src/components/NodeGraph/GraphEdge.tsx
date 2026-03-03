import React from 'react';
import type { EdgeData, NodeData } from '../../types';
import { NODE_WIDTH } from './GraphNode';

interface GraphEdgeProps {
  edge: EdgeData;
  sourceNode: NodeData;
  targetNode: NodeData;
  selected: boolean;
  onSelect: (edgeId: string) => void;
}

const HEADER_HEIGHT = 32;
const PORT_SPACING = 22;
const PORT_START_Y = HEADER_HEIGHT + 8 + 11;

function getPortY(node: NodeData, portId: string, dir: 'in' | 'out'): number {
  const ports = dir === 'out' ? node.ports.outputs : node.ports.inputs;
  const idx = ports.findIndex(p => p.id === portId);
  return idx >= 0 ? PORT_START_Y + idx * PORT_SPACING : HEADER_HEIGHT / 2;
}

export default function GraphEdge({ edge, sourceNode, targetNode, selected, onSelect }: GraphEdgeProps) {
  let x1: number, y1: number, x2: number, y2: number;

  if (edge.type === 'flow') {
    // Flow: 헤더끼리 연결 (NodeGraph-2 확정)
    // source 하단 중앙 → target 상단 중앙
    const nodeHeight = estimateNodeHeight(sourceNode);
    x1 = sourceNode.x + NODE_WIDTH / 2;
    y1 = sourceNode.y + nodeHeight; // 하단
    x2 = targetNode.x + NODE_WIDTH / 2;
    y2 = targetNode.y; // 상단
  } else {
    // Reference: 포트 간 연결
    // source 우측 포트 → target 좌측 포트
    x1 = sourceNode.x + NODE_WIDTH;
    y1 = sourceNode.y + getPortY(sourceNode, edge.sourcePort, 'out');
    x2 = targetNode.x;
    y2 = targetNode.y + getPortY(targetNode, edge.targetPort, 'in');
  }

  // Bezier 곡선 제어점
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);

  let path: string;
  if (edge.type === 'flow') {
    // 수직 방향 곡선
    const cp = Math.max(40, dy * 0.4);
    path = `M ${x1} ${y1} C ${x1} ${y1 + cp}, ${x2} ${y2 - cp}, ${x2} ${y2}`;
  } else {
    // 수평 방향 곡선
    const cp = Math.max(40, dx * 0.4);
    path = `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  }

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(edge.id); }}>
      {/* Hit area (넓은 클릭 영역) */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="cursor-pointer"
      />

      {edge.type === 'flow' ? (
        // E-01: Flow = 두꺼운 회색 실선
        <path
          d={path}
          fill="none"
          stroke={selected ? '#3B82F6' : 'var(--edge-flow)'}
          strokeWidth={selected ? 3 : 2.5}
          strokeLinecap="round"
        />
      ) : (
        // E-01: Reference = 얇은 점선 + 애니메이션
        <path
          d={path}
          fill="none"
          stroke={selected ? '#3B82F6' : 'var(--edge-ref)'}
          strokeWidth={selected ? 1.5 : 1}
          strokeDasharray="6 4"
          strokeLinecap="round"
          className="edge-ref-animated"
        />
      )}

      {/* Arrow at target */}
      <circle
        cx={x2} cy={y2}
        r={3}
        fill={selected ? '#3B82F6' : edge.type === 'flow' ? 'var(--edge-flow)' : 'var(--edge-ref)'}
      />
    </g>
  );
}

function estimateNodeHeight(node: NodeData): number {
  const portsCount = Math.max(node.ports.inputs.length, node.ports.outputs.length, 1);
  let h = HEADER_HEIGHT + 8 + portsCount * 22 + (node.inputSummary ? 16 : 0);
  if (node.thinkingText) h += 24;
  return h + 12;
}

export { getPortY };
