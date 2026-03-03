import { create } from 'zustand';

// 각 Step의 출력 결과
export interface StepOutput {
  nodeId: string;
  stepNumber: number;
  title: string;
  toolType: string;
  toolDisplayName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  inputSummary: string;
  outputSummary: string;
  outputData?: Record<string, unknown>;
  durationMs?: number;
  tokenCount?: number;
  thinkingText: string;
}

// Step에서 생성된 코드
export interface StepCode {
  nodeId: string;
  stepNumber: number;
  title: string;
  toolType: string;
  language: string;
  code: string;
}

interface AnalysisState {
  // Analysis Plan 마크다운
  analysisMarkdown: string;
  // Step별 출력 결과
  stepOutputs: StepOutput[];
  // 생성된 코드
  stepCodes: StepCode[];

  setAnalysisMarkdown: (md: string) => void;
  addStepOutput: (output: StepOutput) => void;
  updateStepOutput: (nodeId: string, partial: Partial<StepOutput>) => void;
  addStepCode: (code: StepCode) => void;
  clearAll: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysisMarkdown: '',
  stepOutputs: [],
  stepCodes: [],

  setAnalysisMarkdown: (md) => set({ analysisMarkdown: md }),

  addStepOutput: (output) =>
    set((s) => ({
      stepOutputs: [...s.stepOutputs.filter(o => o.nodeId !== output.nodeId), output]
        .sort((a, b) => a.stepNumber - b.stepNumber),
    })),

  updateStepOutput: (nodeId, partial) =>
    set((s) => ({
      stepOutputs: s.stepOutputs.map(o =>
        o.nodeId === nodeId ? { ...o, ...partial } : o
      ),
    })),

  addStepCode: (code) =>
    set((s) => ({
      stepCodes: [...s.stepCodes.filter(c => c.nodeId !== code.nodeId), code]
        .sort((a, b) => a.stepNumber - b.stepNumber),
    })),

  clearAll: () => set({ analysisMarkdown: '', stepOutputs: [], stepCodes: [] }),
}));
