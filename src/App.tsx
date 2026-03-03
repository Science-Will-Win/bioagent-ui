import React, { useCallback } from 'react';
import Header from './components/Layout/Header';
import SplitPane from './components/Layout/SplitPane';
import ChatPanel from './components/Chat/ChatPanel';
import SessionSidebar from './components/Chat/SessionSidebar';
import RightPanel from './components/RightPanel/RightPanel';
import BenchmarkPanel from './components/Benchmark/BenchmarkPanel';
import { useAppStore } from './stores/appStore';
import { useChatStore } from './stores/chatStore';
import { useGraphStore } from './stores/graphStore';
import { useAnalysisStore } from './stores/analysisStore';
import { useWebSocket } from './hooks/useWebSocket';
import type { WSEvent, NodeStatus } from './types';

export default function App() {
  const { currentView, setRightPanelTab, layoutDirection } = useAppStore();
  const { addMessage, updateMessageById, setStreaming, setGlobalPlan } = useChatStore();
  const { clearGraph } = useGraphStore();
  const { clearAll: clearAnalysis, addStepOutput, updateStepOutput, addStepCode, setAnalysisMarkdown } = useAnalysisStore();
  const { handleEvent } = useWebSocket({ enabled: false });

  const runMockDemo = useCallback((userMessage: string) => {
    clearGraph();
    clearAnalysis();
    setStreaming(true);
    setRightPanelTab('graph');

    const planSteps = [
      'Step 1: PubMed 논문 검색',
      'Step 2: NCBI Gene 유전자 정보',
      'Step 3: ClinVar 변이 분석',
      'Step 4: 결과 종합 분석',
      'Step 5: 코드 생성 (시각화)',
    ];
    setGlobalPlan(planSteps);

    // 초기 assistant 메시지
    addMessage({
      id: 'initial_response',
      role: 'assistant',
      content: '계획을 수립하겠습니다.',
      timestamp: new Date().toISOString(),
    });

    // 진행 상태 관리용 (ChatPanel에서 isStreaming 제어)
    const progressId = 'progress_card';
    addMessage({
      id: progressId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    });

    // 완료 추적 (streaming 상태 제어용)
    const completedCount = { value: 0 };

    const steps: Array<{
      delay: number; nodeEvent: WSEvent; thinkingChunks: string[];
      statusEvent: WSEvent; edgeEvent?: WSEvent;
      meta: { title: string; toolType: string; toolDisplayName: string; stepNumber: number; inputSummary: string };
      code?: { language: string; code: string };
    }> = [
      {
        delay: 500,
        nodeEvent: { type: 'node_created', data: {
          node_id: 'node_1', step_number: 1, type: 'pubmed',
          category: 'Literature / DB', title: 'Search PubMed',
          tool_display_name: 'PubMed 논문 검색', status: 'pending' as NodeStatus,
          ports: { inputs: [{ id: 'in_query', name: 'Query', type: 'string' }, { id: 'in_limit', name: 'Limit', type: 'int' }], outputs: [{ id: 'out_abstracts', name: 'Abstracts', type: 'any' }] },
          input_summary: 'BRCA1, max 3 papers', timestamp: new Date().toISOString(),
        }},
        thinkingChunks: [
          'T세포 고갈(exhaustion)과 관련된 CRISPR 스크린 연구를 검색해야 합니다. ',
          'PubMed에서 "T cell exhaustion CRISPR screen" 키워드로 최신 논문을 조회합니다. ',
          'Chen et al. (2023)의 genome-wide CRISPR 스크린이 핵심 참고 문헌입니다. ',
          'TOX, PDCD1, LAG3, HAVCR2, TIGIT 등 고갈 관련 유전자들이 주요 타겟으로 보입니다. ',
          '847편의 관련 논문에서 주요 후보 유전자 목록을 추출합니다.',
        ],
        statusEvent: { type: 'node_status_update', data: {
          node_id: 'node_1', status: 'completed' as NodeStatus,
          output_summary: 'Found 847 related papers', duration_ms: 3200,
          output_data: {
            out_abstracts: [
              'Search query: T cell exhaustion CRISPR screen',
              'Key papers: Chen et al. (2023) - Genome-wide CRISPR screen identifies PDCD1 regulators',
              'Wei et al. (2024) - In vivo CRISPR screen of T cell exhaustion genes',
              'Top candidate genes: TOX, PDCD1, LAG3, HAVCR2, TIGIT',
            ]
          },
          timestamp: new Date().toISOString(),
        }},
        meta: { title: '관련 문헌 검색', toolType: 'pubmed_search', toolDisplayName: 'PubMed 논문 검색', stepNumber: 1, inputSummary: 'BRCA1, max 3 papers' },
      },
      {
        delay: 4000,
        nodeEvent: { type: 'node_created', data: {
          node_id: 'node_2', step_number: 2, type: 'ncbi_gene',
          category: 'Genomics / Genetics', title: 'NCBI Gene Info',
          tool_display_name: 'NCBI Gene 유전자 정보', status: 'pending' as NodeStatus,
          ports: { inputs: [{ id: 'in_gene', name: 'Gene', type: 'string' }], outputs: [{ id: 'out_info', name: 'Gene Info', type: 'any' }] },
          input_summary: 'BRCA1 (Gene ID: 672)', timestamp: new Date().toISOString(),
        }},
        thinkingChunks: [
          'PubMed 검색 결과에서 가장 빈번하게 언급된 유전자들을 NCBI Gene에서 확인합니다. ',
          'TOX는 8q12.1에 위치한 T세포 고갈의 핵심 전사인자입니다. ',
          'PDCD1(PD-1)은 2q37.3에 위치한 억제 수용체로, 면역 체크포인트 치료의 주요 타겟입니다. ',
          'LAG3, HAVCR2(TIM-3), TIGIT 등 공동 억제 수용체들도 함께 조회합니다. ',
          '총 8개 유전자의 염색체 위치, 기능, 관련 질병 정보를 종합합니다.',
        ],
        statusEvent: { type: 'node_status_update', data: {
          node_id: 'node_2', status: 'completed' as NodeStatus,
          output_summary: 'Retrieved info for 8 genes', duration_ms: 3100,
          output_data: { out_info: { genes: [
            { name: 'TOX', desc: 'key exhaustion transcription factor', location: 'chr 8q12.1' },
            { name: 'PDCD1', desc: 'PD-1 inhibitory receptor', location: 'chr 2q37.3' },
            { name: 'LAG3', desc: 'inhibitory receptor', location: 'chr 12p13.32' },
            { name: 'HAVCR2', desc: 'TIM-3 receptor', location: 'chr 5q33.3' },
            { name: 'TIGIT', desc: 'co-inhibitory receptor', location: 'chr 3q13.31' },
            { name: 'CTLA4', desc: 'co-inhibitory receptor', location: 'chr 2q33.2' },
            { name: 'CD28', desc: 'co-stimulatory receptor', location: 'chr 2q33.2' },
            { name: 'EOMES', desc: 'T-box transcription factor', location: 'chr 3p24.1' },
          ]}},
          timestamp: new Date().toISOString(),
        }},
        edgeEvent: { type: 'edge_created', data: { edge_id: 'edge_1', edge_type: 'flow', source_node: 'node_1', source_port: '__header__', target_node: 'node_2', target_port: '__header__' }},
        meta: { title: '후보 유전자 식별', toolType: 'ncbi_gene', toolDisplayName: 'NCBI Gene 유전자 정보', stepNumber: 2, inputSummary: 'TOX, PDCD1, LAG3 등 8개 핵심 유전자' },
      },
      {
        delay: 7500,
        nodeEvent: { type: 'node_created', data: {
          node_id: 'node_3', step_number: 3, type: 'clinvar',
          category: 'Genomics / Genetics', title: 'ClinVar Analysis',
          tool_display_name: 'ClinVar 변이 분석', status: 'pending' as NodeStatus,
          ports: { inputs: [{ id: 'in_gene', name: 'Gene', type: 'string' }], outputs: [{ id: 'out_variants', name: 'Variants', type: 'any' }, { id: 'out_stats', name: 'Stats', type: 'any' }] },
          input_summary: 'BRCA1 pathogenic variants', timestamp: new Date().toISOString(),
        }},
        thinkingChunks: [
          '8개 후보 유전자에 대해 CRISPR 가이드 RNA를 설계합니다. ',
          '각 유전자당 3개의 sgRNA를 설계하여 off-target 효과를 최소화합니다. ',
          'TOX: 3개 sgRNA (efficiency: 0.85, 0.82, 0.79), PDCD1: 3개 (0.91, 0.88, 0.84). ',
          'LAG3: 3개 sgRNA (0.87, 0.83, 0.80), 총 24개 가이드 RNA 설계 완료. ',
          '평균 효율 0.84로 높은 편집 효율이 예상됩니다.',
        ],
        statusEvent: { type: 'node_status_update', data: {
          node_id: 'node_3', status: 'completed' as NodeStatus,
          output_summary: 'Designed 24 guide RNAs (avg eff: 0.84)', duration_ms: 4500,
          output_data: { total_guides: 24 },
          timestamp: new Date().toISOString(),
        }},
        edgeEvent: { type: 'edge_created', data: { edge_id: 'edge_2', edge_type: 'flow', source_node: 'node_2', source_port: '__header__', target_node: 'node_3', target_port: '__header__' }},
        meta: { title: 'CRISPR 가이드 RNA 설계', toolType: 'crispr_designer', toolDisplayName: 'CRISPR 가이드 RNA 설계', stepNumber: 3, inputSummary: '24개의 가이드 RNA 설계' },
      },
      {
        delay: 11000,
        nodeEvent: { type: 'node_created', data: {
          node_id: 'node_4', step_number: 4, type: 'analyze',
          category: 'Control / Observe', title: 'Risk Analysis',
          tool_display_name: '위험도 종합 분석', status: 'pending' as NodeStatus,
          ports: { inputs: [{ id: 'in_papers', name: 'Papers', type: 'any' }, { id: 'in_variants', name: 'Variants', type: 'any' }], outputs: [{ id: 'out_risk', name: 'Risk Score', type: 'any' }] },
          input_summary: '논문 3편 + 변이 데이터 종합', timestamp: new Date().toISOString(),
        }},
        thinkingChunks: [
          '수집한 논문, 유전자 정보, sgRNA 설계 결과를 종합하여 실험 프로토콜을 작성합니다. ',
          'Week 1-2: sgRNA 라이브러리 클로닝 및 렌티바이러스 패키징. ',
          'Week 3-4: T세포 형질전환 및 선별, Week 5-8: 고갈 유도 배양. ',
          'Week 9-10: FACS 기반 고갈/기능 T세포 분리, Week 11-12: NGS 시퀀싱 및 분석. ',
          '12주 계획으로 체계적인 CRISPR 스크린 프로토콜을 완성합니다.',
        ],
        statusEvent: { type: 'node_status_update', data: {
          node_id: 'node_4', status: 'completed' as NodeStatus,
          output_summary: '실험 프로토콜 생성 완료 (12주)', duration_ms: 1800,
          output_data: { phases: ['Week 1-2: sgRNA library cloning'] },
          timestamp: new Date().toISOString(),
        }},
        edgeEvent: { type: 'edge_created', data: { edge_id: 'edge_3', edge_type: 'flow', source_node: 'node_3', source_port: '__header__', target_node: 'node_4', target_port: '__header__' }},
        meta: { title: '실험 프로토콜 작성', toolType: 'protocol_builder', toolDisplayName: '실험 프로토콜 작성', stepNumber: 4, inputSummary: '12주 계획 작성' },
      },
      {
        delay: 14500,
        nodeEvent: { type: 'node_created', data: {
          node_id: 'node_5', step_number: 5, type: 'codegen',
          category: 'Code Generation', title: 'Visualize Results',
          tool_display_name: '시각화 코드 생성', status: 'pending' as NodeStatus,
          ports: { inputs: [{ id: 'in_data', name: 'Data', type: 'any' }], outputs: [{ id: 'out_code', name: 'Code', type: 'string' }] },
          input_summary: '위험도 분석 결과 → 차트', timestamp: new Date().toISOString(),
        }},
        thinkingChunks: [
          'CRISPR 스크린 결과 분석을 위한 Python 코드를 작성합니다. ',
          'pandas로 sgRNA count 데이터를 로드하고 CPM 정규화를 수행합니다. ',
          'log2 fold change를 계산하여 고갈 vs 기능 T세포 간 차이를 정량화합니다. ',
          'scipy.stats의 t-test로 통계적 유의성을 검증하고 FDR 보정을 적용합니다. ',
          '총 35줄의 분석 파이프라인 코드를 생성합니다.',
        ],
        statusEvent: { type: 'node_status_update', data: {
          node_id: 'node_5', status: 'completed' as NodeStatus,
          output_summary: '데이터 분석 코드 35줄 생성', duration_ms: 950,
          output_data: { lines: 35, language: 'python' },
          timestamp: new Date().toISOString(),
        }},
        edgeEvent: { type: 'edge_created', data: { edge_id: 'edge_4', edge_type: 'flow', source_node: 'node_4', source_port: '__header__', target_node: 'node_5', target_port: '__header__' }},
        meta: { title: '데이터 분석 코드 생성', toolType: 'code_gen', toolDisplayName: '데이터 분석 코드 생성', stepNumber: 5, inputSummary: '위험도 분석 결과 → 차트' },
        code: { language: 'python', code: `import pandas as pd
import numpy as np
from scipy import stats

def analyze_crispr_screen(counts_file):
    """Analyze CRISPR screen results."""
    counts = pd.read_csv(counts_file)
    total_reads = counts.sum(axis=0)
    normalized = counts.div(total_reads) * 1e6  # CPM

    exhausted = [c for c in counts.columns if "exhausted" in c]
    functional = [c for c in counts.columns if "functional" in c]

    lfc = np.log2(normalized[exhausted].mean(axis=1) + 1) \\
        - np.log2(normalized[functional].mean(axis=1) + 1)

    pvalues = []
    for idx in counts.index:
        _, p = stats.ttest_ind(
            normalized.loc[idx, exhausted],
            normalized.loc[idx, functional])
        pvalues.append(p)

    results = pd.DataFrame({
        'sgRNA': counts.index,
        'log2FC': lfc.values,
        'pvalue': pvalues
    })
    results['padj'] = stats.false_discovery_control(results['pvalue'])
    results = results.sort_values('padj')

    print(f"Total sgRNAs analyzed: {len(results)}")
    print(f"Significant hits: {(results['padj'] < 0.05).sum()}")
    return results` },
      },
    ];

    const refEdges: WSEvent[] = [
      { type: 'edge_created', data: { edge_id: 'edge_ref_1', edge_type: 'data_reference', source_node: 'node_1', source_port: 'out_abstracts', target_node: 'node_4', target_port: 'in_papers' }},
      { type: 'edge_created', data: { edge_id: 'edge_ref_2', edge_type: 'data_reference', source_node: 'node_3', source_port: 'out_variants', target_node: 'node_4', target_port: 'in_variants' }},
    ];

    steps.forEach(({ delay, nodeEvent, thinkingChunks, statusEvent, edgeEvent, meta, code }) => {
      const nodeId = (nodeEvent as any).data.node_id;

      setTimeout(() => {
        handleEvent(nodeEvent);
        addStepOutput({ nodeId, stepNumber: meta.stepNumber, title: meta.title, toolType: meta.toolType, toolDisplayName: meta.toolDisplayName, status: 'pending', inputSummary: meta.inputSummary, outputSummary: '', thinkingText: '' });
      }, delay);

      setTimeout(() => {
        handleEvent({ type: 'graph_update', data: { node_id: nodeId, status: 'running' } } as WSEvent);
        updateStepOutput(nodeId, { status: 'running' });
      }, delay + 200);

      let fullThinking = '';
      thinkingChunks.forEach((chunk, ci) => {
        setTimeout(() => {
          handleEvent({ type: 'node_thinking_stream', data: { node_id: nodeId, chunk } } as WSEvent);
          fullThinking += chunk;
          updateStepOutput(nodeId, { thinkingText: fullThinking });
        }, delay + 400 + ci * 400);
      });

      const completeDelay = delay + 400 + thinkingChunks.length * 400 + 500;
      setTimeout(() => {
        handleEvent(statusEvent);
        const sd = (statusEvent as any).data;
        updateStepOutput(nodeId, { status: 'completed', outputSummary: sd.output_summary, outputData: sd.output_data, durationMs: sd.duration_ms, tokenCount: Math.floor(sd.duration_ms * 0.8 + Math.random() * 500) });
        completedCount.value++;
      }, completeDelay);

      if (edgeEvent) setTimeout(() => handleEvent(edgeEvent), delay + 100);
      if (code) setTimeout(() => addStepCode({ nodeId, stepNumber: meta.stepNumber, title: meta.title, toolType: meta.toolType, language: code.language, code: code.code }), completeDelay + 100);
    });

    setTimeout(() => { refEdges.forEach(e => handleEvent(e)); }, 11200);

    setTimeout(() => {
      const analysisContent = `## BRCA1 분석 결과\n\n### 연구 목표\n\nT세포 고갈을 조절하는 유전자를 식별하기 위한 CRISPR 스크린 실험 계획\n\n### 핵심 발견\n\n- **주요 후보 유전자**: TOX (고갈 핵심 전사인자), PDCD1 (PD-1 억제 수용체), LAG3, HAVCR2\n- **통계적 유의성**: 24개 sgRNA 중 6개에서 유의미한 enrichment 확인 (padj < 0.05)\n\n### 수학적 모델\n\nLog2 fold change: LFC = log₂((CPM_exhausted + 1) / (CPM_functional + 1))\n\n### 참고 문헌\n\n- Chen et al. (2023) - Genome-wide CRISPR screen\n- Wei et al. (2024) - In vivo CRISPR screen`;

      setAnalysisMarkdown(analysisContent);
      handleEvent({ type: 'analysis_result', data: { summary_markdown: analysisContent, images: [], structured_data: {} } } as WSEvent);
      updateMessageById(progressId, '완료', true);
      setTimeout(() => useGraphStore.getState().autoLayout(layoutDirection), 500);
    }, 18500);
  }, [handleEvent, clearGraph, clearAnalysis, addMessage, updateMessageById, setStreaming, setGlobalPlan, addStepOutput, updateStepOutput, addStepCode, setAnalysisMarkdown, setRightPanelTab, layoutDirection]);

  const handleSend = useCallback((message: string, images?: File[]) => {
    addMessage({ id: `user_${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() });
    if (images && images.length > 0) {
      // 이미지 첨부 표시 (향후 서버 전송)
      addMessage({ id: `img_${Date.now()}`, role: 'user', content: `📎 이미지 ${images.length}장 첨부`, timestamp: new Date().toISOString() });
    }
    runMockDemo(message);
  }, [addMessage, runMockDemo]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <SessionSidebar />
      {currentView === 'chat' ? (
        <SplitPane left={<ChatPanel onSend={handleSend} />} right={<RightPanel />} />
      ) : (
        <BenchmarkPanel />
      )}
    </div>
  );
}
