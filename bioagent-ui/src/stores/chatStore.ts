import { create } from 'zustand';
import type { ChatMessage, ChatSession } from '../types';

interface ChatState {
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  isStreaming: boolean;
  globalPlan: string[];

  addMessage: (msg: ChatMessage) => void;
  updateMessageById: (id: string, content: string, isFinal?: boolean) => void;
  updateLastAssistant: (content: string, isFinal: boolean) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;
  setSessions: (s: ChatSession[]) => void;
  setCurrentSession: (id: string | null) => void;
  setGlobalPlan: (steps: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessions: [
    { id: 'demo-1', title: 'BRCA1 변이 분석', preview: 'BRCA1 유전자의 최신 논문...', createdAt: '2026-03-02T10:00:00Z', messageCount: 5 },
    { id: 'demo-2', title: 'T세포 CRISPR 스크린', preview: 'T세포 고갈 메커니즘 분석...', createdAt: '2026-03-01T14:00:00Z', messageCount: 3 },
  ],
  currentSessionId: null,
  isStreaming: false,
  globalPlan: [],

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  // ID 기반 메시지 업데이트 — 중복 방지
  updateMessageById: (id, content, isFinal = false) =>
    set((s) => {
      const msgs = s.messages.map(m => m.id === id ? { ...m, content } : m);
      return { messages: msgs, isStreaming: !isFinal };
    }),

  updateLastAssistant: (content, isFinal) =>
    set((s) => {
      const msgs = [...s.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { messages: msgs, isStreaming: !isFinal };
    }),

  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [], globalPlan: [] }),
  setSessions: (s) => set({ sessions: s }),
  setCurrentSession: (id) => set({ currentSessionId: id }),
  setGlobalPlan: (steps) => set({ globalPlan: steps }),
}));
