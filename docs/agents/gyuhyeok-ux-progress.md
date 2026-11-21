# 규혁 UX 구현 현황 (`gyuhyeok/ux-flow` 브랜치)

> 기준: [`SPEC.md`](../../SPEC.md) v1.1 · [`gyuhyeok-ux.md`](./gyuhyeok-ux.md) · 디자인: Material Design 3
> 최종 갱신: 2026-11-21

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

- `GEMINI_API_KEY`(선택)를 `.env.local`에 넣으면 3개 API가 실제 Gemini(`gemini-2.5-flash`)를 호출합니다. 없으면 한국어 규칙 기반 폴백으로 끝까지 동작합니다. (`.env.example` 참고)
- 상태는 브라우저 `localStorage`의 `ondo_mvp_state_v1`에 저장됩니다. 처음부터 다시 하려면 `/profile` 오른쪽 위 나가기 버튼.

## 규혁 소유 (완료)

| 경로 | 내용 |
|---|---|
| `src/store/useOndoStore.ts`, `src/store/demoUser.ts` | Zustand persist 스토어, 지침서 3장 액션 전부 + 데모 유저(컴공 3학년·90°·27차원 전체) |
| `src/app/layout.tsx` | Pretendard + Material Symbols, 메타데이터 |
| `src/app/page.tsx` | 1) 랜딩 · `@yonsei.ac.kr` 입력 · 데모 계정 1클릭 |
| `src/app/onboarding/page.tsx` | 2) 필수 3단계 + 선택 심화(건너뛰면 성격·갈등 10차원 `null`) |
| `src/app/profile/page.tsx` | 3) 온도 3종 전환 · 응답 완성도(N/27) · 심화 입력 · Weekly Drop 토글/미리보기 |
| `src/app/cv/page.tsx` | 4) PDF 업로드 · 샘플 자동 채우기 · 5섹션 편집 · 링크드인 요약 복사 · 인쇄 |
| `src/app/match/page.tsx` | 5) 대회 선택 · 101명 산점도 · 추천 #1~3 · 근거/차이/결측 안내 · AI 아바타(대규모) · 무거절 소집 |
| `src/app/pilot/[teamId]/page.tsx` | 6) 안건 선택 · 20:00 타이머(30초 단축/종료) · AI 팀원 채팅 · 공유 메모 패치 · 비공개 투표 |
| `src/app/team/[teamId]/page.tsx` | 7) 퍼즐 합체 · 실명 공개 · CV 모달 · 오픈채팅/첫 회의 질문 복사 |

## ⚠ 팀원 영역 임시 구현 (교체 대상)

화면 흐름을 끝까지 돌리기 위해 SPEC 계약 그대로 임시로 만들었습니다. 각 파일 맨 위에 `[임시 구현 · 규혁 브랜치]` 표시가 있습니다. **export 이름·경로를 지침서와 맞췄으니 정식 구현으로 파일을 덮어쓰면 됩니다.**

- **혜원**: `src/types/ondo.ts`(SPEC 4장 원문 그대로), `src/data/constants.ts`, `src/data/seedUsers.ts`(100명, 결측 30명), `src/data/seedContests.ts`(8건), `src/lib/matching/clusterEngine.ts`(Gower+PAM k=5+MDS, 팀 점수 4지표), `src/app/api/*`(Gemini + 폴백)
  - 화면이 쓰는 추가 export: `SCORE_WEIGHTS`, `countMissing`(clusterEngine), `FEATURE_GROUP_LABEL`, `TEMPERATURE_BY_ID`, `SKILL_CARD_BY_ID`, `DEAL_BREAKER_BY_ID`, `ROLE_LABEL`, `LIKERT_LABELS`, `SKILL_LEVEL_LABELS`, `OPTIONAL_FEATURE_KEYS`, `COLLAB_AXIS_LABEL`(constants), `SAMPLE_LINKEDIN_CV_TEXT`(seedUsers)
- **연서**: `src/app/globals.css`(M3 토큰, seed `#B4532F`로 생성), `src/components/m3/*`(M3 기본 컴포넌트), `src/components/ondo/*`(`PuzzleProfileCard`, `ClusterScatterPlot`, `TeamPuzzleMerge`, `AvatarMeetingCard`, `AppShell`)

## 완료 체크리스트 확인 결과 (브라우저로 직접 확인)

- [x] 온보딩 Step 4 건너뛰기 → 성격·갈등 10차원 `null` 저장(17/27), 매칭 화면 `missingInfoNotice`에 본인 표시
- [x] UI에 “궁합 정확도 N%”·“검증된 심리검사” 류 문구 없음 (코드 검색: AI 프롬프트의 금지 지시문과 주석만 존재)
- [x] 데모 1클릭 → 온도 전환 → CV 자동 채우기 → 대규모 매칭(산점도 + AI 아바타) → 파일럿 채팅·타이머 종료·투표 → 팀 언락까지 무중단
- [x] `tsc --noEmit` 0건, `next build` 통과, 모바일(375px) 가로 스크롤 없음
- 매칭 계산: 클러스터 ~35ms + 추천 ~22ms (Node 기준)

## 남은 것 / 확인 필요

- 실제 `GEMINI_API_KEY`로 3개 API 응답은 아직 확인하지 않음 (폴백 경로만 확인)
- 실제 PDF 업로드는 키가 있어야 동작 (키 없으면 안내 메시지 + 샘플 버튼)
- 16×16 호환성 매트릭스는 임시 규칙 — `reference/mbti matching matrix/` 기준 정식 값은 혜원 담당
