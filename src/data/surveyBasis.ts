// 소유: 혜원 — 온보딩 22문항(PIECE_SURVEY, 규혁)의 근거와 '반영되는 곳'
// 문항 정의 파일(src/store/pieceTypes.ts)은 건드리지 않고 문항 id로만 연결합니다. (docs/proposal/09 2장)
// 문항 id가 바뀌면 아래 표도 같이 고쳐 주세요. 표에 없는 id는 '자체 개발'로 표시됩니다.

import type { FeatureKey } from '@/data/constants';
import type { ItemBasis } from '@/data/references';
import type { SurveyQ } from '@/store/pieceTypes';

const ORIGINAL: ItemBasis = { refs: [], adaptation: 'original' };

export const SURVEY_BASIS: Record<string, ItemBasis> = {
  // A. 나와 이번 대회
  A1: { refs: [], adaptation: 'original', note: '프로필 온도와 퍼즐 테마에 쓰고, 순위 점수에는 쓰지 않아요.' },
  A2: { refs: [], adaptation: 'original', note: '순위 점수에는 쓰지 않아요.' },
  A3: { refs: [], adaptation: 'original', note: '희망 역할은 실제 역량(D2)과 따로 저장하고 순위 점수에는 쓰지 않아요.' },
  A4: { refs: ['VANDEWALLE1997'], adaptation: 'concept', note: '성과 지향 개념을 해커톤 수상 목표로 옮겼어요.' },
  A5: { refs: ['VANDEWALLE1997'], adaptation: 'concept', note: '학습 지향 개념을 참고했어요.' },
  A6: ORIGINAL,
  // B. 일하는 방식
  B1: ORIGINAL,
  B2: ORIGINAL,
  B3: ORIGINAL,
  B4: ORIGINAL,
  B5: ORIGINAL,
  // C. AI 쓰는 방식
  C1: { refs: ['SCHEPMAN2020'], adaptation: 'concept', note: 'AI 일반 태도가 아니라 팀에서 어디까지 쓸지를 물어요.' },
  C2: ORIGINAL,
  C3: ORIGINAL,
  // D. 역할과 역량
  D1: { refs: [], adaptation: 'original', note: '퍼즐 모양에만 써요.' },
  D2: { refs: ['LAYTON2010'], adaptation: 'concept', note: '자기 평가라 실제 실력과 다를 수 있어요. 팀 배정 도구들도 같은 방식으로 받아요.' },
  D3: { refs: ['LAYTON2010'], adaptation: 'concept', note: '약점 ← 강점 연결 화살표에 써요.' },
  D4: { refs: ['LAYTON2010'], adaptation: 'concept', note: '약점 ← 강점 연결 화살표에 써요.' },
  D5: { refs: [], adaptation: 'original', note: '퍼즐 모양에만 써요.' },
  // E. 함께하는 방식
  E1: { refs: [], adaptation: 'original', note: '퍼즐 모양에만 써요.' },
  E2: ORIGINAL,
  E3: { refs: [], adaptation: 'original', note: '근거가 약해 점수에는 넣지 않고 ‘첫 회의에서 확인할 점’에만 써요.' },
};

export const basisOf = (q: SurveyQ): ItemBasis => SURVEY_BASIS[q.id] ?? ORIGINAL;

const GOAL: FeatureKey[] = ['winning_orientation', 'learning_priority', 'delivery_priority', 'continuation_intent'];
const AI: FeatureKey[] = ['ai_use_permissiveness', 'ai_verification_strictness', 'ai_disclosure_preference'];
const metricOf = (k: FeatureKey) => (GOAL.includes(k) ? '목표 일치' : AI.includes(k) ? 'AI 규범' : '협업 방식');

/** 이 문항의 답이 매칭 어디에 들어가는지 (문항 정의에서 자동 계산) */
export function feedsOf(q: SurveyQ): string[] {
  const out = new Set<string>();
  switch (q.type) {
    case 'binary':
      for (const o of q.options) {
        for (const k of Object.keys(o.set ?? {}) as FeatureKey[]) out.add(metricOf(k));
        if (o.vote) out.add('퍼즐 모양');
      }
      break;
    case 'scale':
      out.add(metricOf(q.key));
      if (q.vote) out.add('퍼즐 모양');
      break;
    case 'skills':
      out.add('역량 보완');
      break;
    case 'multi':
      if (q.field === 'strengths' || q.field === 'weaknesses') out.add('약점 ← 강점 연결');
      else if (q.field === 'dealBreakers') out.add('첫 회의에서 확인할 점');
      else out.add('프로필 (점수 미사용)');
      break;
    case 'single':
      out.add('프로필 (점수 미사용)');
      break;
  }
  return [...out];
}
