// ============================================================================
// Panel Components
// ============================================================================

import { useStore } from '@/stores/useStore';
import { QueryBox } from './QueryBox';
import { ChatBox } from './ChatBox';
import { StepCard } from './StepCard';
import { Activity, Timer, Coins, Hash, X, Key } from 'lucide-react';
import { useState } from 'react';

// ── Left Panel ──
export function LeftPanel() {
  const { stats, isRunning } = useStore();

  return (
    <div className="w-[380px] border-r border-white/5 flex flex-col bg-surface-1/50">
      <QueryBox />

      {/* Mini Stats */}
      {isRunning && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-2">
            <MiniStat icon={Activity} value={`${stats.progress}%`} label="진행" />
            <MiniStat icon={Timer} value={`${stats.elapsedTime.toFixed(0)}s`} label="시간" />
            <MiniStat icon={Hash} value={`${stats.tokens}`} label="토큰" />
            <MiniStat icon={Coins} value={`$${stats.cost.toFixed(3)}`} label="비용" />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Chat */}
      <ChatBox />
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="bg-surface-2 rounded-lg px-2 py-1.5 text-center">
      <Icon className="w-3 h-3 text-cyan-400/60 mx-auto mb-0.5" />
      <p className="text-[11px] font-mono font-semibold text-gray-200">{value}</p>
      <p className="text-[9px] text-gray-600">{label}</p>
    </div>
  );
}

// ── Right Panel ──
export function RightPanel() {
  const { steps, isRunning, query } = useStore();

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {steps.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Query Header */}
          <div className="glass rounded-xl p-4 mb-6">
            <p className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider mb-1">분석 쿼리</p>
            <p className="text-sm text-gray-200">{query}</p>
          </div>

          {/* Pipeline Steps */}
          <div className="space-y-3">
            {steps.map((step, i) => (
              <StepCard key={step.id} step={step} index={i} />
            ))}
          </div>

          {/* Running Indicator */}
          {isRunning && (
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-2 text-cyan-400/60">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono">에이전트 실행 중...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-600">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/10 flex items-center justify-center mb-6">
        <Activity className="w-8 h-8 text-cyan-500/40" />
      </div>
      <h3 className="text-sm font-medium text-gray-400 mb-2">파이프라인 대기 중</h3>
      <p className="text-xs text-gray-600 text-center max-w-sm leading-relaxed">
        왼쪽 패널에서 연구 질문을 입력하고 분석을 시작하면<br />
        에이전트 실행 과정이 여기에 실시간으로 표시됩니다
      </p>
    </div>
  );
}

// ── Settings Modal ──
export function SettingsModal() {
  const { modalOpen, setModalOpen, settings, setApiKey } = useStore();
  const [anthKey, setAnthKey] = useState(settings.apiKeys.anthropic);
  const [oaiKey, setOaiKey] = useState(settings.apiKeys.openai);

  if (!modalOpen) return null;

  const handleSave = () => {
    setApiKey('anthropic', anthKey);
    setApiKey('openai', oaiKey);
    setModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
      <div className="relative glass rounded-2xl w-[420px] p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-200">API 설정</h2>
          </div>
          <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1.5 block">Anthropic API Key</label>
            <input
              type="password"
              value={anthKey}
              onChange={(e) => setAnthKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1.5 block">OpenAI API Key</label>
            <input
              type="password"
              value={oaiKey}
              onChange={(e) => setOaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-200">
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/20"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
