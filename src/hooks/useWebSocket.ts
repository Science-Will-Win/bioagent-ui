// ============================================================================
// WebSocket Hook - 실시간 에이전트 이벤트 처리
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import type { WSEvent, Step } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { updateStep, completeStep, addStep, stopAnalysis, addMessage, updateStats } = useStore();

  const connect = useCallback((analysisId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}/${analysisId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected:', analysisId);
    };

    ws.onmessage = (event) => {
      try {
        const wsEvent: WSEvent = JSON.parse(event.data);
        handleEvent(wsEvent);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
    };

    return ws;
  }, []);

  const handleEvent = useCallback((event: WSEvent) => {
    const { type, payload } = event;
    const idx = payload.stepIndex as number;

    switch (type) {
      case 'step:start': {
        const newStep: Step = {
          id: crypto.randomUUID(),
          name: payload.name as string,
          tool: (payload.tool as string) || '',
          status: 'active',
          thought: '',
          action: null,
          result: null,
          graph: null,
          duration: null,
        };
        addStep(newStep);
        break;
      }
      case 'step:thought':
        updateStep(idx, { thought: payload.thought as string });
        break;
      case 'step:action':
        updateStep(idx, {
          action: {
            description: (payload.description as string) || '',
            code: payload.code as string,
            language: (payload.language as string) || 'python',
          },
        });
        break;
      case 'step:result':
        updateStep(idx, {
          result: {
            text: payload.result as string,
            data: payload.data as Record<string, unknown>,
          },
          graph: payload.graph as Step['graph'],
        });
        break;
      case 'step:complete':
        completeStep(idx, payload.duration as number);
        break;
      case 'analysis:complete':
        stopAnalysis();
        updateStats({
          progress: 100,
          elapsedTime: payload.totalDuration as number,
          cost: payload.cost as number,
        });
        addMessage('system', `분석 완료! (${(payload.totalDuration as number).toFixed(1)}초)`);
        break;
      case 'analysis:error':
        stopAnalysis();
        addMessage('system', `오류 발생: ${payload.error}`);
        break;
    }
  }, [updateStep, completeStep, addStep, stopAnalysis, addMessage, updateStats]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { connect, disconnect };
}
