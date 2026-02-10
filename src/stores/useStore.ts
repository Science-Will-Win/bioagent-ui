// ============================================================================
// AIGEN BioAgent - Zustand Store
// 4-Slice Architecture: analysis, ui, stats, settings
// ============================================================================

import { create } from 'zustand';
import type { Step, Message, PanelType, ModelType, AnalysisMode, AnalysisStats, Settings } from '@/types';

interface AnalysisSlice {
  isRunning: boolean;
  currentStep: number;
  steps: Step[];
  query: string;
  messages: Message[];
}

interface UISlice {
  activePanel: PanelType;
  openSteps: number[];
  modalOpen: boolean;
}

interface StatsSlice {
  stats: AnalysisStats;
}

interface SettingsSlice {
  settings: Settings;
}

interface Actions {
  // Analysis
  startAnalysis: (query: string) => void;
  stopAnalysis: () => void;
  updateStep: (index: number, data: Partial<Step>) => void;
  completeStep: (index: number, duration: number) => void;
  addStep: (step: Step) => void;
  // UI
  toggleStep: (index: number) => void;
  setActivePanel: (panel: PanelType) => void;
  setModalOpen: (open: boolean) => void;
  // Messages
  addMessage: (role: Message['role'], text: string) => void;
  // Stats
  updateStats: (stats: Partial<AnalysisStats>) => void;
  // Settings
  setModel: (model: ModelType) => void;
  setMode: (mode: AnalysisMode) => void;
  setApiKey: (provider: 'anthropic' | 'openai', key: string) => void;
  // Reset
  reset: () => void;
}

type Store = AnalysisSlice & UISlice & StatsSlice & SettingsSlice & Actions;

const initialStats: AnalysisStats = {
  progress: 0,
  elapsedTime: 0,
  tokens: 0,
  cost: 0,
  stepsCompleted: 0,
  stepsTotal: 0,
};

const initialSettings: Settings = {
  model: 'gpt-4o-mini',
  mode: 'fast',
  apiKeys: { anthropic: '', openai: '' },
  language: 'ko',
};

export const useStore = create<Store>((set, get) => ({
  // ── Analysis State ──
  isRunning: false,
  currentStep: -1,
  steps: [],
  query: '',
  messages: [],

  // ── UI State ──
  activePanel: null,
  openSteps: [],
  modalOpen: false,

  // ── Stats State ──
  stats: { ...initialStats },

  // ── Settings State ──
  settings: { ...initialSettings },

  // ── Analysis Actions ──
  startAnalysis: (query) => {
    const welcomeMsg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      text: `분석을 시작합니다: "${query}"`,
      timestamp: new Date(),
    };
    set({
      isRunning: true,
      currentStep: 0,
      steps: [],
      query,
      messages: [welcomeMsg],
      openSteps: [0],
      stats: { ...initialStats },
    });
  },

  stopAnalysis: () => set({ isRunning: false }),

  updateStep: (index, data) =>
    set((state) => {
      const steps = [...state.steps];
      if (steps[index]) {
        steps[index] = { ...steps[index], ...data };
      }
      return { steps };
    }),

  completeStep: (index, duration) =>
    set((state) => {
      const steps = [...state.steps];
      if (steps[index]) {
        steps[index] = { ...steps[index], status: 'completed', duration };
      }
      const completed = steps.filter((s) => s.status === 'completed').length;
      return {
        steps,
        currentStep: index + 1,
        openSteps: [...state.openSteps, index + 1],
        stats: {
          ...state.stats,
          stepsCompleted: completed,
          progress: Math.round((completed / steps.length) * 100),
        },
      };
    }),

  addStep: (step) =>
    set((state) => ({
      steps: [...state.steps, step],
      stats: { ...state.stats, stepsTotal: state.steps.length + 1 },
    })),

  // ── UI Actions ──
  toggleStep: (index) =>
    set((state) => ({
      openSteps: state.openSteps.includes(index)
        ? state.openSteps.filter((i) => i !== index)
        : [...state.openSteps, index],
    })),

  setActivePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
    })),

  setModalOpen: (open) => set({ modalOpen: open }),

  // ── Message Actions ──
  addMessage: (role, text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), role, text, timestamp: new Date() },
      ],
    })),

  // ── Stats Actions ──
  updateStats: (stats) =>
    set((state) => ({ stats: { ...state.stats, ...stats } })),

  // ── Settings Actions ──
  setModel: (model) =>
    set((state) => ({ settings: { ...state.settings, model } })),

  setMode: (mode) =>
    set((state) => ({ settings: { ...state.settings, mode } })),

  setApiKey: (provider, key) =>
    set((state) => ({
      settings: {
        ...state.settings,
        apiKeys: { ...state.settings.apiKeys, [provider]: key },
      },
    })),

  // ── Reset ──
  reset: () =>
    set({
      isRunning: false,
      currentStep: -1,
      steps: [],
      query: '',
      messages: [],
      openSteps: [],
      stats: { ...initialStats },
    }),
}));
