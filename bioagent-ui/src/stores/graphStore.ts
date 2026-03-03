import { create } from 'zustand';
import type { NodeData, EdgeData, NodeStatus, PortDef, EdgeType } from '../types';
import { isPortTypeCompatible, validateConnection } from '../types';

interface GraphSnapshot {
  nodes: Map<string, NodeData>;
  edges: Map<string, EdgeData>;
}

interface GraphState {
  nodes: Map<string, NodeData>;
  edges: Map<string, EdgeData>;
  selectedNodes: Set<string>;
  selectedEdge: string | null;
  pan: { x: number; y: number };
  zoom: number;
  undoStack: GraphSnapshot[];
  redoStack: GraphSnapshot[];
  // Week 2: 노드 상세 Popup
  popupNodeId: string | null;

  // Node CRUD
  addNode: (node: NodeData) => void;
  updateNode: (id: string, partial: Partial<NodeData>) => void;
  removeNode: (id: string) => void;
  setNodeStatus: (id: string, status: NodeStatus, extras?: Partial<NodeData>) => void;
  // Week 2: Thinking 실시간 스트리밍
  appendNodeThinking: (id: string, chunk: string) => void;
  setNodeThinkingDone: (id: string) => void;

  // Edge CRUD
  addEdge: (edge: EdgeData) => void;
  removeEdge: (id: string) => void;
  // Week 2: 연결 검증
  tryAddEdge: (edge: EdgeData) => { success: boolean; message?: string };

  // Selection
  selectNode: (id: string, multi?: boolean) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  selectNodesInRect: (rect: { x1: number; y1: number; x2: number; y2: number }) => void;

  // Viewport
  setPan: (p: { x: number; y: number }) => void;
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  focusRunningNode: () => void;
  autoLayout: (direction?: 'LR' | 'TB') => void;

  // Undo/Redo
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  // Copy/Paste
  copySelection: () => NodeData[];
  pasteNodes: (nodes: NodeData[], offset: { x: number; y: number }) => void;

  // Popup (Week 2)
  openPopup: (nodeId: string) => void;
  closePopup: () => void;

  // Reset
  clearGraph: () => void;
  deleteSelected: () => void;
}

let nextNodeId = 100;
let nextEdgeId = 100;

function cloneSnapshot(nodes: Map<string, NodeData>, edges: Map<string, EdgeData>): GraphSnapshot {
  return {
    nodes: new Map(Array.from(nodes).map(([k, v]) => [k, { ...v, ports: { inputs: [...v.ports.inputs], outputs: [...v.ports.outputs] } }])),
    edges: new Map(Array.from(edges).map(([k, v]) => [k, { ...v }])),
  };
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: new Map(),
  edges: new Map(),
  selectedNodes: new Set(),
  selectedEdge: null,
  pan: { x: 0, y: 0 },
  zoom: 1,
  undoStack: [],
  redoStack: [],
  popupNodeId: null,

  // ── Node CRUD ──
  addNode: (node) =>
    set((s) => {
      const m = new Map(s.nodes);
      m.set(node.id, node);
      return { nodes: m };
    }),

  updateNode: (id, partial) =>
    set((s) => {
      const m = new Map(s.nodes);
      const n = m.get(id);
      if (n) m.set(id, { ...n, ...partial });
      return { nodes: m };
    }),

  removeNode: (id) =>
    set((s) => {
      const m = new Map(s.nodes);
      m.delete(id);
      // 연결된 엣지 삭제
      const e = new Map(s.edges);
      for (const [eid, edge] of e) {
        if (edge.sourceNode === id || edge.targetNode === id) e.delete(eid);
      }
      const sel = new Set(s.selectedNodes);
      sel.delete(id);
      return { nodes: m, edges: e, selectedNodes: sel, popupNodeId: s.popupNodeId === id ? null : s.popupNodeId };
    }),

  setNodeStatus: (id, status, extras) =>
    set((s) => {
      const m = new Map(s.nodes);
      const n = m.get(id);
      if (n) m.set(id, { ...n, status, ...extras });
      return { nodes: m };
    }),

  // Week 2: 글자 단위 스트리밍
  appendNodeThinking: (id, chunk) =>
    set((s) => {
      const m = new Map(s.nodes);
      const n = m.get(id);
      if (n) m.set(id, { ...n, thinkingText: n.thinkingText + chunk, thinkingStreaming: true });
      return { nodes: m };
    }),

  setNodeThinkingDone: (id) =>
    set((s) => {
      const m = new Map(s.nodes);
      const n = m.get(id);
      if (n) m.set(id, { ...n, thinkingStreaming: false });
      return { nodes: m };
    }),

  // ── Edge CRUD ──
  addEdge: (edge) =>
    set((s) => {
      const m = new Map(s.edges);
      m.set(edge.id, edge);
      return { edges: m };
    }),

  removeEdge: (id) =>
    set((s) => {
      const m = new Map(s.edges);
      m.delete(id);
      return { edges: m, selectedEdge: s.selectedEdge === id ? null : s.selectedEdge };
    }),

  // Week 2: 연결 검증 (PortTypes + NodeGraph-11)
  tryAddEdge: (edge) => {
    const { nodes, edges } = get();
    const source = nodes.get(edge.sourceNode);
    const target = nodes.get(edge.targetNode);
    if (!source || !target) return { success: false, message: '노드를 찾을 수 없습니다.' };

    // 연결 강제 규칙
    const validation = validateConnection(source, target, edge.type);
    if (!validation.valid) return { success: false, message: validation.message };

    // Port 타입 호환성 (Reference는 타입 제한 무시)
    if (edge.type === 'flow') {
      // Flow = 헤더끼리 연결, 타입 검사 불필요
    } else {
      // Reference = 포트 간 연결, 타입 검사
      const outPort = source.ports.outputs.find(p => p.id === edge.sourcePort);
      const inPort = target.ports.inputs.find(p => p.id === edge.targetPort);
      if (outPort && inPort && !isPortTypeCompatible(outPort.type, inPort.type)) {
        return { success: false, message: `타입 불호환: ${outPort.type} → ${inPort.type}` };
      }
    }

    // N:1 — 같은 Input 포트에 기존 연결 있으면 덮어쓰기
    const edgesArr = Array.from(edges.values());
    const existing = edgesArr.find(
      e => e.targetNode === edge.targetNode && e.targetPort === edge.targetPort && e.type === edge.type
    );
    if (existing) {
      get().removeEdge(existing.id);
    }

    get().addEdge(edge);
    return { success: true };
  },

  // ── Selection ──
  selectNode: (id, multi) =>
    set((s) => {
      const sel = multi ? new Set(s.selectedNodes) : new Set<string>();
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      return { selectedNodes: sel, selectedEdge: null };
    }),

  selectEdge: (id) => set({ selectedEdge: id, selectedNodes: new Set() }),

  clearSelection: () => set({ selectedNodes: new Set(), selectedEdge: null }),

  selectNodesInRect: (rect) =>
    set((s) => {
      const sel = new Set<string>();
      const { x1, y1, x2, y2 } = rect;
      const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
      for (const [id, node] of s.nodes) {
        if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
          sel.add(id);
        }
      }
      return { selectedNodes: sel };
    }),

  // ── Viewport ──
  setPan: (p) => set({ pan: p }),
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(3, z)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(3, s.zoom * 1.2) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.1, s.zoom / 1.2) })),
  zoomReset: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

  focusRunningNode: () =>
    set((s) => {
      for (const [, node] of s.nodes) {
        if (node.status === 'running') {
          return { pan: { x: -node.x + 400, y: -node.y + 300 }, zoom: 1.2 };
        }
      }
      return {};
    }),

  autoLayout: (direction?: 'LR' | 'TB') =>
    set((s) => {
      // Dagre-style 간단 트리 배치
      const dir = direction || 'LR';
      const nodes = new Map(s.nodes);
      const edges = Array.from(s.edges.values());
      const nodeIds = Array.from(nodes.keys());
      if (nodeIds.length === 0) return {};

      // 위상정렬로 레벨 계산
      const inDeg = new Map<string, number>();
      const adj = new Map<string, string[]>();
      for (const id of nodeIds) { inDeg.set(id, 0); adj.set(id, []); }
      for (const e of edges) {
        if (e.type === 'flow') {
          inDeg.set(e.targetNode, (inDeg.get(e.targetNode) || 0) + 1);
          adj.get(e.sourceNode)?.push(e.targetNode);
        }
      }
      const queue: string[] = [];
      const level = new Map<string, number>();
      for (const [id, deg] of inDeg) {
        if (deg === 0) { queue.push(id); level.set(id, 0); }
      }
      let i = 0;
      while (i < queue.length) {
        const cur = queue[i++];
        for (const next of (adj.get(cur) || [])) {
          inDeg.set(next, (inDeg.get(next) || 0) - 1);
          level.set(next, Math.max(level.get(next) || 0, (level.get(cur) || 0) + 1));
          if (inDeg.get(next) === 0) queue.push(next);
        }
      }
      // 레벨 없는 노드 처리
      for (const id of nodeIds) {
        if (!level.has(id)) level.set(id, 0);
      }

      const levelGroups = new Map<number, string[]>();
      for (const [id, lv] of level) {
        if (!levelGroups.has(lv)) levelGroups.set(lv, []);
        levelGroups.get(lv)!.push(id);
      }

      const mainGap = dir === 'LR' ? 300 : 240;
      const crossGap = dir === 'LR' ? 160 : 200;
      for (const [lv, ids] of levelGroups) {
        ids.forEach((id, idx) => {
          const n = nodes.get(id);
          if (n) {
            if (dir === 'LR') {
              nodes.set(id, { ...n, x: 60 + lv * mainGap, y: 60 + idx * crossGap });
            } else {
              nodes.set(id, { ...n, x: 60 + idx * mainGap, y: 60 + lv * crossGap });
            }
          }
        });
      }

      return { nodes, pan: { x: 0, y: 0 } };
    }),

  // ── Undo/Redo (최대 50) ──
  pushUndo: () =>
    set((s) => {
      const stack = [...s.undoStack, cloneSnapshot(s.nodes, s.edges)];
      if (stack.length > 50) stack.shift();
      return { undoStack: stack, redoStack: [] };
    }),

  undo: () =>
    set((s) => {
      if (s.undoStack.length === 0) return {};
      const stack = [...s.undoStack];
      const snap = stack.pop()!;
      return {
        undoStack: stack,
        redoStack: [...s.redoStack, cloneSnapshot(s.nodes, s.edges)],
        nodes: snap.nodes,
        edges: snap.edges,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.redoStack.length === 0) return {};
      const stack = [...s.redoStack];
      const snap = stack.pop()!;
      return {
        redoStack: stack,
        undoStack: [...s.undoStack, cloneSnapshot(s.nodes, s.edges)],
        nodes: snap.nodes,
        edges: snap.edges,
      };
    }),

  // ── Copy/Paste ──
  copySelection: () => {
    const { nodes, selectedNodes } = get();
    return Array.from(selectedNodes).map(id => nodes.get(id)).filter(Boolean) as NodeData[];
  },

  pasteNodes: (nodesToPaste, offset) =>
    set((s) => {
      const m = new Map(s.nodes);
      const sel = new Set<string>();
      for (const n of nodesToPaste) {
        const newId = `node_${++nextNodeId}`;
        m.set(newId, { ...n, id: newId, x: n.x + offset.x, y: n.y + offset.y, status: 'pending', thinkingText: '', thinkingStreaming: false });
        sel.add(newId);
      }
      return { nodes: m, selectedNodes: sel };
    }),

  // ── Popup (Week 2) ──
  openPopup: (nodeId) => set({ popupNodeId: nodeId }),
  closePopup: () => set({ popupNodeId: null }),

  // ── Housekeeping ──
  clearGraph: () => set({ nodes: new Map(), edges: new Map(), selectedNodes: new Set(), selectedEdge: null, popupNodeId: null }),

  deleteSelected: () => {
    const { selectedNodes, selectedEdge, pushUndo, removeNode, removeEdge } = get();
    pushUndo();
    if (selectedEdge) {
      removeEdge(selectedEdge);
    }
    for (const id of selectedNodes) {
      removeNode(id);
    }
  },
}));
