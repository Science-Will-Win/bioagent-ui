import { create } from 'zustand';

type ViewMode = 'chat' | 'benchmark';
export type RightPanelTab = 'graph' | 'code' | 'analysis' | 'outputs';
export type LayoutDirection = 'LR' | 'TB'; // Left→Right / Top→Bottom

interface AppState {
  theme: 'dark' | 'light';
  currentView: ViewMode;
  sidebarOpen: boolean;
  rightPanelTab: RightPanelTab;
  layoutDirection: LayoutDirection;
  toggleTheme: () => void;
  setView: (view: ViewMode) => void;
  setSidebar: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setLayoutDirection: (dir: LayoutDirection) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  currentView: 'chat',
  sidebarOpen: false,
  rightPanelTab: 'graph',
  layoutDirection: 'LR',

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      document.body.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),

  setView: (view) => set({ currentView: view }),
  setSidebar: (open) => set({ sidebarOpen: open }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setLayoutDirection: (dir) => set({ layoutDirection: dir }),
}));
