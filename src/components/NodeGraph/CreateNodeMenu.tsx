import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { NODE_CATEGORY_COLORS, getNodeTypesByCategory } from '../../types';
import type { NodeTypeDef } from '../../types';

interface CreateNodeMenuProps {
  x: number;
  y: number;
  onSelect: (def: NodeTypeDef) => void;
  onClose: () => void;
}

const categories = getNodeTypesByCategory();
const categoryOrder = ['General', 'Input', 'Data', 'Tool', 'Math'];

export default function CreateNodeMenu({ x, y, onSelect, onClose }: CreateNodeMenuProps) {
  const [search, setSearch] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>('General');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 검색 필터
  const filtered = search.trim()
    ? Object.entries(categories).reduce((acc, [cat, defs]) => {
        const f = defs.filter(d => d.label.toLowerCase().includes(search.toLowerCase()));
        if (f.length) acc[cat] = f;
        return acc;
      }, {} as Record<string, NodeTypeDef[]>)
    : categories;

  // 화면 밖 방지
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 240),
    top: Math.min(y, window.innerHeight - 400),
    zIndex: 100,
  };

  return (
    <>
      <div className="fixed inset-0 z-[99]" onClick={onClose} />
      <div
        ref={menuRef}
        style={menuStyle}
        className="w-56 rounded-lg border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: 'var(--popup-bg)', borderColor: 'var(--popup-border)' }} className="border rounded-lg">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <Search size={13} style={{ color: 'var(--text-secondary)' }} />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="노드 검색..."
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Categories */}
          <div className="max-h-72 overflow-y-auto py-1">
            {categoryOrder
              .filter(cat => filtered[cat])
              .map(cat => (
                <div key={cat}>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:opacity-80"
                    style={{ color: NODE_CATEGORY_COLORS[cat] || 'var(--text-primary)' }}
                    onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: NODE_CATEGORY_COLORS[cat] || '#6B7280' }}
                    />
                    {cat}
                    <span className="text-[10px] opacity-50 ml-auto">{filtered[cat]?.length}</span>
                  </button>
                  {(expandedCat === cat || search.trim()) && filtered[cat]?.map(def => (
                    <button
                      key={def.type}
                      className="w-full text-left px-6 py-1.5 text-xs hover:brightness-110 transition-all"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                      onClick={() => onSelect(def)}
                    >
                      <span>{def.label}</span>
                      {def.dataOnly && <span className="text-[9px] ml-1 opacity-50">(data)</span>}
                      {def.allowRef && <span className="text-[9px] ml-1 opacity-50">(ref)</span>}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
