import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useAnalysisStore } from '../../stores/analysisStore';

interface ChatPanelProps {
  onSend: (message: string, images?: File[]) => void;
}

export default function ChatPanel({ onSend }: ChatPanelProps) {
  const { messages, isStreaming } = useChatStore();
  const { stepOutputs } = useAnalysisStore();
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stepOutputs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed, attachedImages.length > 0 ? attachedImages : undefined);
    setInput('');
    setAttachedImages([]);
    setImagePreviews([]);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setAttachedImages(prev => [...prev, ...imageFiles]);
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // progress_card 숨김 — 컴팩트 진행바로 대체
  const visibleMessages = messages.filter(m => m.id !== 'progress_card');
  const progressMsg = messages.find(m => m.id === 'progress_card');
  const isComplete = progressMsg?.content.includes('분석 완료');
  const showProgress = stepOutputs.length > 0;
  const completedCount = stepOutputs.filter(o => o.status === 'completed').length;
  const totalCount = stepOutputs.length;
  const runningStep = stepOutputs.find(o => o.status === 'running');

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {visibleMessages.length === 0 && !showProgress && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-400/20">
                <span className="text-2xl">🧬</span>
              </div>
              <p className="text-sm font-medium">BioAgent에 질문하세요</p>
              <p className="text-xs mt-1 opacity-70">생물의학 연구를 AI가 지원합니다</p>
            </div>
          </div>
        )}

        {visibleMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user' ? 'text-white rounded-br-md' : 'rounded-bl-md'
              }`}
              style={{
                background: msg.role === 'user' ? 'var(--chat-user-bg)' : 'var(--chat-ai-bg)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              }}
            >
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}

        {/* ★ 컴팩트 진행 카드 (Think 없음, 상태+시간+진행바만) */}
        {showProgress && (
          <div style={{
            borderRadius: '12px', overflow: 'hidden',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
          }}>
            {/* Step 목록 */}
            <div style={{ padding: '12px 14px' }}>
              {stepOutputs.map((step) => {
                const isDone = step.status === 'completed';
                const isRun = step.status === 'running';
                const isFail = step.status === 'failed';
                return (
                  <div key={step.nodeId} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 0',
                  }}>
                    {/* 상태 아이콘 */}
                    {isDone ? (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>
                      </div>
                    ) : isRun ? (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', flexShrink: 0, animation: 'spin 0.8s linear infinite' }} />
                    ) : isFail ? (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#fff', fontSize: '10px' }}>✕</span>
                      </div>
                    ) : (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-color)', flexShrink: 0 }} />
                    )}

                    {/* 제목 */}
                    <span style={{
                      flex: 1, fontSize: '13px',
                      color: isDone ? 'var(--text-primary)' : isRun ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: isRun ? 600 : 400,
                    }}>
                      {step.title}
                    </span>

                    {/* 시간 */}
                    {isDone && step.durationMs && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.6 }}>
                        {(step.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}

                    {/* 미니 프로그레스 바 */}
                    <div style={{
                      width: '40px', height: '3px', borderRadius: '2px',
                      background: 'var(--bg-tertiary)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: isDone ? '100%' : isRun ? '60%' : '0%',
                        height: '100%', borderRadius: '2px',
                        background: isDone ? '#10B981' : isRun ? 'var(--accent)' : 'transparent',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 전체 진행률 바 */}
            <div style={{
              padding: '8px 14px', borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                flex: 1, height: '6px', borderRadius: '3px',
                background: 'var(--bg-tertiary)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  height: '100%', borderRadius: '3px',
                  background: isComplete ? '#10B981' : 'var(--accent)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {isComplete ? '✨ 완료' : `${completedCount}/${totalCount}`}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 이미지 미리보기 */}
      {imagePreviews.length > 0 && (
        <div className="px-3 pb-1 shrink-0">
          <div className="flex gap-2 flex-wrap">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt={`첨부 ${i + 1}`}
                  style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                <button onClick={() => removeImage(i)}
                  style={{ position: 'absolute', top: '-5px', right: '-5px', width: '16px', height: '16px', borderRadius: '50%',
                    background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={9} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-end gap-2 rounded-xl border px-3 py-2"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <button onClick={() => fileInputRef.current?.click()} disabled={isStreaming}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30 hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }} title="이미지 첨부">
            <Paperclip size={16} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} disabled={isStreaming}
            placeholder={isStreaming ? '분석 중...' : '질문을 입력하세요...'}
            rows={1} className="flex-1 bg-transparent resize-none outline-none text-sm"
            style={{ color: 'var(--text-primary)', maxHeight: '120px', minHeight: '24px' }}
            onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }} />
          <button onClick={handleSend} disabled={isStreaming || !input.trim()}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            <Send size={14} />
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.5, textAlign: 'center', marginTop: '4px' }}>
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
