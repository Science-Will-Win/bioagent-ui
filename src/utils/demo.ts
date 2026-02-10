// ============================================================================
// Demo Simulator - Backend 없이 UI 테스트용 더미 데이터 생성
// ============================================================================

import { useStore } from '@/stores/useStore';
import type { Step } from '@/types';

const DEMO_STEPS: Omit<Step, 'id'>[] = [
  {
    name: 'Literature Search',
    tool: 'PubMed API',
    status: 'waiting',
    thought: 'Currarino syndrome과 관련된 유전자를 찾기 위해 PubMed에서 최신 논문을 검색합니다. DisGeNet과 OMIM 두 데이터베이스 간의 차이를 확인해야 합니다.',
    action: {
      description: 'PubMed에서 Currarino syndrome 관련 논문 검색',
      code: `from biomni.tools import pubmed_search

results = pubmed_search(
    query="Currarino syndrome gene association",
    max_results=20,
    sort="relevance"
)
print(f"Found {len(results)} papers")`,
      language: 'python',
    },
    result: {
      text: 'PubMed에서 20개의 관련 논문을 찾았습니다. 주요 유전자로 MNX1(HLXB9)이 확인되었으며, 추가적으로 PCSK5, WNT3A 등이 보고되었습니다.',
      data: { papers: 20, genes_found: ['MNX1', 'PCSK5', 'WNT3A'] },
    },
    graph: null,
    duration: null,
  },
  {
    name: 'DisGeNet Query',
    tool: 'DisGeNet API',
    status: 'waiting',
    thought: 'DisGeNet 데이터베이스에서 Currarino syndrome과 연관된 모든 유전자 목록을 가져옵니다.',
    action: {
      description: 'DisGeNet에서 질병-유전자 연관성 조회',
      code: `from biomni.tools import disgenet_query

genes_disgenet = disgenet_query(
    disease="Currarino syndrome",
    source="ALL",
    min_score=0.3
)
print(f"DisGeNet genes: {genes_disgenet}")`,
      language: 'python',
    },
    result: {
      text: 'DisGeNet에서 5개 유전자를 확인했습니다: MNX1, PCSK5, WNT3A, SHH, HOXD13',
      data: { genes: ['MNX1', 'PCSK5', 'WNT3A', 'SHH', 'HOXD13'], count: 5 },
    },
    graph: {
      type: 'bar',
      data: [
        { gene: 'MNX1', score: 0.95 },
        { gene: 'PCSK5', score: 0.72 },
        { gene: 'WNT3A', score: 0.58 },
        { gene: 'SHH', score: 0.45 },
        { gene: 'HOXD13', score: 0.38 },
      ],
      config: { xKey: 'gene', yKey: 'score', title: 'DisGeNet Association Score' },
    },
    duration: null,
  },
  {
    name: 'OMIM Cross-Reference',
    tool: 'OMIM API',
    status: 'waiting',
    thought: 'OMIM 데이터베이스에서 동일 질환의 유전자 목록을 조회하여 DisGeNet 결과와 교차 비교합니다.',
    action: {
      description: 'OMIM에서 Currarino syndrome 유전자 조회 및 교차 분석',
      code: `from biomni.tools import omim_query

genes_omim = omim_query(disease="Currarino triad")
print(f"OMIM genes: {genes_omim}")

# 차집합 계산: DisGeNet에만 있는 유전자
only_disgenet = set(genes_disgenet) - set(genes_omim)
print(f"DisGeNet only: {only_disgenet}")`,
      language: 'python',
    },
    result: {
      text: 'OMIM에서는 MNX1만 등록되어 있습니다. DisGeNet에만 존재하는 유전자: PCSK5, WNT3A, SHH, HOXD13. 따라서 답은 이 중 하나입니다.',
      data: {
        omim_genes: ['MNX1'],
        disgenet_only: ['PCSK5', 'WNT3A', 'SHH', 'HOXD13'],
      },
    },
    graph: null,
    duration: null,
  },
];

export async function runDemoAnalysis() {
  const store = useStore.getState();

  for (let i = 0; i < DEMO_STEPS.length; i++) {
    const stepData = DEMO_STEPS[i];
    const step: Step = { ...stepData, id: crypto.randomUUID(), status: 'active' };

    store.addStep(step);
    store.updateStats({ stepsTotal: DEMO_STEPS.length });
    await delay(600);

    // Thought
    store.updateStep(i, { thought: stepData.thought });
    await delay(1200);

    // Action
    store.updateStep(i, { action: stepData.action });
    await delay(1500);

    // Result
    store.updateStep(i, { result: stepData.result, graph: stepData.graph });
    await delay(800);

    // Complete
    const dur = 2.5 + Math.random() * 5;
    store.completeStep(i, dur);
    await delay(400);
  }

  store.stopAnalysis();
  store.updateStats({ progress: 100, elapsedTime: 12.3, cost: 0.05, tokens: 4520 });
  store.addMessage('assistant', '분석이 완료되었습니다. Currarino syndrome과 관련하여 DisGeNet에는 있지만 OMIM에는 없는 유전자로 PCSK5, WNT3A, SHH, HOXD13이 확인되었습니다.');
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
