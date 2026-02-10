import { ChevronDown, Check, Loader2, AlertTriangle, Clock, Wrench, Brain, Code, FileText, BarChart3 } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import type { Step } from '@/types';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StepCardProps {
  step: Step;
  index: number;
}

const STATUS_CONFIG = {
  waiting: { icon: Clock, color: 'text-gray-500', ring: 'ring-gray-700', bg: 'bg-gray-500/10' },
  active: { icon: Loader2, color: 'text-cyan-400', ring: 'ring-cyan-500/50', bg: 'bg-cyan-500/10', animate: true },
  completed: { icon: Check, color: 'text-emerald-400', ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/10' },
  error: { icon: AlertTriangle, color: 'text-rose-400', ring: 'ring-rose-500/40', bg: 'bg-rose-500/10' },
};

export function StepCard({ step, index }: StepCardProps) {
  const { openSteps, toggleStep } = useStore();
  const isOpen = openSteps.includes(index);
  const config = STATUS_CONFIG[step.status];
  const StatusIcon = config.icon;

  return (
    <div className={clsx(
      'rounded-xl border transition-all duration-300 animate-slide-up',
      step.status === 'active' ? 'glow-border-active' : 'border-white/5',
      step.status === 'completed' && 'border-emerald-500/15',
    )}>
      {/* Header */}
      <button
        onClick={() => toggleStep(index)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors rounded-xl"
      >
        {/* Status Icon */}
        <div className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center ring-1',
          config.bg, config.ring
        )}>
          <StatusIcon className={clsx('w-4 h-4', config.color, config.animate && 'animate-spin')} />
        </div>

        {/* Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-200 truncate">
              Step {index + 1}: {step.name}
            </span>
            {step.tool && (
              <span className="badge badge-cyan flex items-center gap-1">
                <Wrench className="w-2.5 h-2.5" />
                {step.tool}
              </span>
            )}
          </div>
          {step.duration !== null && (
            <span className="text-[10px] text-gray-500 font-mono">{step.duration.toFixed(1)}s</span>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown className={clsx(
          'w-4 h-4 text-gray-600 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Thought */}
          {step.thought && (
            <Section icon={Brain} label="Thought" color="text-purple-400">
              <p className="text-xs text-gray-400 leading-relaxed">{step.thought}</p>
            </Section>
          )}

          {/* Action */}
          {step.action && (
            <Section icon={Code} label="Action" color="text-cyan-400">
              <p className="text-xs text-gray-400 mb-2">{step.action.description}</p>
              <div className="code-block">
                <pre className="whitespace-pre-wrap">{step.action.code}</pre>
              </div>
            </Section>
          )}

          {/* Result */}
          {step.result && (
            <Section icon={FileText} label="Result" color="text-emerald-400">
              <p className="text-xs text-gray-300 leading-relaxed">{step.result.text}</p>
            </Section>
          )}

          {/* Graph */}
          {step.graph && (
            <Section icon={BarChart3} label="Visualization" color="text-amber-400">
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={step.graph.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey={step.graph.config?.xKey as string || 'name'}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a2332',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar
                      dataKey={step.graph.config?.yKey as string || 'value'}
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  color,
  children,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-2/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={clsx('w-3.5 h-3.5', color)} />
        <span className={clsx('text-[11px] font-semibold uppercase tracking-wider', color)}>{label}</span>
      </div>
      {children}
    </div>
  );
}
