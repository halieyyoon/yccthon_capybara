// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/data/)
// ⚠ 합성 데모 데이터입니다. 실제 연세대 학생 정보가 아니며, 성능 검증 근거로 쓰지 않습니다.
// 고정 시드 난수로 정확히 100명을 생성합니다. ~70명은 27차원 전체 보유, ~30명은 성격 또는 갈등 5차원이 null.

import {
  FEATURE_SCHEMA_VERSION,
  type CvTemplate,
  type DealBreakerId,
  type Features27,
  type RoleId,
  type SkillCardId,
  type TemperatureMode,
  type UserProfile,
  type WeeklyHours,
} from '@/types/ondo';
import { DEAL_BREAKERS, SKILL_CARDS, TEMPERATURE_BY_ID, deriveCollabType } from './constants';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261121);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const likert = (center: number, spread = 1.1) => clamp(Math.round(center + (rand() * 2 - 1) * spread), 1, 5);
const level = (center: number) => clamp(Math.round(center + (rand() * 2 - 1) * 1.1), 0, 4);

type SkillBias = Record<RoleId, number>;

interface MajorProfile {
  name: string;
  skills: SkillBias;
  strengths: SkillCardId[];
  weight: number;
}

const MAJORS: MajorProfile[] = [
  { name: '컴퓨터과학과', skills: { planning: 1.5, frontend: 3, backend: 3.2, design: 1, data_ai: 2.4, presentation: 1.3 }, strengths: ['frontend', 'backend', 'fast_proto', 'ai_prompt'], weight: 14 },
  { name: '인공지능학과', skills: { planning: 1.4, frontend: 2, backend: 2.4, design: 0.8, data_ai: 3.4, presentation: 1.3 }, strengths: ['ai_prompt', 'data_analysis', 'backend'], weight: 7 },
  { name: '전기전자공학부', skills: { planning: 1.3, frontend: 1.8, backend: 2.6, design: 0.7, data_ai: 2.2, presentation: 1.2 }, strengths: ['backend', 'fast_proto', 'data_analysis'], weight: 7 },
  { name: '산업공학과', skills: { planning: 2.8, frontend: 1.4, backend: 1.4, design: 1.4, data_ai: 2.6, presentation: 2.2 }, strengths: ['data_analysis', 'pm_schedule', 'slide_story'], weight: 8 },
  { name: '응용통계학과', skills: { planning: 2, frontend: 0.8, backend: 1, design: 0.8, data_ai: 3.2, presentation: 1.8 }, strengths: ['data_analysis', 'ai_prompt', 'user_research'], weight: 7 },
  { name: '경영학과', skills: { planning: 3.2, frontend: 0.6, backend: 0.4, design: 1.4, data_ai: 1.4, presentation: 3.2 }, strengths: ['pitching', 'slide_story', 'pm_schedule', 'user_research'], weight: 12 },
  { name: '경제학부', skills: { planning: 2.8, frontend: 0.5, backend: 0.4, design: 0.9, data_ai: 2.2, presentation: 2.6 }, strengths: ['data_analysis', 'slide_story', 'copywriting'], weight: 7 },
  { name: '생활디자인학과', skills: { planning: 2.2, frontend: 1.6, backend: 0.4, design: 3.5, data_ai: 0.6, presentation: 2.2 }, strengths: ['ui_design', 'slide_story', 'ideation'], weight: 8 },
  { name: '언론홍보영상학부', skills: { planning: 2.8, frontend: 0.6, backend: 0.3, design: 2.4, data_ai: 0.8, presentation: 3.2 }, strengths: ['copywriting', 'pitching', 'ideation'], weight: 7 },
  { name: '심리학과', skills: { planning: 2.6, frontend: 0.5, backend: 0.3, design: 1.6, data_ai: 1.8, presentation: 2.4 }, strengths: ['user_research', 'copywriting', 'data_analysis'], weight: 6 },
  { name: '문헌정보학과', skills: { planning: 2.4, frontend: 1.6, backend: 1.2, design: 1.4, data_ai: 2, presentation: 1.8 }, strengths: ['user_research', 'copywriting', 'data_analysis'], weight: 4 },
  { name: '국어국문학과', skills: { planning: 2.6, frontend: 0.4, backend: 0.2, design: 1.2, data_ai: 0.6, presentation: 2.8 }, strengths: ['copywriting', 'slide_story', 'ideation'], weight: 4 },
  { name: '실내건축학과', skills: { planning: 2.2, frontend: 1, backend: 0.3, design: 3.2, data_ai: 0.5, presentation: 2.2 }, strengths: ['ui_design', 'ideation', 'pm_schedule'], weight: 4 },
  { name: '글로벌인재학부', skills: { planning: 2.8, frontend: 0.8, backend: 0.5, design: 1.4, data_ai: 1.2, presentation: 3.2 }, strengths: ['pitching', 'user_research', 'ideation'], weight: 5 },
];

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
const GIVEN = ['민준', '서연', '지호', '하은', '도윤', '수아', '예준', '지민', '시우', '서윤', '주원', '채원', '하준', '지유', '건우', '다은', '우진', '소율', '현우', '예린', '태윤', '나연', '준서', '유나', '은호', '가윤', '승민', '서아', '재원', '하린'];
const NICK_A = ['새벽', '느긋한', '꼼꼼한', '번개', '조용한', '반짝', '단단한', '말랑', '성실한', '엉뚱한', '차분한', '든든한', '호기심', '부지런한', '손빠른'];
const NICK_B = ['코더', '기획자', '다람쥐', '수달', '부엉이', '카피바라', '고래', '펭귄', '여우', '연필', '스케치', '노트', '커밋', '픽셀', '마감러'];
const TOOLS = ['ChatGPT', 'Claude', 'Gemini', 'Cursor', 'GitHub Copilot', 'Figma AI', 'Perplexity', 'Notion AI'];

function pickMajor(): MajorProfile {
  const total = MAJORS.reduce((s, m) => s + m.weight, 0);
  let r = rand() * total;
  for (const m of MAJORS) {
    r -= m.weight;
    if (r <= 0) return m;
  }
  return MAJORS[0];
}

function temperatureFor(i: number): TemperatureMode {
  // fun 30 · balanced 35 · serious 35
  if (i % 20 < 6) return 'fun';
  if (i % 20 < 13) return 'balanced';
  return 'serious';
}

function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeFeatures(major: MajorProfile, mode: TemperatureMode, missing: 'none' | 'personality' | 'conflict' | 'both'): Features27 {
  const goalCenter = mode === 'serious' ? 4.3 : mode === 'balanced' ? 3.1 : 2;
  const learnCenter = mode === 'fun' ? 4.4 : mode === 'balanced' ? 3.6 : 2.8;
  const aiCenter = 1.8 + rand() * 3;
  const proto = rand();
  const p = (c: number) => likert(c);
  const personality = missing === 'personality' || missing === 'both';
  const conflict = missing === 'conflict' || missing === 'both';
  return {
    openness: personality ? null : p(3.4),
    conscientiousness: personality ? null : p(mode === 'serious' ? 4 : 3.2),
    extraversion: personality ? null : p(3),
    agreeableness: personality ? null : p(3.5),
    emotional_stability: personality ? null : p(3.2),
    winning_orientation: likert(goalCenter, 0.9),
    learning_priority: likert(learnCenter, 0.9),
    delivery_priority: likert(mode === 'fun' ? 3 : 4, 1),
    continuation_intent: likert(mode === 'serious' ? 3.6 : 2.8, 1.2),
    integrating: conflict ? null : p(3.6),
    obliging: conflict ? null : p(3),
    dominating: conflict ? null : p(2.8),
    avoiding: conflict ? null : p(2.6),
    compromising: conflict ? null : p(3.4),
    ai_use_permissiveness: likert(aiCenter, 0.7),
    ai_verification_strictness: likert(5.6 - aiCenter * 0.6, 0.9),
    ai_disclosure_preference: likert(3.6, 1),
    prototyping_preference: likert(proto > 0.5 ? 4 : 2.4, 0.9),
    risk_appetite: likert(mode === 'fun' ? 3.8 : 3, 1),
    quality_priority: likert(proto > 0.5 ? 2.6 : 4, 0.9),
    decision_structure_preference: likert(mode === 'serious' ? 3.9 : 3.1, 1),
    planning: level(major.skills.planning),
    frontend: level(major.skills.frontend),
    backend: level(major.skills.backend),
    design: level(major.skills.design),
    data_ai: level(major.skills.data_ai),
    presentation: level(major.skills.presentation),
  };
}

function preferredRolesFrom(x: Features27): RoleId[] {
  const ranked = (['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'] as RoleId[])
    .map((r) => [r, x[r] + rand() * 0.6] as const)
    .sort((a, b) => b[1] - a[1]);
  return ranked.slice(0, rand() > 0.5 ? 2 : 1).map(([r]) => r);
}

function cardsFor(major: MajorProfile, x: Features27): { strengths: [SkillCardId, SkillCardId]; weaknesses: [SkillCardId, SkillCardId] } {
  const pool = shuffled(major.strengths);
  const s1 = pool[0];
  const s2 = pool[1] ?? pick(SKILL_CARDS.filter((c) => c.id !== s1)).id;
  const byWeakAxis = [...SKILL_CARDS]
    .filter((c) => c.id !== s1 && c.id !== s2)
    .sort((a, b) => x[a.axis] - x[b.axis] + (rand() - 0.5) * 1.5);
  return { strengths: [s1, s2], weaknesses: [byWeakAxis[0].id, byWeakAxis[1].id] };
}

function makeCv(realName: string, major: string, grade: string, strengths: SkillCardId[], mode: TemperatureMode): CvTemplate {
  const strengthLabels = strengths.map((id) => SKILL_CARDS.find((c) => c.id === id)!.strength);
  const tools = shuffled(TOOLS).slice(0, 2 + Math.floor(rand() * 2));
  const projects = [
    { title: '교내 해커톤 프로젝트', role: strengthLabels[0], summary: '4인 팀에서 핵심 기능 1개를 맡아 48시간 안에 시연 버전을 냈습니다.' },
    { title: '학회 데이터 분석 세션', role: '스터디원', summary: '공공데이터로 주제를 정해 분석 보고서를 함께 썼습니다.' },
    { title: '창업 동아리 서비스 기획', role: strengthLabels[1], summary: '사용자 인터뷰 10건을 바탕으로 첫 화면 흐름을 다시 짰습니다.' },
    { title: '공모전 본선 진출', role: '팀원', summary: '아이디어 기획서와 발표 자료를 맡았습니다.' },
  ];
  return {
    realName,
    university: '연세대학교',
    major,
    grade,
    headline: `${major} ${grade} · ${strengthLabels[0]}`,
    experiences: shuffled(projects)
      .slice(0, 2)
      .map((p, i) => ({ ...p, period: i === 0 ? '2026.03 – 2026.06' : '2025.09 – 2025.12' })),
    skills: strengthLabels,
    languages: rand() > 0.4 ? ['한국어', '영어(업무 가능)'] : ['한국어'],
    aiTools: tools,
    aiUsageNote:
      mode === 'serious'
        ? `${tools[0]}로 초안을 만들고, 제출 전에는 직접 검증합니다.`
        : `${tools[0]}는 자료 조사와 아이디어 정리에 주로 씁니다.`,
    collaborationNote: '진행 상황을 하루 한 번 공유하는 걸 좋아합니다.',
    source: 'manual',
  };
}

function makeUser(i: number): UserProfile {
  const major = pickMajor();
  const mode = temperatureFor(i);
  // 30명 결측: personality 10 · conflict 10 · both 10
  const missing = i % 10 === 3 ? 'personality' : i % 10 === 7 ? 'conflict' : i % 10 === 9 ? 'both' : 'none';
  const features27 = makeFeatures(major, mode, missing);
  const realName = `${SURNAMES[i % SURNAMES.length]}${GIVEN[(i * 7) % GIVEN.length]}`;
  const grade = `${1 + Math.floor(rand() * 4)}학년`;
  const { strengths, weaknesses } = cardsFor(major, features27);
  const dealCount = rand() > 0.5 ? 2 : 1;
  const dealBreakers = shuffled(DEAL_BREAKERS.map((d) => d.id)).slice(0, dealCount) as DealBreakerId[];
  const weeklyHours: WeeklyHours = mode === 'serious' ? pick(['6-10h', '10h+'] as const) : pick(['3-5h', '6-10h'] as const);
  return {
    id: `seed-${String(i + 1).padStart(3, '0')}`,
    nickname: `${NICK_A[i % NICK_A.length]}${NICK_B[(i * 4 + 3 + Math.floor(i / NICK_A.length)) % NICK_B.length]}`,
    email: `seed${i + 1}@yonsei.ac.kr`,
    featureSchemaVersion: FEATURE_SCHEMA_VERSION,
    temperatureMode: mode,
    temperature: TEMPERATURE_BY_ID[mode].temperature,
    features27,
    preferredRoles: preferredRolesFrom(features27),
    hardConstraints: {
      weeklyHours,
      offlineAvailable: rand() > 0.25,
      nightWorkAvailable: rand() > 0.4,
    },
    collabType: deriveCollabType(features27),
    strengths,
    weaknesses,
    dealBreakers,
    weeklyDropEnabled: rand() > 0.3,
    cv: makeCv(realName, major.name, grade, strengths, mode),
  };
}

export const SEED_USERS: UserProfile[] = Array.from({ length: 100 }, (_, i) => makeUser(i));

/** 시연용: '샘플 링크드인 PDF로 채워보기'에 쓰는 가상의 이력 텍스트 */
export const SAMPLE_LINKEDIN_CV_TEXT = `박지후
연세대학교 컴퓨터과학과 3학년
프론트엔드 개발 · 해커톤 4회 참가

경력
- 신촌 IT 연합 해커톤 2026 · 프론트엔드 리드 · 2026.05
  React와 Next.js로 실시간 대기열 화면을 만들고 48시간 안에 시연까지 마쳤습니다. 장려상.
- 연세대 데이터 학회 YDS · 웹 개발 담당 · 2025.09 – 2026.02
  학회 아카이브 사이트를 새로 만들고 월 방문자 1,200명을 유지했습니다.
- 스타트업 인턴(가상) · UI 개발 인턴 · 2025.07 – 2025.08
  디자인 시스템 컴포넌트 20여 개를 정리했습니다.

기술
TypeScript, React, Next.js, Tailwind CSS, Figma, Python

언어
한국어(모국어), 영어(업무 가능)

AI 도구
Claude, Cursor, ChatGPT — 반복 코드와 테스트 초안에 쓰고, 화면 로직은 직접 검토합니다.

협업
결정 사항은 그날 문서로 남기는 편입니다. 피드백은 구체적으로 주고받는 걸 선호합니다.`;
