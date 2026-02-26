AIGEN BioAgent UI v25
데모 실행 가이드
첨부파일: AIGEN_R0_Alt2_v25.html
1. 실행 방법 (30초면 충분합니다)
#	동작	설명
1	HTML 파일 열기	AIGEN_R0_Alt2_v25.html 파일을 Chrome/Edge에서 열어주세요
2	입력창 클릭	좌측 하단 입력창에 "BRCA1 변이의 유방암 위험도를 분석해줘" 입력 → Enter 또는 전송 버튼
3	실행 관찰	4단계가 순차 실행됩니다: ClinVar → GWAS → PubMed → Analyze (2.8초)
4	탭 확인	우측 Steps / Code / Results / Graph 4개 탭을 클릭해서 확인해주세요
  팅: Guided 모드도 확인해주세요 — 우측 상단 [Guided] 버튼 → Results 탭에서 링 차트 스타일 확인 가능
2. 수석님 요구사항 반영 현황
수석님 요구사항	v25 반영 내용	탭	상태
KGAI 참고 UI 구성 (채팅창 + 중간단계)	좌측 채팅 + 우측 4탭 분할 레이아웃	전체	✅ 완료
중간 결과 실시간 표시 (대기 체감 완화)	Step별 순차 실행 + 토큰 카운터 + 신뢰도 바	Steps	✅ 완료
유저 인터랙션 (수정/재시도/질문)	각 Step에 수정/재시도/설명/질문 4개 버튼	Steps	✅ 완료
Latency 30초 목표 (단계별 측정)	각 Step 소요시간 + 총 실행시간 표시	Steps	✅ 완료
코드 실행 과정 표시	Python 구문 하이라이팅 (8종 색상, 다크 테마)	Code	✅ 완료
결과 보고서 시각화	Apple Health 스타일 링 차트 + 임상 보고서 6섹션	Results	✅ 완료
Failure Taxonomy 알림	GWAS 타임아웃 시 분류된 에러 배지 표시	Steps	✅ 완료
그래프 시각화	16노드 DAG + 실행 중 에지 애니메이션 (Blue→Green)	Graph	✅ 완료
다국어 지원	한국어/영어 토글 (우측 상단)	전체	✅ 완료
데모 구현 (Gradio UI)	HTML 단일 파일 데모 (서버 불필요, 브라우저만으로 실행)	전체	✅ 완료
3. 탭별 핵심 포인트
탭	확인 포인트
Steps	• 4단계 순차 실행: ClinVar → GWAS → PubMed → Analyze
• 각 Step 클릭 시 상세 결과 + 수정/재시도/설명/질문 버튼
• Step 2에서 GWAS 타임아웃 → Failure Taxonomy 배지 자동 표시
Code	• Python 구문 하이라이팅 (키워드/문자열/숫자/주석/함수 색상 구분)
• 다크 테마 (Catppuccin) — 전문가 느낌의 코드 뷰어
• Step 클릭 시 해당 코드 자동 전환
Results	• Apple Health 스타일 링 차트 (70% 생애 유방암 위험도)
• 핵심 지표 4개 + ClinVar 변이 분류 + 문헌 근거 테이블 + 임상 권고
• JSON 내보내기 / 복사 버튼
Graph	• 16노드 DAG: Tool 4 + Data 7 + 처리 3 + DataLake 1 + Query 1
• 실행 중: 파란 점선 흐름 애니메이션 → 완료: 초록 실선 전환
• "위험도 보고서" 노드 클릭 → Results 탭 자동 이동
4. 다음 단계
현재 상태: 하드코딩 데모 (BRCA1 시나리오 고정)
단계	작업	예상 소요
1	수석님 UI 방향 승인 + 피드백 반영	피드백 받는 대로
2	백엔드 API 연동 (FastAPI + WebSocket + vLLM)	약 5~7일
3	실제 에이전트로 실행되는 라이브 데모	백엔드 완료 후
  피드백 요청: UI 방향, 디자인, 추가 기능 등 의견 주시면 바로 반영하겠습니다.
