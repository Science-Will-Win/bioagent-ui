import { useStore } from '@/stores/useStore';
import { Zap, Target, Globe } from 'lucide-react';
import clsx from 'clsx';
import type { ModelType, AnalysisMode } from '@/types';

const MODELS: { value: ModelType; label: string }[] = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-sonnet', label: 'Claude Sonnet' },
  { value: 'biomni-r0', label: 'Biomni R0-32B' },
];

export function Header() {
  const { settings, setModel, setMode } = useStore();

  return (
    <header className="h-12 bg-surface-1 border-b border-white/5 flex items-center justify-between px-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="font-display text-sm font-semibold tracking-wide text-gray-200">
          AIGEN <span className="text-cyan-400">BioAgent</span>
        </h1>
        <span className="badge badge-cyan">Phase 1</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Language */}
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">
          <Globe className="w-3.5 h-3.5" />
          <span>KO</span>
        </button>

        {/* Model Selector */}
        <select
          value={settings.model}
          onChange={(e) => setModel(e.target.value as ModelType)}
          className="bg-surface-2 border border-white/10 rounded-md px-2.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Mode Toggle */}
        <div className="flex items-center bg-surface-2 rounded-md border border-white/10 p-0.5">
          {(['fast', 'precise'] as AnalysisMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all',
                settings.mode === mode
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {mode === 'fast' ? <Zap className="w-3 h-3" /> : <Target className="w-3 h-3" />}
              {mode === 'fast' ? 'Fast' : 'Precise'}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
