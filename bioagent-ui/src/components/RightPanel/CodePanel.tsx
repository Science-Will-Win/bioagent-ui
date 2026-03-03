import React, { useState } from 'react';
import { useAnalysisStore } from '../../stores/analysisStore';

// GitHub Light 스타일 구문 하이라이팅
function highlightPython(code: string): string {
  let safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return safe
    .replace(/(#.*$)/gm, '<span style="color:#6a737d">$1</span>')
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span style="color:#032f62">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#032f62">$1</span>')
    .replace(/\b(import|from|def|class|return|if|else|elif|for|in|while|try|except|finally|with|as|yield|lambda|not|and|or|is|True|False|None|raise|pass|break|continue)\b/g,
      '<span style="color:#d73a49">$1</span>')
    .replace(/\b(print|len|range|int|float|str|list|dict|set|tuple|type|isinstance|enumerate|zip|map|filter|sorted|sum|min|max|abs|round|open)\b/g,
      '<span style="color:#6f42c1">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#005cc5">$1</span>')
    .replace(/\b(self)\b/g, '<span style="color:#005cc5">$1</span>');
}

export default function CodePanel() {
  const { stepCodes } = useAnalysisStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, nodeId: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(nodeId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (stepCodes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>💻</div>
          <div style={{ fontSize: '14px' }}>생성된 코드가 없습니다</div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.6 }}>분석을 실행하면 여기에 코드가 표시됩니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {stepCodes.map((c) => (
        <div key={c.nodeId} style={{ borderBottom: '1px solid var(--border-color)' }}>
          {/* 헤더 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                Step {c.stepNumber}: {c.title}
              </span>
              <span style={{
                fontSize: '11px', padding: '1px 8px', borderRadius: '10px',
                background: 'var(--accent)', color: '#fff',
              }}>
                {c.language}
              </span>
            </div>
            <button
              onClick={() => handleCopy(c.code, c.nodeId)}
              style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                background: 'var(--accent)', border: 'none',
                color: '#fff', cursor: 'pointer',
              }}
            >
              {copiedId === c.nodeId ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          {/* 코드 본문 — GitHub Light 스타일 */}
          <div style={{
            padding: '16px', fontSize: '13px', lineHeight: '1.7',
            overflowX: 'auto',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontFamily: "'Consolas', 'Monaco', 'Fira Code', monospace",
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightPython(c.code) }} />
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
