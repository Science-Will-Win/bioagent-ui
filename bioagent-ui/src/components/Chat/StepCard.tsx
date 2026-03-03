import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, Pencil, Copy, ChevronDown, Check } from 'lucide-react';
import type { StepOutput } from '../../stores/analysisStore';
import { useAnalysisStore } from '../../stores/analysisStore';

interface StepCardProps {
  step: StepOutput;
  onAskQuestion?: (stepNumber: number, question: string) => void;
}

export default function StepCard({ step, onAskQuestion }: StepCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevStatus = useRef(step.status);
  const { updateStepOutput } = useAnalysisStore();

  // running → 자동 펼침, completed → 0.5초 후 자동 접힘
  useEffect(() => {
    if (step.status === 'running' && prevStatus.current !== 'running') {
      setOpen(true);
      setRegenerating(false);
    }
    if (step.status === 'completed' && prevStatus.current === 'running') {
      const timer = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(timer);
    }
    prevStatus.current = step.status;
  }, [step.status]);

  const isCompleted = step.status === 'completed';
  const isRunning = step.status === 'running';
  const isFailed = step.status === 'failed';

  const resultBullets = formatOutputBullets(step);
  const resultText = resultBullets.join('\n');

  // ── 액션: 편집 ──
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(resultText || step.outputSummary || '');
    setEditing(true);
    setOpen(true);
  }, [resultText, step.outputSummary]);

  const handleSave = useCallback(() => {
    updateStepOutput(step.nodeId, { outputSummary: editText });
    setEditing(false);
  }, [step.nodeId, editText, updateStepOutput]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  // ── 액션: 재시도 ──
  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRegenerating(true);
    setOpen(true);
    // Mock: 2초 후 재생성 완료
    setTimeout(() => {
      setRegenerating(false);
      updateStepOutput(step.nodeId, {
        outputSummary: step.outputSummary + ' (regenerated)',
      });
    }, 2000);
  }, [step.nodeId, step.outputSummary, updateStepOutput]);

  // ── 액션: 복사 ──
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${step.title}\n${step.outputSummary}\n${resultText}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [step.title, step.outputSummary, resultText]);

  return (
    <div style={{
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-primary)',
      marginBottom: '8px',
    }}>
      {/* ═══ 헤더 ═══ */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', cursor: 'pointer',
        }}
        onClick={() => !editing && setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <StatusIcon status={step.status} />
          <div style={{ minWidth: 0 }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (isCompleted && onAskQuestion) onAskQuestion(step.stepNumber, '');
              }}
              style={{
                fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                cursor: isCompleted ? 'pointer' : 'default',
              }}
              title={isCompleted ? `Step ${step.stepNumber}에 대해 질문하기` : undefined}
            >
              {step.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {step.toolType}
            </div>
          </div>
        </div>

        {/* ═══ 액션 아이콘 (inference_ui 스타일) ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {isCompleted && (
            <>
              <ActionBtn icon={<RotateCw size={13} />} title="재시도" onClick={handleRetry} />
              <ActionBtn icon={<Pencil size={13} />} title="편집" onClick={handleEdit} />
              <ActionBtn
                icon={copied ? <Check size={13} /> : <Copy size={13} />}
                title="복사" onClick={handleCopy} highlight={copied}
              />
            </>
          )}
          <ActionBtn
            icon={<ChevronDown size={14} style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }} />}
            title={open ? '접기' : '펼치기'}
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          />
        </div>
      </div>

      {/* ═══ 펼침 영역 ═══ */}
      <div style={{
        maxHeight: open ? '600px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{ padding: '0 12px 12px 12px' }}>

          {/* 재시도 중 */}
          {regenerating && (
            <div style={{
              padding: '14px', borderRadius: '8px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <RotateCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              LLM is regenerating...
            </div>
          )}

          {/* 편집 모드 */}
          {editing && !regenerating && (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{
                  width: '100%', minHeight: '100px', padding: '10px 12px',
                  borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  fontSize: '13px', lineHeight: '1.6', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button onClick={handleCancel} style={{
                  padding: '5px 16px', borderRadius: '6px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button onClick={handleSave} style={{
                  padding: '5px 16px', borderRadius: '6px',
                  border: 'none', background: 'var(--accent)', color: '#fff',
                  fontSize: '12px', cursor: 'pointer', fontWeight: 600,
                }}>
                  Save
                </button>
              </div>
            </div>
          )}

          {/* 일반 표시 모드 */}
          {!editing && !regenerating && (
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '8px',
              padding: '10px 14px',
            }}>
              {/* Think ▸ */}
              {(step.thinkingText || isRunning) && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Think ▸
                </div>
              )}

              {/* 결과 요약 (대문자) */}
              {isCompleted && step.outputSummary && (
                <div style={{
                  fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600,
                  marginBottom: '6px', textTransform: 'uppercase',
                }}>
                  {step.outputSummary}
                </div>
              )}

              {/* 불릿 포인트 결과 */}
              {isCompleted && resultBullets.length > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  {resultBullets.map((bullet, i) => (
                    <div key={i} style={{ paddingLeft: '8px' }}>• {bullet}</div>
                  ))}
                </div>
              )}

              {/* Thinking 텍스트 (running 중) */}
              {isRunning && step.thinkingText && (
                <div style={{
                  fontSize: '12px', color: 'var(--text-secondary)',
                  marginTop: '4px', fontStyle: 'italic', opacity: 0.8, lineHeight: '1.7',
                }}>
                  {step.thinkingText}
                </div>
              )}
            </div>
          )}

          {/* 메타 정보 */}
          {isCompleted && !editing && !regenerating && (
            <div style={{
              display: 'flex', gap: '8px', fontSize: '11px',
              color: 'var(--text-secondary)', opacity: 0.6,
              justifyContent: 'flex-end', marginTop: '6px',
            }}>
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

// ── 상태 아이콘 ──
function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return (
    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>✓</span>
    </div>
  );
  if (status === 'running') return (
    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
  );
  if (status === 'failed') return (
    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: '#fff', fontSize: '12px' }}>✕</span>
    </div>
  );
  return <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--border-color)', flexShrink: 0 }} />;
}

// ── 액션 버튼 ──
function ActionBtn({ icon, title, onClick, highlight }: {
  icon: React.ReactNode; title: string;
  onClick: (e: React.MouseEvent) => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick} title={title}
      style={{
        width: '28px', height: '28px', borderRadius: '6px',
        border: '1px solid var(--border-color)',
        background: highlight ? '#10B981' : 'var(--bg-secondary)',
        color: highlight ? '#fff' : 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!highlight) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
      onMouseLeave={(e) => { if (!highlight) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
    >
      {icon}
    </button>
  );
}

// ── 출력 데이터 → 불릿 변환 ──
function formatOutputBullets(step: StepOutput): string[] {
  if (!step.outputData) return [];
  const bullets: string[] = [];
  try {
    const data = step.outputData;
    if (data.out_abstracts && Array.isArray(data.out_abstracts))
      (data.out_abstracts as string[]).forEach(a => bullets.push(a));
    if (data.out_info && typeof data.out_info === 'object') {
      const info = data.out_info as any;
      if (info.genes && Array.isArray(info.genes))
        info.genes.forEach((g: any) => bullets.push(`${g.name}: ${g.desc || ''}, ${g.location || ''}`));
    }
    if (data.total_guides) bullets.push(`Total: ${data.total_guides} guides, avg efficiency: 0.84`);
    if (data.phases && Array.isArray(data.phases)) (data.phases as string[]).forEach(p => bullets.push(p));
    if (data.lines) bullets.push(`Generated ${data.lines} lines of ${data.language || 'python'} code`);
  } catch { /* ignore */ }
  return bullets;
}
