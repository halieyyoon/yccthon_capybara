// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/data/)
// SPEC.md 2~3장과 docs/proposal/08 3장을 바탕으로 화면 개발에 필요한 만큼 먼저 만든 상수입니다.
// 혜원의 정식 구현이 올라오면 이 파일을 그대로 교체하면 됩니다. (export 이름은 hyewon-schema.md Task 1 기준)

import type { ItemBasis } from './references';
import type {
  CollabType,
  DealBreakerId,
  Features27,
  RoleId,
  SkillCardId,
  TemperatureMode,
  TemperatureValue,
} from '@/types/ondo';

export type FeatureKey = keyof Features27;
export type FeatureGroup = 'personality' | 'goal' | 'conflict' | 'ai' | 'work' | 'skill';

export interface FeatureMeta {
  index: number;
  key: FeatureKey;
  group: FeatureGroup;
  label: string;
  min: number;
  max: number;
  optional: boolean;
}

export const FEATURE_GROUP_LABEL: Record<FeatureGroup, string> = {
  personality: '성격',
  goal: '목표',
  conflict: '갈등 대응',
  ai: 'AI 규범',
  work: '작업 방식',
  skill: '역량',
};

const f = (
  index: number,
  key: FeatureKey,
  group: FeatureGroup,
  label: string,
  optional = false,
): FeatureMeta => ({
  index,
  key,
  group,
  label,
  min: group === 'skill' ? 0 : 1,
  max: group === 'skill' ? 4 : 5,
  optional,
});

/** 고정 27차원 순서 (feature_schema_version v1.0) */
export const FEATURE_META_27: FeatureMeta[] = [
  f(0, 'openness', 'personality', '개방성', true),
  f(1, 'conscientiousness', 'personality', '성실성', true),
  f(2, 'extraversion', 'personality', '외향성', true),
  f(3, 'agreeableness', 'personality', '친화성', true),
  f(4, 'emotional_stability', 'personality', '정서 안정성', true),
  f(5, 'winning_orientation', 'goal', '수상 우선'),
  f(6, 'learning_priority', 'goal', '학습 우선'),
  f(7, 'delivery_priority', 'goal', '완성 제출 우선'),
  f(8, 'continuation_intent', 'goal', '이후 지속 의향'),
  f(9, 'integrating', 'conflict', '통합형', true),
  f(10, 'obliging', 'conflict', '양보형', true),
  f(11, 'dominating', 'conflict', '주장형', true),
  f(12, 'avoiding', 'conflict', '회피형', true),
  f(13, 'compromising', 'conflict', '타협형', true),
  f(14, 'ai_use_permissiveness', 'ai', 'AI 사용 허용'),
  f(15, 'ai_verification_strictness', 'ai', 'AI 결과 검증'),
  f(16, 'ai_disclosure_preference', 'ai', 'AI 사용 공개'),
  f(17, 'prototyping_preference', 'work', '빠른 프로토타입'),
  f(18, 'risk_appetite', 'work', '도전 성향'),
  f(19, 'quality_priority', 'work', '완성도 우선'),
  f(20, 'decision_structure_preference', 'work', '결정 규칙 명확화'),
  f(21, 'planning', 'skill', '기획'),
  f(22, 'frontend', 'skill', '프론트엔드'),
  f(23, 'backend', 'skill', '백엔드'),
  f(24, 'design', 'skill', '디자인'),
  f(25, 'data_ai', 'skill', '데이터·AI'),
  f(26, 'presentation', 'skill', '발표'),
];

export const OPTIONAL_FEATURE_KEYS = FEATURE_META_27.filter((m) => m.optional).map((m) => m.key);

export interface SurveyQuestion {
  key: FeatureKey;
  text: string;
  /** true면 동의할수록 해당 피처 값이 낮아지는 역문항 */
  reverse?: boolean;
  /** 이 문항이 무엇에 기반하는지 (docs/proposal/09 2장) */
  basis: ItemBasis;
}

/** 1~5 리커트 문항. 08번 문서 3장 '자체 개발 문항 예시(검증 전)' 기반 */
export const SURVEY_QUESTIONS: {
  required: { group: FeatureGroup; title: string; items: SurveyQuestion[] }[];
  optional: { group: FeatureGroup; title: string; items: SurveyQuestion[] }[];
} = {
  required: [
    {
      group: 'goal',
      title: '이번 대회에서 바라는 것',
      items: [
        { key: 'winning_orientation', text: '이번 참가에서는 새로운 기술 학습보다 수상이 중요하다.', basis: { refs: ['VANDEWALLE1997'], adaptation: 'concept', note: '성과 지향 개념을 해커톤 수상 목표로 옮겼어요.' } },
        { key: 'learning_priority', text: '완성된 결과물보다 탐색과 학습 경험을 더 중시한다.', basis: { refs: ['VANDEWALLE1997'], adaptation: 'concept', note: '학습 지향 개념을 참고했어요.' } },
        { key: 'delivery_priority', text: '마감이 촉박하면 기능을 줄여서라도 작동하는 결과물을 제출해야 한다.', basis: { refs: [], adaptation: 'original', note: '해커톤 맥락에 맞춰 만든 문항이에요.' } },
        { key: 'continuation_intent', text: '대회가 끝난 뒤에도 프로젝트를 이어갈 의향이 있다.', basis: { refs: [], adaptation: 'original' } },
      ],
    },
    {
      group: 'ai',
      title: 'AI를 쓰는 방식',
      items: [
        { key: 'ai_use_permissiveness', text: '핵심 기능의 코드도 생성형 AI로 작성해도 괜찮다.', basis: { refs: ['SCHEPMAN2020'], adaptation: 'concept', note: 'AI 일반 태도가 아니라 팀 안에서 어디까지 쓸지를 물어요.' } },
        { key: 'ai_verification_strictness', text: 'AI가 만든 결과물은 팀원이 직접 확인한 뒤에 써야 한다.', basis: { refs: [], adaptation: 'original' } },
        { key: 'ai_disclosure_preference', text: 'AI를 어디에 썼는지 팀 안에서 서로 공개해야 한다.', basis: { refs: [], adaptation: 'original' } },
      ],
    },
    {
      group: 'work',
      title: '일하는 방식',
      items: [
        { key: 'prototyping_preference', text: '긴 기획 회의보다 먼저 만들어 보고 고치는 편이 좋다.', basis: { refs: [], adaptation: 'original' } },
        { key: 'risk_appetite', text: '불확실한 도전보다 확실히 완성할 수 있는 기능을 먼저 한다.', reverse: true, basis: { refs: [], adaptation: 'original', note: '반대로 묻는 문항이라 점수를 뒤집어 계산해요.' } },
        { key: 'quality_priority', text: '마감 직전이라도 품질을 위해 범위를 조정할 수 있다.', basis: { refs: [], adaptation: 'original' } },
        { key: 'decision_structure_preference', text: '시작 전에 팀의 결정 규칙을 정해 두는 것이 좋다.', basis: { refs: [], adaptation: 'original' } },
      ],
    },
  ],
  optional: [
    {
      group: 'personality',
      title: '성격 (임시 문항 · 검증 전)',
      items: [
        { key: 'openness', text: '처음 보는 방식이나 아이디어를 시도하는 게 즐겁다.', basis: { refs: ['DONNELLAN2006'], adaptation: 'concept', note: '요인당 1문항이라 점수에는 쓰지 않고 대화 주제로만 써요.' } },
        { key: 'conscientiousness', text: '맡은 일은 계획을 세워 마감 전에 끝낸다.', basis: { refs: ['DONNELLAN2006'], adaptation: 'concept', note: '요인당 1문항이라 점수에는 쓰지 않고 대화 주제로만 써요.' } },
        { key: 'extraversion', text: '여러 사람과 바로 이야기를 나누는 게 편하다.', basis: { refs: ['DONNELLAN2006'], adaptation: 'concept', note: '요인당 1문항이라 점수에는 쓰지 않고 대화 주제로만 써요.' } },
        { key: 'agreeableness', text: '팀원의 사정을 먼저 헤아리는 편이다.', basis: { refs: ['DONNELLAN2006'], adaptation: 'concept', note: '요인당 1문항이라 점수에는 쓰지 않고 대화 주제로만 써요.' } },
        { key: 'emotional_stability', text: '일이 꼬여도 쉽게 흔들리지 않는다.', basis: { refs: ['DONNELLAN2006'], adaptation: 'concept', note: '요인당 1문항이라 점수에는 쓰지 않고 대화 주제로만 써요.' } },
      ],
    },
    {
      group: 'conflict',
      title: '의견이 부딪힐 때',
      items: [
        { key: 'integrating', text: '다수결 전에 서로의 근거를 충분히 검토하고 싶다.', basis: { refs: ['RAHIM1983'], adaptation: 'concept', note: '\'통합\' 스타일 개념이에요. 점수에는 쓰지 않아요.' } },
        { key: 'obliging', text: '팀 분위기를 위해 내 의견을 양보하는 편이다.', basis: { refs: ['RAHIM1983'], adaptation: 'concept', note: '\'양보\' 스타일 개념이에요. 점수에는 쓰지 않아요.' } },
        { key: 'dominating', text: '동의하지 않을 때는 이유를 직접 말한다.', basis: { refs: ['RAHIM1983'], adaptation: 'concept', note: '\'지배\' 스타일 개념이에요. 점수에는 쓰지 않아요.' } },
        { key: 'avoiding', text: '충돌하면 잠시 시간을 둔 뒤 다시 이야기하는 게 낫다.', basis: { refs: ['RAHIM1983'], adaptation: 'concept', note: '\'회피\' 스타일 개념이에요. 점수에는 쓰지 않아요.' } },
        { key: 'compromising', text: '서로 조금씩 양보해 중간 지점을 찾는다.', basis: { refs: ['RAHIM1983'], adaptation: 'concept', note: '\'타협\' 스타일 개념이에요. 점수에는 쓰지 않아요.' } },
      ],
    },
  ],
};

export const LIKERT_LABELS = ['전혀 아니다', '아니다', '보통', '그렇다', '매우 그렇다'] as const;
export const SKILL_LEVEL_LABELS = ['없음', '입문', '기본', '능숙', '리드 가능'] as const;

export interface TemperatureModeMeta {
  id: TemperatureMode;
  label: string;
  short: string;
  temperature: TemperatureValue;
  description: string;
  /** 이 상태를 고른 사람의 목표 참고값 (사용자 응답을 덮어쓰지 않고 비교용으로만 표시) */
  goalReference: { winning_orientation: number; learning_priority: number };
}

export const TEMPERATURE_MODES: TemperatureModeMeta[] = [
  {
    id: 'fun',
    label: '가볍게 재미 · 경험',
    short: '가볍게',
    temperature: 36.5,
    description: '부담 없이 새로운 걸 배우고 경험하는 데 집중해요.',
    goalReference: { winning_orientation: 2, learning_priority: 4.5 },
  },
  {
    id: 'balanced',
    label: '균형 있게 완주',
    short: '균형 있게',
    temperature: 65,
    description: '즐겁게 하되, 작동하는 결과물은 꼭 내요.',
    goalReference: { winning_orientation: 3, learning_priority: 3.5 },
  },
  {
    id: 'serious',
    label: '진지하게 수상 · 취업',
    short: '진지하게',
    temperature: 90,
    description: '수상과 포트폴리오를 목표로 완성도를 끝까지 올려요.',
    goalReference: { winning_orientation: 4.5, learning_priority: 2.5 },
  },
];

export const TEMPERATURE_BY_ID = Object.fromEntries(TEMPERATURE_MODES.map((m) => [m.id, m])) as Record<
  TemperatureMode,
  TemperatureModeMeta
>;

export interface SkillCardMeta {
  id: SkillCardId;
  strength: string;
  weakness: string;
  axis: RoleId;
}

export const SKILL_CARDS: SkillCardMeta[] = [
  { id: 'frontend', strength: '프론트엔드·화면 구현', weakness: '화면 구현·코딩 서툼', axis: 'frontend' },
  { id: 'backend', strength: '백엔드·API·DB 설계', weakness: '서버·데이터 연결 어려움', axis: 'backend' },
  { id: 'ai_prompt', strength: 'AI 툴·프롬프트 활용 능숙', weakness: 'AI 툴 활용이 어색함', axis: 'data_ai' },
  { id: 'data_analysis', strength: '데이터 분석·리서치', weakness: '수치·근거 데이터 정리 약함', axis: 'data_ai' },
  { id: 'ui_design', strength: 'UI/UX·시각 디자인', weakness: '디자인 감각·미감 부족', axis: 'design' },
  { id: 'slide_story', strength: '장표 구성·스토리라인', weakness: '발표 자료 구조화 서툼', axis: 'planning' },
  { id: 'pitching', strength: '발표·질의응답 강점', weakness: '발표 울렁증 있음', axis: 'presentation' },
  { id: 'ideation', strength: '빠른 아이디어 발산', weakness: '백지에서 아이디어 짜기 어려움', axis: 'planning' },
  { id: 'pm_schedule', strength: '일정 관리·역할 정리', weakness: '마감·일정 관리가 약함', axis: 'planning' },
  { id: 'copywriting', strength: '글쓰기·문서·카피라이팅', weakness: '글 정리·문서화 부담', axis: 'presentation' },
  { id: 'user_research', strength: '인터뷰·시장 조사', weakness: '현장 조사·사용자 인터뷰 서툼', axis: 'planning' },
  { id: 'fast_proto', strength: '빠른 프로토타이핑·실행력', weakness: '실행 착수가 느림(완벽주의)', axis: 'frontend' },
];

export const SKILL_CARD_BY_ID = Object.fromEntries(SKILL_CARDS.map((c) => [c.id, c])) as Record<
  SkillCardId,
  SkillCardMeta
>;

export const DEAL_BREAKERS: { id: DealBreakerId; label: string; detail: string }[] = [
  { id: 'ghosting', label: '연락 두절', detail: '24시간 넘게 답이 없음' },
  { id: 'blind_ai_copy', label: 'AI 복붙', detail: '이해 없이 AI 결과를 그대로 붙여 넣음' },
  { id: 'last_minute', label: '막판 뒤집기', detail: '마감 직전에 방향을 바꿈' },
  { id: 'no_prep', label: '자료 미확인', detail: '공유한 자료를 읽지 않고 회의에 옴' },
  { id: 'free_riding', label: '역할 떠넘기기', detail: '맡은 일을 남에게 미룸' },
  { id: 'harsh_tone', label: '공격적 피드백', detail: '사람을 향한 날 선 말투' },
  { id: 'slow_decision', label: '결정 지연', detail: '정할 것을 계속 미룸' },
  { id: 'scope_creep', label: '기능 욕심', detail: '일정을 넘는 기능을 계속 추가' },
];

export const DEAL_BREAKER_BY_ID = Object.fromEntries(DEAL_BREAKERS.map((d) => [d.id, d])) as Record<
  DealBreakerId,
  (typeof DEAL_BREAKERS)[number]
>;

export const ROLES: { id: RoleId; label: string }[] = [
  { id: 'planning', label: '기획' },
  { id: 'frontend', label: '프론트엔드' },
  { id: 'backend', label: '백엔드' },
  { id: 'design', label: '디자인' },
  { id: 'data_ai', label: '데이터·AI' },
  { id: 'presentation', label: '발표' },
];

export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.id, r.label])) as Record<RoleId, string>;

export const COLLAB_AXIS_LABEL = {
  A: 'AI 가속',
  M: '직접 검증',
  S: '빠른 실행',
  P: '완성도 우선',
  D: '명확·직설',
  H: '유연·합의',
  B: '구현 중심',
  V: '기획·스토리',
} as const;

/** SPEC 3.2 규칙으로 27차원에서 16유형 자동 도출 */
export function deriveCollabType(x: Features27): CollabType {
  const a = x.ai_use_permissiveness >= 3.5 ? 'A' : 'M';
  const s = x.prototyping_preference >= x.quality_priority ? 'S' : 'P';
  const conflictDirect = x.dominating !== null && x.obliging !== null && x.dominating >= x.obliging;
  const d = x.decision_structure_preference >= 3.5 || conflictDirect ? 'D' : 'H';
  const tech = Math.max(x.frontend, x.backend, x.data_ai);
  const story = Math.max(x.planning, x.design, x.presentation);
  const b = tech >= story ? 'B' : 'V';
  return `${a}${s}${d}${b}` as CollabType;
}

export const COLLAB_TYPES: CollabType[] = [
  'APDB', 'APDV', 'APHB', 'APHV', 'ASDB', 'ASDV', 'ASHB', 'ASHV',
  'MPDB', 'MPDV', 'MPHB', 'MPHV', 'MSDB', 'MSDV', 'MSHB', 'MSHV',
];

export type CompatLevel = 1 | 2 | 3 | 4 | 5;

export const COMPAT_LEVEL_META: Record<CompatLevel, { key: string; label: string; color: string }> = {
  5: { key: 'ideal', label: '잘 맞물림', color: '#2f6fb0' },
  4: { key: 'good', label: '무난함', color: '#2e7d4f' },
  3: { key: 'one_sided', label: '한쪽이 맞춰 줌', color: '#8fb34a' },
  2: { key: 'workable', label: '조율 필요', color: '#d8a826' },
  1: { key: 'caution', label: '초반 합의 권장', color: '#c4462f' },
};

/**
 * 16×16 호환성 매트릭스 (시각화 보조 배지 · 심리검사 진단 아님)
 * 임시 규칙: AI 규범은 같을수록, 역량 초점은 다를수록(보완) 높게, 작업 속도 차이와 직설-직설 조합은 약간 낮게.
 */
function compat(a: CollabType, b: CollabType): CompatLevel {
  let score = 3;
  score += a[0] === b[0] ? 0.5 : -1.5;
  score += a[1] === b[1] ? 0.5 : -0.5;
  if (a[2] === 'D' && b[2] === 'D') score -= 0.5;
  else if (a[2] !== b[2]) score += 0.5;
  score += a[3] !== b[3] ? 1 : -0.5;
  return Math.max(1, Math.min(5, Math.round(score))) as CompatLevel;
}

export const COMPATIBILITY_MATRIX_16X16 = Object.fromEntries(
  COLLAB_TYPES.map((a) => [a, Object.fromEntries(COLLAB_TYPES.map((b) => [b, compat(a, b)]))]),
) as Record<CollabType, Record<CollabType, CompatLevel>>;

/** 역량 자기보고(0~4)의 근거 — CATME Team-Maker도 기술·경험을 자기보고로 받아 팀 배정에 씀 (온보딩 C3) */
export const SKILL_BASIS: ItemBasis = { refs: ['LAYTON2010'], adaptation: 'concept', note: '본인이 매긴 숙련도라 실제 실력과 다를 수 있어요.' };

/**
 * 약점 카드 → 그 약점을 덮어 줄 수 있는 강점 카드 (자체 매핑 v1.0)
 * 이전 버전은 '같은 역량 축'이면 아무 강점이나 연결해 "발표 자료 구조화 서툼 ← 빠른 아이디어 발산" 같은 어색한 짝이 나왔음.
 * 첫 번째 = 같은 카드(정확히 덮음), 나머지 = 실제로 그 일을 대신해 줄 수 있는 카드만.
 */
export const WEAKNESS_COVERED_BY: Record<SkillCardId, SkillCardId[]> = {
  frontend: ['frontend', 'fast_proto'],
  backend: ['backend'],
  ai_prompt: ['ai_prompt'],
  data_analysis: ['data_analysis'],
  ui_design: ['ui_design'],
  slide_story: ['slide_story', 'copywriting'],
  pitching: ['pitching'],
  ideation: ['ideation', 'user_research'],
  pm_schedule: ['pm_schedule'],
  copywriting: ['copywriting', 'slide_story'],
  user_research: ['user_research', 'data_analysis'],
  fast_proto: ['fast_proto', 'pm_schedule'],
};
