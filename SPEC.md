# On-do (온도) — 마스터 기획서 (Single Source of Truth, v1.1)

> **문서 목적**  
> YCCthon 카피바라 팀 3명(**혜원 · 규혁 · 연서**)과 각자의 **AI 에이전트**가 충돌 없이 병렬로 작업하기 위한 단일 기준 문서입니다.  
> **`docs/proposal/08-팀원매칭척도및설문설계.md`의 27차원 분석 피처 규격(`feature_schema_version = "v1.0"`)과 방법론 원칙을 전면 통합**했습니다.
>
> **역할별 AI 에이전트 작업 지침서**
> - **혜원 (Schema · 27차원 피처 · Seed 100명 · Clustering · AI API)**: [`docs/agents/hyewon-schema.md`](./docs/agents/hyewon-schema.md)
> - **규혁 (UX · 라우팅 · 상태관리 · 인터랙션 · 카피)**: [`docs/agents/gyuhyeok-ux.md`](./docs/agents/gyuhyeok-ux.md)
> - **연서 (UI 컴포넌트 · 퍼즐 디자인 시스템 · 발표 슬라이드)**: [`docs/agents/yeonseo-slides-ui.md`](./docs/agents/yeonseo-slides-ui.md)

---

## 1. 서비스 정의 & 설계 원칙

### 1.1 한 줄 정의
**On-do (온도)** — 스펙 대신 **27차원 협업 피처·참여 온도(36.5°/65°/90°)·장단점 퍼즐**을 바탕으로, **다차원 군집 탐색 → AI 아바타 사전 모의회의 → 20분 파일럿 해커톤**을 거쳐 팀원 간 목표 일치·역량 보완·사전 쟁점을 확인하고 무거절로 팀을 결성하는 대학생 프로젝트 매칭 서비스

### 1.2 핵심 구현 범위 (YCCthon MVP)
- **형태**: 프론트엔드 중심 인터랙티브 웹 MVP + **실제 Gemini API 연동** + **연세대 합성 시드 데이터 100명**
- **기술 스택**: `Next.js (App Router)` · `TypeScript` · `Tailwind CSS` · `Gemini API (gemini-2.5-flash)` · `localStorage`
- **MVP 핵심 3가지 기능**:
  1. **3단계 매칭 엔진**: `1단계 27차원 군집 탐색 & 팀 수준 최적화` → `2단계 AI 아바타 사전 모의회의` → `3단계 20분 파일럿 해커톤`
  2. **퍼즐 프로필 (+ Weekly Drop 자동 알림 토글)**: 참여 상태 3종에 따라 디자인이 변하는 퍼즐 프로필 + 16유형 호환성 매트릭스 + 장점 2장·약점 2장
  3. **CV 템플릿 제공**: 표준 5섹션 에디터 + 링크드인/이력서 PDF 업로드 AI 자동 채우기 + 원클릭 링크드인 복붙 요약 & PDF 인쇄 내보내기
- **이번 MVP에서 제외 (v2 확장)**:
  - `When2Meet` 주간 가능 시간표 기반 정기 회의 추천 *(하드 제약 필드로 예약만 두고 MVP UI/로직 제외)*
  - 실제 Supabase DB/Auth 및 멀티유저 실시간 WebSocket *(3단계 파일럿 방은 시드 팀원 3명이 AI 페르소나로 실시간 반응)*

### 1.3 전 팀원·에이전트 공통 금지 원칙 (`08번 문서` 정합)
UI 카피, AI 프롬프트, 발표 슬라이드 어디에서도 아래 과장을 절대 사용하지 않습니다.
- ❌ **금지**: “궁합 정확도 94%”, “검증된 심리검사”, “같은 군집 = 좋은 팀 보장”, “AI가 실제 행동을 정확히 예측”, “합성 데이터로 실제 성능 입증”
- ✅ **원칙**:
  - 모든 27차원 값은 **자기보고 또는 규칙 기반 분석 피처(`v1.0`)**로 명시
  - 결측값(미응답 성격·갈등 문항 등)은 **절대 `0`으로 채우지 않고 `null`로 보존**하며, 가용 지표의 가중치만 재조정하고 정보 부족을 표기
  - AI 아바타 모의회의는 **행동 예측이 아니라 사전 쟁점을 드러내는 가상 실험**으로 명시
  - 2D 군집 산점도는 **탐색적 시각화(합성 시드 100명 데모)**이며, 2D 거리를 적합도 근거로 주장하지 않음

---

## 2. 고정 27차원 분석 피처 규격 (`feature_schema_version = "v1.0"`)

`docs/proposal/08-팀원매칭척도및설문설계.md`에 따라 **사용자 1명당 27개 분석 피처 순서를 고정**합니다.  
초기 2분 온보딩에서는 **목표(4) + AI 규범(3) + 작업 방식(4) + 역량(6)**을 우선 수집하고, **성격(5) + 갈등 대응(5)**은 선택 심화 단계로 두어 미응답 시 `null`로 저장합니다.

| 인덱스 | 그룹 | 키 (`FeatureKey`) | 의미 (높은 값) | 값 범위 | 온보딩 수집 |
|---:|---|---|---|---|---|
| 0 | 성격(5) | `openness` | 새로운 접근·아이디어 선호 | `1~5 \| null` | 선택 심화 |
| 1 | 성격(5) | `conscientiousness` | 계획·책임·마감 준수 경향 | `1~5 \| null` | 선택 심화 |
| 2 | 성격(5) | `extraversion` | 적극적 상호작용 경향 | `1~5 \| null` | 선택 심화 |
| 3 | 성격(5) | `agreeableness` | 협조·배려 경향 | `1~5 \| null` | 선택 심화 |
| 4 | 성격(5) | `emotional_stability` | 정서적 동요 적음 | `1~5 \| null` | 선택 심화 |
| 5 | 목표(4) | `winning_orientation` | 성과·수상 우선 | `1~5` | **필수** |
| 6 | 목표(4) | `learning_priority` | 기술 습득·경험 우선 | `1~5` | **필수** |
| 7 | 목표(4) | `delivery_priority` | 작동하는 결과물 제출 우선 | `1~5` | **필수** |
| 8 | 목표(4) | `continuation_intent` | 해커톤 이후 지속 의향 | `1~5` | **필수** |
| 9 | 갈등(5) | `integrating` | 협력적 통합 선호 | `1~5 \| null` | 선택 심화 |
| 10 | 갈등(5) | `obliging` | 상대 우선 선호 | `1~5 \| null` | 선택 심화 |
| 11 | 갈등(5) | `dominating` | 자기 주장 선호 | `1~5 \| null` | 선택 심화 |
| 12 | 갈등(5) | `avoiding` | 갈등 회피 선호 | `1~5 \| null` | 선택 심화 |
| 13 | 갈등(5) | `compromising` | 상호 타협 선호 | `1~5 \| null` | 선택 심화 |
| 14 | AI 규범(3) | `ai_use_permissiveness` | 핵심 업무 AI 사용 허용 | `1~5` | **필수** |
| 15 | AI 규범(3) | `ai_verification_strictness` | AI 결과물 직접 검증 요구 | `1~5` | **필수** |
| 16 | AI 규범(3) | `ai_disclosure_preference` | AI 사용 범위 팀 내 공개 요구 | `1~5` | **필수** |
| 17 | 작업방식(4) | `prototyping_preference` | 빠른 프로토타이핑 선호 | `1~5` | **필수** |
| 18 | 작업방식(4) | `risk_appetite` | 불확실한 기능 시도 성향 | `1~5` | **필수** |
| 19 | 작업방식(4) | `quality_priority` | 기능 수보다 완성도 우선 | `1~5` | **필수** |
| 20 | 작업방식(4) | `decision_structure_preference` | 의사결정 규칙·담당자 명확화 | `1~5` | **필수** |
| 21 | 역량(6) | `planning` | 기획·요구사항 정의 숙련도 | `0~4` | **필수** |
| 22 | 역량(6) | `frontend` | UI·웹 프론트엔드 숙련도 | `0~4` | **필수** |
| 23 | 역량(6) | `backend` | API·서버·DB 숙련도 | `0~4` | **필수** |
| 24 | 역량(6) | `design` | UX·UI·시각 디자인 숙련도 | `0~4` | **필수** |
| 25 | 역량(6) | `data_ai` | 데이터 분석·ML·생성형 AI 숙련도 | `0~4` | **필수** |
| 26 | 역량(6) | `presentation` | 발표·피칭·커뮤니케이션 숙련도 | `0~4` | **필수** |

> **27차원에 절대 포함하지 않는 별도 필드** (`08번 문서` 0장 준수):  
> - `preferredRoles` (희망 역할 — 숙련도 21~26과 분리)
> - `weeklyHours`, `hardConstraints` (행사 자격, 오프라인/야간 작업 가능 여부)
> - `availableSlots` (v2 When2Meet용 시간 슬롯)
> - 학번·실명·이메일 등 개인 식별정보

---

## 3. 퍼즐 프로필 & 도메인 상수 (혜원·규혁·연서 공통)

### 3.1 참여 온도 상태 3종 (`TemperatureMode`)
프로필 상태를 바꾸면 퍼즐 디자인 테마가 즉시 변경되며, `winning_orientation` / `learning_priority` 목표 기대치와 연동됩니다.

| `id` | 표시 라벨 | 온도 | 의미 | 퍼즐 비주얼 톤 (연서) |
|---|---|---|---|---|
| `fun` | `가볍게 재미 · 경험` | `36.5` | 탐색·학습·부담 없는 경험 중심 | 둥근 유기적 퍼즐, 파스텔 코랄/민트 |
| `balanced` | `균형 있게 완주` | `65` | 즐겁게 하되 작동하는 결과물 완주 | 깔끔한 라운드 퍼즐, 소프트 스카이 블루 |
| `serious` | `진지하게 수상 · 취업` | `90` | 수상·포트폴리오·고완성도 집중 | 각진 지오메트릭 퍼즐, 딥 블루/차콜 |

### 3.2 4축 협업 유형 16종 (`CollabType` — 퍼즐 시각 요약 & 16×16 매트릭스)
설문 피로도를 줄이기 위해 **27차원 응답에서 자동 도출**합니다 (별도 중복 질문 불필요).

- **1축 (AI 규범)**: `ai_use_permissiveness >= 3.5` → `A` (AI 가속) / 미만 → `M` (직접 검증·구현)
- **2축 (작업 방식)**: `prototyping_preference >= quality_priority` → `S` (빠른 프로토·실행) / 미만 → `P` (구조·완성도 우선)
- **3축 (소통·결정)**: `decision_structure_preference >= 3.5` (또는 `dominating >= obliging`) → `D` (명확·직설) / 미만 → `H` (유연·합의)
- **4축 (역량 초점)**: `max(frontend, backend, data_ai) >= max(planning, design, presentation)` → `B` (구현·기술) / 미만 → `V` (기획·디자인·스토리)

→ 총 **16유형** + `reference/mbti matching matrix/`의 **5단계 호환성 매트릭스** (`5=ideal 블루`, `4=good 진초록`, `3=one_sided 연두`, `2=workable 노랑`, `1=caution 빨강`)를 퍼즐 시각 보조 및 협업 쟁점 안내에 활용합니다. *(심리검사 진단이 아닌 시각화 요약 배지임)*

### 3.3 장점·약점 퍼즐 카드 (각 12종, 사용자당 장점 2장 + 약점 2장)
| ID | 장점 카드 (돌기 凸) | 대응 약점 카드 (홈 凹) | 연계 역량 축 |
|---|---|---|---|
| `frontend` | 프론트엔드·화면 구현 | 화면 구현·코딩 서툼 | `frontend` |
| `backend` | 백엔드·API·DB 설계 | 서버·데이터 연결 어려움 | `backend` |
| `ai_prompt` | AI 툴·프롬프트 활용 능숙 | AI 툴 활용이 어색함 | `data_ai` |
| `data_analysis` | 데이터 분석·리서치 | 수치·근거 데이터 정리 약함 | `data_ai` |
| `ui_design` | UI/UX·시각 디자인 | 디자인 감각·미감 부족 | `design` |
| `slide_story` | 장표 구성·스토리라인 | 발표 자료 구조화 서툼 | `planning` |
| `pitching` | 발표·질의응답 강점 | 발표 울렁증 있음 | `presentation` |
| `ideation` | 빠른 아이디어 발산 | 백지에서 아이디어 짜기 어려움 | `planning` |
| `pm_schedule` | 일정 관리·역할 정리 | 마감·일정 관리가 약함 | `planning` |
| `copywriting` | 글쓰기·문서·카피라이팅 | 글 정리·문서화 부담 | `presentation` |
| `user_research` | 인터뷰·시장 조사 | 현장 조사·사용자 인터뷰 서툼 | `planning` |
| `fast_proto` | 빠른 프로토타이핑·실행력 | 실행 착수가 느림(완벽주의) | `frontend` |

### 3.4 협업 지뢰 (`DealBreakerId` — 8종 중 1~2개 선택)
`ghosting`(24시간 이상 연락 두절) · `blind_ai_copy`(이해 없이 AI 복붙) · `last_minute`(마감 직전 뒤집기) · `no_prep`(자료 미확인) · `free_riding`(역할 떠넘기기) · `harsh_tone`(공격적 피드백) · `slow_decision`(결정 지연) · `scope_creep`(무리한 기능 추가)

---

## 4. 공통 TypeScript 스키마 계약 (`src/types/ondo.ts`)

**혜원**이 `src/types/ondo.ts`를 최초 작성하고, **규혁**과 **연서**는 이 타입을 그대로 import합니다.

```ts
export const FEATURE_SCHEMA_VERSION = 'v1.0' as const;

export type TemperatureMode = 'fun' | 'balanced' | 'serious';
export type TemperatureValue = 36.5 | 65 | 90;
export type WeeklyHours = '3-5h' | '6-10h' | '10h+';
export type ContestScale = 'small' | 'large';
export type RoleId = 'planning' | 'frontend' | 'backend' | 'design' | 'data_ai' | 'presentation';

export type SkillCardId =
  | 'frontend' | 'backend' | 'ai_prompt' | 'data_analysis'
  | 'ui_design' | 'slide_story' | 'pitching' | 'ideation'
  | 'pm_schedule' | 'copywriting' | 'user_research' | 'fast_proto';

export type DealBreakerId =
  | 'ghosting' | 'blind_ai_copy' | 'last_minute' | 'no_prep'
  | 'free_riding' | 'harsh_tone' | 'slow_decision' | 'scope_creep';

export type CollabType =
  | 'APDB' | 'APDV' | 'APHB' | 'APHV'
  | 'ASDB' | 'ASDV' | 'ASHB' | 'ASHV'
  | 'MPDB' | 'MPDV' | 'MPHB' | 'MPHV'
  | 'MSDB' | 'MSDV' | 'MSHB' | 'MSHV';

// 고정 27차원 분석 피처 (결측은 0이 아닌 null!)
export interface Features27 {
  // 성격 (5) — 선택 심화, 미응답 시 null
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  emotional_stability: number | null;
  // 목표 (4) — 1~5
  winning_orientation: number;
  learning_priority: number;
  delivery_priority: number;
  continuation_intent: number;
  // 갈등 대응 (5) — 선택 심화, 미응답 시 null
  integrating: number | null;
  obliging: number | null;
  dominating: number | null;
  avoiding: number | null;
  compromising: number | null;
  // AI 규범 (3) — 1~5
  ai_use_permissiveness: number;
  ai_verification_strictness: number;
  ai_disclosure_preference: number;
  // 작업 방식 (4) — 1~5
  prototyping_preference: number;
  risk_appetite: number;
  quality_priority: number;
  decision_structure_preference: number;
  // 역량 숙련도 (6) — 0~4
  planning: number;
  frontend: number;
  backend: number;
  design: number;
  data_ai: number;
  presentation: number;
}

export interface HardConstraints {
  weeklyHours: WeeklyHours;
  offlineAvailable: boolean;
  nightWorkAvailable: boolean;
  // v2 When2Meet 확장 예약 (MVP 미사용, 27차원 불포함)
  availableTimeSlots?: Record<string, number[]>;
}

export interface CvExperience {
  title: string;
  role: string;
  period: string;
  summary: string;
}

export interface CvTemplate {
  realName: string;
  university: string;
  major: string;
  grade: string;
  headline: string;
  experiences: CvExperience[];
  skills: string[];
  languages: string[];
  aiTools: string[];
  aiUsageNote: string;
  collaborationNote: string;
  source?: 'manual' | 'pdf_parsed';
}

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  featureSchemaVersion: typeof FEATURE_SCHEMA_VERSION;
  temperatureMode: TemperatureMode;
  temperature: TemperatureValue;
  features27: Features27;
  preferredRoles: RoleId[];       // 희망 역할 (숙련도와 별도)
  hardConstraints: HardConstraints;
  collabType: CollabType;         // features27에서 자동 도출
  strengths: [SkillCardId, SkillCardId];
  weaknesses: [SkillCardId, SkillCardId];
  dealBreakers: DealBreakerId[];
  weeklyDropEnabled: boolean;     // 매주 금요일 밤 10시 일괄 매칭 알림 토글
  cv: CvTemplate;
}

export interface Contest {
  id: string;
  title: string;
  organizer: string;
  category: 'it_hackathon' | 'business' | 'design' | 'ai_data' | 'free';
  scale: ContestScale;            // 'small' | 'large'
  deadline: string;
  summary: string;
  requiredRoles: RoleId[];
  pilotTopics: string[];          // scale === 'large'일 때 3단계 20분 파일럿 안건 3개
}

export interface ClusteredPoint {
  userId: string;
  nickname: string;
  major: string;
  temperatureMode: TemperatureMode;
  collabType: CollabType;
  clusterId: number;              // Gower + PAM (k=5) 탐색적 군집 ID
  x: number;                      // 2D 탐색 시각화 좌표 (-100 ~ 100)
  y: number;
  missingCount: number;           // 결측 차원 수 (0~10)
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
  id: string;
  contestId: string;
  rank: 1 | 2 | 3;
  members: UserProfile[];         // [현재 유저, 추천 팀원 3명]
  matchScore: number;             // 0 ~ 1 (UI 표기 시 "임시 가중치 기준 점수"로 명시)
  minMemberFit: number;           // 0 ~ 1 (팀원 중 가장 불리한 적합도)
  biggestGapNote: string;         // 예: "AI 결과물 검증 엄격도에 차이가 있어 초반 합의 권장"
  evidenceTags: string[];         // 응답 근거 태그 (군집 라벨 대신 근거 중심 노출)
  scoreBreakdown: {
    goalAlignment: number;        // 0 ~ 1
    roleCoverage: number;         // 0 ~ 1
    aiPolicyAlignment: number;    // 0 ~ 1
    collaborationCompatibility: number; // 0 ~ 1
    scheduleOverlap: number | null;     // MVP는 null (가용 4지표 가중치 재조정)
  };
  missingInfoNotice?: string;     // 성격/갈등 결측 시 안내 문구
  puzzlePairs: PuzzleMatchPair[];
  status: 'CLUSTERED' | 'AVATAR_DONE' | 'PILOT_ACTIVE' | 'WAITING_CONSENT' | 'UNLOCKED' | 'EXPIRED';
}

// 2단계 AI 아바타 모의회의 출력 (08번 문서 6장 4요소 반영)
export interface AvatarTurn {
  speakerId: string;
  speakerNickname: string;
  roleTag: string;
  message: string;
}

export interface AvatarMeetingResult {
  teamId: string;
  contestTitle: string;
  agenda: string;                 // 부여된 공통 안건 (예: "20분 안에 MVP 핵심 기능 1개 합의하기")
  turns: AvatarTurn[];            // 6턴 가상 회의
  consensus: string;              // 합의안
  unresolvedIssues: string[];     // 미해결 쟁점 1~2개
  expectedRoleSplit: string[];    // 예상 역할 분담
  questionsToAskTeam: string[];   // 실제 팀원에게 확인할 질문 2~3개
  chemistryBadge: string;
}

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

## 5. 3단계 매칭 엔진 & 팀 최적화 로직 (`08번 문서` 정합)

### 공모전 규모 분기 규칙
- **소규모 (`scale === 'small'`)**: `1단계 27차원 군집 탐색 & 팀 최적화` → 추천 팀 카드 3개 → **`[바로 만나볼래요]`** (무거절 소집)
- **대규모 (`scale === 'large'`)**: `1단계 27차원 군집 탐색 & 팀 최적화` → **`2단계 AI 아바타 모의회의` 자동 실행** → **`[바로 만나볼래요]`** 또는 **`[20분 파일럿 해커톤 먼저 해보기]`** (3단계)

### 1단계: 27차원 군집 탐색 + 팀 수준 매칭 최적화 (비용 0원)
1. **하드 제약 사전 필터**: 행사 자격·오프라인/야간 등 필수 제약 확인
2. **탐색적 군집분석 (`Gower distance + PAM, k=5`)**:
   - 101명(`currentUser` + 합성 시드 100명)의 `features27`에서 **결측(`null`)을 제외한 유효 차원만으로 그룹 균형 Gower 거리 행렬 계산**
   - PAM(k-medoids, 고정 시드)으로 5개 군집 할당 + 2D MDS/선형 투영 좌표 `(x, y)` 산출 → 산점도 시각화 *(같은 군집만 묶지 않고, 목표 유사성 + 역량 보완성을 함께 고려하는 후보 다양화 보조 계층)*
3. **팀 수준 최적화 점수식 (`08번 문서` 5.3 — `schedule_overlap = null` 시 가용 4지표 재정규화)**:
   ```text
   MVP matchScore (임시 가중치 v1.0, 0~1) =
       0.3750 × goalAlignment              (목표 4차원 유사성, 원안 0.30 / 0.80)
     + 0.3125 × roleCoverage               (역량 6차원 커버리지 + 퍼즐 장단점 보완, 원안 0.25 / 0.80)
     + 0.1875 × aiPolicyAlignment          (AI 규범 3차원 일치, 원안 0.15 / 0.80)
     + 0.1250 × collaborationCompatibility (작업방식·갈등·16×16 매트릭스·지뢰, 원안 0.10 / 0.80)
   ```
   - 성격(01~05)은 점수식에서 제외하고 설명·모의회의 맥락에만 제한 활용
   - 평균 `matchScore`와 함께 **`minMemberFit`(가장 불리한 팀원 적합도)**과 **`biggestGapNote`(가장 큰 차이 쟁점)**를 반드시 함께 표시

### 2단계: AI 아바타 사전 모의회의 (`POST /api/avatar-meeting`)
- **개인 식별정보(실명·이메일)를 제외**하고 `nickname`, `features27` 응답 근거, `strengths`/`weaknesses`, `dealBreakers`만 LLM에 전송
- 공통 안건을 주고 6턴 가상 회의 + **`consensus`(합의안) · `unresolvedIssues`(미해결 쟁점) · `expectedRoleSplit`(예상 역할 분담) · `questionsToAskTeam`(실제 팀원에게 확인할 질문)** 반환
- API 오류 시에도 깨지지 않도록 폴백(Fallback) 응답 필수

### 3단계: 20분 파일럿 해커톤 (`POST /api/pilot-chat`)
- `contest.pilotTopics` 3개 중 1개 선택 → `20:00` 타이머(시연용 30초 단축/즉시 종료 버튼 포함) + 1페이지 공유 메모 + 시드 팀원 3명이 실제 AI 페르소나로 채팅 반응 → 종료 후 비공개 투표 → 상호 수락 시 실명·전체 CV 언락

---

## 6. CV 템플릿 (`POST /api/parse-cv`) & 퍼즐 프로필 (+ Weekly Drop)

- **CV 템플릿 (`/cv`)**: 표준 5섹션 에디터 + 링크드인/이력서 PDF 업로드 AI 자동 채우기(+ 시연용 “샘플 링크드인 PDF로 채워보기” 버튼) + 원클릭 **링크드인 복붙 요약 복사** & **PDF 인쇄**
- **퍼즐 프로필 (`/profile`)**: 상태 3종(`36.5°/65°/90°`) 실시간 전환 시 퍼즐 모양·색상·분위기 즉시 변경 + **Weekly Drop(매주 금요일 밤 10시 자동 매칭 알림) 토글** + 시연용 `[이번 주 금요일 드롭 미리보기]` 버튼

---

## 7. API 계약 & 화면 라우트 & 폴더 소유권

### API 3종 (`src/app/api/`)
- `POST /api/avatar-meeting` — `{ contest, team }` → `AvatarMeetingResult`
- `POST /api/pilot-chat` — `{ contestTitle, topic, teamMembers, messages, workspace, userMessage }` → `{ replies: PilotMessage[], suggestedWorkspacePatch?: Partial<PilotWorkspace> }`
- `POST /api/parse-cv` — `multipart/form-data(file)` or `{ rawText }` → `{ cv: Partial<CvTemplate>, suggestedStrengths?: SkillCardId[] }`

### 화면 7종 (`src/app/`)
`/` (랜딩·데모 진입) · `/onboarding` (2분 필수 + 선택 심화 온보딩) · `/profile` (퍼즐 프로필·Weekly Drop) · `/cv` (5섹션 CV 에디터) · `/match` (공모전 선택·101명 27차원 군집 산점도·AI 아바타 카드) · `/pilot/[teamId]` (20분 파일럿 해커톤 방) · `/team/[teamId]` (팀 확정·실명·CV 언락)

### 폴더 소유권 (충돌 방지)
| 담당자 | 소유 경로 |
|---|---|
| **혜원 (Schema & AI)** | `src/types/`, `src/data/`, `src/lib/matching/`, `src/app/api/` |
| **규혁 (UX & Flow)** | `src/store/`, `src/app/**/page.tsx`, `src/app/layout.tsx` |
| **연서 (Slides & UI)** | `src/components/`, `src/app/globals.css`, `tailwind.config.*`, `docs/slides/` |
