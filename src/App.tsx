import { Toolbar } from '@/components/Toolbar';
import { Header } from '@/components/Header';
import { LeftPanel, RightPanel, SettingsModal } from '@/components/Panels';

export default function App() {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 flex min-h-0">
          <LeftPanel />
          <RightPanel />
        </div>
      </div>

      {/* Modal */}
      <SettingsModal />
    </div>
  );
}
