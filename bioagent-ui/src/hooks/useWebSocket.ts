import { useRef, useCallback, useEffect } from 'react';
import { useGraphStore } from '../stores/graphStore';
import { useChatStore } from '../stores/chatStore';
import type { WSEvent, NodeData, PortDef } from '../types';
import { getToolCategory, NODE_CATEGORY_COLORS } from '../types';

interface UseWebSocketOptions {
  url?: string;
  enabled?: boolean;
}

export function useWebSocket({ url, enabled = false }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const { addNode, setNodeStatus, appendNodeThinking, setNodeThinkingDone, addEdge, updateNode } = useGraphStore();
  const { addMessage, updateLastAssistant, setStreaming, setGlobalPlan } = useChatStore();

  const handleEvent = useCallback((event: WSEvent) => {
    switch (event.type) {
      case 'chat_message': {
        const d = event.data;
        if (d.is_final) {
          updateLastAssistant(d.content, true);
        } else {
          // 스트리밍 중 — 마지막 assistant 메시지 업데이트
          updateLastAssistant(d.content, false);
        }
        break;
      }

      case 'node_created': {
        const d = event.data;
        const category = d.category || getToolCategory(d.type);
        addNode({
          id: d.node_id,
          type: d.type,
          category,
          title: d.title,
          toolDisplayName: d.tool_display_name,
          status: d.status,
          x: 60 + (d.step_number - 1) * 280,
          y: 60,
          ports: {
            inputs: d.ports.inputs.map(p => ({ ...p, dir: 'in' as const, type: p.type as any })),
            outputs: d.ports.outputs.map(p => ({ ...p, dir: 'out' as const, type: p.type as any })),
          },
          thinkingText: '',
          thinkingStreaming: false,
          stepNumber: d.step_number,
          inputSummary: d.input_summary,
          timestamp: d.timestamp,
          allowRef: ['step', 'composite', 'analyze', 'codegen', 'pubmed', 'ncbi_gene', 'crispr', 'protocol'].includes(d.type),
          dataOnly: ['string', 'integer', 'float_input', 'double', 'boolean', 'data_loader', 'image'].includes(d.type),
        });
        break;
      }

      case 'node_status_update': {
        const d = event.data;
        setNodeStatus(d.node_id, d.status, {
          outputSummary: d.output_summary,
          durationMs: d.duration_ms,
          outputData: d.output_data,
          timestamp: d.timestamp,
        });
        break;
      }

      case 'edge_created': {
        const d = event.data;
        addEdge({
          id: d.edge_id,
          type: d.edge_type === 'data_reference' ? 'reference' : 'flow',
          sourceNode: d.source_node,
          sourcePort: d.source_port || '__header__',
          targetNode: d.target_node,
          targetPort: d.target_port || '__header__',
        });
        break;
      }

      case 'graph_update': {
        const d = event.data;
        setNodeStatus(d.node_id, d.status, {
          outputSummary: d.result_preview,
        });
        break;
      }

      case 'node_thinking_stream': {
        const d = event.data;
        appendNodeThinking(d.node_id, d.chunk);
        break;
      }

      case 'analysis_result': {
        // Analysis Plan 탭에서만 표시 — 채팅에는 추가하지 않음
        setStreaming(false);
        break;
      }
    }
  }, [addNode, setNodeStatus, appendNodeThinking, setNodeThinkingDone, addEdge, updateNode, addMessage, updateLastAssistant, setStreaming, setGlobalPlan]);

  // WebSocket 연결
  useEffect(() => {
    if (!enabled || !url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => console.log('[WS] Connected:', url);
    ws.onclose = () => console.log('[WS] Disconnected');
    ws.onerror = (e) => console.error('[WS] Error:', e);
    ws.onmessage = (ev) => {
      try {
        const event: WSEvent = JSON.parse(ev.data);
        handleEvent(event);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [enabled, url, handleEvent]);

  // 메시지 전송 (user_query)
  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_query',
        data: { message },
      }));
    }
  }, []);

  return { send, handleEvent };
}
