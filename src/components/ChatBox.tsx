import { useRef, useEffect, useState } from 'react';
import { SendHorizontal, Bot, User, Monitor } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import clsx from 'clsx';

const ROLE_CONFIG = {
  user: { icon: User, color: 'text-cyan-400', bg: 'bg-cyan-500/5', label: 'You' },
  assistant: { icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-500/5', label: 'Agent' },
  system: { icon: Monitor, color: 'text-gray-400', bg: 'bg-white/[0.02]', label: 'System' },
};

export function ChatBox() {
  const { messages, addMessage, isRunning } = useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage('user', input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <Bot className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-xs">분석을 시작하면 대화가 여기에 표시됩니다</p>
          </div>
        ) : (
          messages.map((msg) => {
            const config = ROLE_CONFIG[msg.role];
            const Icon = config.icon;
            return (
              <div key={msg.id} className={clsx('flex gap-2.5 animate-slide-up', config.bg, 'rounded-lg p-3')}>
                <div className={clsx('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5', config.color, 'bg-white/5')}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx('text-[11px] font-semibold', config.color)}>{config.label}</span>
                    <span className="text-[10px] text-gray-600 font-mono">
                      {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2 bg-surface-2 rounded-lg border border-white/5 px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRunning ? '추가 질문...' : '분석 후 질문할 수 있습니다'}
            disabled={!isRunning && messages.length === 0}
            className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 focus:outline-none disabled:opacity-30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="text-gray-500 hover:text-cyan-400 disabled:opacity-20 transition-colors"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
