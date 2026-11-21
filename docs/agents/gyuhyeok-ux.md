# AI Agent 작업 지침서 — 규혁 (UX · 라우팅 · 상태관리 · 인터랙션 · 카피)

> **필독 기준 문서**: 루트의 [`SPEC.md`](../../SPEC.md)  
> 이 문서는 **규혁 담당 AI 에이전트**가 전체 사용자 흐름, 상태 관리, 페이지 연결, 시연용 컨트롤을 빈틈없이 구현하도록 정리한 지침서입니다.

---

## 1. 소유 영역 (파일 충돌 방지)

- **수정 가능**: `src/store/`, `src/app/layout.tsx`, `src/app/**/page.tsx`
- **수정 금지**: `src/types/`, `src/data/`, `src/lib/matching/`, `src/app/api/` (혜원 소유), `src/components/` 내부 디자인 (연서 소유 — 단, 연서 컴포넌트 완성 전에는 인터페이스에 맞춰 임시 Wrapper로 연결 후 교체)
- **의존성**: 모든 데이터 구조는 `src/types/ondo.ts`에서 import

---

## 2. 핵심 UX 원칙 (On-do 전용)

1. **모바일 웹 최우선 (`max-w-[430px] mx-auto` 기본, 데스크톱에서는 깔끔한 중앙 앱 프레임 + 산점도/파일럿 방만 여유 폭 허용)**
2. **2분 온보딩 & 0초 데모 진입**: 첫 화면에서 `@yonsei.ac.kr` 입력 + **“데모 계정으로 1초 체험하기”** 버튼 제공 (심사위원·발표 시연 시 즉시 진입 가능)
3. **무거절 심리 설계**: “거절당했다”, “지원 실패” 같은 부정적 표현 전면 금지. 선요청자 비공개 문구(*“누가 먼저 눌렀는지 상대에게 보이지 않아요”*)를 소집 버튼 바로 아래 배치
4. **대기 시간의 UX화**: AI 아바타 모의회의 로딩(2~4초) 동안 단순 스피너 대신 3단계 라이브 중계 텍스트 순차 표시:
   - *“100명 풀에서 온도와 퍼즐이 맞는 클러스터를 찾는 중…”*
   - *“내 AI 아바타가 후보 팀원 3명과 가상 첫 회의를 여는 중…”*
   - *“회의 하이라이트와 첫 회의 합의 포인트를 정리하고 있어요”*

---

## 3. 상태 관리 설계 (`src/store/useOndoStore.ts`)

`localStorage` (`ondo_mvp_state_v1`)에 영속 저장되는 클라이언트 스토어(React Context 또는 Zustand)를 구현합니다.

### 관리할 상태
- `currentUser: UserProfile | null` (온보딩 완료 또는 데모 프리셋 로드 시 생성)
- `selectedContestId: string | null`
- `clusteredPoints: ClusteredPoint[]`
- `recommendedTeams: TeamCandidate[]`
- `avatarMeetings: Record<string, AvatarMeetingResult>` *(key: `teamId`, 중복 API 호출 캐싱)*
- `pilotStates: Record<string, { selectedTopic: string; remainingSec: number; isDemoFastMode: boolean; messages: PilotMessage[]; workspace: PilotWorkspace }>`
- `unlockedTeamIds: string[]`
- `weeklyDropPreviewOpen: boolean`

### 필수 액션
- `initDemoUser()` — 연세대 시연용 기본 유저(컴공 3학년, 90°, `APDB`, 강점 `frontend`·`ai_prompt`, 약점 `pitching`·`ui_design`) 1클릭 로드
- `updateTemperatureMode(mode: TemperatureMode)` — 상태 변경 시 `temperature` 값(`36.5`/`65`/`90`) 동기화 + 즉시 `localStorage` 저장
- `updateCv(patch: Partial<CvTemplate>)`
- `runMatchingForContest(contestId: string)` — 혜원의 `runClusterAnalysis` + `recommendTeams` 호출 → 대규모(`scale === 'large'`)이면 자동으로 1순위 팀 `/api/avatar-meeting` 호출 및 캐싱
- `unlockTeam(teamId: string)` — 무거절 상호 수락 시뮬레이션(1.5초 응답 대기 연출 후 `status = 'UNLOCKED'`)

---

## 4. 7개 페이지 상세 UX 흐름

### 1) `/` — 랜딩 & 로그인
- On-do 로고 + 한 줄 가치 제안 + 미니 퍼즐 프리뷰
- `@yonsei.ac.kr` 이메일 입력 → `/onboarding` 이동
- 하단 보조 버튼: **`데모 계정으로 바로 둘러보기`** → `initDemoUser()` 후 `/profile` 이동

### 2) `/onboarding` — 4단계 2분 컷 퍼즐 온보딩
- 상단 4칸 진행률 바 + 뒤로가기
- **Step 1 (참여 온도)**: `편함 36.5°` / `균형 65°` / `진지 90°` + 주당 시간(`3-5h` / `6-10h` / `10h+`) + 닉네임·전공
- **Step 2 (4축 협업 성향 4문항)**: 한 화면에 2개 카드 중 택1 × 4문항 → 완료 시 내 `CollabType`(예: `APDB`) 결과 배지 표시
- **Step 3 (장점 2장 + 약점 2장)**: 12종 중 정확히 2장씩 선택 *(같은 항목을 장점과 약점에 중복 선택 방지!)*
- **Step 4 (AI 스타일 + 협업 지뢰 1~2개)**: 선택 완료 → `/profile` 이동

### 3) `/profile` — 내 퍼즐 프로필 (+ Weekly Drop)
- 상단: **온도 상태 3종 실시간 전환 세그먼트** → 클릭 즉시 퍼즐 카드 테마 변화 체감
- 중단: 연서의 `PuzzleProfileCard` 렌더링 (강점·약점·16유형·지뢰 요약)
- 하단 영역 1: **Weekly Drop (매주 금요일 밤 10시 자동 매칭 알림)** 토글 + **`[이번 주 드롭 미리보기]`** 모달/시트 버튼
- 하단 영역 2: **`내 CV 템플릿 작성/수정` (`/cv`)** + **`공모전 팀 찾기` (`/match`)** 메인 버튼

### 4) `/cv` — CV 템플릿 에디터
- 상단 배너: **PDF 업로드 input** + **`[시연용 샘플 링크드인 PDF로 채워보기]`** 버튼 → `/api/parse-cv` 호출 후 5섹션 자동 채우기 + 토스트 알림
- 중단: 5섹션 접기/펼치기 또는 깔끔한 카드 폼 (경력 항목 추가/삭제 지원)
- 하단 고정 바:
  - **`링크드인 복붙 요약 복사`** (국문+영문 깔끔한 포맷 클립보드 복사 + “복사됨” 토스트)
  - **`PDF로 저장 / 인쇄`** (`window.print()` 호출, 인쇄용 레이아웃 연결)

### 5) `/match` — 공모전 선택 & 1·2단계 매칭
- 상단: 공모전 리스트 (`소규모 · 바로 매칭` vs `대규모 · AI 아바타 + 파일럿 지원` 배지 명확히 구분)
- 공모전 선택 시:
  - **1단계 영역**: 연서의 `ClusterScatterPlot` (100명 산점도 + 내 클러스터 + 1순위 팀 4인 연결선)
  - **추천 팀 탭**: `추천 #1` / `추천 #2` / `추천 #3` 전환
  - **소규모(`small`) 분기**: 퍼즐 보완 요약 + 점수 분해 + **`[바로 만나볼래요]`** 단일 CTA
  - **대규모(`large`) 분기**: 퍼즐 보완 요약 + **2단계 `AvatarMeetingCard` (6턴 요약 + 합의 포인트)** + 하단 2버튼:
    - **`[바로 만나볼래요]`**
    - **`[20분 파일럿 해커톤 먼저 해보기]`** → `/pilot/[teamId]` 이동

### 6) `/pilot/[teamId]` — 3단계 20분 파일럿 해커톤
- **진입 모달/화면**: `contest.pilotTopics` 3개 중 안건 1개 선택 → 타이머 `20:00` 시작
- **헤더**: 남은 시간 타이머 + **`[시연용: 30초 단축]`** + **`[협업 종료 & 투표]`** 버튼
- **본문 (모바일 탭 전환 / 데스크톱 2단)**:
  - `1페이지 공유 메모`: 문제 정의 / 핵심 아이디어 / 역할 분담 (편집 가능 + AI 응답의 `suggestedWorkspacePatch` 자동 반영 버튼)
  - `팀 채팅`: 메시지 전송 → `/api/pilot-chat` 호출 → “OOO 입력 중…” 연출 후 1~2명 순차 메시지 출력
- **종료 모달**: 비공개 투표 (`이 팀으로 본선 갈래요` / `다음 기회에`) → 수락 시 1.5초 상호 수락 대기 연출 후 `/team/[teamId]` 이동

### 7) `/team/[teamId]` — 팀 확정 & 실명·CV 언락
- 4인 퍼즐 합체 축하 헤더
- 팀원 4명 카드 (이제 익명 닉네임 → **실명 · 전공 · 학년** 공개 + 각 멤버 클릭 시 **전체 5섹션 CV 열람 모달**)
- 하단 액션: **`카카오톡 오픈채팅 링크 복사`** + **`첫 회의 안건 3줄 복사`**

---

## 5. 완료 체크리스트 (Acceptance Criteria)
- [ ] 데모 계정 1클릭 → 프로필 온도 전환 → CV 자동 채우기 → 대규모 매칭(100명 산점도 + AI 아바타) → 20분 파일럿 채팅 → 팀 언락까지 **단 한 번의 에러나 막힘 없이 완주**
- [ ] 소규모 공모전 선택 시 2단계 AI 아바타·3단계 파일럿 버튼이 숨겨지고 바로 소집 흐름으로 분기 확인
- [ ] 새로고침해도 `localStorage`에서 유저 프로필·CV·언락 상태 유지
