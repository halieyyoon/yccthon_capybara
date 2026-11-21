# AI Agent 작업 지침서 — 혜원 (Schema · Seed 100명 · Clustering · AI API)

> **필독 기준 문서**: 루트의 [`SPEC.md`](../../SPEC.md)  
> 이 문서는 **혜원 담당 AI 에이전트**가 바로 구현에 착수할 수 있도록 소유 파일, 상세 요구사항, 완료 기준을 정리한 지침서입니다.

---

## 1. 소유 영역 (파일 충돌 방지)

- **수정 가능**: `src/types/`, `src/data/`, `src/lib/matching/`, `src/app/api/`
- **수정 금지**: `src/components/` (연서 소유), `src/store/` 및 `src/app/**/page.tsx` (규혁 소유)
- **주의**: `src/types/ondo.ts`의 인터페이스/타입 이름은 `SPEC.md` 3장과 **100% 동일**해야 규혁·연서의 코드와 바로 붙습니다.

---

## 2. 구현 태스크 목록 (우선순위 순)

### Task 1. 공통 타입 & 도메인 상수 (`src/types/ondo.ts`, `src/data/constants.ts`)
- `SPEC.md` 3장의 모든 TypeScript 타입을 `src/types/ondo.ts`로 생성
- `src/data/constants.ts`에 다음 상수 배열/맵 정의:
  - `TEMPERATURE_MODES` (`fun` 36.5° / `balanced` 65° / `serious` 90°)
  - `COLLAB_AXES` (4축 질문 4개와 `A/M`, `P/S`, `D/H`, `B/V` 메타데이터)
  - `SKILL_CARDS` (12종 — `id`, `strengthLabel`, `weaknessLabel`, `category`, `puzzleShapeKey`)
  - `DEAL_BREAKERS` (8종 — `id`, `label`, `description`)
  - `AI_STYLES` (3종 — `ai_accelerator`, `ai_verifier`, `manual_first`)
  - `COMPATIBILITY_MATRIX_16X16`: `Record<CollabType, Record<CollabType, 1 | 2 | 3 | 4 | 5>>`  
    *(참고: `reference/mbti matching matrix/`의 5단계 범례 `5=ideal, 4=good, 3=one_sided, 2=workable, 1=caution`에 맞춰 대칭/논리적 규칙으로 16×16 전체 작성)*

### Task 2. 연세대 시드 데이터 100명 + 공모전 8건 (`src/data/seedUsers.ts`, `src/data/seedContests.ts`)
- **`seedUsers.ts` (정확히 100명)**:
  - 다양한 연세대 학과 분포(컴퓨터과학, 경영, 디자인/시각디자인, 통계/응용통계, 산업공학, 전기전자, 경제, 언론홍보영상, 심리, 문헌정보 등 12개 이상 전공)
  - 온도 분포: `fun(36.5°)` ~30명, `balanced(65°)` ~35명, `serious(90°)` ~35명
  - 16유형(`CollabType`)과 12종 장단점 카드가 고르게 분포하되, **현실적인 전공-장단점 상관관계** 반영 (예: 컴공은 `frontend`/`backend` 강점·`pitching`/`ui_design` 약점 비율 높음, 경영은 `slide_story`/`pitching` 강점·`frontend`/`backend` 약점 비율 높음)
  - 모든 100명은 **실제 같은 한국어 `nickname`, `realName`, `cv` 5섹션**을 모두 보유해야 팀 언락 화면(`/team/[teamId]`)에서 100% 풍부하게 보임
  - **시연용 샘플 CV 텍스트 상수** (`SAMPLE_LINKEDIN_CV_TEXT`) 1개 함께 제공 (규혁·연서가 `/cv`의 “샘플 링크드인 PDF로 채워보기”에 사용)
- **`seedContests.ts` (8건)**:
  - **대규모(`scale: 'large'`) 4건**: 예) YCCthon 2026 해커톤, 전국 대학생 AI 창업 경진대회, 핀테크 서비스 기획 공모전, 대학생 ESG 데이터 챌린지 → 각각 `pilotTopics` 3개씩 포함
  - **소규모(`scale: 'small'`) 4건**: 예) 연세대 교내 주말 미니 해커톤, 2주 UI/UX 리디자인 스터디 프로젝트, 교내 데이터 시각화 챌린지, 자유 사이드 프로젝트 → `pilotTopics: []`

### Task 3. 1단계 High-Dimensional Cluster Analysis 엔진 (`src/lib/matching/clusterEngine.ts`)
- **Export 함수 1**: `runClusterAnalysis(currentUser: UserProfile, pool: UserProfile[]): ClusteredPoint[]`
  - 총 101명(`currentUser` + 100명 시드)을 21차원 수치 벡터로 인코딩
  - 결정론적 시드 기반 K-Means(`K = 5`) 클러스터링 수행 (매번 새로고침해도 좌표가 날뛰지 않게 고정 시드 사용)
  - 2D PCA(또는 2축 선형 투영: X축=온도·리듬·실행 성향, Y축=AI·기여초점 성향 + 분산 정규화)로 `(-100 ~ 100)` 좌표 산출
- **Export 함수 2**: `recommendTeams(currentUser: UserProfile, pool: UserProfile[], contest: Contest, clusteredPoints: ClusteredPoint[]): { teams: TeamCandidate[]; annotatedPoints: ClusteredPoint[] }`
  - `currentUser`의 클러스터 및 인접 클러스터 후보군에서 3명을 조합해 상위 3개 팀(`rank: 1 | 2 | 3`) 생성
  - **점수 계산식**:
    - `temperatureFit` (0~25): 팀원 온도 분산이 작고 `currentUser`와 일치할수록 고점
    - `matrixCompatibility` (0~25): 4인 중 6개 페어의 `COMPATIBILITY_MATRIX_16X16` 평균(1~5 → 0~25 변환)
    - `puzzleComplement` (0~35): 팀 내 8개 약점 중 다른 팀원의 장점으로 덮이는 비율 (`puzzlePairs` 배열 정확히 생성!)
    - `aiStyleFit` (0~15): AI 활용 스타일 조화도
    - `dealBreakerPenalty` (0~25 감점): `SPEC.md` 2.4 규칙 기반 충돌 감점
  - `annotatedPoints`: 1순위 추천 팀원 3명에 `isRecommendedTeammate: true`, 본인에 `isCurrentUser: true` 마킹

### Task 4. 실제 Gemini API 라우트 3종 (`src/app/api/...`)
- 환경 변수: `GEMINI_API_KEY` (`.env.local`), 모델: `gemini-2.5-flash` (`responseMimeType: "application/json"`)
- **공통 필수 규칙**: `GEMINI_API_KEY`가 없거나 네트워크/할당량 오류가 나도 **절대 500 에러로 데모가 깨지지 않도록**, 각 API마다 자연스러운 한국어 **폴백 응답(Fallback)**을 반드시 구현할 것!
- **① `src/app/api/avatar-meeting/route.ts` (`POST`)**:
  - 입력: `{ contest, team }` → 출력: `AvatarMeetingResult`
  - 프롬프트 요구: 4명 각자의 `nickname`, `collabType`, `strengths`, `weaknesses`, `aiStyle` 성격이 실제 말투에 드러나는 **6턴 가상 첫 회의** + 3~4줄 요약 + 첫 회의 합의 포인트 1줄 + `chemistryBadge` 생성
- **② `src/app/api/pilot-chat/route.ts` (`POST`)**:
  - 입력: `{ contestTitle, topic, teamMembers, messages, workspace, userMessage }`
  - 출력: `{ replies: PilotMessage[], suggestedWorkspacePatch?: Partial<PilotWorkspace> }`
  - 프롬프트 요구: 시드 팀원 3명 중 맥락에 맞는 1~2명이 각자의 강점·말투로 짧고 현실적인 대학생 팀플 대화(1~2문장)로 응답 + 대화 내용에 따라 1페이지 공유 메모(`problemStatement`/`solutionIdea`/`roleSplit`) 자동 업데이트 제안 반환
- **③ `src/app/api/parse-cv/route.ts` (`POST`)**:
  - `multipart/form-data`(PDF 파일 → 텍스트 추출) 및 JSON `{ rawText }` 둘 다 지원
  - 출력: `{ cv: Partial<CvTemplate>, suggestedStrengths?: SkillCardId[], suggestedAiStyle?: AiStyle }`

---

## 3. 완료 체크리스트 (Acceptance Criteria)
- [ ] `npx tsc --noEmit` 타입 에러 0건
- [ ] 100명 시드 유저가 12개 이상 전공, 3종 온도, 16유형에 현실적으로 분포하고 누락 필드 없음
- [ ] `recommendTeams()` 실행 시간 `< 100ms`, `puzzlePairs`가 실제 장단점 ID 일치로 정확히 매핑됨
- [ ] 3개 API 모두 `GEMINI_API_KEY` 있을 때 정상 JSON 응답 + 키 없을 때 폴백 JSON 정상 응답 확인
