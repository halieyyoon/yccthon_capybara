# AI Agent 작업 지침서 — 연서 (UI 디자인 시스템 · 퍼즐 컴포넌트 · 발표 슬라이드)

> **필독 기준 문서**: 루트의 [`SPEC.md`](../../SPEC.md) 및 [`docs/proposal/08-팀원매칭척도및설문설계.md`](../proposal/08-팀원매칭척도및설문설계.md)  
> 이 문서는 **연서 담당 AI 에이전트**가 ① 상태에 따라 변하는 퍼즐 UI 컴포넌트와 디자인 시스템, ② 학술적 근거와 정직한 데이터 설계까지 어필하는 YCCthon 발표 슬라이드를 완성하도록 정리한 지침서입니다.

---

## 1. 소유 영역 (파일 충돌 방지)

- **수정 가능**: `src/components/`, `src/app/globals.css`, `tailwind.config.*`, `docs/slides/`
- **수정 금지**: `src/types/`, `src/data/`, `src/lib/matching/`, `src/app/api/` (혜원 소유), `src/store/` 및 `src/app/**/page.tsx` (규혁 소유)
- **원칙**: 모든 컴포넌트는 Props 기반 순수 프레젠테이션 컴포넌트로 작성합니다.

---

## 2. 브랜드 & 디자인 시스템 (`On-do`)

### 2.1 무드 & 기본 컬러
- **무드**: *“딱딱한 이력서도, 가벼운 소개팅도 아닌 — 온도가 느껴지는 대학생 프로젝트 라운지”*
- 배경 `#FAF9F6` · 카드 `#FFFFFF` · 보더 `#E7E5E4` · 기본 글자 `#18181B` · 보조 `#71717A` · 글꼴 `Pretendard` + `Inter`

### 2.2 상태 3종에 따른 ‘퍼즐 프로필’ 동적 테마 (`transition-all duration-300`)

| 토큰 | `fun` (편함 36.5°) | `balanced` (균형 65°) | `serious` (진지 90°) |
|---|---|---|---|
| **퍼즐 실루엣** | 둥근 유기적 곡선 (`rx=24`) | 깔끔한 라운드 (`rx=14`) | 각진 지오메트릭 (`rx=4`) |
| **포인트 컬러** | `#F97316` (코랄 오렌지) | `#0EA5E9` (스카이 블루) | `#1D4ED8` (딥 로열 블루) |
| **배경 틴트** | `#FFF7ED` → `#ECFDF5` | `#F0F9FF` | `#0F172A` 다크 헤더 + `#EEF2FF` |
| **테두리** | `border-2 border-dashed border-orange-200` | `border border-sky-200` | `border-2 border-slate-900` |
| **배지** | `🎈 36.5° 편하게 경험` | `⚖️ 65° 균형 있게 완주` | `🔥 90° 진지하게 수상` |

### 2.3 16×16 호환성 매트릭스 5색 (`reference/mbti matching matrix/` 일치)
`5 (ideal)`: `#2563EB` · `4 (good)`: `#16A34A` · `3 (one_sided)`: `#84CC16` · `2 (workable)`: `#EAB308` · `1 (caution)`: `#DC2626`

---

## 3. 구현할 핵심 UI 컴포넌트 6종 (`src/components/`)

### ① `src/components/PuzzleProfileCard.tsx`
- **Props**: `{ profile: UserProfile; showRealIdentity?: boolean; onModeChange?: (mode: TemperatureMode) => void; compact?: boolean }`
- SVG 퍼즐 조각: 좌·우 돌기(凸)=장점 2장, 상·하 홈(凹)=약점 2장, 중앙=16유형 코드(`APDB`) + 온도 배지(`90°`) + 27차원 응답 현황 칩

### ② `src/components/TeamPuzzleMerge.tsx`
- **Props**: `{ team: TeamCandidate; unlocked?: boolean }`
- 4인 퍼즐 2×2 맞물림 시각화 + `puzzlePairs` 보완 화살표 + **`evidenceTags`(응답 근거 칩)** + **`biggestGapNote`(주의 쟁점 앰버 박스)** + **`minMemberFit` 보조 지표**
- ⚠️ 주의: “궁합 94%!” 대신 **“조합 지수 (임시 가중치 v1.0)”** 라벨 사용

### ③ `src/components/ClusterScatterPlot.tsx`
- **Props**: `{ points: ClusteredPoint[]; onSelectPoint?: (p: ClusteredPoint) => void }`
- 101개 점을 반응형 SVG 산점도로 렌더링 (5개 클러스터 색상 + 내 위치 펄스 링 + 추천 팀원 3명 연결선)
- 하단 정직한 범례 필수: *“27차원 분석 피처(Gower + PAM) 2D 탐색 시각화 · 합성 시드 100명 데모 (2D 거리는 참고용)”*

### ④ `src/components/AvatarMeetingCard.tsx`
- **Props**: `{ result: AvatarMeetingResult; loading?: boolean; loadingStepText?: string }`
- `08번 문서` 6장 4요소를 깔끔한 카드로 배치:
  - 상단: `chemistryBadge` + 부여된 공통 안건(`agenda`)
  - 중단: 6턴 가상 회의 말풍선
  - 하단 4블록: **`합의안(consensus)`** · **`미해결 쟁점(unresolvedIssues)`** · **`예상 역할 분담(expectedRoleSplit)`** · **`실제 팀원에게 확인할 질문(questionsToAskTeam)`**
  - 하단 고지: *“AI 모의회의는 행동 예측이 아니라 사전 쟁점 확인을 위한 가상 실험입니다.”*

### ⑤ `src/components/PilotRoomView.tsx`
- **Props**: `{ contestTitle: string; topic: string; remainingSec: number; members: UserProfile[]; messages: PilotMessage[]; workspace: PilotWorkspace; isTyping: boolean; onSendMessage: (text: string) => void; onUpdateWorkspace: (patch: Partial<PilotWorkspace>) => void; onToggleFastDemo: () => void; onFinish: () => void }`
- 상단 20분 타이머 + 안건 고정 바 + 1페이지 공유 메모(3칸) + 실시간 팀 채팅

### ⑥ `src/components/CvPrintSheet.tsx`
- **Props**: `{ profile: UserProfile }`
- 표준 5섹션 A4 1페이지 인쇄 최적화 레이아웃 + 우측 상단 내 퍼즐 엠블럼

---

## 4. 발표 슬라이드 구성안 (`docs/slides/SLIDE_OUTLINE.md` — 10장)

`08번 문서`의 탄탄한 통계·척도 설계를 슬라이드에 녹여 **심사위원 신뢰도**를 극대화합니다.

1. **표지**: **`On-do (온도)`** — *“스펙보다 온도, 만나기 전에 쟁점부터 맞춰보는 대학생 팀 빌딩”*
2. **문제 제기**: 에브리타임·링커리어의 3가지 한계 — ① 저학년 스펙 장벽 ② 목표·AI 규범·갈등 스타일 불투명 ③ 좁은 캠퍼스의 거절 스트레스
3. **핵심 인사이트**: 좋은 팀은 “성격이 똑같은 사람”이 아니라 **목표·AI 규범의 일치 + 역량의 보완 + 사전 갈등 확인**으로 만들어진다
4. **솔루션 개요 (MVP 핵심 3가지)**: ① 3단계 매칭 엔진 ② 상태에 따라 변하는 퍼즐 프로필(+Weekly Drop) ③ 초보자용 CV 템플릿
5. **설계 근거 — 27차원 분석 피처 & 연구 척도**: Big Five(IPIP)·ROCI-II·GAAIS·CATME를 참고한 **고정 27차원 피처(`v1.0`)**, 결측 `null` 보존 원칙, 과장 없는 임시 가중치 & 사후 검증 계획 강조
6. **기능 심화 ① — 퍼즐 프로필 & 16유형 매트릭스**: `36.5°/65°/90°` 상태별 퍼즐 비주얼 변화 + 16×16 매트릭스 + 장점·약점 12종 보완 쌍
7. **기능 심화 ② — 3단계 매칭 파이프라인**: `1단계 Gower+PAM 27차원 군집 탐색 & 팀 최적화` → `2단계 AI 아바타 사전 모의회의(합의안·미해결 쟁점·확인 질문)` → `3단계 20분 파일럿 해커톤` (규모별 분기 + Weekly Drop)
8. **기능 심화 ③ — CV 템플릿**: 초보자 가이드 5섹션 + 링크드인 PDF 자동 채우기 + 원클릭 복붙 내보내기
9. **라이브 시연 (2분)**: 온도 전환 퍼즐 → PDF CV 자동 입력 → 101명 27차원 군집 산점도 & AI 아바타 쟁점 리포트 → 20분 파일럿 채팅 → 4인 퍼즐 합체 & 실명·CV 언락
10. **확장 로드맵 & 비즈니스 모델**: 연세대 파일럿(실제 응답 수집·타당도/군집 안정성 검증) → v2 `When2Meet` 정기 회의 추천 & 2촌 신뢰망 → 타 대학 확장 & 공모전 주최사 맞춤형 추천 광고

---

## 5. 완료 체크리스트 (Acceptance Criteria)
- [ ] `PuzzleProfileCard`가 `fun`/`balanced`/`serious` 3모드에서 형태·색상·분위기 확연히 전환
- [ ] `ClusterScatterPlot`과 `AvatarMeetingCard`에 `08번 문서`의 정직한 고지 문구 및 4요소(합의안·쟁점·역할·확인 질문) 누락 없음
- [ ] `CvPrintSheet` A4 1페이지 인쇄 깔끔하게 출력
- [ ] 발표 슬라이드 10장 구성안에 과장된 정확도 수치(“94%” 등)가 없고 27차원 설계·검증 계획이 설득력 있게 반영됨
