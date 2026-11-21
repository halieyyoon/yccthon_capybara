# On-do (온도) — 마스터 기획서 (Single Source of Truth)

> **문서 목적**  
> YCCthon 카피바라 팀 3명(**혜원 · 규혁 · 연서**)과 각자의 **AI 에이전트**가 충돌 없이 병렬로 작업하기 위한 단일 기준 문서입니다.  
> 모든 데이터 타입, 상수, API 입출력, 화면 흐름, 디자인 규칙은 이 문서를 따릅니다.
>
> **역할별 AI 에이전트 작업 지침서**
> - **혜원 (Schema · Seed 100명 · Clustering · AI API)**: [`docs/agents/hyewon-schema.md`](./docs/agents/hyewon-schema.md)
> - **규혁 (UX · 라우팅 · 상태관리 · 인터랙션 · 카피)**: [`docs/agents/gyuhyeok-ux.md`](./docs/agents/gyuhyeok-ux.md)
> - **연서 (UI 컴포넌트 · 퍼즐 디자인 시스템 · 발표 슬라이드)**: [`docs/agents/yeonseo-slides-ui.md`](./docs/agents/yeonseo-slides-ui.md)

---

## 1. 서비스 정의 & 프로젝트 범위

### 1.1 한 줄 정의
**On-do (온도)** — 스펙 대신 **참여 온도(36.5°/65°/90°)·협업 성향·장단점 퍼즐**을 입력하면, **다차원 클러스터 분석 → AI 아바타 모의회의 → 20분 파일럿 해커톤**을 거쳐 합이 맞는 4인 팀을 무거절로 연결해 주는 대학생 프로젝트 팀 빌딩 서비스

### 1.2 초기 타깃 & 확장 방향
- **초기 타깃**: 연세대학교 재학생 (`@yonsei.ac.kr` 인증 시나리오)
- **확장 방향**: 타 대학 확장 → 여러 전공 융합 팀 빌딩 → 공모전 주최사 맞춤형 추천 광고

### 1.3 이번 YCCthon MVP 구현 범위 (확정)
- **형태**: 프론트엔드 중심 인터랙티브 웹 MVP + **실제 Gemini API 연동** + **연세대 시드 데이터 100명**
- **기술 스택**: `Next.js (App Router)` · `TypeScript` · `Tailwind CSS` · `Gemini API (gemini-2.5-flash)` · `localStorage` *(별도 DB 서버 없이 100명 JSON 시드 + 클라이언트 상태 영속화로 빠른 시연)*
- **MVP 핵심 3가지 기능**:
  1. **3단계 매칭 엔진**: `1단계 High-Dimensional Cluster Analysis` → `2단계 AI 아바타 사전 모의회의` → `3단계 20분 파일럿 해커톤`
  2. **퍼즐 프로필 (+ Weekly Drop 자동 알림 설정)**: 상태 3종에 따라 디자인이 변하는 퍼즐 프로필 + 4축 16유형 호환성 매트릭스 + 장점 2장·약점 2장
  3. **CV 템플릿 제공**: 표준 5섹션 에디터 + 링크드인/이력서 PDF 업로드 AI 자동 채우기 + 원클릭 링크드인 복붙 요약 & PDF 인쇄 내보내기
- **이번 MVP에서 제외 (v2 확장 포인트)**:
  - `When2Meet` 주간 가능 시간표 기반 정기 회의 시간 추천 *(스키마에 optional 확장 필드로만 남겨두고 UI/로직 미구현)*
  - 실제 Supabase Auth / 다중 사용자 실시간 WebSocket 채팅 *(3단계 파일럿 방은 시드 팀원 3명이 AI 페르소나로 실시간 반응하는 인터랙티브 시뮬레이션으로 구현)*
  - 링크드인 공식 양방향 API 동기화

---

## 2. 핵심 도메인 규격 (혜원·규혁·연서 공통 상수)

세 에이전트가 정확히 같은 ID와 라벨을 사용해야 합니다. 임의로 키 이름을 바꾸지 마세요.

### 2.1 참여 온도 상태 3종 (`TemperatureMode`)
프로필의 현재 상태를 바꾸면 **퍼즐 디자인 테마**와 **1단계 클러스터링 온도 축**이 동시에 바뀝니다.

| `id` | 표시 라벨 | 온도 값 | 의미 | 퍼즐 비주얼 톤 (연서 기준) |
|---|---|---|---|---|
| `fun` | `가볍게 재미 · 경험` | `36.5` | 부담 없이 경험·친목·실험 위주 | 둥근 유기적 퍼즐, 파스텔 코랄/민트, 경쾌한 느낌 |
| `balanced` | `균형 있게 완주` | `65` | 즐겁게 하되 퀄리티 있게 끝까지 완주 | 깔끔한 라운드 퍼즐, 소프트 블루/세이지, 안정적 느낌 |
| `serious` | `진지하게 수상 · 취업` | `90` | 수상·포트폴리오·실전 성과 집중 | 각진 지오메트릭 퍼즐, 딥 인디고/차콜, 단단한 느낌 |

### 2.2 4축 협업 성향 16유형 (`CollabType` — MBTI 매칭 매트릭스 구조)
`reference/mbti matching matrix/`의 16×16 5단계 호환성 차트를 대학생 팀플에 맞게 재해석합니다.

| 축 | 코드 A | 코드 B | 질문 예시 (온보딩 4문항, 각 1택) |
|---|---|---|---|
| **1. AI 활용** | `A` (AI 가속형) | `M` (직접 구현형) | “마감이 촉박할 때 AI가 만든 초안을 적극 활용해 속도를 낸다(`A`) vs 내가 완전히 이해하고 직접 다듬어야 마음이 놓인다(`M`)” |
| **2. 작업 리듬** | `P` (계획 선행형) | `S` (마감 스프린트형) | “일정을 미리 쪼개 매일 조금씩 끝낸다(`P`) vs 마감 직전 몰입해서 한 번에 폭발력을 낸다(`S`)” |
| **3. 소통 방식** | `D` (직설·속도형) | `H` (배려·합의형) | “아쉬운 점은 바로 솔직하게 말해야 빠르다(`D`) vs 분위기를 지키며 모두가 납득할 때까지 조율한다(`H`)” |
| **4. 기여 초점** | `B` (구현·실행형) | `V` (기획·스토리형) | “실제로 돌아가는 결과물을 손으로 만드는 데 강하다(`B`) vs 문제 정의·전략·설득력 있는 스토리라인에 강하다(`V`)” |

- 조합 결과: 총 **16유형** (예: `APDB`, `APDV`, `APHB`, ..., `MSHV`)
- **16×16 호환성 점수 (5단계 — 레퍼런스 차트 5색 그대로 매핑)**:
  - `5` (`ideal`, `#2563EB` 블루): 이상적 궁합 *(예: 같은 AI/리듬 + 보완되는 `B↔V`)*
  - `4` (`good`, `#16A34A` 진초록): 좋은 조합
  - `3` (`one_sided`, `#84CC16` 연두): 조율하면 무난
  - `2` (`workable`, `#EAB308` 노랑): 가능하지만 사전 합의 필요
  - `1` (`caution`, `#DC2626` 빨강): 충돌 주의 *(예: 극단적 `P↔S` + 반대 AI 태도)*

### 2.3 장점·약점 카드 표준 풀 (각 12종, 사용자당 장점 2장 + 약점 2장 선택)
약점 12종은 장점 12종과 **정확히 1:1 보완 쌍**을 이루도록 설계해, 퍼즐의 **돌기(장점) ↔ 홈(약점)**이 수학적·시각적으로 완벽히 맞물리게 합니다.

| ID | 장점 카드 라벨 (돌기) | 대응 약점 카드 라벨 (홈) | 카테고리 |
|---|---|---|---|
| `frontend` | 프론트엔드·화면 구현 | 화면 구현·코딩 서툼 | 개발 |
| `backend` | 백엔드·API·DB 설계 | 서버·데이터 연결 어려움 | 개발 |
| `ai_prompt` | AI 툴·프롬프트 활용 능숙 | AI 툴 활용이 어색함 | AI |
| `data_analysis` | 데이터 분석·리서치 | 수치·근거 데이터 정리 약함 | 분석 |
| `ui_design` | UI/UX·시각 디자인 | 디자인 감각·미감 부족 | 디자인 |
| `slide_story` | 장표 구성·스토리라인 | 발표 자료 구조화 서툼 | 기획 |
| `pitching` | 발표·질의응답 강점 | 발표 울렁증 있음 | 발표 |
| `ideation` | 빠른 아이디어 발산 | 백지에서 아이디어 짜기 어려움 | 기획 |
| `pm_schedule` | 일정 관리·역할 정리 | 마감·일정 관리가 약함 | 운영 |
| `copywriting` | 글쓰기·문서·카피라이팅 | 글 정리·문서화 부담 | 기획 |
| `user_research` | 인터뷰·시장 조사 | 현장 조사·사용자 인터뷰 서툼 | 분석 |
| `fast_proto` | 빠른 프로토타이핑·실행력 | 실행 착수가 느림(완벽주의) | 실행 |

### 2.4 협업 지뢰 (`DealBreaker` — 8종 중 1~2개 선택)
| ID | 표시 라벨 | 충돌 판정 대상(예시) |
|---|---|---|
| `ghosting` | 24시간 이상 연락 두절 | `weeklyHours === '3-5h'` & 저응답 페르소나 |
| `blind_ai_copy` | 이해 없이 AI 복붙 제출 | `aiStyle === 'ai_heavy'` & 검증 없는 성향 |
| `last_minute` | 마감 직전 잠수·뒤집기 | `collabType`에 `S`(스프린트) + `pm_schedule` 약점 |
| `no_prep` | 회의 전 자료 안 읽어오기 | `temperature === 36.5` (진지 유저 기준) |
| `free_riding` | 역할 떠넘기기·무임승차 | 투입 시간 극단적 불일치 |
| `harsh_tone` | 공격적·감정적 피드백 | `collabType`에 `D`(직설) 강도 높음 |
| `slow_decision` | 결정 못 내리고 회의만 길어짐 | `collabType`에 `H` 과다 집중 |
| `scope_creep` | 무리한 기능 계속 추가 | `ideation` 과다 + `fast_proto` 부재 |

### 2.5 AI 활용 스타일 (`AiStyle` — 3종)
- `ai_accelerator`: **AI 적극 가속형** — 기획·코드·디자인 초안을 AI로 빠르게 뽑고 다듬음
- `ai_verifier`: **AI 보조+검증형** — AI를 참고하되 핵심 로직과 근거는 직접 검증함
- `manual_first`: **직접 구현 지향형** — 단순 반복 외 핵심 결과물은 직접 만드는 것을 선호

---

## 3. 공통 TypeScript 스키마 계약 (`src/types/ondo.ts`)

**혜원**이 `src/types/ondo.ts`를 최초 작성하고, **규혁**과 **연서**는 반드시 이 타입을 import해 사용합니다.

```ts
export type TemperatureMode = 'fun' | 'balanced' | 'serious';
export type TemperatureValue = 36.5 | 65 | 90;
export type AiStyle = 'ai_accelerator' | 'ai_verifier' | 'manual_first';
export type WeeklyHours = '3-5h' | '6-10h' | '10h+';
export type ContestScale = 'small' | 'large';

export type SkillCardId =
  | 'frontend' | 'backend' | 'ai_prompt' | 'data_analysis'
  | 'ui_design' | 'slide_story' | 'pitching' | 'ideation'
  | 'pm_schedule' | 'copywriting' | 'user_research' | 'fast_proto';

export type DealBreakerId =
  | 'ghosting' | 'blind_ai_copy' | 'last_minute' | 'no_prep'
  | 'free_riding' | 'harsh_tone' | 'slow_decision' | 'scope_creep';

// 4축 조합: [A|M][P|S][D|H][B|V] — 총 16개
export type CollabType =
  | 'APDB' | 'APDV' | 'APHB' | 'APHV'
  | 'ASDB' | 'ASDV' | 'ASHB' | 'ASHV'
  | 'MPDB' | 'MPDV' | 'MPHB' | 'MPHV'
  | 'MSDB' | 'MSDV' | 'MSHB' | 'MSHV';

export interface CvExperience {
  title: string;          // 프로젝트 / 공모전 / 동아리명
  role: string;           // 맡은 역할
  period: string;         // 예: "2026.03 - 2026.06"
  summary: string;        // 핵심 성과 1~2줄
}

export interface CvTemplate {
  // 1. 기본정보·학력
  realName: string;
  university: string;     // 기본: "연세대학교"
  major: string;
  grade: string;          // 예: "3학년"
  headline: string;       // 한 줄 자기소개
  // 2. 프로젝트·공모전 이력
  experiences: CvExperience[];
  // 3. 스킬·언어
  skills: string[];
  languages: string[];    // 예: ["한국어", "영어(비즈니스)"]
  // 4. AI 툴 활용 방식
  aiTools: string[];      // 예: ["Cursor", "Claude", "ChatGPT", "Figma AI"]
  aiUsageNote: string;
  // 5. 협업 스타일
  collaborationNote: string;
  source?: 'manual' | 'pdf_parsed';
}

export interface UserProfile {
  id: string;
  nickname: string;       // 팀 확정 전 노출되는 익명 별명 (예: "새벽코딩 카피바라")
  email: string;          // @yonsei.ac.kr
  temperatureMode: TemperatureMode;
  temperature: TemperatureValue;
  weeklyHours: WeeklyHours;
  collabType: CollabType;
  aiStyle: AiStyle;
  strengths: [SkillCardId, SkillCardId];
  weaknesses: [SkillCardId, SkillCardId];
  dealBreakers: DealBreakerId[]; // 1~2개
  weeklyDropEnabled: boolean;    // 매주 금요일 밤 10시 일괄 매칭 알림 토글
  cv: CvTemplate;
  // v2 확장 예약 (MVP 미사용)
  availableSlots?: Record<string, number[]>;
}

export interface Contest {
  id: string;
  title: string;
  organizer: string;
  category: 'it_hackathon' | 'business' | 'design' | 'ai_data' | 'free';
  scale: ContestScale;    // 'small' | 'large' — 매칭 분기 결정
  deadline: string;       // YYYY-MM-DD
  summary: string;
  pilotTopics: string[];  // scale === 'large'일 때 3단계 20분 파일럿 해커톤용 안건 3개
}

// 1단계 High-Dimensional Cluster Analysis 출력
export interface ClusteredPoint {
  userId: string;
  nickname: string;
  major: string;
  temperatureMode: TemperatureMode;
  collabType: CollabType;
  clusterId: number;      // 0 ~ 4 (5개 클러스터)
  x: number;              // 2D 투영 좌표 (-100 ~ 100)
  y: number;              // 2D 투영 좌표 (-100 ~ 100)
  isCurrentUser?: boolean;
  isRecommendedTeammate?: boolean;
}

export interface PuzzleMatchPair {
  weaknessOwnerId: string;
  weaknessOwnerNickname: string;
  weaknessId: SkillCardId;
  coveredById: string;
  coveredByNickname: string;
  strengthId: SkillCardId;
}

export interface TeamCandidate {
  id: string;             // 예: "team-contest1-rank1"
  contestId: string;
  rank: 1 | 2 | 3;
  members: UserProfile[]; // [현재 유저, 추천 팀원 3명] 총 4명
  totalScore: number;     // 0 ~ 100
  scoreBreakdown: {
    temperatureFit: number;
    matrixCompatibility: number;
    puzzleComplement: number;
    aiStyleFit: number;
    dealBreakerPenalty: number;
  };
  puzzlePairs: PuzzleMatchPair[];
  status: 'CLUSTERED' | 'AVATAR_DONE' | 'PILOT_ACTIVE' | 'WAITING_CONSENT' | 'UNLOCKED' | 'EXPIRED';
}

// 2단계 AI 아바타 모의회의 출력
export interface AvatarTurn {
  speakerId: string;
  speakerNickname: string;
  roleTag: string;
  message: string;
}

export interface AvatarMeetingResult {
  teamId: string;
  contestTitle: string;
  summaryLines: string[];   // 3~4줄 핵심 분위기 요약
  turns: AvatarTurn[];      // 6턴 가상 첫 회의 하이라이트
  alignmentTip: string;     // 첫 회의 사전 합의 포인트 1줄
  chemistryBadge: string;   // 예: "빠른 실행 × 탄탄한 스토리"
}

// 3단계 20분 파일럿 해커톤 상태
export interface PilotMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  isUser: boolean;
  text: string;
  timestamp: string;
}

export interface PilotWorkspace {
  problemStatement: string;
  solutionIdea: string;
  roleSplit: string;
}
```

---

## 4. MVP 핵심 3가지 기능 상세 스펙

### 기능 1. 3단계 매칭 엔진 (`Cluster → AI Avatar → Pilot Hackathon`)

#### 공모전 규모별 분기 규칙 (확정)
- **소규모 (`contest.scale === 'small'`)**:  
  `1단계 다차원 클러스터 분석` → 100명 클러스터 산점도 + 추천 팀 카드 3개 표시 → **`바로 만나볼래요` (무거절 소집)** → 상호 수락 시 실명·CV 공개
- **대규모/장기 (`contest.scale === 'large'`)**:  
  `1단계 다차원 클러스터 분석` → **`2단계 AI 아바타 사전 모의회의` 자동 실행** → 결과 카드에서 선택:
  - `[바로 만나볼래요]` (무거절 소집)
  - **`[20분 파일럿 해커톤 먼저 해보기]`** (3단계 진입 버튼 — 대규모 대회에서만 표시)

#### 1단계: High-Dimensional Cluster Analysis (클라이언트/서버 결정론적 계산, 0원)
- **입력 풀**: 현재 사용자 1명 + 시드 데이터 **100명** (총 101명)
- **고차원 피처 벡터 (21차원)**:
  - 온도 정규화(1) + 주당 시간 정규화(1) + 4축 성향 이진 인코딩(4) + AI 스타일 원-핫(3) + 장점/약점 12종 압축 벡터(12)
- **클러스터링 & 2D 시각화**:
  - 101명을 K-Means(`K = 5`)로 클러스터링하고, 2D 투영 좌표 `(x, y)`를 산출해 산점도에 렌더링
  - 현재 유저와 같은/인접 클러스터 후보 중 **4인 팀 조합 점수** 상위 3팀 추출:
    ```text
    totalScore = (온도 일치 × 0.25)
               + (16×16 매트릭스 평균 궁합 × 0.25)
               + (장점↔약점 퍼즐 보완율 × 0.35)
               + (AI 스타일 조화 × 0.15)
               − (협업 지뢰 충돌 감점)
    ```

#### 2단계: AI 아바타 사전 모의회의 (`POST /api/avatar-meeting`)
- 대규모 공모전에서 추천된 팀에 대해 **단일 Gemini Flash Structured JSON 호출**로 6턴 가상 첫 회의 + 3~4줄 요약 + 합의 포인트 1줄 생성
- **폴백(Fallback) 필수**: 해커톤 시연 중 네트워크/API 키 오류 시에도 화면이 멈추지 않도록, 멤버 프로필 기반 템플릿 폴백 JSON 반환 구현

#### 3단계: 20분 파일럿 해커톤 (`POST /api/pilot-chat`)
- **진입**: `contest.pilotTopics` 3개 중 안건 1개 선택 → 파일럿 방 입장
- **구성**:
  - 상단: `20:00` 카운트다운 타이머 + **[시연용: 30초 단축 / 바로 종료]** 토글 버튼
  - 좌측/상단 탭: **1페이지 공유 메모** (`문제 정의` / `핵심 아이디어` / `역할 분담`)
  - 우측/하단: **실시간 팀 채팅** — 사용자가 메시지를 보내면 `/api/pilot-chat`을 통해 시드 팀원 3명 중 1~2명이 각자의 `collabType`·`strengths`·`aiStyle`에 맞는 말투로 2~3초 내 응답
- **종료 & 무거절 투표**: 타이머 종료 또는 완료 클릭 시 비공개 투표 모달(`이 팀으로 본선 갈래요` / `다음 기회에`) → 수락 시 시드 팀원 수락 애니메이션(1.5초) 후 `UNLOCKED` 화면(실명·전공·전체 CV 공개 + 오픈채팅 복사)으로 이동

---

### 기능 2. 퍼즐 프로필 (+ Weekly Drop 자동 알림)

- **상태 전환 즉시 반영**: 프로필 상단 토글(`편함 36.5°` / `균형 65°` / `진지 90°`)을 누르면 퍼즐 카드의 모양·색상·테두리·분위기가 즉시 변경됨
- **퍼즐 모양 매핑**:
  - 좌/우 돌기(凸) = 내가 선택한 **장점 2장**
  - 상/하 홈(凹) = 내가 선택한 **약점 2장**
  - 중앙 엠블럼 = **4축 16유형 코드**(예: `APDB`) + **현재 온도 배지**(`90°`)
- **Weekly Drop (매주 금요일 일괄 매칭)**:
  - 프로필 설정 영역에 **`매주 금요일 밤 10시 자동 팀 매칭 받기` 토글** 제공 (별도 탭 없음)
  - 시연 편의를 위해 토글 옆에 작은 **`[이번 주 금요일 드롭 미리보기]`** 버튼을 두어 클릭 시 이번 주 자동 추천 팀 알림 카드를 즉시 확인 가능

---

### 기능 3. CV 템플릿 제공 (`POST /api/parse-cv`)

- **표준 5섹션 에디터** (`/cv`):
  1. 기본정보·학력 (`realName`, `university`, `major`, `grade`, `headline`)
  2. 프로젝트·공모전 이력 (`experiences[]` — 추가/삭제 가능, 초보자용 “수업 팀플도 괜찮아요” 가이드 문구)
  3. 스킬·언어 (`skills[]`, `languages[]`)
  4. AI 툴 활용 방식 (`aiTools[]`, `aiUsageNote`)
  5. 협업 스타일 (`collaborationNote` — 퍼즐 프로필의 16유형·장단점과 자동 동기화 미리보기)
- **PDF 업로드 자동 채우기**: 링크드인 `PDF로 저장` 파일 또는 일반 이력서 PDF를 업로드하면 텍스트 추출 후 `/api/parse-cv` (Gemini API)가 5섹션 JSON으로 자동 채움 *(시연용 “샘플 링크드인 PDF로 채워보기” 원클릭 버튼 필수 포함)*
- **원클릭 내보내기 2종**:
  1. **`링크드인 복붙 요약 복사`**: 국문/영문 경력·프로젝트 요약 텍스트를 클립보드에 즉시 복사
  2. **`PDF 저장 / 인쇄`**: `@media print` 전용 깔끔한 1페이지 CV 시트 인쇄

---

## 5. API 계약 (혜원 구현 ↔ 규혁 호출)

모든 API는 Next.js Route Handlers (`src/app/api/...`)로 구현합니다.

### 5.1 `POST /api/avatar-meeting`
- **Request**: `{ contest: Contest, team: TeamCandidate }`
- **Response (`200`)**: `AvatarMeetingResult`

### 5.2 `POST /api/pilot-chat`
- **Request**: `{ contestTitle: string, topic: string, teamMembers: UserProfile[], messages: PilotMessage[], workspace: PilotWorkspace, userMessage: string }`
- **Response (`200`)**: `{ replies: PilotMessage[], suggestedWorkspacePatch?: Partial<PilotWorkspace> }`

### 5.3 `POST /api/parse-cv`
- **Request**: `multipart/form-data` (`file`: PDF) 또는 JSON `{ rawText: string }`
- **Response (`200`)**: `{ cv: Partial<CvTemplate>, suggestedStrengths?: SkillCardId[], suggestedAiStyle?: AiStyle }`

---

## 6. 화면 라우트 목록 (규혁·연서 공통)

| 경로 | 화면명 | 핵심 역할 |
|---|---|---|
| `/` | 랜딩 & 로그인 | On-do 소개, 미니 퍼즐 프리뷰, `@yonsei.ac.kr` 간편 시작(데모 1클릭 체험 포함) |
| `/onboarding` | 2분 퍼즐 온보딩 | 4단계(온도 선택 → 4축 4문항 → 장점 2·약점 2 → AI 스타일·지뢰) |
| `/profile` | 내 퍼즐 프로필 | 상태 3종 실시간 전환, 내 퍼즐 카드, Weekly Drop 알림 토글 + 미리보기, CV 바로가기 |
| `/cv` | CV 템플릿 에디터 | 5섹션 편집, PDF 자동 채우기(+샘플 버튼), 링크드인 복붙 복사, PDF 인쇄 |
| `/match` | 공모전 선택 & 1·2단계 매칭 | 공모전 목록(`small`/`large` 배지) → **100명 클러스터 산점도** → 추천 팀 3개 + (대규모) AI 아바타 모의회의 카드 |
| `/pilot/[teamId]` | 3단계 20분 파일럿 해커톤 | 안건 선택 → 타이머(단축 모드) + 1페이지 공유 메모 + AI 팀원 3명 실시간 채팅 → 비공개 투표 |
| `/team/[teamId]` | 팀 확정 & 언락 | 4인 퍼즐 합체 연출, 실명·학과·전체 CV 열람, 오픈채팅 링크 & 첫 회의 안건 복사 |

---

## 7. 폴더 소유권 (3인 AI 에이전트 충돌 방지 규칙)

각 에이전트는 **본인 소유 폴더만 수정**합니다. 공통 타입(`src/types/ondo.ts`) 변경이 필요하면 혜원이 수정 후 공유합니다.

| 담당자 | 소유 경로 | 핵심 산출물 |
|---|---|---|
| **혜원 (Schema & AI)** | `src/types/`, `src/data/`, `src/lib/matching/`, `src/app/api/` | 타입 정의, 100명 시드 JSON, 16×16 매트릭스, 1단계 클러스터·PCA·스코어링, Gemini API 3종 |
| **규혁 (UX & Flow)** | `src/store/`, `src/app/**/page.tsx`, `src/app/layout.tsx` | `localStorage` 상태 관리, 7개 페이지 라우팅/상태 연결, 시연용 단축 컨트롤, 카피라이팅 |
| **연서 (Slides & UI)** | `src/components/`, `src/app/globals.css`, `docs/slides/` | 디자인 토큰, 상태별 퍼즐 SVG/UI 컴포넌트, 산점도/모의회의/CV/파일럿 UI, 발표 슬라이드(10~12장) |

---

## 8. 해커톤 심사 시연 시나리오 (2분 완결)

1. **문제 제기 & 온보딩 (20초)**: `/` → “데모 계정으로 시작” 또는 4단계 온보딩 → `/profile`에서 온도 토글(`36.5° ↔ 90°`)로 **퍼즐 디자인이 실시간 변하는 모습** 시연
2. **CV 템플릿 (20초)**: `/cv` → “샘플 링크드인 PDF 자동 채우기” 클릭 → 5섹션 자동 완성 → “링크드인 복붙 요약 복사” 확인
3. **1단계 클러스터 + 2단계 AI 아바타 (40초)**: `/match` → 대규모 해커톤 선택 → **100명 다차원 클러스터 산점도**에서 내 위치와 추천 4인 연결선 확인 → **AI 아바타 6턴 모의회의 요약 & 합의 포인트** 확인
4. **3단계 20분 파일럿 해커톤 & 팀 확정 (40초)**: “20분 파일럿 해커톤 먼저 해보기” 클릭 → 안건 1개 선택 → 채팅 1줄 입력 → 시드 팀원 3명이 각자 성향대로 즉시 AI 응답 → 시연 단축 종료 → 비공개 투표 수락 → `/team/[id]`에서 **4인 퍼즐 합체 + 실명·CV 언락**!
