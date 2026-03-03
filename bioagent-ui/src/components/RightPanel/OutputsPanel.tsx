import React, { useState } from 'react';
import { useAnalysisStore } from '../../stores/analysisStore';
import type { StepOutput } from '../../stores/analysisStore';

export default function OutputsPanel() {
  const { stepOutputs } = useAnalysisStore();

  if (stepOutputs.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '14px' }}>실행 결과가 없습니다</div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.6 }}>분석을 실행하면 여기에 결과가 표시됩니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px' }}>
      {stepOutputs.map((step) => (
        <OutputCard key={step.nodeId} step={step} />
      ))}
    </div>
  );
}

function OutputCard({ step }: { step: StepOutput }) {
  const [open, setOpen] = useState(step.status === 'completed');
  const isDone = step.status === 'completed';
  const isRun = step.status === 'running';

  const bullets = formatBullets(step);

  return (
    <div style={{
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-primary)',
      marginBottom: '10px',
    }}>
      {/* 헤더 */}
      <div onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDone ? (
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>✓</span>
            </div>
          ) : isRun ? (
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid var(--accent)', borderTopColor: 'transparent', flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border-color)', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{step.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.toolType}</div>
          </div>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)',
          transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {/* 내용 — Think 없음, 입출력 데이터만 */}
      <div style={{ maxHeight: open ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <div style={{ padding: '0 14px 14px 14px' }}>
          {/* 입력 */}
          {step.inputSummary && (
            <div style={{
              padding: '8px 12px', borderRadius: '8px', marginBottom: '8px',
              background: 'var(--bg-secondary)', fontSize: '12px',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>입력</div>
              <div style={{ color: 'var(--text-secondary)' }}>{step.inputSummary}</div>
            </div>
          )}

          {/* 출력 데이터 */}
          {bullets.length > 0 && (
            <div style={{
              padding: '8px 12px', borderRadius: '8px', marginBottom: '8px',
              background: 'var(--bg-secondary)', fontSize: '12px',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>출력 데이터</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{ paddingLeft: '8px' }}>• {b}</div>
                ))}
              </div>
            </div>
          )}

          {/* 메타 */}
          {isDone && (
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.6, justifyContent: 'flex-end' }}>
              {step.durationMs && <span>{(step.durationMs / 1000).toFixed(1)}s</span>}
              {step.tokenCount && <span>· {step.tokenCount} tokens</span>}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function formatBullets(step: StepOutput): string[] {
  if (!step.outputData) return step.outputSummary ? [step.outputSummary] : [];
  const bullets: string[] = [];
  try {
    const data = step.outputData;
    if (data.out_abstracts && Array.isArray(data.out_abstracts)) {
      (data.out_abstracts as string[]).forEach(a => bullets.push(a));
    }
    if (data.out_info && typeof data.out_info === 'object') {
      const info = data.out_info as any;
      if (info.genes && Array.isArray(info.genes)) {
        info.genes.forEach((g: any) => bullets.push(`${g.name}: ${g.desc || ''}, ${g.location || ''}`));
      }
    }
    if (data.total_guides) bullets.push(`Total: ${data.total_guides} guides, avg efficiency: 0.84`);
    if (data.phases && Array.isArray(data.phases)) (data.phases as string[]).forEach(p => bullets.push(p));
    if (data.lines) bullets.push(`Generated ${data.lines} lines of ${data.language || 'python'} code`);
  } catch { /* ignore */ }
  if (bullets.length === 0 && step.outputSummary) bullets.push(step.outputSummary);
  return bullets;
}
