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

const SIDE_LABEL = ['윗변', '오른쪽 변', '아랫변', '왼쪽 변'] as const;

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

export function optionHint(q: PieceQuestion, o: PieceOption) {
  return `${SIDE_LABEL[q.side]}이 ${o.edge === 1 ? '볼록' : '오목'}해져요`;
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
