import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, LayoutDashboard, ArrowRightLeft, ArrowDownUp } from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useAppStore } from '../../stores/appStore';
import GraphNode, { NODE_WIDTH } from './GraphNode';
import GraphEdge from './GraphEdge';
import CreateNodeMenu from './CreateNodeMenu';
import NodeDetailPopup from './NodeDetailPopup';
import type { NodeTypeDef, EdgeType, NodeData } from '../../types';
import { getToolCategory, NODE_CATEGORY_COLORS } from '../../types';

let idCounter = 200;

export default function NodeGraphCanvas() {
  const store = useGraphStore();
  const {
    nodes, edges, selectedNodes, selectedEdge,
    pan, zoom,
    setPan, setZoom, zoomIn, zoomOut, zoomReset, focusRunningNode, autoLayout,
    addNode, addEdge, selectNode, selectEdge, clearSelection, selectNodesInRect,
    pushUndo, undo, redo, deleteSelected, copySelection, pasteNodes,
    tryAddEdge, popupNodeId,
  } = store;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const marqueeStart = useRef({ x: 0, y: 0 });

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragStart = useRef({ nodeX: 0, nodeY: 0, mx: 0, my: 0 });

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number } | null>(null);

  // Edge dragging
  const [pendingEdge, setPendingEdge] = useState<{
    sourceNode: string; sourcePort: string; dir: 'in' | 'out';
    type: EdgeType; mx: number; my: number;
  } | null>(null);

  // Port tooltip (N-05)
  const [portTooltip, setPortTooltip] = useState<{
    nodeId: string; portId: string; rect: DOMRect;
  } | null>(null);

  // Toast messages (연결 검증 결과)
  const [toast, setToast] = useState<string | null>(null);

  // Clipboard
  const clipboardRef = useRef<NodeData[]>([]);

  // ── 마우스 → 캔버스 좌표 변환 ──
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // ── 마우스 이벤트 ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (contextMenu) { setContextMenu(null); return; }

    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]') as HTMLElement;

    // 우클릭(button=2) + 배경 → 패닝 시작 (G-01: 우클릭+드래그)
    if (e.button === 2) {
      if (nodeEl) return; // 노드 위에서 우클릭은 무시 (추후 컨텍스트 메뉴)
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }

    // 좌클릭(button=0)
    if (e.button === 0) {
      // 노드의 드래그 핸들 클릭 → 노드 드래그
      if (nodeEl) {
        const nodeId = nodeEl.getAttribute('data-node-id')!;
        const node = nodes.get(nodeId);
        if (!node) return;

        // 다중 선택 + 드래그
        if (!selectedNodes.has(nodeId) && !e.ctrlKey && !e.metaKey) {
          selectNode(nodeId);
        }

        pushUndo();
        setDraggingNode(nodeId);
        dragStart.current = { nodeX: node.x, nodeY: node.y, mx: e.clientX, my: e.clientY };
        return;
      }

      // 배경 클릭 → 마퀴 선택 시작 or 선택 해제
      clearSelection();
      setMarquee(null);
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      marqueeStart.current = { x: canvasPos.x, y: canvasPos.y };
      setMarquee({ x1: canvasPos.x, y1: canvasPos.y, x2: canvasPos.x, y2: canvasPos.y });
    }
  }, [contextMenu, pan, zoom, nodes, selectedNodes, clearSelection, selectNode, pushUndo, screenToCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 패닝
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
      return;
    }

    // 노드 드래그
    if (draggingNode) {
      const dx = (e.clientX - dragStart.current.mx) / zoom;
      const dy = (e.clientY - dragStart.current.my) / zoom;
      const node = nodes.get(draggingNode);
      if (!node) return;

      // 다중 노드 이동
      if (selectedNodes.has(draggingNode) && selectedNodes.size > 1) {
        const origX = dragStart.current.nodeX;
        const origY = dragStart.current.nodeY;
        for (const id of selectedNodes) {
          const n = nodes.get(id);
          if (n) {
            const offsetX = n.x - origX;
            const offsetY = n.y - origY;
            store.updateNode(id, {
              x: dragStart.current.nodeX + dx + offsetX,
              y: dragStart.current.nodeY + dy + offsetY,
            });
          }
        }
      } else {
        store.updateNode(draggingNode, {
          x: dragStart.current.nodeX + dx,
          y: dragStart.current.nodeY + dy,
        });
      }
      return;
    }

    // 마퀴
    if (marquee) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setMarquee({ ...marquee, x2: pos.x, y2: pos.y });
      return;
    }

    // 엣지 드래그 임시선
    if (pendingEdge) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setPendingEdge({
          ...pendingEdge,
          mx: (e.clientX - rect.left - pan.x) / zoom,
          my: (e.clientY - rect.top - pan.y) / zoom,
        });
      }
    }
  }, [isPanning, draggingNode, marquee, pendingEdge, zoom, pan, nodes, selectedNodes, store, screenToCanvas, setPan]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) { setIsPanning(false); return; }
    if (draggingNode) { setDraggingNode(null); return; }

    // 마퀴 선택 확정
    if (marquee) {
      const dx = Math.abs(marquee.x2 - marquee.x1);
      const dy = Math.abs(marquee.y2 - marquee.y1);
      if (dx > 5 || dy > 5) {
        selectNodesInRect(marquee);
      }
      setMarquee(null);
      return;
    }

    // 엣지 드래그 완료 → 대상 포트 연결
    if (pendingEdge) {
      const target = e.target as HTMLElement;
      const portEl = target.closest('.port-circle') as HTMLElement;
      const nodeEl = target.closest('[data-node-id]') as HTMLElement;

      if (portEl && nodeEl) {
        const targetNodeId = nodeEl.getAttribute('data-node-id')!;
        const isFlowAnchor = portEl.getAttribute('data-flow-anchor');

        if (isFlowAnchor) {
          // Flow 연결 (헤더끼리)
          const result = tryAddEdge({
            id: `edge_${++idCounter}`,
            type: 'flow',
            sourceNode: pendingEdge.sourceNode,
            sourcePort: '__header__',
            targetNode: targetNodeId,
            targetPort: '__header__',
          });
          if (!result.success) showToast(result.message || '연결 실패');
        }
      }
      setPendingEdge(null);
    }
  }, [isPanning, draggingNode, marquee, pendingEdge, selectNodesInRect, tryAddEdge]);

  // 우클릭 컨텍스트 메뉴 (배경 더블클릭 or 우클릭)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    if (target.closest('[data-node-id]')) return;

    // 짧은 거리만 이동한 우클릭 → 컨텍스트 메뉴
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setContextMenu({ x: e.clientX, y: e.clientY, canvasX: canvasPos.x, canvasY: canvasPos.y });
  }, [screenToCanvas]);

  // 배경 더블클릭 → Create Node 메뉴
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-node-id]')) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setContextMenu({ x: e.clientX, y: e.clientY, canvasX: canvasPos.x, canvasY: canvasPos.y });
  }, [screenToCanvas]);

  // G-02: 줌 (마우스 휠, 현재 마우스 커서 위치 중심)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(3, zoom * factor));

    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const newPanX = mx - (mx - pan.x) * (newZoom / zoom);
      const newPanY = my - (my - pan.y) * (newZoom / zoom);
      setPan({ x: newPanX, y: newPanY });
    }
    setZoom(newZoom);
  }, [zoom, pan, setPan, setZoom]);

  // ── 키보드 단축키 ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { clipboardRef.current = copySelection(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboardRef.current.length) { pushUndo(); pasteNodes(clipboardRef.current, { x: 40, y: 40 }); }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodes.size > 0 || selectedEdge) deleteSelected();
      }
      if (e.key === 'Escape') { setContextMenu(null); clearSelection(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, copySelection, pasteNodes, deleteSelected, selectedNodes, selectedEdge, clearSelection, pushUndo]);

  // ── 노드 생성 ──
  const handleCreateNode = useCallback((def: NodeTypeDef) => {
    if (!contextMenu) return;
    pushUndo();
    const id = `node_${++idCounter}`;
    addNode({
      id,
      type: def.type,
      category: def.category,
      title: def.label,
      status: 'pending',
      x: contextMenu.canvasX,
      y: contextMenu.canvasY,
      ports: {
        inputs: def.defaultPorts.inputs.map(p => ({ ...p })),
        outputs: def.defaultPorts.outputs.map(p => ({ ...p })),
      },
      thinkingText: '',
      thinkingStreaming: false,
      allowRef: def.allowRef,
      dataOnly: def.dataOnly,
      result: def.result,
    });
    setContextMenu(null);
  }, [contextMenu, pushUndo, addNode]);

  // ── 포트 드래그 시작 ──
  const handlePortDragStart = useCallback((nodeId: string, portId: string, dir: 'in' | 'out', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const node = nodes.get(nodeId);
    if (!node) return;

    const edgeType: EdgeType = e.button === 2 ? 'reference' : 'flow';
    const pos = screenToCanvas(e.clientX, e.clientY);
    setPendingEdge({
      sourceNode: nodeId, sourcePort: portId, dir,
      type: edgeType, mx: pos.x, my: pos.y,
    });
  }, [nodes, screenToCanvas]);

  // 포트 연결 완료 (mouseup이 포트 위)
  const handlePortMouseUp = useCallback((nodeId: string, portId: string) => {
    if (!pendingEdge) return;
    if (pendingEdge.sourceNode === nodeId) { setPendingEdge(null); return; } // 자기 자신

    const edgeId = `edge_${++idCounter}`;
    let result;

    if (pendingEdge.type === 'flow') {
      result = tryAddEdge({
        id: edgeId,
        type: 'flow',
        sourceNode: pendingEdge.sourceNode,
        sourcePort: '__header__',
        targetNode: nodeId,
        targetPort: '__header__',
      });
    } else {
      result = tryAddEdge({
        id: edgeId,
        type: 'reference',
        sourceNode: pendingEdge.dir === 'out' ? pendingEdge.sourceNode : nodeId,
        sourcePort: pendingEdge.dir === 'out' ? pendingEdge.sourcePort : portId,
        targetNode: pendingEdge.dir === 'out' ? nodeId : pendingEdge.sourceNode,
        targetPort: pendingEdge.dir === 'out' ? portId : pendingEdge.sourcePort,
      });
    }

    if (!result.success) showToast(result.message || '연결 실패');
    setPendingEdge(null);
  }, [pendingEdge, tryAddEdge]);

  // N-05: 포트 hover → 연결 데이터 툴팁
  const handlePortHover = useCallback((nodeId: string, portId: string, rect: DOMRect | null) => {
    if (!rect) { setPortTooltip(null); return; }
    setPortTooltip({ nodeId, portId, rect });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 포트 툴팁 데이터 조회
  const getPortTooltipData = () => {
    if (!portTooltip) return null;
    const { nodeId, portId } = portTooltip;
    const edgesArr = Array.from(edges.values());
    const connected = edgesArr.find(
      e => (e.targetNode === nodeId && e.targetPort === portId) ||
           (e.sourceNode === nodeId && e.sourcePort === portId)
    );
    if (!connected) return null;

    const otherNodeId = connected.sourceNode === nodeId ? connected.targetNode : connected.sourceNode;
    const otherNode = nodes.get(otherNodeId);
    return otherNode ? `${otherNode.title}: ${otherNode.outputSummary || '데이터 없음'}` : null;
  };

  const nodesArr = Array.from(nodes.values());
  const edgesArr = Array.from(edges.values());
  const tooltipData = getPortTooltipData();

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{ background: 'var(--canvas-bg)' }}>
      <svg
        ref={svgRef}
        className="w-full h-full canvas-dots"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {edgesArr.map(edge => {
            const src = nodes.get(edge.sourceNode);
            const tgt = nodes.get(edge.targetNode);
            if (!src || !tgt) return null;
            return (
              <GraphEdge
                key={edge.id}
                edge={edge}
                sourceNode={src}
                targetNode={tgt}
                selected={selectedEdge === edge.id}
                onSelect={(id) => selectEdge(id)}
              />
            );
          })}

          {/* Pending edge (드래그 중 임시 선) */}
          {pendingEdge && (() => {
            const src = nodes.get(pendingEdge.sourceNode);
            if (!src) return null;
            const sx = src.x + NODE_WIDTH / 2;
            const sy = src.y + (pendingEdge.dir === 'out' ? 100 : 0); // 대략적 위치
            return (
              <line
                x1={pendingEdge.dir === 'out' ? src.x + NODE_WIDTH : src.x}
                y1={sy}
                x2={pendingEdge.mx}
                y2={pendingEdge.my}
                stroke={pendingEdge.type === 'flow' ? 'var(--edge-flow)' : 'var(--edge-ref)'}
                strokeWidth={pendingEdge.type === 'flow' ? 2 : 1}
                strokeDasharray={pendingEdge.type === 'reference' ? '6 4' : undefined}
                opacity={0.6}
              />
            );
          })()}

          {/* Nodes */}
          {nodesArr.map(node => (
            <GraphNode
              key={node.id}
              node={node}
              selected={selectedNodes.has(node.id)}
              zoom={zoom}
              onPortDragStart={handlePortDragStart}
              onPortHover={handlePortHover}
            />
          ))}

          {/* Marquee selection */}
          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth={1 / zoom}
              strokeDasharray={`${4 / zoom} ${4 / zoom}`}
            />
          )}
        </g>
      </svg>

      {/* G-04: 자동 정렬 (상단 툴바 위치) + 가로/세로 토글 */}
      <div className="absolute top-3 left-3 flex gap-1.5">
        <button
          onClick={() => {
            const dir = useAppStore.getState().layoutDirection;
            autoLayout(dir);
          }}
          className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title="자동 정렬 (Dagre)"
        >
          <LayoutDashboard size={13} /> 정렬
        </button>
        <button
          onClick={() => {
            useAppStore.getState().setLayoutDirection('LR');
            autoLayout('LR');
          }}
          className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors hover:opacity-80"
          style={{
            background: useAppStore.getState().layoutDirection === 'LR' ? 'var(--accent)' : 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: useAppStore.getState().layoutDirection === 'LR' ? '#fff' : 'var(--text-secondary)',
          }}
          title="가로 정렬 (좌→우)"
        >
          <ArrowRightLeft size={13} />
        </button>
        <button
          onClick={() => {
            useAppStore.getState().setLayoutDirection('TB');
            autoLayout('TB');
          }}
          className="p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors hover:opacity-80"
          style={{
            background: useAppStore.getState().layoutDirection === 'TB' ? 'var(--accent)' : 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: useAppStore.getState().layoutDirection === 'TB' ? '#fff' : 'var(--text-secondary)',
          }}
          title="세로 정렬 (위→아래)"
        >
          <ArrowDownUp size={13} />
        </button>
      </div>

      {/* G-02/G-03: 줌 + 포커스 (우측 하단 위치) */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <button
          onClick={focusRunningNode}
          className="p-1.5 rounded-lg border transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
          title="실행 중 노드 포커스"
        >
          <Crosshair size={14} />
        </button>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded-lg border transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title="줌 인"
        >
          <ZoomIn size={14} />
        </button>
        <div
          className="text-center text-[10px] py-0.5 rounded-lg border"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={zoomOut}
          className="p-1.5 rounded-lg border transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title="줌 아웃"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={zoomReset}
          className="p-1.5 rounded-lg border transition-colors hover:opacity-80"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title="줌 리셋"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Create Node Menu */}
      {contextMenu && (
        <CreateNodeMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onSelect={handleCreateNode}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Node Detail Popup (Week 2) */}
      <NodeDetailPopup />

      {/* N-05: Port 참조 툴팁 */}
      {portTooltip && tooltipData && (
        <div
          className="fixed z-40 px-2 py-1 rounded text-[10px] shadow-lg border max-w-48 pointer-events-none"
          style={{
            left: portTooltip.rect.right + 8,
            top: portTooltip.rect.top - 4,
            background: 'var(--popup-bg)',
            borderColor: 'var(--popup-border)',
            color: 'var(--text-primary)',
          }}
        >
          {tooltipData}
        </div>
      )}

      {/* Toast (연결 검증 결과) */}
      {toast && (
        <div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs font-medium shadow-lg border z-40"
          style={{ background: 'var(--bg-secondary)', borderColor: '#EF4444', color: '#EF4444' }}
        >
          ⚠️ {toast}
        </div>
      )}
    </div>
  );
}
