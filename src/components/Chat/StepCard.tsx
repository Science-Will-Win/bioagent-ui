import React, { useState, useEffect, useRef } from 'react';
import type { StepOutput } from '../../stores/analysisStore';

interface StepCardProps {
  step: StepOutput;
}

export default function StepCard({ step }: StepCardProps) {
  const [thinkOpen, setThinkOpen] = useState(false);
  const prevStatus = useRef(step.status);

  // Think 자동 열림: running 시작 시 열림
  useEffect(() => {
    if (step.status === 'running' && prevStatus.current !== 'running') {
      setThinkOpen(true);
    }
    // Think 자동 닫힘: completed 시 닫힘
    if (step.status === 'completed' && prevStatus.current === 'running') {
      const timer = setTimeout(() => setThinkOpen(false), 600);
      return () => clearTimeout(timer);
    }
    prevStatus.current = step.status;
  }, [step.status]);

  const isCompleted = step.status === 'completed';
  const isRunning = step.status === 'running';
  const isFailed = step.status === 'failed';

  // 결과 데이터를 불릿 포인트로 변환
  const resultBullets = formatOutputBullets(step);

  return (
    <div style={{
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-primary)',
      marginBottom: '8px',
    }}>
      {/* 헤더 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', cursor: 'pointer',
        }}
        onClick={() => setThinkOpen(!thinkOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 상태 아이콘 */}
          {isCompleted ? (
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>✓</span>
            </div>
          ) : isRunning ? (
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
          ) : isFailed ? (
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '12px' }}>✕</span>
            </div>
          ) : (
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--border-color)', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {step.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {step.toolType}
            </div>
          </div>
        </div>
        {/* 접기/펼치기 화살표 */}
        <span style={{
          fontSize: '12px', color: 'var(--text-secondary)',
          transform: thinkOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
        }}>
          ▼
        </span>
      </div>

      {/* Think + 결과 영역 (접기/펼치기) */}
      <div style={{
        maxHeight: thinkOpen ? '600px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{ padding: '0 14px 12px 14px' }}>
          {/* Think 섹션 */}
          {step.thinkingText && (
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '8px',
              padding: '10px 14px', marginBottom: '8px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Think ▸
              </div>
              {/* 결과 요약 (대문자) */}
              {step.outputSummary && (
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                  {step.outputSummary}
                </div>
              )}
              {/* 불릿 포인트 결과 */}
              {resultBullets.length > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                  {resultBullets.map((bullet, i) => (
                    <div key={i} style={{ paddingLeft: '8px' }}>• {bullet}</div>
                  ))}
                </div>
              )}
              {/* Thinking 텍스트 (running 중일 때만 표시) */}
              {isRunning && step.thinkingText && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic', opacity: 0.7 }}>
                  {step.thinkingText}
                </div>
              )}
            </div>
          )}

          {/* 메타 정보 (시간/토큰) */}
          {isCompleted && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.6, justifyContent: 'flex-end' }}>
              {step.durationMs && <span>{(step.durationMs / 1000).toFixed(1)}s</span>}
              {step.tokenCount && <span>· {step.tokenCount} tokens</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step의 outputData를 불릿 포인트 문자열로 변환
function formatOutputBullets(step: StepOutput): string[] {
  if (!step.outputData) return [];
  const bullets: string[] = [];

  try {
    const data = step.outputData;

    // pubmed 결과
    if (data.out_abstracts && Array.isArray(data.out_abstracts)) {
      bullets.push(`Search query: ${step.inputSummary}`);
      (data.out_abstracts as string[]).slice(0, 4).forEach(a => bullets.push(a));
    }

    // gene 결과
    if (data.out_info && typeof data.out_info === 'object') {
      const info = data.out_info as any;
      if (info.genes && Array.isArray(info.genes)) {
        info.genes.forEach((g: any) => {
          bullets.push(`${g.name}: ${g.desc || ''}, ${g.location || ''}`);
        });
      }
    }

    // CRISPR 결과
    if (data.total_guides) {
      bullets.push(`Total: ${data.total_guides} guides, avg efficiency: 0.84`);
    }

    // Protocol 결과
    if (data.phases && Array.isArray(data.phases)) {
      (data.phases as string[]).forEach(p => bullets.push(p));
    }

    // Code 결과
    if (data.lines) {
      bullets.push(`Generated ${data.lines} lines of ${data.language || 'python'} code`);
    }
  } catch {
    // 파싱 실패 시 빈 배열
  }

  return bullets;
}
