# AI Agent 작업 지침서 — 혜원 (Schema · 27차원 피처 · Seed 100명 · Clustering · AI API)

> **필독 기준 문서**: 루트의 [`SPEC.md`](../../SPEC.md) 및 [`docs/proposal/08-팀원매칭척도및설문설계.md`](../proposal/08-팀원매칭척도및설문설계.md)  
> 이 문서는 **혜원 담당 AI 에이전트**가 바로 구현에 착수할 수 있도록 소유 파일, 27차원 스키마·군집 로직, API 요구사항, 완료 기준을 정리한 지침서입니다.

---

## 1. 소유 영역 (파일 충돌 방지)

- **수정 가능**: `src/types/`, `src/data/`, `src/lib/matching/`, `src/app/api/`
- **수정 금지**: `src/components/` (연서 소유), `src/store/` 및 `src/app/**/page.tsx` (규혁 소유)
- **주의**: `src/types/ondo.ts`는 `SPEC.md` 4장의 타입·필드명(`featureSchemaVersion = "v1.0"`, `Features27` 등)과 **100% 일치**해야 합니다.

---

## 2. 구현 태스크 목록 (우선순위 순)

### Task 1. 공통 타입 & 27차원 도메인 상수 (`src/types/ondo.ts`, `src/data/constants.ts`)
- `SPEC.md` 4장의 모든 TypeScript 타입을 `src/types/ondo.ts`로 생성
- `src/data/constants.ts`에 다음 상수 정의:
  - `FEATURE_META_27`: 27개 피처의 고정 순서 배열 (`index 0~26`, `key`, `group`, `label`, `min`, `max`, `optional`)
  - `SURVEY_QUESTIONS`: `08번 문서` 3장의 자체 개발 문항 기반 — **필수 2분 온보딩 문항**(목표 4 + AI 규범 3 + 작업방식 4 + 역량 6)과 **선택 심화 문항**(성격 5 + 갈등 5)을 명확히 분리
  - `TEMPERATURE_MODES` (`fun` 36.5° / `balanced` 65° / `serious` 90°)
  - `SKILL_CARDS` (12종 장단점 1:1 보완 쌍), `DEAL_BREAKERS` (8종), `ROLES` (6종)
  - `COMPATIBILITY_MATRIX_16X16`: `Record<CollabType, Record<CollabType, 1 | 2 | 3 | 4 | 5>>`
  - **헬퍼 함수**: `deriveCollabType(features: Features27): CollabType` (`SPEC.md` 3.2 규칙으로 27차원에서 16유형 자동 도출)

### Task 2. 연세대 합성 시드 데이터 100명 + 공모전 8건 (`src/data/seedUsers.ts`, `src/data/seedContests.ts`)
- **`seedUsers.ts` (정확히 100명, 합성 데모 데이터임을 주석 명시)**:
  - 연세대 12개 이상 전공 분포(컴퓨터과학, 경영, 디자인, 통계, 산업공학, 전기전자, 경제, 언론홍보영상, 심리, 문헌정보 등)
  - 온도 분포: `fun(36.5°)` ~30명, `balanced(65°)` ~35명, `serious(90°)` ~35명
  - **27차원 결측 테스트 포함**: 100명 중 ~70명은 27차원 전체 보유, ~30명은 선택 심화 영역(`성격 5` 또는 `갈등 5`)이 `null` → 결측이 0으로 오염되지 않고 정상 동작하는지 검증 가능
  - 전공과 역량(22~27)·장단점 카드 간 현실적 상관관계 반영
  - 100명 모두 자연스러운 한국어 `nickname`, `realName`, 5섹션 `cv` 보유
  - `SAMPLE_LINKEDIN_CV_TEXT` 1건 함께 export (시연용 원클릭 CV 자동 채우기용)
- **`seedContests.ts` (8건)**:
  - 대규모(`scale: 'large'`) 4건 (`pilotTopics` 각 3개 포함, `requiredRoles` 포함)
  - 소규모(`scale: 'small'`) 4건 (`pilotTopics: []`)

### Task 3. 1단계 27차원 Gower + PAM 군집 탐색 & 팀 수준 최적화 (`src/lib/matching/clusterEngine.ts`)
`08번 문서` 4~5장의 통계적 원칙을 정확히 구현합니다.
- **절대 규칙**:
  - **결측(`null`)은 절대 0으로 치환하지 않음** — 두 사용자 간 Gower 거리는 둘 다 관측된 유효 차원만 사용해 그룹별 균형 가중치로 계산
  - 학번·이름·이메일 및 `hardConstraints`/`preferredRoles`는 **27차원 거리 계산에 넣지 않음**
  - **같은 군집 사람만 묶지 않음** — 군집은 후보 탐색·다양화·시각화 보조 계층이며, 최종 추천은 팀 수준 최적화 점수로 결정
- **Export 1**: `runClusterAnalysis(currentUser: UserProfile, pool: UserProfile[]): ClusteredPoint[]`
  - 101명(`currentUser` + 100명 시드)의 27차원 그룹 가중 Gower 거리 행렬 계산
  - 결정론적 시드 기반 **PAM (k-medoids, `k = 5`)** 군집 할당
  - 거리 행렬 기반 2D 탐색 시각화 좌표 `(x, y)` 산출 (`-100 ~ 100` 정규화) + `missingCount` 기록
- **Export 2**: `recommendTeams(currentUser: UserProfile, pool: UserProfile[], contest: Contest, clusteredPoints: ClusteredPoint[]): { teams: TeamCandidate[]; annotatedPoints: ClusteredPoint[] }`
  - 1차 하드 제약 필터(행사 조건·희망 역할 고려) 후, 군집 다양성을 반영해 4인 조합 후보 생성
  - **팀 수준 점수식 (MVP 4개 가용 지표 가중치 재조정, 합계 1.0)**:
    - `goalAlignment` (`× 0.3750`): 목표 4차원(06~09) 팀 내 분산이 작을수록 고점
    - `roleCoverage` (`× 0.3125`): `contest.requiredRoles` 및 6개 역량(22~27) 커버리지 + 장단점 퍼즐 보완율 (`puzzlePairs` 정확히 생성)
    - `aiPolicyAlignment` (`× 0.1875`): AI 규범 3차원(15~17) 일치도 (중대한 규범 충돌 별도 페널티)
    - `collaborationCompatibility` (`× 0.1250`): 작업방식 4차원 + (관측 시) 갈등 5차원 + 16×16 매트릭스 + 협업 지뢰 충돌 확인
    - `scheduleOverlap: null` *(v2 예약)*
    - **성격 5차원(01~05)은 점수식에서 제외** (설명·모의회의 맥락에만 활용)
  - 각 팀에 **`minMemberFit`(가장 불리한 팀원의 적합도)**, **`biggestGapNote`(가장 큰 차이 쟁점 1줄)**, **`evidenceTags`(응답 근거 태그 3개)**, 결측 시 `missingInfoNotice` 필수 산출

### Task 4. 실제 Gemini API 라우트 3종 (`src/app/api/...`)
- 모델: `gemini-2.5-flash`, `responseMimeType: "application/json"`, **API 키 누락·오류 시 100% 동작하는 한국어 폴백 필수**
- **프라이버시 규칙**: LLM에 `realName`·`email` 등 **개인 식별정보는 절대 전송하지 않음** (`nickname` + 27차원 응답 근거 + 장단점 + 지뢰만 전송)
- **① `POST /api/avatar-meeting`**:
  - 공통 안건(예: *“20분 안에 이번 대회의 핵심 MVP 기능 1개와 역할 분담 합의하기”*) 부여
  - **군집 라벨이 아닌 각 멤버의 실제 27차원 응답 근거**를 바탕으로 6턴 대화 + `consensus`(합의안) + `unresolvedIssues`(미해결 쟁점) + `expectedRoleSplit`(예상 역할 분담) + `questionsToAskTeam`(실제 팀원에게 확인할 질문 2~3개) 반환
- **② `POST /api/pilot-chat`**:
  - 시드 팀원 3명 중 맥락에 맞는 1~2명이 각자의 실제 27차원 성향·역량 말투로 응답 + `suggestedWorkspacePatch` 제안
- **③ `POST /api/parse-cv`**:
  - PDF 업로드(`multipart/form-data`) 및 `{ rawText }` JSON 지원 → 5섹션 `CvTemplate` 자동 추출

---

## 3. 완료 체크리스트 (Acceptance Criteria)
- [ ] `npx tsc --noEmit` 타입 에러 0건
- [ ] 27차원 피처 순서·키가 `08번 문서` `v1.0`과 100% 일치하고 결측(`null`)을 0으로 치환하지 않음
- [ ] `recommendTeams()`가 `< 150ms` 내 상위 3팀 + `minMemberFit` + `biggestGapNote` + `evidenceTags` 반환
- [ ] 3개 API 모두 실 LLM 응답 + 폴백 응답 정상 동작 및 개인 식별정보 미전송 확인
