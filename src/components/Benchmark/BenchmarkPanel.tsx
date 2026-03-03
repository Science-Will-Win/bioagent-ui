import React, { useCallback } from 'react';
import { Play, BarChart3, Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useBenchmarkStore } from '../../stores/benchmarkStore';

const DATASETS = [
  { id: 'biological_causality_1000', name: 'Biological Causality (1,000)', count: 1000 },
  { id: 'biomni_eval1_433', name: 'Biomni-Eval1 (433)', count: 433 },
  { id: 'lab_bench_1967', name: 'LAB-Bench (1,967)', count: 1967 },
  { id: 'bioml_bench_24', name: 'BioML-Bench (24)', count: 24 },
];

const MODELS = [
  { id: 'ministral_3b_instruct', name: 'Ministral 3B Instruct' },
  { id: 'ministral_3b_reasoning', name: 'Ministral 3B Reasoning' },
  { id: 'biomni_a1', name: 'Biomni-A1' },
];

export default function BenchmarkPanel() {
  const {
    dataset, model, temperature, maxTokens,
    currentJob, pastJobs, isRunning,
    setDataset, setModel, setTemperature, setMaxTokens,
    startJob, updateJob, completeJob,
  } = useBenchmarkStore();

  // B-02: Mock 벤치마크 실행
  const handleRun = useCallback(() => {
    const dsInfo = DATASETS.find(d => d.id === dataset);
    const total = dsInfo?.count || 100;

    startJob({
      jobId: `bmark-${Date.now().toString(36)}`,
      status: 'in_progress',
      progress: { total, current: 0, percentage: 0 },
    });

    // 프로그레스 시뮬레이션
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 20) + 5;
      if (current >= total) {
        current = total;
        clearInterval(interval);
        completeJob({
          accuracy: 0.82 + Math.random() * 0.1,
          f1_score: 0.79 + Math.random() * 0.1,
          precision: 0.85 + Math.random() * 0.08,
          recall: 0.78 + Math.random() * 0.1,
        });
      } else {
        updateJob({ progress: { total, current, percentage: (current / total) * 100 } });
      }
    }, 300);
  }, [dataset, startJob, updateJob, completeJob]);

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Title */}
        <div className="flex items-center gap-2">
          <BarChart3 size={20} style={{ color: 'var(--accent)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>벤치마크</h1>
        </div>

        {/* B-01: 설정 */}
        <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Settings size={14} /> 실행 설정
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Dataset</label>
              <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {DATASETS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isRunning}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Temperature</label>
              <input
                type="number"
                step={0.1}
                min={0}
                max={2}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={isRunning}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Max Tokens</label>
              <input
                type="number"
                step={256}
                min={256}
                max={4096}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={14} /> {isRunning ? '실행 중...' : '벤치마크 실행'}
          </button>
        </div>

        {/* B-02: 프로그레스바 */}
        {currentJob && (
          <div className="rounded-xl border p-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {currentJob.status === 'in_progress' ? (
                  <Clock size={14} className="text-blue-400 animate-pulse" />
                ) : currentJob.status === 'completed' ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : (
                  <AlertCircle size={14} className="text-red-400" />
                )}
                {currentJob.jobId}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {currentJob.progress.current} / {currentJob.progress.total}
              </span>
            </div>

            {/* 프로그레스바 */}
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${currentJob.progress.percentage}%`,
                  background: currentJob.status === 'completed' ? '#10B981' : 'var(--accent)',
                }}
              />
            </div>
            <div className="text-right text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {currentJob.progress.percentage.toFixed(1)}%
            </div>

            {/* B-03: 결과 시각화 (완료 시) */}
            {currentJob.metrics && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>결과</h4>

                {/* 막대그래프 */}
                <div className="space-y-2">
                  {Object.entries(currentJob.metrics).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-right capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {key.replace('_', ' ')}
                      </span>
                      <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                        <div
                          className="h-full rounded flex items-center justify-end px-2 text-[10px] font-bold text-white transition-all duration-500"
                          style={{
                            width: `${(value as number) * 100}%`,
                            background: (value as number) > 0.85 ? '#10B981' : (value as number) > 0.7 ? '#F59E0B' : '#EF4444',
                          }}
                        >
                          {((value as number) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 테이블 */}
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)' }}>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Metric</th>
                        <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(currentJob.metrics).map(([key, value]) => (
                        <tr key={key} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td className="px-3 py-1.5 capitalize" style={{ color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {((value as number) * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 이전 실행 결과 */}
        {pastJobs.length > 1 && (
          <div className="rounded-xl border p-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>이전 실행 기록</h4>
            <div className="space-y-2">
              {pastJobs.slice(1).map(job => (
                <div
                  key={job.jobId}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{job.jobId}</span>
                  <div className="flex gap-3">
                    {job.metrics && Object.entries(job.metrics).slice(0, 2).map(([k, v]) => (
                      <span key={k} style={{ color: 'var(--text-secondary)' }}>
                        {k}: {((v as number) * 100).toFixed(1)}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
