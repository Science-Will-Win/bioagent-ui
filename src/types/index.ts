// ============================================================================
// AIGEN BioAgent - Type Definitions
// Based on UI Architecture v2.0
// ============================================================================

export type StepStatus = 'waiting' | 'active' | 'completed' | 'error';
export type AnalysisMode = 'fast' | 'precise';
export type ModelType = 'claude-sonnet' | 'gpt-4o' | 'gpt-4o-mini' | 'biomni-r0';
export type PanelType = 'stats' | 'history' | null;
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ActionData {
  description: string;
  code: string;
  language: string;
}

export interface ResultData {
  text: string;
  data?: Record<string, unknown>;
}

export interface GraphData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
  data: Record<string, unknown>[];
  config?: Record<string, unknown>;
}

export interface Step {
  id: string;
  name: string;
  tool: string;
  status: StepStatus;
  thought: string;
  action: ActionData | null;
  result: ResultData | null;
  graph: GraphData | null;
  duration: number | null;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
}

export interface AnalysisStats {
  progress: number;
  elapsedTime: number;
  tokens: number;
  cost: number;
  stepsCompleted: number;
  stepsTotal: number;
}

export interface Settings {
  model: ModelType;
  mode: AnalysisMode;
  apiKeys: {
    anthropic: string;
    openai: string;
  };
  language: 'ko' | 'en';
}

// WebSocket Event Types
export type WSEventType =
  | 'step:start'
  | 'step:thought'
  | 'step:action'
  | 'step:result'
  | 'step:complete'
  | 'analysis:complete'
  | 'analysis:error';

export interface WSEvent {
  type: WSEventType;
  payload: Record<string, unknown>;
}
