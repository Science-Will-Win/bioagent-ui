import React from 'react';
import { X, MessageCircle, Plus } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useChatStore } from '../../stores/chatStore';

export default function SessionSidebar() {
  const { sidebarOpen, setSidebar } = useAppStore();
  const { sessions, currentSessionId, setCurrentSession, clearMessages } = useChatStore();

  const handleNewChat = () => {
    clearMessages();
    setCurrentSession(null);
    setSidebar(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSession(id);
    setSidebar(false);
  };

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* C-04: 슬라이드 인 애니메이션 */}
      <div
        className={`fixed top-0 left-0 h-full z-50 flex flex-col border-r transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 280,
          background: 'var(--sidebar-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 h-12 border-b shrink-0"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            대화 기록
          </span>
          <button
            onClick={() => setSidebar(false)}
            className="p-1 rounded hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 py-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)',
            }}
          >
            <Plus size={14} /> 새 대화
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSession(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                currentSessionId === s.id ? 'ring-1' : ''
              }`}
              style={{
                background: currentSessionId === s.id ? 'var(--bg-tertiary)' : 'transparent',
                color: 'var(--text-primary)',
                ...(currentSessionId === s.id ? { ringColor: 'var(--accent)' } : {}),
              }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={13} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium truncate">{s.title}</span>
              </div>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                {s.preview}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                {new Date(s.createdAt).toLocaleDateString('ko-KR')} · {s.messageCount}개 메시지
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
