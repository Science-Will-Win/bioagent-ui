import React from 'react';
import { Sun, Moon, FlaskConical, MessageSquare, Menu } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function Header() {
  const { theme, currentView, toggleTheme, setView, setSidebar, sidebarOpen } = useAppStore();

  return (
    <header
      className="flex items-center justify-between px-4 h-12 shrink-0 border-b select-none"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebar(!sidebarOpen)}
          className="p-1.5 rounded hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
          title="세션 사이드바"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            BioAgent
          </span>
        </div>
        <select
          className="text-xs px-2 py-1 rounded border ml-2"
          style={{
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)',
          }}
          defaultValue="biomni-a1"
        >
          <option value="biomni-a1">Biomni-A1</option>
          <option value="ministral-3b">Ministral 3B</option>
        </select>
      </div>

      {/* Center — Tabs */}
      <div className="flex gap-1 rounded-lg p-0.5" style={{ background: 'var(--bg-tertiary)' }}>
        <button
          onClick={() => setView('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
            currentView === 'chat' ? 'shadow-sm' : 'opacity-60 hover:opacity-80'
          }`}
          style={{
            background: currentView === 'chat' ? 'var(--bg-primary)' : 'transparent',
            color: 'var(--text-primary)',
          }}
        >
          <MessageSquare size={13} /> Chat + Graph
        </button>
        <button
          onClick={() => setView('benchmark')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
            currentView === 'benchmark' ? 'shadow-sm' : 'opacity-60 hover:opacity-80'
          }`}
          style={{
            background: currentView === 'benchmark' ? 'var(--bg-primary)' : 'transparent',
            color: 'var(--text-primary)',
          }}
        >
          <FlaskConical size={13} /> Benchmark
        </button>
      </div>

      {/* Right */}
      <button
        onClick={toggleTheme}
        className="p-1.5 rounded hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
        title="테마 전환"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  );
}
