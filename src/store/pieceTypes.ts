// 소유: 규혁 (src/store/) — ‘내 조각’ 설문 16문항과 16유형 (퍼즐 궁합 매트릭스 시안 구조)
// 한 화면 한 문항 · 2지선다 16개. 12문항이 퍼즐 4축(축마다 3표, 다수결)을 정하고,
// 모든 답이 매칭용 27차원 응답(목표·AI 규범·작업 방식·역량)과 장단점 카드·협업 지뢰도 채웁니다.
// → 1~5점 리커트 화면과 ‘역량과 퍼즐 카드’ 화면을 대신합니다. (2지선다라 값은 2/4·1/5처럼 거칠게 들어감)
// ‘딱 맞물리는 짝’ = 네 변이 전부 반대, ‘포개지는 쌍둥이’ = 같은 유형. 심리검사 아님.
// 캐릭터 이름은 시안 — 뚝딱·척척·와다닥·꼼꼼은 시안 그대로, 나머지는 같은 결로 지은 초안입니다.

import type { EdgeType } from '@/components/PuzzlePiece';
import type { DealBreakerId, Features27, RoleId, SkillCardId } from '@/types/ondo';
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

export interface SurveyOption {
  answer: string;
  /** 퍼즐 축 한 표 */
  vote?: PieceLetter;
  /** 매칭용 27차원 값(같은 키는 평균) */
  set?: Partial<Record<FeatureKey, number>>;
  /** 역할 성향(역량 기본값) */
  roleBias?: 'M' | 'S';
  strength?: SkillCardId;
  weakness?: SkillCardId;
  dealBreaker?: DealBreakerId;
}

export interface SurveyQuestion {
  question: string;
  options: [SurveyOption, SurveyOption];
}

/** 16문항 — 축이 번갈아 나오도록 배치해 조각이 고르게 완성됩니다 */
export const PIECE_SURVEY: SurveyQuestion[] = [
  {
    question: '새 프로젝트 첫날. 너는 뭐부터 해?',
    options: [
      { answer: '아이디어부터 막 던져', vote: 'I', set: { prototyping_preference: 4, decision_structure_preference: 2 } },
      { answer: '계획표부터 짜', vote: 'P', set: { prototyping_preference: 2, decision_structure_preference: 4 } },
    ],
  },
  {
    question: '팀에서 제일 맡고 싶은 일은?',
    options: [
      { answer: '내 손으로 직접 만들기', vote: 'M', roleBias: 'M' },
      { answer: '만든 걸 말로 설득하기', vote: 'S', roleBias: 'S' },
    ],
  },
  {
    question: '회의에서 A안, B안이 팽팽해. 너는 보통 어떻게 정해?',
    options: [
      { answer: '자료부터 찾아보고 정해', vote: 'E', set: { quality_priority: 4, risk_appetite: 2 } },
      { answer: '감 오는 쪽으로 바로 가', vote: 'G', set: { quality_priority: 2, risk_appetite: 4 } },
    ],
  },
  {
    question: '마감 사흘 전. 너는 어떻게 일해?',
    options: [
      { answer: '혼자 몰입해서 끝내', vote: 'A' },
      { answer: '같이 붙어서 해', vote: 'W' },
    ],
  },
  {
    question: '이번 대회, 솔직히 뭐가 더 중요해?',
    options: [
      { answer: '수상이나 포트폴리오', set: { winning_orientation: 5, learning_priority: 2 } },
      { answer: '새로 배우는 경험', set: { winning_orientation: 2, learning_priority: 5 } },
    ],
  },
  {
    question: '기획서가 반쯤 비었는데 시간이 없어.',
    options: [
      { answer: '일단 만들면서 채워', vote: 'I', set: { prototyping_preference: 5, risk_appetite: 4 } },
      { answer: '빈칸부터 다 채우고 시작해', vote: 'P', set: { prototyping_preference: 2, risk_appetite: 2 } },
    ],
  },
  {
    question: '둘 중 더 자신 있는 건?',
    options: [
      { answer: '화면이나 기능을 직접 구현하기', vote: 'M', roleBias: 'M', strength: 'frontend' },
      { answer: '발표하고 질문에 답하기', vote: 'S', roleBias: 'S', strength: 'pitching' },
    ],
  },
  {
    question: 'AI가 만든 코드나 글, 어떻게 써?',
    options: [
      { answer: '한 줄씩 확인하고 써', vote: 'E', set: { ai_verification_strictness: 5, ai_use_permissiveness: 2 } },
      { answer: '잘 돌아가면 바로 써', vote: 'G', set: { ai_verification_strictness: 2, ai_use_permissiveness: 5 } },
    ],
  },
  {
    question: 'AI를 어디에 썼는지는?',
    options: [
      { answer: '각자 알아서 쓰면 돼', vote: 'A', set: { ai_disclosure_preference: 2 } },
      { answer: '팀에 다 공유해야 해', vote: 'W', set: { ai_disclosure_preference: 5 } },
    ],
  },
  {
    question: '둘 중 더 자신 없는 건?',
    options: [
      { answer: '디자인 감각', weakness: 'ui_design' },
      { answer: '글 정리와 문서화', weakness: 'copywriting' },
    ],
  },
  {
    question: '팀 규칙은 언제 정하는 게 좋아?',
    options: [
      { answer: '하다 보면 자연스럽게 생겨', vote: 'I', set: { decision_structure_preference: 2 } },
      { answer: '시작 전에 딱 정해 둬', vote: 'P', set: { decision_structure_preference: 5 } },
    ],
  },
  {
    question: '둘 중 더 자신 있는 건?',
    options: [
      { answer: '데이터 분석이나 AI 툴 다루기', vote: 'M', roleBias: 'M', strength: 'data_analysis' },
      { answer: '장표 구성과 스토리라인', vote: 'S', roleBias: 'S', strength: 'slide_story' },
    ],
  },
  {
    question: '마감 30분 전, 버그 하나가 남았어.',
    options: [
      { answer: '기능을 빼더라도 완성도부터', vote: 'E', set: { quality_priority: 5, delivery_priority: 5 } },
      { answer: '일단 다 넣고 제출해', vote: 'G', set: { quality_priority: 2, delivery_priority: 3, risk_appetite: 5 } },
    ],
  },
  {
    question: '대회가 끝나면 이 팀은?',
    options: [
      { answer: '결과 나오면 각자 갈 길', vote: 'A', set: { continuation_intent: 2 } },
      { answer: '계속 같이 이어가고 싶어', vote: 'W', set: { continuation_intent: 5 } },
    ],
  },
  {
    question: '둘 중 더 자신 없는 건?',
    options: [
      { answer: '서버나 데이터 연결', weakness: 'backend' },
      { answer: '마감과 일정 관리', weakness: 'pm_schedule' },
    ],
  },
  {
    question: '둘 중 더 못 참는 건?',
    options: [
      { answer: '하루 넘게 연락이 끊기는 것', dealBreaker: 'ghosting' },
      { answer: '이해 없이 AI 결과를 붙여 넣는 것', dealBreaker: 'blind_ai_copy' },
    ],
  },
];

/** 답: 문항마다 고른 선택지 번호(0 · 1), 안 고르면 null */
export type PieceAnswers = (0 | 1 | null)[];
export const emptyPieceAnswers = (): PieceAnswers => PIECE_SURVEY.map(() => null);

function votesByAxis(a: PieceAnswers): PieceLetter[][] {
  const votes: PieceLetter[][] = [[], [], [], []];
  a.forEach((pick, i) => {
    if (pick === null) return;
    const v = PIECE_SURVEY[i].options[pick].vote;
    if (!v) return;
    const axis = PIECE_AXES.findIndex((x) => x.options.some((o) => o.letter === v));
    votes[axis].push(v);
  });
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
  if (a.some((x) => x === null)) return null;
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
  /** 필수 17차원(목표 4 · AI 규범 3 · 작업 방식 4 · 역량 6). 성격·갈등 10차원은 별도(선택) */
  features: Pick<
    Features27,
    | 'winning_orientation' | 'learning_priority' | 'delivery_priority' | 'continuation_intent'
    | 'ai_use_permissiveness' | 'ai_verification_strictness' | 'ai_disclosure_preference'
    | 'prototyping_preference' | 'risk_appetite' | 'quality_priority' | 'decision_structure_preference'
    | RoleId
  >;
  strengths: [SkillCardId, SkillCardId];
  weaknesses: [SkillCardId, SkillCardId];
  dealBreakers: DealBreakerId[];
}

const REQUIRED_LIKERT_KEYS: FeatureKey[] = [
  'winning_orientation', 'learning_priority', 'delivery_priority', 'continuation_intent',
  'ai_use_permissiveness', 'ai_verification_strictness', 'ai_disclosure_preference',
  'prototyping_preference', 'risk_appetite', 'quality_priority', 'decision_structure_preference',
];

/** 16문항 답 → 매칭용 필수 17차원 + 장단점 카드 + 협업 지뢰 */
export function featuresFromSurvey(a: PieceAnswers): SurveyResult {
  const sums: Partial<Record<FeatureKey, number[]>> = {};
  let makeBias = 0;
  const strengths: SkillCardId[] = [];
  const weaknesses: SkillCardId[] = [];
  const dealBreakers: DealBreakerId[] = [];
  a.forEach((pick, i) => {
    if (pick === null) return;
    const o = PIECE_SURVEY[i].options[pick];
    for (const [k, v] of Object.entries(o.set ?? {})) (sums[k as FeatureKey] ??= []).push(v as number);
    if (o.roleBias) makeBias += o.roleBias === 'M' ? 1 : -1;
    if (o.strength) strengths.push(o.strength);
    if (o.weakness) weaknesses.push(o.weakness);
    if (o.dealBreaker) dealBreakers.push(o.dealBreaker);
  });
  const likert = Object.fromEntries(
    REQUIRED_LIKERT_KEYS.map((k) => {
      const vals = sums[k];
      return [k, vals?.length ? Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 10) / 10 : 3];
    }),
  );
  // 역량 0~4: 역할 성향으로 기본값 → 장점 카드 축은 4, 약점 카드 축은 1
  const maker = makeBias >= 0;
  const skills: Record<RoleId, number> = maker
    ? { planning: 2, frontend: 3, backend: 3, design: 2, data_ai: 2, presentation: 1 }
    : { planning: 3, frontend: 1, backend: 1, design: 2, data_ai: 2, presentation: 3 };
  for (const w of weaknesses) skills[SKILL_CARD_BY_ID[w].axis] = 1;
  for (const st of strengths) skills[SKILL_CARD_BY_ID[st].axis] = 4;
  return {
    features: { ...(likert as Record<string, number>), ...skills } as SurveyResult['features'],
    strengths: [strengths[0], strengths[1]],
    weaknesses: [weaknesses[0], weaknesses[1]],
    dealBreakers,
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
 * 4문항에 답하지 않은 사람(시드 팀원 등)의 조각을 27차원 응답에서 규칙으로 추정합니다.
 * 내 조각은 4문항 답(myPiece)을 그대로 씁니다.
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

export function pairReport(me: PieceCode, them: PieceCode, themName: string): PairReport {
  const t = nameI(themName);
  const axes = PIECE_AXES.map((q, i) => {
    const mine = q.options.find((o) => o.letter === me[i])!;
    const theirs = q.options.find((o) => o.letter === them[i])!;
    const opposite = mine.letter !== theirs.letter;
    return {
      axis: q.axis,
      label: opposite ? `${q.axisLabel} ${mine.tag} ↔ ${theirs.tag}` : `${q.axisLabel} 둘 다 ${mine.tag}`,
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
