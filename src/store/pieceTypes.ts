// 소유: 규혁 (src/store/) — “내 조각” 4문항 설문과 16유형 (퍼즐 궁합 매트릭스 시안 구조)
// 4축 × 2지선다 = 16유형. 답 하나가 퍼즐 조각의 한 변(볼록/오목)을 정합니다.
// ‘딱 맞물리는 짝’ = 네 변이 전부 반대(모든 축 반대), ‘포개지는 쌍둥이’ = 같은 유형.
// 매칭 엔진(27차원·CollabType)과는 별개로, 프로필 정체성과 궁합 설명에 씁니다. (심리검사 아님)
// 캐릭터 이름은 시안 — 뚝딱·척척·와다닥·꼼꼼은 시안 그대로, 나머지는 같은 결로 지은 초안입니다.

import type { EdgeType } from '@/components/PuzzlePiece';

export type AxisId = 'start' | 'role' | 'decide' | 'style';
export type PieceLetter = 'I' | 'P' | 'M' | 'S' | 'G' | 'E' | 'A' | 'W';
/** 예: 'IMGA' — 시작(I/P) · 맡는 일(M/S) · 결정(G/E) · 스타일(A/W) */
export type PieceCode = `${'I' | 'P'}${'M' | 'S'}${'G' | 'E'}${'A' | 'W'}`;

export interface PieceOption {
  letter: PieceLetter;
  /** 답 카드 제목 */
  answer: string;
  /** 결과 태그 · 궁합 화면 축 라벨 */
  tag: string;
  /** 이 답이 만드는 변 모양 (1 볼록 · -1 오목) */
  edge: 1 | -1;
}

export interface PieceQuestion {
  axis: AxisId;
  axisLabel: string;
  /** 위 0 · 오른쪽 1 · 아래 2 · 왼쪽 3 */
  side: 0 | 1 | 2 | 3;
  ordinal: string;
  question: string;
  options: [PieceOption, PieceOption];
}

export const PIECE_QUESTIONS: PieceQuestion[] = [
  {
    axis: 'start',
    axisLabel: '시작',
    side: 0,
    ordinal: '첫 번째 질문',
    question: '새 프로젝트 첫날. 너는 뭐부터 해?',
    options: [
      { letter: 'I', answer: '아이디어부터 막 던져', tag: '아이디어부터', edge: 1 },
      { letter: 'P', answer: '계획표부터 짜', tag: '계획부터', edge: -1 },
    ],
  },
  {
    axis: 'role',
    axisLabel: '맡는 일',
    side: 1,
    ordinal: '두 번째 질문',
    question: '팀에서 제일 맡고 싶은 일은?',
    options: [
      { letter: 'M', answer: '내 손으로 직접 만들기', tag: '직접 만들기', edge: 1 },
      { letter: 'S', answer: '만든 걸 말로 설득하기', tag: '말로 설득', edge: -1 },
    ],
  },
  {
    axis: 'decide',
    axisLabel: '결정',
    side: 2,
    ordinal: '세 번째 질문',
    question: '회의에서 A안, B안이 팽팽해. 너는 보통 어떻게 정해?',
    options: [
      { letter: 'E', answer: '자료부터 찾아보고 정해', tag: '근거로 결정', edge: 1 },
      { letter: 'G', answer: '감 오는 쪽으로 바로 가', tag: '감으로 결정', edge: -1 },
    ],
  },
  {
    axis: 'style',
    axisLabel: '스타일',
    side: 3,
    ordinal: '네 번째 질문',
    question: '마감 사흘 전. 너는 어떻게 일해?',
    options: [
      { letter: 'A', answer: '혼자 몰입해서 끝내', tag: '혼자 몰입', edge: 1 },
      { letter: 'W', answer: '같이 붙어서 해', tag: '같이 붙어서', edge: -1 },
    ],
  },
];

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

export type PieceAnswers = [PieceLetter | null, PieceLetter | null, PieceLetter | null, PieceLetter | null];

export const emptyPieceAnswers = (): PieceAnswers => [null, null, null, null];

export function codeFromAnswers(a: PieceAnswers): PieceCode | null {
  return a.every(Boolean) ? (a.join('') as PieceCode) : null;
}

/** 답한 변만 볼록/오목, 아직 안 한 변은 평평(0) — 답할 때마다 한 변씩 완성 */
export function edgesFromAnswers(a: PieceAnswers): [EdgeType, EdgeType, EdgeType, EdgeType] {
  const edges: [EdgeType, EdgeType, EdgeType, EdgeType] = [0, 0, 0, 0];
  PIECE_QUESTIONS.forEach((q, i) => {
    const o = q.options.find((x) => x.letter === a[i]);
    if (o) edges[q.side] = o.edge;
  });
  return edges;
}

export function edgesFromCode(code: PieceCode) {
  return edgesFromAnswers(code.split('') as PieceAnswers);
}

/** 네 변이 전부 반대인 유형 */
export function perfectMatch(code: PieceCode): PieceCode {
  return PIECE_QUESTIONS.map((q, i) => q.options.find((o) => o.letter !== code[i])!.letter).join('') as PieceCode;
}

export function quadrantOf(code: PieceCode) {
  return QUADRANT[code.slice(0, 2)];
}

export function tagsOf(code: PieceCode): string[] {
  return PIECE_QUESTIONS.map((q, i) => q.options.find((o) => o.letter === code[i])!.tag);
}

/** 두 조각이 맞물리는 변 수 (반대인 축 수) */
export function interlockCount(a: PieceCode, b: PieceCode) {
  return [0, 1, 2, 3].filter((i) => a[i] !== b[i]).length;
}

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
  const axes = PIECE_QUESTIONS.map((q, i) => {
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
