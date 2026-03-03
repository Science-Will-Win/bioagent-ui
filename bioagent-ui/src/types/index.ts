// ═══════════════════════════════════════════
// AIGEN BioAgent UI — 타입 정의
// 기준: UI_설계_기준서_v1.5 + 통합_지침_v2.7
// ═══════════════════════════════════════════

// ── PortTypes 타입 시스템 (A9 inference_ui 기준) ──
export type PortType =
  | 'any' | 'string' | 'int' | 'float' | 'double' | 'boolean'
  | 'vector2' | 'vector3' | 'vector4' | 'color' | 'matrix'
  | 'data' | 'table' | 'image';

export type PortTypeGroup = 'numeric' | 'addable';

export const PORT_TYPE_GROUPS: Record<PortTypeGroup, PortType[]> = {
  numeric: ['float', 'int', 'double', 'matrix', 'vector2', 'vector3', 'vector4', 'color'],
  addable: ['float', 'int', 'double', 'matrix', 'vector2', 'vector3', 'vector4', 'color', 'string'],
};

// 호환성 검사 (A9 PortTypes 규칙)
export function isPortTypeCompatible(outputType: PortType, inputType: PortType): boolean {
  if (inputType === 'any' && outputType !== 'image') return true;
  if (outputType === 'any' && inputType !== 'image') return true;
  if (outputType === inputType) return true;
  if (inputType === 'string') return true; // string input ← 모든 타입 수용
  if (inputType === 'float' && outputType === 'int') return true; // int → float promotion
  if (inputType === 'table' && outputType === 'data') return true;
  if (inputType === 'image' && outputType === 'image') return true;
  // numeric group 호환
  const numGroup = PORT_TYPE_GROUPS.numeric;
  if (numGroup.includes(inputType) && numGroup.includes(outputType)) return true;
  return false;
}

// ── 포트 정의 ──
export interface PortDef {
  id: string;
  name: string;
  type: PortType;
  dir: 'in' | 'out';
  label?: string;
  defaultValue?: unknown;
}

// ── 노드 카테고리 (A6 색상 규약) ──
export type NodeCategory =
  | 'Control / Observe'
  | 'Literature / DB'
  | 'Genomics / Genetics'
  | 'Biochemistry'
  | 'Lab Automation'
  | 'Code Generation'
  | 'General'
  | 'Input'
  | 'Data'
  | 'Tool'
  | 'Math';

export const NODE_CATEGORY_COLORS: Record<string, string> = {
  'Control / Observe': '#3B82F6',
  'Literature / DB': '#0EA5E9',
  'Genomics / Genetics': '#8B5CF6',
  'Biochemistry': '#F59E0B',
  'Lab Automation': '#10B981',
  'Code Generation': '#EF4444',
  'General': '#3B82F6',
  'Input': '#6B7280',
  'Data': '#6B7280',
  'Tool': '#0EA5E9',
  'Math': '#EF4444',
};

// 노드 타입 → 카테고리 매핑 (Biomni 도구 기준)
export function getToolCategory(type: string): string {
  const map: Record<string, string> = {
    step: 'Control / Observe', plan: 'Control / Observe',
    observe: 'Control / Observe', analyze: 'Control / Observe',
    composite: 'General', visualize: 'General', save: 'General', table: 'General',
    pubmed: 'Literature / DB', cbioportal: 'Literature / DB', clinicaltrials: 'Literature / DB',
    dbsnp: 'Genomics / Genetics', ensembl: 'Genomics / Genetics',
    clinvar: 'Genomics / Genetics', crispr: 'Genomics / Genetics',
    ncbi_gene: 'Genomics / Genetics',
    pubchem: 'Biochemistry', chembl: 'Biochemistry', pdb: 'Biochemistry',
    opentrons: 'Lab Automation', pylabrobot: 'Lab Automation', protocol: 'Lab Automation',
    codegen: 'Code Generation', math: 'Code Generation',
    // Math nodes
    add: 'Math', subtract: 'Math', multiply: 'Math', divide: 'Math',
    power: 'Math', sqrt: 'Math', log: 'Math',
    // Input/Data
    string: 'Input', integer: 'Input', float_input: 'Input', double: 'Input',
    boolean: 'Input', vector2: 'Input', vector3: 'Input', vector4: 'Input',
    color: 'Input', matrix2: 'Input', matrix3: 'Input', matrix4: 'Input',
    data_loader: 'Data', image: 'Data',
  };
  return map[type] || 'General';
}

// ── 노드 속성 ──
export interface NodeData {
  id: string;
  type: string;
  category: string;
  title: string;
  toolDisplayName?: string;
  status: NodeStatus;
  x: number;
  y: number;
  ports: { inputs: PortDef[]; outputs: PortDef[] };
  config?: Record<string, unknown>;
  inputSummary?: string;
  outputSummary?: string;
  outputData?: Record<string, unknown>;
  thinkingText: string;
  thinkingStreaming: boolean; // Week 2: 실시간 스트리밍 중인지
  stepNumber?: number;
  durationMs?: number;
  timestamp?: string;
  // 속성 플래그 (A9)
  allowRef?: boolean;
  dataOnly?: boolean;
  result?: boolean;
}

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

// ── 엣지 ──
export type EdgeType = 'flow' | 'reference';

export interface EdgeData {
  id: string;
  type: EdgeType;
  sourceNode: string;
  sourcePort: string;  // Flow: '__header__' / Reference: port id
  targetNode: string;
  targetPort: string;
}

// ── WebSocket 이벤트 (A7 확정 8종) ──
export interface WSUserQuery {
  type: 'user_query';
  data: { message: string };
}

export interface WSChatMessage {
  type: 'chat_message';
  data: {
    id: string; role: 'assistant'; content: string;
    timestamp: string; is_final: boolean;
  };
}

export interface WSNodeCreated {
  type: 'node_created';
  data: {
    node_id: string; step_number: number; type: string;
    category: string; title: string; tool_display_name: string;
    status: NodeStatus;
    ports: {
      inputs: { id: string; name: string; type: string }[];
      outputs: { id: string; name: string; type: string }[];
    };
    input_summary: string; timestamp: string;
  };
}

export interface WSNodeStatusUpdate {
  type: 'node_status_update';
  data: {
    node_id: string; status: NodeStatus;
    output_summary: string; duration_ms: number;
    output_data?: Record<string, unknown>;
    timestamp: string;
  };
}

export interface WSEdgeCreated {
  type: 'edge_created';
  data: {
    edge_id: string; edge_type: string;
    source_node: string; source_port: string;
    target_node: string; target_port: string;
  };
}

export interface WSGraphUpdate {
  type: 'graph_update';
  data: {
    node_id: string; status: NodeStatus;
    result_preview?: string;
    error_message?: string;
    retry_count?: number;
    retry_message?: string;
  };
}

export interface WSNodeThinkingStream {
  type: 'node_thinking_stream';
  data: { node_id: string; chunk: string };
}

export interface WSAnalysisResult {
  type: 'analysis_result';
  data: {
    summary_markdown: string;
    images: { url: string; caption: string }[];
    structured_data: Record<string, unknown>;
  };
}

export type WSEvent =
  | WSUserQuery | WSChatMessage | WSNodeCreated | WSNodeStatusUpdate
  | WSEdgeCreated | WSGraphUpdate | WSNodeThinkingStream | WSAnalysisResult;

// ── 채팅 ──
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  messageCount: number;
}

// ── 벤치마크 (B-01~B-03) ──
export interface BenchmarkConfig {
  dataset: string;
  model: string;
  parameters: { temperature: number; max_tokens: number };
}

export interface BenchmarkJob {
  jobId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: { total: number; current: number; percentage: number };
  metrics?: Record<string, number>;
}

// ── 노드 전체 목록 (31종, A9 inference_ui 기준) ──
export interface NodeTypeDef {
  type: string;
  label: string;
  category: string;
  allowRef?: boolean;
  dataOnly?: boolean;
  result?: boolean;
  defaultPorts: { inputs: PortDef[]; outputs: PortDef[] };
}

export const NODE_TYPE_DEFS: NodeTypeDef[] = [
  // General
  { type: 'step', label: 'Step', category: 'General', allowRef: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'composite', label: 'Composite', category: 'General', allowRef: true,
    defaultPorts: { inputs: [{ id: 'image', name: 'Image', type: 'image', dir: 'in' }, { id: 'prompt', name: 'Prompt', type: 'string', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'visualize', label: 'Visualize', category: 'General', result: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'observe', label: 'Observe', category: 'General', result: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [] } },
  { type: 'save', label: 'Save', category: 'General', result: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [] } },
  { type: 'table', label: 'Table', category: 'General', result: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'table', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'table', dir: 'out' }] } },
  // Input (dataOnly)
  { type: 'string', label: 'String', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'string', dir: 'out' }] } },
  { type: 'integer', label: 'Integer', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'int', dir: 'out' }] } },
  { type: 'float_input', label: 'Float', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'float', dir: 'out' }] } },
  { type: 'double', label: 'Double', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'double', dir: 'out' }] } },
  { type: 'boolean', label: 'Boolean', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'boolean', dir: 'out' }] } },
  { type: 'vector2', label: 'Vector2', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'vector2', dir: 'out' }] } },
  { type: 'vector3', label: 'Vector3', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'vector3', dir: 'out' }] } },
  { type: 'vector4', label: 'Vector4', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'vector4', dir: 'out' }] } },
  { type: 'color', label: 'Color', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'color', dir: 'out' }] } },
  { type: 'matrix2', label: 'Matrix2', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'matrix', dir: 'out' }] } },
  { type: 'matrix3', label: 'Matrix3', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'matrix', dir: 'out' }] } },
  { type: 'matrix4', label: 'Matrix4', category: 'Input', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'matrix', dir: 'out' }] } },
  // Data (dataOnly)
  { type: 'data_loader', label: 'Data Loader', category: 'Data', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'data', dir: 'out' }] } },
  { type: 'image', label: 'Image', category: 'Data', dataOnly: true,
    defaultPorts: { inputs: [], outputs: [{ id: 'out', name: 'Out', type: 'image', dir: 'out' }] } },
  // Tool (allowRef)
  { type: 'analyze', label: 'Analyze', category: 'Tool', allowRef: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'codegen', label: 'CodeGen', category: 'Tool', allowRef: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'pubmed', label: 'PubMed', category: 'Tool', allowRef: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'ncbi_gene', label: 'NCBI Gene', category: 'Tool', allowRef: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'crispr', label: 'CRISPR', category: 'Tool', allowRef: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'protocol', label: 'Protocol', category: 'Tool', allowRef: true,
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  // Math
  { type: 'add', label: 'Add', category: 'Math',
    defaultPorts: { inputs: [{ id: 'a', name: 'A', type: 'any', dir: 'in' }, { id: 'b', name: 'B', type: 'any', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'any', dir: 'out' }] } },
  { type: 'subtract', label: 'Subtract', category: 'Math',
    defaultPorts: { inputs: [{ id: 'a', name: 'A', type: 'float', dir: 'in' }, { id: 'b', name: 'B', type: 'float', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'float', dir: 'out' }] } },
  { type: 'multiply', label: 'Multiply', category: 'Math',
    defaultPorts: { inputs: [{ id: 'a', name: 'A', type: 'float', dir: 'in' }, { id: 'b', name: 'B', type: 'float', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'float', dir: 'out' }] } },
  { type: 'divide', label: 'Divide', category: 'Math',
    defaultPorts: { inputs: [{ id: 'a', name: 'A', type: 'float', dir: 'in' }, { id: 'b', name: 'B', type: 'float', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'float', dir: 'out' }] } },
  { type: 'sqrt', label: 'Sqrt', category: 'Math',
    defaultPorts: { inputs: [{ id: 'in', name: 'In', type: 'float', dir: 'in' }], outputs: [{ id: 'out', name: 'Out', type: 'float', dir: 'out' }] } },
];

// 카테고리별 그룹핑 (CreateNodeMenu용)
export function getNodeTypesByCategory(): Record<string, NodeTypeDef[]> {
  const groups: Record<string, NodeTypeDef[]> = {};
  for (const def of NODE_TYPE_DEFS) {
    if (!groups[def.category]) groups[def.category] = [];
    groups[def.category].push(def);
  }
  return groups;
}

// ── 연결 강제 규칙 (NodeGraph-11) ──
export function validateConnection(
  sourceNode: NodeData, targetNode: NodeData,
  edgeType: EdgeType
): { valid: boolean; message?: string } {
  // Reference 연결: allowRef 노드만 수신 가능
  if (edgeType === 'reference' && !targetNode.allowRef) {
    return { valid: false, message: 'Reference 연결은 Step/Composite/Tool 노드만 수신 가능합니다.' };
  }
  // Image → Step 직접 Flow 연결 금지 (Composite 경유 필수)
  if (edgeType === 'flow' && sourceNode.type === 'image' && targetNode.type === 'step') {
    return { valid: false, message: 'Image 노드는 Step에 직접 연결 불가 — Composite 경유 필수' };
  }
  // dataOnly 노드는 Output만 존재
  if (edgeType === 'flow' && targetNode.dataOnly) {
    return { valid: false, message: 'dataOnly 노드에는 Flow 입력 연결 불가' };
  }
  return { valid: true };
}
