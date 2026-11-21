# AI Agent 작업 지침서 — 연서 (UI 디자인 시스템 · 퍼즐 컴포넌트 · 발표 슬라이드)

> **필독 기준 문서**: 루트의 [`SPEC.md`](../../SPEC.md)  
> 이 문서는 **연서 담당 AI 에이전트**가 ① 상태에 따라 변하는 퍼즐 UI 컴포넌트와 디자인 시스템, ② YCCthon 심사 발표용 슬라이드 구성안을 일관되게 완성하도록 정리한 지침서입니다.

---

## 1. 소유 영역 (파일 충돌 방지)

- **수정 가능**: `src/components/`, `src/app/globals.css`, `tailwind.config.*`, `docs/slides/`
- **수정 금지**: `src/types/`, `src/data/`, `src/lib/matching/`, `src/app/api/` (혜원 소유), `src/store/` 및 `src/app/**/page.tsx` (규혁 소유)
- **원칙**: 모든 컴포넌트는 상태를 직접 들고 있지 않고 **Props 기반 순수 프레젠테이션 컴포넌트**로 설계해 규혁의 페이지에 바로 꽂을 수 있게 합니다.

---

## 2. 브랜드 & 디자인 시스템 (`On-do`)

### 2.1 무드 키워드
> **“딱딱한 이력서도, 가벼운 소개팅도 아닌 — 온도가 느껴지는 대학생 프로젝트 라운지”**

- 기본 배경: `#FAF9F6` (따뜻한 오프화이트), 카드 배경 `#FFFFFF`, 기본 테두리 `#E7E5E4`, 본문 텍스트 `#18181B`, 보조 `#71717A`
- 글꼴: `Pretendard` (한글) + `Inter` (숫자·영문)

### 2.2 상태 3종에 따른 ‘퍼즐 프로필’ 동적 테마 토큰 (핵심 비주얼 차별화)

`profile.temperatureMode` 값이 바뀔 때 아래 토큰이 부드러운 트랜지션(`transition-all duration-300`)으로 전환됩니다.

| 토큰 | `fun` (편함 36.5°) | `balanced` (균형 65°) | `serious` (진지 90°) |
|---|---|---|---|
| **퍼즐 실루엣** | 둥글고 유기적인 곡선 퍼즐 (`rx=24`) | 깔끔한 라운드 퍼즐 (`rx=14`) | 각지고 날렵한 지오메트릭 퍼즐 (`rx=4`) |
| **메인 포인트** | `#F97316` (코랄 오렌지) | `#0EA5E9` (스카이 블루) | `#1D4ED8` (딥 로열 블루) |
| **배경 틴트** | `#FFF7ED` → `#ECFDF5` 소프트 그라데이션 | `#F0F9FF` 클린 틴트 | `#0F172A` 다크 헤더 + `#EEF2FF` 고대비 카드 |
| **테두리 스타일** | `border-2 border-dashed border-orange-200` | `border border-sky-200` | `border-2 border-slate-900` |
| **분위기 배지** | `🎈 36.5° 편하게 경험` | `⚖️ 65° 균형 있게 완주` | `🔥 90° 진지하게 수상` |

### 2.3 16×16 호환성 매트릭스 컬러 (레퍼런스 이미지 일치)
`reference/mbti matching matrix/`의 5단계 범례를 그대로 따릅니다.
- `5 (ideal)`: `#2563EB` (블루)
- `4 (good)`: `#16A34A` (진초록)
- `3 (one_sided)`: `#84CC16` (연두)
- `2 (workable)`: `#EAB308` (노랑)
- `1 (caution)`: `#DC2626` (빨강)

---

## 3. 구현할 핵심 UI 컴포넌트 6종 (`src/components/`)

규혁의 페이지가 아래 Props 시그니처로 바로 import할 수 있게 export 이름을 고정합니다.

### ① `src/components/PuzzleProfileCard.tsx`
- **Props**: `{ profile: UserProfile; showRealIdentity?: boolean; onModeChange?: (mode: TemperatureMode) => void; compact?: boolean }`
- **디자인**:
  - 커스텀 SVG 퍼즐 조각 카드: 좌·우 돌기(凸)에 **장점 2장** 라벨, 상·하 홈(凹)에 **약점 2장** 라벨 배치
  - 중앙에 **4축 성향 코드(`APDB`)** + **온도 배지(`90°`)**
  - `temperatureMode`에 따라 위 2.2 테마가 즉시 애니메이션 전환

### ② `src/components/TeamPuzzleMerge.tsx`
- **Props**: `{ team: TeamCandidate; unlocked?: boolean }`
- **디자인**:
  - 4명의 퍼즐 조각이 2×2 격자로 맞물리는 시각화 + `team.puzzlePairs`를 연결 화살표/배지로 표시 (*“내 약점(발표) ← 민지(경영) 강점으로 커버”*)
  - `unlocked === true`일 때 4조각이 간격 0으로 딱 붙는 합체 연출

### ③ `src/components/ClusterScatterPlot.tsx`
- **Props**: `{ points: ClusteredPoint[]; onSelectPoint?: (p: ClusteredPoint) => void }`
- **디자인**:
  - 100명 + 나(101개 점)를 깔끔한 SVG 산점도로 렌더링 (클러스터 0~4별 파스텔 색상, 줌 없이도 한눈에 들어오는 반응형 SVG)
  - **내 위치(`isCurrentUser`)**: 펄스 링 강조
  - **추천 팀원 3명(`isRecommendedTeammate`)**: 내 위치와 점선/실선으로 연결 + 닉네임 툴팁 표시
  - 하단에 범례: *“101명 21차원 프로필 벡터 → 2D 클러스터 투영”*

### ④ `src/components/AvatarMeetingCard.tsx`
- **Props**: `{ result: AvatarMeetingResult; loading?: boolean; loadingStepText?: string }`
- **디자인**:
  - 상단: `chemistryBadge` + 3~4줄 핵심 요약 박스
  - 중단: 6턴 가상 첫 회의 말풍선 (발화자별 퍼즐 컬러 아바타 칩)
  - 하단: 앰버 강조 박스 **`💡 첫 회의 합의 포인트`** 1줄 + *“AI 아바타 시뮬레이션 미리보기”* 작은 안내 문구

### ⑤ `src/components/PilotRoomView.tsx`
- **Props**: `{ contestTitle: string; topic: string; remainingSec: number; members: UserProfile[]; messages: PilotMessage[]; workspace: PilotWorkspace; isTyping: boolean; onSendMessage: (text: string) => void; onUpdateWorkspace: (patch: Partial<PilotWorkspace>) => void; onToggleFastDemo: () => void; onFinish: () => void }`
- **디자인**:
  - 상단 고정 타이머 바 + 안건 배지 + 시연 단축 버튼
  - 1페이지 공유 메모(3칸) + 채팅 영역이 깔끔하게 정리된 협업 UI

### ⑥ `src/components/CvPrintSheet.tsx`
- **Props**: `{ profile: UserProfile }`
- **디자인**:
  - 표준 5섹션이 A4 1페이지에 정갈하게 떨어지는 이력서 카드 (`@media print` 최적화 포함)
  - 우측 상단에 작은 **내 퍼즐 엠블럼**(`90° · APDB`)을 넣어 “On-do만의 대학생 CV” 정체성 강조

---

## 4. 발표 슬라이드(Pitch Deck) 구성안 (`docs/slides/SLIDE_OUTLINE.md`)

YCCthon 발표 시간(보통 5~7분, 시연 2분 포함) 기준 **10장 구성**을 제안하며, 연서의 AI 에이전트가 실제 장표 카피·시각 자료를 제작할 때 아래 흐름을 기준으로 합니다.

1. **표지**: **`On-do (온도)`** — *“스펙보다 온도, 만나기 전에 먼저 맞춰보는 대학생 팀 빌딩”* (상태별 퍼즐 3종 비주얼)
2. **문제 제기 (Pain Point)**: 에브리타임·링커리어 모집글의 현실 — ① 저학년 스펙 장벽 ② “열심히 하겠다”뿐인 온도·AI 태도 불일치 ③ 좁은 캠퍼스의 거절 스트레스
3. **핵심 인사이트**: 팀 빌딩은 ‘1명 검색’이 아니라 **‘4명의 온도 일치 + 약점 보완 + 실전 호흡 검증’**의 문제
4. **솔루션 개요 (MVP 핵심 3가지)**: ① 3단계 매칭 엔진 ② 상태에 따라 변하는 퍼즐 프로필(+Weekly Drop) ③ 초보자용 CV 템플릿
5. **기능 심화 ① — 퍼즐 프로필 & 16유형 매트릭스**: `36.5° / 65° / 90°` 상태에 따라 변하는 퍼즐 비주얼 + 16×16 협업 호환성 매트릭스(`reference/` 차트 재해석) + 장점·약점 돌기/홈 보완
6. **기능 심화 ② — 3단계 매칭 파이프라인**: `1단계 100명 다차원 클러스터 분석` → `2단계 AI 아바타 모의회의` → `3단계 20분 파일럿 해커톤` (규모별 분기 + Weekly Drop)
7. **기능 심화 ③ — CV 템플릿**: 초보자도 2분 완성 + 링크드인 PDF 자동 채우기 + 링크드인 복붙 내보내기 (API 제약의 영리한 우회)
8. **라이브 시연 (2분)**: 온도 전환 퍼즐 → PDF CV 자동 입력 → 100명 클러스터 산점도 & AI 아바타 → 20분 파일럿 채팅 → 4인 퍼즐 합체 & 실명 언락
9. **기술 구조 & 비용 효율**: 1단계 0원 클러스터링으로 후보 압축 후 2단계 단일 LLM 호출(조합당 몇 원) — 확장 가능한 경량 아키텍처
10. **확장 로드맵 & 비즈니스 모델**: 연세대 시작 → 타 대학 크로스전공 확장 → `When2Meet` 정기 회의 추천 & 2촌 검증 신뢰망(v2) → 공모전 주최사 맞춤형 추천 광고 수익화

---

## 5. 완료 체크리스트 (Acceptance Criteria)
- [ ] `PuzzleProfileCard`가 `fun` / `balanced` / `serious` 3가지 모드에서 모양·색상·분위기가 확연히 다르게 전환됨
- [ ] `ClusterScatterPlot`이 101개 점을 겹침 없이 깔끔하게 표현하고 내 위치·추천 3인을 즉시 구분 가능
- [ ] `CvPrintSheet`가 `window.print()` 시 불필요한 네비게이션 없이 1페이지로 깔끔하게 출력됨
- [ ] `docs/slides/SLIDE_OUTLINE.md` 기반 발표 슬라이드 장표 10장 완성
