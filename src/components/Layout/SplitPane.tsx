import React, { useCallback, useRef, useState } from 'react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  minLeft?: number;  // 기준서 L-01: 최소 300px
}

export default function SplitPane({ left, right, minLeft = 300 }: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(380);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const maxW = rect.width - 200;
      setLeftWidth(Math.max(minLeft, Math.min(maxW, x)));
    };

    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [minLeft]);

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* Left Panel — Chat */}
      <div style={{ width: leftWidth, minWidth: minLeft }} className="shrink-0 overflow-hidden">
        {left}
      </div>

      {/* Splitter Handle (L-01: col-resize 커서) */}
      <div
        onMouseDown={onMouseDown}
        className="splitter-handle w-1 shrink-0 hover:w-1"
        style={{ background: 'var(--border-color)' }}
      />

      {/* Right Panel — NodeGraph (flex: 1) */}
      <div className="flex-1 overflow-hidden">
        {right}
      </div>
    </div>
  );
}
