// 소유: 규혁 (src/store/) — ‘내 조각’ 설문(섹션 A~F, 29문항)과 16유형 (퍼즐 궁합 매트릭스 시안 구조)
// 공모전마다 달라지는 질문(참여 온도·주당 시간·이번 대회 목표)은 빼고, 그 사람의 작업 방식·성격·습관만 묻습니다.
// 한 화면 한 문항. 문항마다 맞는 형식: 2지선다(퍼즐 축 상황) · 5점 척도(정도) · 여러 개 고르기 · 역량 0~4 표.
// 퍼즐 4축은 축마다 3표(다수결). 답은 27차원 전부(성격·갈등 포함)·희망 역할·장단점 카드·협업 지뢰를 채웁니다.
// 목표 4차원은 대회마다 달라서 묻지 않고, 프로필의 참여 온도 기준 참고값으로 채웁니다.
// ‘딱 맞물리는 짝’ = 네 변이 전부 반대, ‘포개지는 쌍둥이’ = 같은 유형. 심리검사 아님.
// 캐릭터 이름은 시안 — 뚝딱·척척·와다닥·꼼꼼은 시안 그대로, 나머지는 같은 결로 지은 초안입니다.

import type { EdgeType } from '@/components/PuzzlePiece';
import type { DealBreakerId, Features27, RoleId, SkillCardId, TemperatureMode, WeeklyHours } from '@/types/ondo';
import { SKILL_CARD_BY_ID } from '@/data/constants';

export type AxisId = 'start' | 'role' | 'decide' | 'style';
export type PieceLetter = 'I' | 'P' | 'M' | 'S' | 'G' | 'E' | 'A' | 'W';
/** 예: 'IMGA' — 시작(I/P) · 맡는 일(M/S) · 결정(G/E) · 스타일(A/W) */
export type PieceCode = `${'I' | 'P'}${'M' | 'S'}${'G' | 'E'}${'A' | 'W'}`;

export interface AxisSide {
  letter: PieceLetter;
  tag: string;
  /** 1 볼록 · -1 오목 */
  edge: 1 | -1;
}

/** 퍼즐 4변 = 4축. side: 위 0 · 오른쪽 1 · 아래 2 · 왼쪽 3 */
export const PIECE_AXES: { axis: AxisId; axisLabel: string; side: 0 | 1 | 2 | 3; options: [AxisSide, AxisSide] }[] = [
  { axis: 'start', axisLabel: '시작', side: 0, options: [{ letter: 'I', tag: '아이디어부터', edge: 1 }, { letter: 'P', tag: '계획부터', edge: -1 }] },
  { axis: 'role', axisLabel: '맡는 일', side: 1, options: [{ letter: 'M', tag: '직접 만들기', edge: 1 }, { letter: 'S', tag: '말로 설득', edge: -1 }] },
  { axis: 'decide', axisLabel: '결정', side: 2, options: [{ letter: 'E', tag: '근거로 결정', edge: 1 }, { letter: 'G', tag: '감으로 결정', edge: -1 }] },
  { axis: 'style', axisLabel: '스타일', side: 3, options: [{ letter: 'A', tag: '혼자 몰입', edge: 1 }, { letter: 'W', tag: '같이 붙어서', edge: -1 }] },
];

type FeatureKey = keyof Features27;
type Likert = 1 | 2 | 3 | 4 | 5;

/** 섹션 — 문항 번호는 A1, A2 … E3 */
export const SURVEY_SECTIONS = [
  { id: 'A', title: '일하는 방식' },
  { id: 'B', title: 'AI 쓰는 방식' },
  { id: 'C', title: '역할과 역량' },
  { id: 'D', title: '성격' },
  { id: 'E', title: '의견이 부딪힐 때' },
  { id: 'F', title: '함께하는 방식' },
] as const;
export type SectionId = (typeof SURVEY_SECTIONS)[number]['id'];

interface BaseQ {
  id: string;
  section: SectionId;
  question: string;
}

export interface BinaryOption {
  answer: string;
  vote?: PieceLetter;
  set?: Partial<Record<FeatureKey, number>>;
  /** 여건(하드 제약) */
  hard?: { offlineAvailable?: boolean; nightWorkAvailable?: boolean };
}

/** 2지선다 — 퍼즐 축 상황 질문 */
export interface BinaryQ extends BaseQ {
  type: 'binary';
  options: [BinaryOption, BinaryOption];
}

/** 5점 척도 — 정도를 묻는 문항. vote: 4~5점이면 high, 1~2점이면 low에 한 표(3점은 표 없음) */
export interface ScaleQ extends BaseQ {
  type: 'scale';
  key: FeatureKey;
  low: string;
  high: string;
  reverse?: boolean;
  vote?: { high: PieceLetter; low: PieceLetter };
}

/** 여러 개 중 하나 */
export interface SingleQ extends BaseQ {
  type: 'single';
  field: 'temperatureMode' | 'weeklyHours';
  options: { value: string; label: string; detail?: string }[];
}

/** 여러 개 고르기 */
export interface MultiQ extends BaseQ {
  type: 'multi';
  field: 'preferredRoles' | 'strengths' | 'weaknesses' | 'dealBreakers';
  min: number;
  max: number;
  options: { value: string; label: string }[];
  /** 이미 고른 값과 겹치면 안 되는 문항(장점 ↔ 약점) */
  excludeFrom?: string;
}

/** 역량 0~4 표 */
export interface SkillsQ extends BaseQ {
  type: 'skills';
}

export type SurveyQ = BinaryQ | ScaleQ | SingleQ | MultiQ | SkillsQ;

const ROLE_OPTS: { value: RoleId; label: string }[] = [
  { value: 'planning', label: '기획' },
  { value: 'frontend', label: '프론트엔드' },
  { value: 'backend', label: '백엔드' },
  { value: 'design', label: '디자인' },
  { value: 'data_ai', label: '데이터·AI' },
  { value: 'presentation', label: '발표' },
];
export const SKILL_ROLES = ROLE_OPTS;
export const SKILL_LEVELS = ['없음', '입문', '기본', '능숙', '리드 가능'] as const;

const STRENGTH_OPTS = Object.values(SKILL_CARD_BY_ID).map((c) => ({ value: c.id, label: c.strength }));
const WEAKNESS_OPTS = Object.values(SKILL_CARD_BY_ID).map((c) => ({ value: c.id, label: c.weakness }));
const DEAL_OPTS: { value: DealBreakerId; label: string }[] = [
  { value: 'ghosting', label: '하루 넘게 연락이 끊김' },
  { value: 'blind_ai_copy', label: '이해 없이 AI 결과 복붙' },
  { value: 'last_minute', label: '마감 직전에 방향 뒤집기' },
  { value: 'no_prep', label: '공유 자료를 안 읽고 옴' },
  { value: 'free_riding', label: '맡은 일 떠넘기기' },
  { value: 'harsh_tone', label: '날 선 말투의 피드백' },
  { value: 'slow_decision', label: '정할 걸 계속 미룸' },
  { value: 'scope_creep', label: '일정 넘는 기능 욕심' },
];

/** 설문 29문항 (A6 · B3 · C6 · D5 · E5 · F4). 퍼즐 4축은 축마다 3표(다수결) */
export const PIECE_SURVEY: SurveyQ[] = [
  // A. 일하는 방식 — 시작(I/P)·결정(G/E) 축
  {
    id: 'A1', section: 'A', type: 'binary', question: '새 프로젝트 첫날. 너는 뭐부터 해?',
    options: [
      { answer: '아이디어부터 막 던져', vote: 'I', set: { prototyping_preference: 5 } },
      { answer: '계획표부터 짜', vote: 'P', set: { prototyping_preference: 2 } },
    ],
  },
  {
    id: 'A2', section: 'A', type: 'binary', question: '할 일은 많은데 정리가 안 됐어.',
    options: [
      { answer: '일단 손에 잡히는 것부터 해', vote: 'I', set: { prototyping_preference: 4 } },
      { answer: '목록부터 쭉 정리하고 시작해', vote: 'P', set: { prototyping_preference: 2 } },
    ],
  },
  { id: 'A3', section: 'A', type: 'scale', key: 'decision_structure_preference', question: '같이 일할 땐 결정하는 규칙과 담당을 먼저 정해 두는 게 좋아.', low: '하다 보면 생겨', high: '꼭 먼저 정해', vote: { high: 'P', low: 'I' } },
  {
    id: 'A4', section: 'A', type: 'binary', question: '두 가지 방법이 팽팽해. 너는 보통 어떻게 정해?',
    options: [
      { answer: '자료부터 찾아보고 정해', vote: 'E', set: { quality_priority: 4 } },
      { answer: '감 오는 쪽으로 바로 가', vote: 'G', set: { quality_priority: 2 } },
    ],
  },
  {
    id: 'A5', section: 'A', type: 'binary', question: '시간이 부족할 때 너는?',
    options: [
      { answer: '개수를 줄이고 하나라도 제대로', vote: 'E', set: { quality_priority: 5 } },
      { answer: '조금 거칠어도 다 해내기', vote: 'G', set: { quality_priority: 2 } },
    ],
  },
  { id: 'A6', section: 'A', type: 'scale', key: 'risk_appetite', question: '확실한 방법보다 해 본 적 없는 방법을 시도하는 게 좋아.', low: '전혀 아니야', high: '완전 그래' },

  // B. AI 쓰는 방식
  { id: 'B1', section: 'B', type: 'scale', key: 'ai_use_permissiveness', question: '중요한 작업도 생성형 AI로 해도 괜찮아.', low: '전혀 아니야', high: '완전 그래' },
  {
    id: 'B2', section: 'B', type: 'binary', question: 'AI가 만든 코드나 글, 어떻게 써?',
    options: [
      { answer: '한 줄씩 확인하고 써', vote: 'E', set: { ai_verification_strictness: 5 } },
      { answer: '잘 돌아가면 바로 써', vote: 'G', set: { ai_verification_strictness: 2 } },
    ],
  },
  {
    id: 'B3', section: 'B', type: 'binary', question: 'AI를 어디에 썼는지는?',
    options: [
      { answer: '각자 알아서 쓰면 돼', vote: 'A', set: { ai_disclosure_preference: 2 } },
      { answer: '같이 하는 사람에게 다 공유해', vote: 'W', set: { ai_disclosure_preference: 5 } },
    ],
  },

  // C. 역할과 역량 — 맡는 일(M/S) 축
  {
    id: 'C1', section: 'C', type: 'binary', question: '팀플에서 더 즐거운 일은?',
    options: [
      { answer: '내 손으로 직접 만들기', vote: 'M' },
      { answer: '만든 걸 말로 설득하기', vote: 'S' },
    ],
  },
  { id: 'C2', section: 'C', type: 'multi', field: 'preferredRoles', min: 1, max: 2, question: '팀에서 주로 맡고 싶은 역할은? (최대 2개)', options: ROLE_OPTS },
  { id: 'C3', section: 'C', type: 'skills', question: '지금 할 수 있는 정도는?' },
  { id: 'C4', section: 'C', type: 'multi', field: 'strengths', min: 2, max: 2, question: '내가 채워 줄 수 있는 것 2개', options: STRENGTH_OPTS },
  { id: 'C5', section: 'C', type: 'multi', field: 'weaknesses', min: 2, max: 2, question: '채워 줄 사람이 필요한 것 2개', options: WEAKNESS_OPTS, excludeFrom: 'C4' },
  {
    id: 'C6', section: 'C', type: 'binary', question: '결과를 보여 주는 자리, 너는 어디에 있어?',
    options: [
      { answer: '뒤에서 시연을 돌리고 있어', vote: 'M' },
      { answer: '앞에서 마이크를 잡고 있어', vote: 'S' },
    ],
  },

  // D. 성격 (임시 문항 · 검증 전)
  { id: 'D1', section: 'D', type: 'scale', key: 'openness', question: '처음 보는 방식이나 아이디어를 시도하는 게 즐거워.', low: '전혀 아니야', high: '완전 그래' },
  { id: 'D2', section: 'D', type: 'scale', key: 'conscientiousness', question: '맡은 일은 계획을 세워서 마감 전에 끝내.', low: '전혀 아니야', high: '완전 그래' },
  { id: 'D3', section: 'D', type: 'scale', key: 'extraversion', question: '여러 사람과 바로 이야기를 나누는 게 편해.', low: '전혀 아니야', high: '완전 그래', vote: { high: 'W', low: 'A' } },
  { id: 'D4', section: 'D', type: 'scale', key: 'agreeableness', question: '같이 하는 사람의 사정을 먼저 헤아리는 편이야.', low: '전혀 아니야', high: '완전 그래' },
  { id: 'D5', section: 'D', type: 'scale', key: 'emotional_stability', question: '일이 꼬여도 쉽게 흔들리지 않아.', low: '전혀 아니야', high: '완전 그래' },

  // E. 의견이 부딪힐 때
  { id: 'E1', section: 'E', type: 'scale', key: 'integrating', question: '정하기 전에 서로의 근거를 충분히 들어 보고 싶어.', low: '전혀 아니야', high: '완전 그래' },
  { id: 'E2', section: 'E', type: 'scale', key: 'obliging', question: '분위기를 위해 내 의견을 양보하는 편이야.', low: '전혀 아니야', high: '완전 그래' },
  { id: 'E3', section: 'E', type: 'scale', key: 'dominating', question: '동의하지 않을 땐 이유를 바로 말해.', low: '전혀 아니야', high: '완전 그래' },
  { id: 'E4', section: 'E', type: 'scale', key: 'avoiding', question: '부딪히면 잠시 시간을 두고 다시 이야기하는 게 나아.', low: '전혀 아니야', high: '완전 그래' },
  { id: 'E5', section: 'E', type: 'scale', key: 'compromising', question: '서로 조금씩 양보해서 중간 지점을 찾아.', low: '전혀 아니야', high: '완전 그래' },

  // F. 함께하는 방식 — 스타일(A/W) 축
  {
    id: 'F1', section: 'F', type: 'binary', question: '마감이 다가오면 너는?',
    options: [
      { answer: '혼자 몰입해서 끝내', vote: 'A' },
      { answer: '같이 붙어서 해', vote: 'W' },
    ],
  },
  { id: 'F2', section: 'F', type: 'multi', field: 'dealBreakers', min: 1, max: 2, question: '같이 일할 때 이것만은 힘들어 (1~2개)', options: DEAL_OPTS },
  {
    id: 'F3', section: 'F', type: 'binary', question: '직접 만나서 같이 작업할 수 있어?',
    options: [
      { answer: '응, 오프라인도 좋아', hard: { offlineAvailable: true } },
      { answer: '온라인이 편해', hard: { offlineAvailable: false } },
    ],
  },
  {
    id: 'F4', section: 'F', type: 'binary', question: '필요하면 밤새 작업할 수 있어?',
    options: [
      { answer: '할 수 있어', hard: { nightWorkAvailable: true } },
      { answer: '밤샘은 어려워', hard: { nightWorkAvailable: false } },
    ],
  },
];

/** 답: 문항 id → 2지선다·하나 고르기는 번호, 척도는 1~5, 여러 개는 값 배열, 역량은 역할별 0~4 */
export type SurveyAnswer = number | string | string[] | Partial<Record<RoleId, number>>;
export type PieceAnswers = Record<string, SurveyAnswer | undefined>;
export const emptyPieceAnswers = (): PieceAnswers => ({});

export function isAnswered(q: SurveyQ, a: SurveyAnswer | undefined): boolean {
  if (a === undefined) return false;
  if (q.type === 'multi') return Array.isArray(a) && a.length >= q.min && a.length <= q.max;
  if (q.type === 'skills') return typeof a === 'object' && !Array.isArray(a) && SKILL_ROLES.every((r) => typeof (a as Record<string, number>)[r.value] === 'number');
  return true;
}

function axisOfLetter(v: PieceLetter) {
  return PIECE_AXES.findIndex((x) => x.options.some((o) => o.letter === v));
}

/** 강점 카드 2장이 모두 만들기 쪽(구현·데이터·디자인)이면 M, 모두 설득 쪽(기획·발표)이면 S에 한 표 */
function cardVote(strengths: string[] | undefined): PieceLetter | null {
  if (!strengths || strengths.length < 2) return null;
  const makerAxes: RoleId[] = ['frontend', 'backend', 'data_ai', 'design'];
  const maker = strengths.filter((id) => makerAxes.includes(SKILL_CARD_BY_ID[id as SkillCardId].axis)).length;
  return maker === 2 ? 'M' : maker === 0 ? 'S' : null;
}

function votesByAxis(a: PieceAnswers): PieceLetter[][] {
  const votes: PieceLetter[][] = [[], [], [], []];
  for (const q of PIECE_SURVEY) {
    const ans = a[q.id];
    if (ans === undefined) continue;
    let v: PieceLetter | null | undefined = null;
    if (q.type === 'binary') v = q.options[ans as number].vote;
    else if (q.type === 'scale' && q.vote) v = (ans as number) >= 4 ? q.vote.high : (ans as number) <= 2 ? q.vote.low : null;
    else if (q.type === 'multi' && q.field === 'strengths') v = cardVote(ans as string[]);
    if (v) votes[axisOfLetter(v)].push(v);
  }
  return votes;
}

/** 축별 다수결. 동점이면 마지막 표를 따름 */
function majority(axis: number, votes: PieceLetter[]): PieceLetter | null {
  if (!votes.length) return null;
  const [a, b] = PIECE_AXES[axis].options.map((o) => votes.filter((v) => v === o.letter).length);
  if (a !== b) return a > b ? PIECE_AXES[axis].options[0].letter : PIECE_AXES[axis].options[1].letter;
  return votes[votes.length - 1];
}

export function codeFromAnswers(a: PieceAnswers): PieceCode | null {
  if (!PIECE_SURVEY.every((q) => isAnswered(q, a[q.id]))) return null;
  const letters = votesByAxis(a).map((v, i) => majority(i, v));
  return letters.every(Boolean) ? (letters.join('') as PieceCode) : null;
}

/** 지금까지의 답으로 변 모양을 그림 — 아직 표가 없는 축은 평평(0) */
export function edgesFromAnswers(a: PieceAnswers): [EdgeType, EdgeType, EdgeType, EdgeType] {
  const edges: [EdgeType, EdgeType, EdgeType, EdgeType] = [0, 0, 0, 0];
  votesByAxis(a).forEach((v, i) => {
    const m = majority(i, v);
    const o = PIECE_AXES[i].options.find((x) => x.letter === m);
    if (o) edges[PIECE_AXES[i].side] = o.edge;
  });
  return edges;
}

export function edgesFromCode(code: PieceCode): [EdgeType, EdgeType, EdgeType, EdgeType] {
  const edges: [EdgeType, EdgeType, EdgeType, EdgeType] = [0, 0, 0, 0];
  PIECE_AXES.forEach((ax, i) => {
    edges[ax.side] = ax.options.find((o) => o.letter === code[i])!.edge;
  });
  return edges;
}

/** 네 변이 전부 반대인 유형 */
export function perfectMatch(code: PieceCode): PieceCode {
  return PIECE_AXES.map((ax, i) => ax.options.find((o) => o.letter !== code[i])!.letter).join('') as PieceCode;
}

export function tagsOf(code: PieceCode): string[] {
  return PIECE_AXES.map((ax, i) => ax.options.find((o) => o.letter === code[i])!.tag);
}

/** 두 조각이 맞물리는 변 수 (반대인 축 수) */
export function interlockCount(a: PieceCode, b: PieceCode) {
  return [0, 1, 2, 3].filter((i) => a[i] !== b[i]).length;
}

export function quadrantOf(code: PieceCode) {
  return QUADRANT[code.slice(0, 2)];
}

export interface SurveyResult {
  /** 27차원 전부 (성격·갈등 포함). 목표 4차원은 참여 온도 참고값 */
  features: Features27;
  temperatureMode: TemperatureMode;
  weeklyHours: WeeklyHours;
  offlineAvailable: boolean;
  nightWorkAvailable: boolean;
  preferredRoles: RoleId[];
  strengths: [SkillCardId, SkillCardId];
  weaknesses: [SkillCardId, SkillCardId];
  dealBreakers: DealBreakerId[];
}

const LIKERT_KEYS: FeatureKey[] = [
  'ai_use_permissiveness', 'ai_verification_strictness', 'ai_disclosure_preference',
  'prototyping_preference', 'risk_appetite', 'quality_priority', 'decision_structure_preference',
  'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotional_stability',
  'integrating', 'obliging', 'dominating', 'avoiding', 'compromising',
];

/** 대회마다 달라지는 목표 4차원 — 참여 온도별 참고값 (설문에서 묻지 않음) */
export function goalFeaturesFor(mode: TemperatureMode) {
  const ref = { fun: { w: 2, l: 4.5, d: 3, c: 3 }, balanced: { w: 3, l: 3.5, d: 4, c: 3 }, serious: { w: 4.5, l: 2.5, d: 4.5, c: 3.5 } }[mode];
  return { winning_orientation: ref.w, learning_priority: ref.l, delivery_priority: ref.d, continuation_intent: ref.c };
}

/** 설문 답 → 27차원 + 희망 역할 + 장단점 카드 + 협업 지뢰 (온도·시간은 기본값, 프로필에서 대회마다 바꿈) */
export function featuresFromSurvey(a: PieceAnswers): SurveyResult {
  const sums: Partial<Record<FeatureKey, number[]>> = {};
  const push = (k: FeatureKey, v: number) => (sums[k] ??= []).push(v);
  const out: Partial<SurveyResult> = {};
  const hard = { offlineAvailable: true, nightWorkAvailable: false };
  for (const q of PIECE_SURVEY) {
    const ans = a[q.id];
    if (ans === undefined) continue;
    if (q.type === 'binary') {
      const o = q.options[ans as number];
      for (const [k, v] of Object.entries(o.set ?? {})) push(k as FeatureKey, v as number);
      Object.assign(hard, o.hard ?? {});
    }
    if (q.type === 'scale') push(q.key, q.reverse ? 6 - (ans as Likert) : (ans as Likert));
    if (q.type === 'single') (out as Record<string, unknown>)[q.field] = q.options[ans as number].value;
    if (q.type === 'multi') (out as Record<string, unknown>)[q.field] = ans;
    if (q.type === 'skills') out.features = { ...(out.features ?? {}), ...(ans as Record<RoleId, number>) } as SurveyResult['features'];
  }
  const likert = Object.fromEntries(
    LIKERT_KEYS.map((k) => {
      const vals = sums[k];
      return [k, vals?.length ? Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 10) / 10 : 3];
    }),
  );
  const st = (out.strengths ?? []) as SkillCardId[];
  const wk = (out.weaknesses ?? []) as SkillCardId[];
  const temperatureMode = (out.temperatureMode ?? 'balanced') as TemperatureMode;
  return {
    features: { ...goalFeaturesFor(temperatureMode), ...(out.features ?? {}), ...(likert as Record<string, number>) } as SurveyResult['features'],
    temperatureMode,
    weeklyHours: (out.weeklyHours ?? '6-10h') as WeeklyHours,
    offlineAvailable: hard.offlineAvailable,
    nightWorkAvailable: hard.nightWorkAvailable,
    preferredRoles: (out.preferredRoles ?? []) as RoleId[],
    strengths: [st[0], st[1]],
    weaknesses: [wk[0], wk[1]],
    dealBreakers: (out.dealBreakers ?? []) as DealBreakerId[],
  };
}

export interface PieceType {
  code: PieceCode;
  name: string;
  title: string;
  line: string;
}

const QUADRANT: Record<string, string> = {
  IM: '창작 사분면',
  IS: '제안 사분면',
  PM: '구축 사분면',
  PS: '조율 사분면',
};

export const PIECE_TYPES: Record<PieceCode, PieceType> = {
  IMGA: { code: 'IMGA', name: '뚝딱', title: '고독한 발명가', line: '꽂히면 혼자 밤새 일단 만들어 와요' },
  IMGW: { code: 'IMGW', name: '와다닥', title: '번개 제작자', line: '떠오르면 바로 같이 만들어 봐요' },
  IMEA: { code: 'IMEA', name: '또각', title: '조용한 공방장', line: '자료로 확인하면서 혼자 정교하게 만들어요' },
  IMEW: { code: 'IMEW', name: '착착', title: '실험실 팀장', line: '근거 보며 같이 손발 맞춰 만들어요' },
  ISGA: { code: 'ISGA', name: '반짝', title: '영감형 이야기꾼', line: '혼자 떠올린 걸 말 한마디로 꽂아요' },
  ISGW: { code: 'ISGW', name: '왁자', title: '분위기 메이커', line: '다 같이 떠들며 아이디어를 굴려요' },
  ISEA: { code: 'ISEA', name: '술술', title: '조용한 논객', line: '혼자 정리한 근거로 차분히 설득해요' },
  ISEW: { code: 'ISEW', name: '도란', title: '토론 리더', line: '같이 근거를 모아 한 이야기로 엮어요' },
  PMGA: { code: 'PMGA', name: '쓱싹', title: '혼자 끝내는 해결사', line: '계획 세우면 혼자 쓱 끝내 놓아요' },
  PMGW: { code: 'PMGW', name: '영차', title: '현장 반장', line: '계획대로 다 같이 밀어붙여요' },
  PMEA: { code: 'PMEA', name: '차곡', title: '정밀 엔지니어', line: '계획과 근거대로 한 칸씩 쌓아요' },
  PMEW: { code: 'PMEW', name: '뚜벅', title: '든든한 완주자', line: '같이 정한 계획을 끝까지 지켜요' },
  PSGA: { code: 'PSGA', name: '휘릭', title: '한 장 전략가', line: '혼자 판을 짜고 한 장으로 정리해요' },
  PSGW: { code: 'PSGW', name: '두런', title: '팀 조율사', line: '사람 사이를 오가며 방향을 맞춰요' },
  PSEA: { code: 'PSEA', name: '꼼꼼', title: '문서 장인', line: '근거를 빈틈없이 문서로 남겨요' },
  PSEW: { code: 'PSEW', name: '척척', title: '일정표 매니저', line: '아이디어를 일정표로 바꿔 착착 굴려요' },
};

// ───────────── 다른 사람의 조각 · 우리 둘 궁합 · 팀 드롭 2+2 ─────────────

import type { UserProfile } from '@/types/ondo';

/**
 * 설문에 답하지 않은 사람(시드 팀원 등)의 조각을 27차원 응답에서 규칙으로 추정합니다.
 * 내 조각은 설문 답(myPiece)을 그대로 씁니다.
 */
export function derivePieceCode(u: UserProfile): PieceCode {
  const x = u.features27;
  const start = x.prototyping_preference > x.decision_structure_preference ? 'I' : 'P';
  const role = Math.max(x.frontend, x.backend, x.data_ai, x.design) >= Math.max(x.planning, x.presentation) ? 'M' : 'S';
  const decide = x.quality_priority >= x.risk_appetite ? 'E' : 'G';
  const together = x.extraversion !== null ? x.extraversion >= 3.5 : x.ai_disclosure_preference >= 4;
  return `${start}${role}${decide}${together ? 'W' : 'A'}` as PieceCode;
}

export function pieceOf(u: UserProfile, currentUserId: string, myPiece: PieceCode | null): PieceCode {
  return u.id === currentUserId && myPiece ? myPiece : derivePieceCode(u);
}

const josa = (name: string, withBatchim: string, without: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? withBatchim : without;
};
/** 이름 + 이/가 (뚝딱이, 척척이) — 시안 말투 */
export const nameI = (name: string) => `${name}${josa(name, '이', '')}`;

// 축별 문장: [내 글자][상대 글자] → 상대가 나에게 해 주는 것 / 같으면 나눌 것
const AXIS_LINES: Record<AxisId, Record<string, (them: string) => string>> = {
  start: {
    IP: (t) => `내가 던진 아이디어를 ${t}가 일정표로 바꿔 줘요`,
    PI: (t) => `${t}가 던진 아이디어를 내가 일정표로 바꿔요`,
    II: () => '둘 다 아이디어부터 — 계획은 누가 맡을지 먼저 정해요',
    PP: () => '둘 다 계획부터 — 새 아이디어 낼 시간을 따로 잡아요',
  },
  role: {
    MS: (t) => `내가 만든 걸 ${t}가 심사위원 언어로 풀어 줘요`,
    SM: (t) => `${t}가 만든 걸 내가 심사위원 언어로 풀어요`,
    MM: () => '둘 다 만들기 — 발표·문서 담당을 미리 정해요',
    SS: () => '둘 다 설득 — 실제 구현은 누가 할지 정해요',
  },
  decide: {
    GE: (t) => `내 감을 ${t}가 자료로 한 번 더 확인해 줘요`,
    EG: (t) => `망설일 때 ${t}가 감으로 방향을 잡아 줘요`,
    GG: () => '둘 다 감으로 — 큰 결정 하나는 자료로 확인해요',
    EE: () => '둘 다 근거로 — 자료 조사 마감 시간을 정해요',
  },
  style: {
    AW: (t) => `내가 놓친 팀 소통을 ${t}가 대신 챙겨 줘요`,
    WA: (t) => `${t}가 혼자 몰입할 시간을 내가 지켜 줘요`,
    AA: () => '둘 다 혼자 몰입 — 같이 보는 시간을 꼭 잡아요',
    WW: () => '둘 다 같이 — 혼자 끝낼 몫도 나눠요',
  },
};

const HEADLINE: Record<number, [string, string]> = {
  4: ['완벽하게 맞물려요', '네 변이 전부 반대예요'],
  3: ['거의 다 맞물려요', '세 변이 반대예요'],
  2: ['반은 맞물리고 반은 포개져요', '두 변이 반대예요'],
  1: ['대부분 포개져요', '한 변만 반대예요'],
  0: ['포개지는 쌍둥이예요', '네 변이 전부 같아요'],
};

export interface PairReport {
  count: number;
  headline: string;
  sub: string;
  axes: { axis: AxisId; label: string; opposite: boolean; line: string }[];
  firstMeeting: string;
}

/** 축 라벨 안에서 ‘결정’이 겹치지 않게: ‘감으로 결정’ → ‘감으로’ */
const short = (tag: string) => tag.replace(/ 결정$/, '');

export function pairReport(me: PieceCode, them: PieceCode, themName: string): PairReport {
  const t = nameI(themName);
  const axes = PIECE_AXES.map((q, i) => {
    const mine = q.options.find((o) => o.letter === me[i])!;
    const theirs = q.options.find((o) => o.letter === them[i])!;
    const opposite = mine.letter !== theirs.letter;
    return {
      axis: q.axis,
      label: opposite ? `${q.axisLabel} ${short(mine.tag)} ↔ ${short(theirs.tag)}` : `${q.axisLabel} 둘 다 ${short(mine.tag)}`,
      opposite,
      line: AXIS_LINES[q.axis][`${me[i]}${them[i]}`](t),
    };
  });
  const count = interlockCount(me, them);
  const style = `${me[3]}${them[3]}`;
  const firstMeeting =
    style === 'AW' || style === 'WA'
      ? '혼자 파는 시간과 같이 보는 시간. 예를 들면 일주일에 두 번, 30분 공유.'
      : style === 'AA'
        ? '같이 보는 시간부터. 예를 들면 일주일에 두 번, 30분 공유.'
        : me[2] !== them[2]
          ? '큰 결정을 정하는 방법. 예를 들면 30분 안에 자료 하나 보고 바로 정하기.'
          : me[1] === them[1]
            ? '겹치는 일을 누가 맡을지. 예를 들면 만들기와 발표를 한 명씩.'
            : '각자 혼자 끝낼 몫. 예를 들면 화면은 한 명, 발표 자료는 다른 한 명.';
  return { count, headline: HEADLINE[count][0], sub: HEADLINE[count][1], axes, firstMeeting };
}

export interface DropLayout {
  /** 2×2 순서: [왼쪽 위, 오른쪽 위, 왼쪽 아래, 오른쪽 아래] */
  order: number[];
  /** 가로 연결(위·아래 줄): 맞물리는 변 수 */
  across: [number, number];
  /** 세로 연결(왼쪽·오른쪽 열): 같은 변 수 */
  down: [number, number];
  note: string;
}

const ROLE_WORK: Record<string, string> = { M: '만들기', S: '문서와 발표' };

/**
 * 팀 드롭 2+2: 결이 같은 둘씩(세로 열) 묶고, 서로 맞물리는 상대를 같은 줄(가로)에 둡니다.
 * order[0]은 항상 나(멤버 0)로 맞춥니다.
 */
export function dropLayout(codes: PieceCode[], names: string[]): DropLayout {
  const same = (a: number, b: number) => 4 - interlockCount(codes[a], codes[b]);
  const pairings: [number, number, number, number][] = [
    [0, 1, 2, 3],
    [0, 2, 1, 3],
    [0, 3, 1, 2],
  ];
  // 열(같은 결) 묶음: 열 안 유사도 합이 가장 큰 짝짓기
  let best = pairings[0];
  for (const p of pairings) if (same(p[0], p[1]) + same(p[2], p[3]) > same(best[0], best[1]) + same(best[2], best[3])) best = p;
  const [a1, a2, b1, b2] = best;
  // 가로(맞물림) 정렬: 줄마다 반대 변이 많은 쪽
  const straight = interlockCount(codes[a1], codes[b1]) + interlockCount(codes[a2], codes[b2]);
  const swapped = interlockCount(codes[a1], codes[b2]) + interlockCount(codes[a2], codes[b1]);
  const [r1, r2] = swapped > straight ? [b2, b1] : [b1, b2];
  const order = [a1, r1, a2, r2];
  const n = (i: number) => nameI(names[i]);
  const col = (i: number, j: number) =>
    codes[i][1] === codes[j][1] ? `${n(i)}와 ${n(j)}는 ${ROLE_WORK[codes[i][1]]}` : `${n(i)}는 ${ROLE_WORK[codes[i][1]]}, ${n(j)}는 ${ROLE_WORK[codes[j][1]]}`;
  const bothSame = codes[a1][1] === codes[a2][1] && codes[r1][1] === codes[r2][1];
  const note = `${col(a1, a2)}, ${col(r1, r2)}. ${bothSame ? '결이 같은 둘끼리 일이 몰리지 않게 첫 회의에서 나눠요.' : '맡을 일이 겹치는 사람끼리 첫 회의에서 먼저 나눠요.'}`;
  return {
    order,
    across: [interlockCount(codes[a1], codes[r1]), interlockCount(codes[a2], codes[r2])],
    down: [same(a1, a2), same(r1, r2)],
    note,
  };
}
