import { useState } from 'react';
import { Play, Square, Sparkles } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { runDemoAnalysis } from '@/utils/demo';
import clsx from 'clsx';

const EXAMPLE_QUERIES = [
  'Currarino syndrome과 관련된 유전자 중 DisGeNet에만 있는 유전자를 찾아주세요',
  'BRCA1 변이와 유방암의 연관성을 분석해주세요',
  'GLI1 과발현 시 하향조절되는 유전자 세트를 조회해주세요',
];

export function QueryBox() {
  const { isRunning, startAnalysis, stopAnalysis } = useStore();
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isRunning) return;
    startAnalysis(input.trim());
    runDemoAnalysis(); // demo mode
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4">
      {/* Input Area */}
      <div className={clsx(
        'rounded-xl transition-all duration-300',
        isRunning ? 'glow-border-active' : 'glow-border'
      )}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="연구 질문을 입력하세요..."
          disabled={isRunning}
          rows={4}
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 p-4 resize-none focus:outline-none disabled:opacity-50 font-body"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-[11px] text-gray-600 font-mono">
            {input.length > 0 ? `${input.length}자` : 'Enter로 전송'}
          </span>
          <button
            onClick={isRunning ? stopAnalysis : handleSubmit}
            disabled={!isRunning && !input.trim()}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
              isRunning
                ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed'
            )}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5" />
                중지
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                분석 시작
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example Queries */}
      {!isRunning && !input && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] text-gray-600 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            예시 질문
          </p>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              className="block w-full text-left text-xs text-gray-500 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
