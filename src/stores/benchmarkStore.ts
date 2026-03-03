import { create } from 'zustand';
import type { BenchmarkJob } from '../types';

interface BenchmarkState {
  dataset: string;
  model: string;
  temperature: number;
  maxTokens: number;
  currentJob: BenchmarkJob | null;
  pastJobs: BenchmarkJob[];
  isRunning: boolean;

  setDataset: (d: string) => void;
  setModel: (m: string) => void;
  setTemperature: (t: number) => void;
  setMaxTokens: (t: number) => void;
  startJob: (job: BenchmarkJob) => void;
  updateJob: (partial: Partial<BenchmarkJob>) => void;
  completeJob: (metrics: Record<string, number>) => void;
}

export const useBenchmarkStore = create<BenchmarkState>((set) => ({
  dataset: 'biological_causality_1000',
  model: 'ministral_3b_instruct',
  temperature: 0.1,
  maxTokens: 1024,
  currentJob: null,
  pastJobs: [],
  isRunning: false,

  setDataset: (d) => set({ dataset: d }),
  setModel: (m) => set({ model: m }),
  setTemperature: (t) => set({ temperature: t }),
  setMaxTokens: (t) => set({ maxTokens: t }),

  startJob: (job) => set({ currentJob: job, isRunning: true }),
  updateJob: (partial) =>
    set((s) => ({
      currentJob: s.currentJob ? { ...s.currentJob, ...partial } : null,
    })),
  completeJob: (metrics) =>
    set((s) => {
      const completed: BenchmarkJob = {
        ...s.currentJob!,
        status: 'completed',
        progress: { ...s.currentJob!.progress, percentage: 100 },
        metrics,
      };
      return {
        currentJob: completed,
        isRunning: false,
        pastJobs: [completed, ...s.pastJobs],
      };
    }),
}));
