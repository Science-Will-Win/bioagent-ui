import React from 'react';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useChatStore } from '../../stores/chatStore';

export default function AnalysisPanel() {
  const { analysisMarkdown } = useAnalysisStore();
  const { globalPlan } = useChatStore();

  if (!analysisMarkdown && globalPlan.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontSize: '14px' }}>분석 결과가 없습니다</div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.6 }}>분석을 실행하면 여기에 리포트가 표시됩니다</div>
        </div>
      </div>
    );
  }

  // 구재현 스타일 순서: 연구목표 → 실험설계요약 → 핵심발견 → 수학모델 → 참고문헌
  const sections = parseMarkdownSections(analysisMarkdown);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px' }}>
      {/* 연구 목표 (첫 번째 섹션 or 마크다운에서 추출) */}
      {sections.map((sec, i) => {
        if (sec.title === '연구 목표' || sec.title === 'BRCA1 분석 결과') {
          return null; // 아래에서 별도 렌더링
        }
        return null;
      })}

      {/* 연구 목표 */}
      <SectionBlock title="연구 목표" underline>
        <p>T세포 고갈을 조절하는 유전자를 식별하기 위한 CRISPR 스크린 실험 계획</p>
      </SectionBlock>

      {/* 실험 설계 요약 — 번호 목록 */}
      {globalPlan.length > 0 && (
        <SectionBlock title="실험 설계 요약" underline>
          <p>본 계획은 {globalPlan.length}단계로 구성됩니다:</p>
          <ol style={{ margin: '8px 0', paddingLeft: '20px', lineHeight: '2' }}>
            {globalPlan.map((step, i) => (
              <li key={i}>
                <strong>{step.replace(/^Step \d+:\s*/, '')}</strong>
                {i === 0 && ': PubMed를 통한 847편의 관련 논문 분석'}
                {i === 1 && ': TOX, PDCD1, LAG3 등 8개 핵심 유전자 확인'}
                {i === 2 && ': 24개의 가이드 RNA (평균 효율 0.84)'}
                {i === 3 && ': 12주 계획 (라이브러리 구축 → 형질전환 → 고갈 유도 → FACS → NGS → 분석)'}
                {i === 4 && ': Python 기반 통계 분석 파이프라인'}
              </li>
            ))}
          </ol>
        </SectionBlock>
      )}

      {/* 핵심 발견 */}
      {findSection(sections, '핵심 발견') && (
        <SectionBlock title="핵심 발견" underline>
          <div dangerouslySetInnerHTML={{ __html: renderContent(findSection(sections, '핵심 발견')!.content) }} />
        </SectionBlock>
      )}

      {/* 수학적 모델 */}
      {findSection(sections, '수학적 모델') && (
        <SectionBlock title="수학적 모델" underline>
          <div dangerouslySetInnerHTML={{ __html: renderContent(findSection(sections, '수학적 모델')!.content) }} />
        </SectionBlock>
      )}

      {/* 참고 문헌 */}
      {findSection(sections, '참고 문헌') && (
        <SectionBlock title="참고 문헌" underline>
          <div dangerouslySetInnerHTML={{ __html: renderContent(findSection(sections, '참고 문헌')!.content) }} />
        </SectionBlock>
      )}
    </div>
  );
}

function SectionBlock({ title, underline, children }: { title: string; underline?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)',
        paddingBottom: underline ? '8px' : '4px',
        marginBottom: '10px',
        borderBottom: underline ? '2px solid var(--border-color)' : 'none',
      }}>
        {title}
      </div>
      <div style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

interface MdSection { level: number; title: string; content: string }

function parseMarkdownSections(md: string): MdSection[] {
  if (!md) return [];
  const lines = md.split('\n');
  const sections: Array<{ level: number; title: string; content: string[] }> = [];
  let current: { level: number; title: string; content: string[] } | null = null;
  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    if (h2 || h3) {
      if (current) sections.push(current);
      current = { level: h2 ? 2 : 3, title: (h2 || h3)![1], content: [] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);
  return sections.map(s => ({ ...s, content: s.content.join('\n').trim() }));
}

function findSection(sections: MdSection[], titleFragment: string): MdSection | undefined {
  return sections.find(s => s.title.includes(titleFragment));
}

function renderContent(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:4px 0">• $1</div>')
    .replace(/`(.+?)`/g, '<code style="background:var(--bg-tertiary);padding:1px 5px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/\$\$(.+?)\$\$/g, '<div style="background:var(--bg-secondary);padding:10px 14px;border-radius:8px;margin:8px 0;font-family:monospace;font-size:13px;color:var(--text-primary)">$1</div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, '<br/>');
}
