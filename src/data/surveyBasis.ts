// 소유: 혜원 — 온보딩 설문(PIECE_SURVEY, 규혁)의 근거와 '반영되는 곳'
// 문항 정의 파일(src/store/pieceTypes.ts)은 건드리지 않고 문항 id로만 연결합니다. (docs/proposal/09 2장)
// 문항 id가 바뀌면 아래 표도 같이 고쳐 주세요. 표에 없는 id는 '자체 개발'로 표시됩니다.

import type { FeatureKey } from '@/data/constants';
import type { ItemBasis } from '@/data/references';
import type { SurveyQ } from '@/store/pieceTypes';

const ORIGINAL: ItemBasis = { refs: [], adaptation: 'original' };

const PIECE_ONLY: ItemBasis = { refs: [], adaptation: 'original', note: '퍼즐 모양에만 써요.' };
const PERSONALITY: ItemBasis = { refs: ['DONNELLAN2006'], adaptation: 'concept', note: '요인당 1문항 자체 작성이라 순위 점수에는 쓰지 않고, AI 모의회의와 대화 주제에만 써요.' };
const CONFLICT: ItemBasis = { refs: ['RAHIM1983'], adaptation: 'concept', note: '스타일당 1문항 자체 작성이라 순위 점수에는 쓰지 않아요.' };

// [규혁 갱신] 설문이 성향 문항 29개(A~F)로 바뀌어 id를 다시 맞춤 (공모전마다 달라지는 문항 제거)
export const SURVEY_BASIS: Record<string, ItemBasis> = {
  // A. 일하는 방식
  A1: ORIGINAL,
  A2: ORIGINAL,
  A3: ORIGINAL,
  A4: ORIGINAL,
  A5: ORIGINAL,
  A6: ORIGINAL,
  // B. AI 쓰는 방식
  B1: { refs: ['SCHEPMAN2020'], adaptation: 'concept', note: 'AI 일반 태도가 아니라 중요한 작업에도 쓸지를 물어요.' },
  B2: ORIGINAL,
  B3: ORIGINAL,
  // C. 역할과 역량
  C1: PIECE_ONLY,
  C2: { refs: [], adaptation: 'original', note: '희망 역할은 실제 역량(C3)과 따로 저장하고 순위 점수에는 쓰지 않아요.' },
  C3: { refs: ['LAYTON2010'], adaptation: 'concept', note: '자기 평가라 실제 실력과 다를 수 있어요. 팀 배정 도구들도 같은 방식으로 받아요.' },
  C4: { refs: ['LAYTON2010'], adaptation: 'concept', note: '약점 ← 강점 연결 화살표에 써요.' },
  C5: { refs: ['LAYTON2010'], adaptation: 'concept', note: '약점 ← 강점 연결 화살표에 써요.' },
  C6: PIECE_ONLY,
  // D. 성격
  D1: PERSONALITY,
  D2: PERSONALITY,
  D3: { ...PERSONALITY, note: '요인당 1문항 자체 작성이라 순위 점수에는 쓰지 않아요. 퍼즐 모양(혼자/같이)에는 한 표로 들어가요.' },
  D4: PERSONALITY,
  D5: PERSONALITY,
  // E. 의견이 부딪힐 때
  E1: CONFLICT,
  E2: CONFLICT,
  E3: CONFLICT,
  E4: CONFLICT,
  E5: CONFLICT,
  // F. 함께하는 방식
  F1: PIECE_ONLY,
  F2: { refs: [], adaptation: 'original', note: '근거가 약해 점수에는 넣지 않고 ‘첫 회의에서 확인할 점’에만 써요.' },
  F3: { refs: [], adaptation: 'original', note: '현장 대회에서 오프라인이 어려운 후보를 거를 때만 써요.' },
  F4: { refs: [], adaptation: 'original', note: '밤샘이 필요한 대회에서 후보를 거를 때만 써요.' },
};

export const basisOf = (q: SurveyQ): ItemBasis => SURVEY_BASIS[q.id] ?? ORIGINAL;

const GOAL: FeatureKey[] = ['winning_orientation', 'learning_priority', 'delivery_priority', 'continuation_intent'];
const AI: FeatureKey[] = ['ai_use_permissiveness', 'ai_verification_strictness', 'ai_disclosure_preference'];
const TALK_ONLY: FeatureKey[] = [
  'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotional_stability',
  'integrating', 'obliging', 'dominating', 'avoiding', 'compromising',
];
const metricOf = (k: FeatureKey) =>
  TALK_ONLY.includes(k) ? '대화 주제 (점수 미사용)' : GOAL.includes(k) ? '목표 일치' : AI.includes(k) ? 'AI 규범' : '협업 방식';

/** 이 문항의 답이 매칭 어디에 들어가는지 (문항 정의에서 자동 계산) */
export function feedsOf(q: SurveyQ): string[] {
  const out = new Set<string>();
  switch (q.type) {
    case 'binary':
      for (const o of q.options) {
        for (const k of Object.keys(o.set ?? {}) as FeatureKey[]) out.add(metricOf(k));
        if (o.vote) out.add('퍼즐 모양');
        if (o.hard) out.add('후보 거르기');
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
