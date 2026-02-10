import { Home, BarChart3, History, Settings, Dna } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import clsx from 'clsx';

const NAV_ITEMS = [
  { icon: Home, label: '홈', panel: null as null },
  { icon: BarChart3, label: '통계', panel: 'stats' as const },
  { icon: History, label: '히스토리', panel: 'history' as const },
];

export function Toolbar() {
  const { activePanel, setActivePanel, setModalOpen } = useStore();

  return (
    <div className="w-14 h-full bg-surface-1 border-r border-white/5 flex flex-col items-center py-4 gap-1">
      {/* Logo */}
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-6">
        <Dna className="w-5 h-5 text-white" />
      </div>

      {/* Nav Items */}
      {NAV_ITEMS.map(({ icon: Icon, label, panel }) => (
        <button
          key={label}
          onClick={() => setActivePanel(panel)}
          className={clsx(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative',
            activePanel === panel
              ? 'bg-cyan-500/15 text-cyan-400'
              : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
          )}
          title={label}
        >
          <Icon className="w-[18px] h-[18px]" />
          <span className="absolute left-12 bg-surface-3 text-xs text-gray-200 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {label}
          </span>
        </button>
      ))}

      <div className="flex-1" />

      {/* Settings */}
      <button
        onClick={() => setModalOpen(true)}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all"
        title="설정"
      >
        <Settings className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}
