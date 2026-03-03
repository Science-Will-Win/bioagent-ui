import React from 'react';
import { useAppStore } from '../../stores/appStore';
import type { RightPanelTab } from '../../stores/appStore';
import NodeGraphCanvas from '../NodeGraph/NodeGraphCanvas';
import CodePanel from './CodePanel';
import AnalysisPanel from './AnalysisPanel';
import OutputsPanel from './OutputsPanel';

const TAB_ITEMS: { id: RightPanelTab; label: string }[] = [
  { id: 'graph', label: 'Graph' },
  { id: 'code', label: 'Code' },
  { id: 'analysis', label: 'Analysis Plan' },
  { id: 'outputs', label: 'Outputs' },
];

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 탭 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '38px',
          minHeight: '38px',
          paddingLeft: '8px',
          paddingRight: '8px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          zIndex: 10,
        }}
      >
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRightPanelTab(tab.id)}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: rightPanelTab === tab.id ? 600 : 500,
              color: rightPanelTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            {rightPanelTab === tab.id && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '4px',
                  right: '4px',
                  height: '2px',
                  background: 'var(--accent)',
                  borderRadius: '2px',
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {rightPanelTab === 'graph' && <NodeGraphCanvas />}
        {rightPanelTab === 'code' && <CodePanel />}
        {rightPanelTab === 'analysis' && <AnalysisPanel />}
        {rightPanelTab === 'outputs' && <OutputsPanel />}
      </div>
    </div>
  );
}
