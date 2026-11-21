'use client';

// 소유: 규혁 — 2) `/onboarding` 온보딩
// 구조(퍼즐 궁합 매트릭스 시안): ① ‘내 조각’ 설문(섹션 A~F) — 한 화면 한 문항 · 문항마다 맞는 형식 · 답할수록 조각 완성
//   (목표·AI 규범·작업 방식·역량·장단점 카드·협업 지뢰도 이 답으로 채움 → 리커트·역량 화면 없음)
//   → ② 결과 ‘내 조각이 나왔어요!’(16유형 · 딱 맞물리는 짝 · 포개지는 쌍둥이) → ③ 기본 정보 → CV
// 성격·갈등도 설문(D·E 섹션)에서 받아 27차원 전부 채움. 공모전마다 달라지는 온도·시간은 프로필에서.
// 끝나면 CV 작성으로 이어짐(프로필 = 퍼즐 + CV, 05 workflow) — CV는 건너뛸 수 있음.

import { useRouter } from 'next/navigation';
import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  FEATURE_SCHEMA_VERSION,
  type DealBreakerId,
  type Features27,
  type RoleId,
  type SkillCardId,
  type TemperatureMode,
  type UserProfile,
  type WeeklyHours,
} from '@/types/ondo';
import {
  DEAL_BREAKERS,
  type FeatureKey,
  LIKERT_LABELS,
  OPTIONAL_FEATURE_KEYS,
  ROLES,
  SKILL_CARDS,
  SKILL_LEVEL_LABELS,
  SURVEY_QUESTIONS,
  type SurveyQuestion,
  TEMPERATURE_MODES,
  deriveCollabType,
} from '@/data/constants';
import { basisText } from '@/data/references';
import { basisOf, feedsOf } from '@/data/surveyBasis';
import { Button, Chip, cx, Icon, IconButton, InfoTip, SegmentedButton } from '@/components/m3';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';
import {
  PIECE_SURVEY,
  PIECE_TYPES,
  SKILL_LEVELS,
  SKILL_ROLES,
  SURVEY_SECTIONS,
  type SurveyAnswer,
  type SurveyQ,
  isAnswered,
  type PieceAnswers,
  type PieceCode,
  codeFromAnswers,
  edgesFromAnswers,
  edgesFromCode,
  emptyPieceAnswers,
  featuresFromSurvey,
  goalFeaturesFor,
  perfectMatch,
  quadrantOf,
  tagsOf,
} from '@/store/pieceTypes';





/** 선택 카드 — 안 고름: 흰 면(테두리 없음) / 고름: 연한 파랑 면 + 파랑 테두리선 + 굵은 글씨 + 체크 */
function ChoiceCard({
  selected,
  focusable,
  onPick,
  className,
  children,
}: {
  selected: boolean;
  focusable: boolean;
  onPick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={focusable ? 0 : -1}
      onClick={onPick}
      className={cx(
        'relative grid w-full place-items-center rounded-m3-lg px-3 text-center transition-[background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        selected
          ? 'bg-secondary-container font-semibold text-on-secondary-container shadow-[0_0_0_2px_var(--md-sys-color-secondary)]'
          : 'bg-surface text-on-surface hover:bg-surface-container',
        className,
      )}
    >
      {selected && (
        <span aria-hidden className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-secondary text-on-secondary">
          <Icon name="check" size={14} />
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </button>
  );
}

/** 라디오 묶음 키보드: ←/→(↑/↓) 포커스 이동, 숫자키 1~5로 바로 고르기 */
function onRadioKeys(e: KeyboardEvent<HTMLDivElement>, pick: (i: number) => void) {
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const n = radios.length;
  const i = radios.indexOf(document.activeElement as HTMLButtonElement);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    radios[(i + 1 + n) % n]?.focus();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    radios[(i - 1 + n) % n]?.focus();
  } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= n) {
    e.preventDefault();
    const k = Number(e.key) - 1;
    radios[k]?.focus();
    pick(k);
  }
}

const SCALE_WORDS = ['전혀 아니야', '아닌 편', '반반', '그런 편', '완전 그래'];

/** 한 번 탭으로 끝나는 형식(이지선다 · 하나 고르기 · 1~5점) */
const isOneTap = (q: SurveyQ) => q.type === 'binary' || q.type === 'single' || q.type === 'scale';

/** 문항 형식별 입력 — 이지선다(O/X 카드 2장) · 1~5점(말로 쓴 카드 5장) · 하나 고르기 · 여러 개 고르기 · 역량표 */
type AnswerUpdate = SurveyAnswer | ((prev: SurveyAnswer | undefined) => SurveyAnswer);

function QuestionInput({ q, value, answers, onChange }: { q: SurveyQ; value: SurveyAnswer | undefined; answers: PieceAnswers; onChange: (v: AnswerUpdate) => void }) {
  if (q.type === 'binary') {
    return (
      <div className="grid auto-rows-fr grid-cols-2 gap-3" role="radiogroup" aria-label={q.question} onKeyDown={(e) => onRadioKeys(e, (i) => onChange(i))}>
        {q.options.map((o, oi) => (
          <ChoiceCard key={oi} selected={value === oi} focusable={value === undefined ? oi === 0 : value === oi} onPick={() => onChange(oi)} className="min-h-24 px-4 py-5 sm:min-h-28">
            <span className="block title-medium text-balance [word-break:keep-all]">{o.answer}</span>
          </ChoiceCard>
        ))}
      </div>
    );
  }
  if (q.type === 'single') {
    return (
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2" role="radiogroup" aria-label={q.question} onKeyDown={(e) => onRadioKeys(e, (i) => onChange(i))}>
        {q.options.map((o, oi) => (
          <ChoiceCard key={oi} selected={value === oi} focusable={value === undefined ? oi === 0 : value === oi} onPick={() => onChange(oi)} className="py-4">
            <span className="block title-medium">{o.label}</span>
            {o.detail && <span className="block body-small opacity-90">{o.detail}</span>}
          </ChoiceCard>
        ))}
      </div>
    );
  }
  if (q.type === 'scale') {
    // 문항에 low/high 문구가 있으면 1번·5번 카드에 그 문구
    const words = [q.low || SCALE_WORDS[0], SCALE_WORDS[1], SCALE_WORDS[2], SCALE_WORDS[3], q.high || SCALE_WORDS[4]];
    return (
      <div className="grid auto-rows-fr grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-label={q.question} onKeyDown={(e) => onRadioKeys(e, (i) => onChange(i + 1))}>
        {words.map((w, i) => (
          <ChoiceCard key={i} selected={value === i + 1} focusable={value === undefined ? i === 0 : value === i + 1} onPick={() => onChange(i + 1)} className="min-h-16 px-1 py-3">
            <span className="block label-large text-balance [word-break:keep-all]">{w}</span>
          </ChoiceCard>
        ))}
      </div>
    );
  }
  if (q.type === 'multi') {
    const picked = (value as string[]) ?? [];
    const blocked = q.excludeFrom ? ((answers[q.excludeFrom] as string[]) ?? []) : [];
    const toggle = (v: string) =>
      onChange((prev) => {
        const cur = (prev as string[] | undefined) ?? [];
        return cur.includes(v) ? cur.filter((x) => x !== v) : cur.length < q.max ? [...cur, v] : cur;
      });
    return (
      <div>
        <p className="mb-3 tabular label-large text-on-surface-variant">
          {picked.length}/{q.max} 골랐어요
        </p>
        <div className="flex flex-wrap gap-2">
          {q.options.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={picked.includes(o.value)}
              disabled={blocked.includes(o.value) || (!picked.includes(o.value) && picked.length >= q.max)}
              onClick={() => toggle(o.value)}
            />
          ))}
        </div>
      </div>
    );
  }
  // skills
  const grid = (value as Partial<Record<RoleId, number>>) ?? {};
  return (
    <div className="space-y-3">
      {SKILL_ROLES.map((r) => (
        <div key={r.value} className="grid items-center gap-2 sm:grid-cols-[88px_1fr]">
          <span className="title-small">{r.label}</span>
          <SegmentedButton
            ariaLabel={`${r.label} 숙련도`}
            dense
            value={grid[r.value] ?? null}
            onChange={(v) => onChange((prev) => ({ ...((prev as Partial<Record<RoleId, number>>) ?? {}), [r.value]: v }))}
            options={SKILL_LEVELS.map((l, i) => ({ value: i, label: <span><span className="tabular">{i}</span><span className="hidden md:inline"> {l}</span></span> }))}
          />
        </div>
      ))}
      <p className="flex justify-end gap-1 label-small text-on-surface-variant">0 해 본 적 없음 · 4 팀을 이끌 수 있음</p>
    </div>
  );
}

/** 하단 진행 표시 — 섹션 6단계(A~F) */
function SectionSteps({ step }: { step: number }) {
  return (
    <div aria-label={`${step + 1} / ${SURVEY_SECTIONS.length} 단계`}>
      <div className="flex gap-1.5" aria-hidden>
        {SURVEY_SECTIONS.map((s, i) => (
          <span key={s.id} className={cx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-outline-variant')} />
        ))}
      </div>
      <p className="mt-2 label-large text-on-surface">
        <span className="tabular">
          {step + 1} / {SURVEY_SECTIONS.length}
        </span>{' '}
        · {SURVEY_SECTIONS[step].title}
      </p>
    </div>
  );
}

/** 한 페이지 = 섹션 하나(질문 3~6개). 한 번 탭 → 선택 표시 250ms → 다음 질문으로 이동 */
function SectionScreen({
  step,
  answers,
  onAnswer,
  onNext,
  onBack,
}: {
  step: number;
  answers: PieceAnswers;
  onAnswer: (id: string, v: AnswerUpdate) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const section = SURVEY_SECTIONS[step];
  const qs = useMemo(() => PIECE_SURVEY.filter((q) => q.section === section.id), [section.id]);
  const last = step === SURVEY_SECTIONS.length - 1;
  const allDone = qs.every((q) => isAnswered(q, answers[q.id]));
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const timer = useRef<number | undefined>(undefined);
  const footerRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), [step]);

  const goNextFrom = (qi: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const a = answersRef.current;
      const next = qs.slice(qi + 1).find((q) => !isAnswered(q, a[q.id])) ?? qs.find((q) => !isAnswered(q, a[q.id]));
      if (next) {
        const el = document.getElementById(`q-${next.id}`);
        // 포커스 먼저(스크롤 없이) → 부드럽게 스크롤 (순서가 반대면 스크롤이 끊김)
        el?.querySelector<HTMLElement>('[role="radio"], button')?.focus({ preventScroll: true });
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 250);
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-page">
      <header className="mx-auto flex h-16 w-full max-w-xl items-center gap-2 px-4">
        <IconButton icon="arrow_back" label={step === 0 ? '나가기' : '이전 단계'} onClick={onBack} />
        <h1 className="flex-1 headline-small">{section.title}</h1>
        {/* 혜원 v1.1 근거: 문항별 ‘반영되는 곳’과 근거 — 페이지당 (i) 하나로 모음 */}
        <InfoTip label="이 질문들의 근거" align="end">
          {qs.map((q, qi) => (
            <span key={q.id} className="mb-2 block last:mb-0">
              {qi + 1}. 반영되는 곳: {feedsOf(q).join(' · ')}. {basisText(basisOf(q))}
            </span>
          ))}
        </InfoTip>
      </header>
      <main key={step} className="page-enter mx-auto w-full max-w-xl flex-1 space-y-10 px-4 pb-8 pt-2">
        {qs.map((q, qi) => (
          <section key={q.id} id={`q-${q.id}`} className="scroll-mt-20">
            <h2 className="title-large">{q.question}</h2>
            <div className="mt-4">
              <QuestionInput
                q={q}
                value={answers[q.id]}
                answers={answers}
                onChange={(v) => {
                  onAnswer(q.id, v);
                  if (isOneTap(q)) goNextFrom(qi);
                }}
              />
            </div>
          </section>
        ))}
      </main>
      <div ref={footerRef} className="sticky bottom-0 bg-surface/95 shadow-[0_-1px_0_var(--md-sys-color-surface-container-high)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center gap-4 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {/* 답할수록 완성되는 내 조각 */}
          <PuzzlePiece mode="fun" edges={edgesFromAnswers(answers)} size={64} />
          <div className="min-w-0 flex-1">
            <SectionSteps step={step} />
          </div>
          <Button size="lg" variant="filled" disabled={!allDone} onClick={onNext} trailingIcon={last ? undefined : 'arrow_forward'}>
            {last ? '내 조각 보기' : '다음'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniPiece({ code, caption, tone }: { code: PieceCode; caption: string; tone: 'match' | 'twin' }) {
  const t = PIECE_TYPES[code];
  return (
    <div className="grid place-items-center rounded-m3-lg bg-surface px-3 py-4 text-center">
      <PuzzlePiece mode={tone === 'match' ? 'serious' : 'fun'} edges={edgesFromCode(code)} size={88} />
      <p className={cx('mt-1 flex items-center gap-1 label-medium', tone === 'match' ? 'text-primary' : 'text-secondary')}>
        <Icon name={tone === 'match' ? 'extension' : 'join'} size={14} />
        {caption}
      </p>
      <p className="title-medium">{t.name}</p>
      <p className="label-large text-on-surface">{t.title}</p>
      <p className="mt-1 body-small text-on-surface-variant">{t.line}</p>
    </div>
  );
}

function PieceResultScreen({ code, onContinue, onRetry, continueLabel = '이 조각으로 팀 맞추기' }: { code: PieceCode; onContinue: () => void; onRetry: () => void; continueLabel?: string }) {
  const t = PIECE_TYPES[code];
  const match = perfectMatch(code);
  const [shared, setShared] = useState<string | null>(null);
  const share = async () => {
    const text = `On-do에서 내 조각이 나왔어요: ${t.name} · ${t.title} — ${t.line}`;
    try {
      if (navigator.share) await navigator.share({ title: 'On-do 내 조각', text });
      else {
        await navigator.clipboard.writeText(text);
        setShared('복사했어요');
      }
    } catch {}
  };
  return (
    <div className="min-h-dvh overflow-x-clip bg-page">
      <main className="page-enter mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8">
        <p className="text-center title-medium text-primary">내 조각이 나왔어요!</p>
        <section className="mt-4 grid place-items-center rounded-m3-xl bg-surface px-5 py-8 text-center">
          <PuzzlePiece mode="fun" edges={edgesFromCode(code)} size={200} />
          <h1 className="mt-2 display-small">{t.name}</h1>
          <p className="mt-1 title-large text-on-surface">{t.title}</p>
          <p className="mt-2 body-large text-on-surface">“{t.line}”</p>
          <p className="mt-4 rounded-m3-lg bg-surface-container px-4 py-2 body-medium text-on-surface">조각 이름은 일하는 스타일을 부르는 별명이에요. 16가지가 있어요.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tagsOf(code).map((tag) => (
              <span key={tag} className="rounded-full bg-surface-container px-3 py-1 label-large text-on-surface">
                {tag}
              </span>
            ))}
          </div>
        </section>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MiniPiece code={match} caption="딱 맞물리는 짝" tone="match" />
          <MiniPiece code={code} caption="포개지는 쌍둥이" tone="twin" />
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 body-small text-on-surface-variant">
          {PIECE_TYPES[match].name}({PIECE_TYPES[match].title})과는 서로 반대라 빈 곳을 채워 줘요
          <InfoTip>설문 답으로 정한 협업 성향 조각이에요(심리검사 아님). 팀 추천도 같은 답을 바탕으로 해요.</InfoTip>
        </p>

        <div className="mt-auto space-y-2 pt-8">
          <Button size="lg" className="w-full" icon="arrow_forward" onClick={onContinue}>
            {continueLabel}
          </Button>
          <div className="flex gap-2">
            <Button variant="outlined" className="flex-1" icon="ios_share" onClick={share}>
              {shared ?? '자랑하기'}
            </Button>
            <Button variant="text" className="flex-1" icon="refresh" onClick={onRetry}>
              다시 답하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const setCurrentUser = useOndoStore((s) => s.setCurrentUser);
  const setJustOnboarded = useOndoStore((s) => s.setJustOnboarded);
  const setMyPiece = useOndoStore((s) => s.setMyPiece);

  // ① 내 조각 설문 → ② 결과 → CV(닉네임·전공·학년은 CV ‘기본 정보’에서)
  const [phase, setPhase] = useState<'piece' | 'result'>('piece');
  const [pieceStep, setPieceStep] = useState(0);
  // 프로필 ‘고치기’로 다시 들어오면(이미 프로필이 있음) 지난 답을 채워서 시작
  const existingUser = useOndoStore((s) => s.currentUser);
  const savedAnswers = useOndoStore((s) => s.surveyAnswers);
  const setSurveyAnswers = useOndoStore((s) => s.setSurveyAnswers);
  const hydrated = useHydrated();
  const retake = hydrated && !!existingUser;
  const [pieceAnswers, setPieceAnswers] = useState<PieceAnswers>(emptyPieceAnswers);
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (!hydrated || prefilled) return;
    if (existingUser && savedAnswers) setPieceAnswers(savedAnswers);
    setPrefilled(true);
  }, [hydrated, prefilled, existingUser, savedAnswers]);
  const pieceCode = codeFromAnswers(pieceAnswers);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase, pieceStep]);

  const finish = () => {
    // 27차원 전부 설문 답에서 (성격·갈등 포함). 참여 온도·주당 시간은 기본값 — 프로필에서 대회마다 바꿈
    const survey = featuresFromSurvey(pieceAnswers);
    const mode = survey.temperatureMode;
    const features27: Features27 = survey.features;
    let email = 'me@yonsei.ac.kr';
    try {
      email = sessionStorage.getItem('ondo_signup_email') ?? email;
    } catch {}
    const temp = TEMPERATURE_MODES.find((m) => m.id === mode)!;
    const user: UserProfile = {
      id: `me-${Math.random().toString(36).slice(2, 8)}`,
      // 닉네임·전공·학년은 CV ‘기본 정보’에서 입력 — 우선 조각 이름으로 시작
      nickname: PIECE_TYPES[pieceCode ?? 'IMGA'].name,
      email,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION,
      temperatureMode: mode,
      temperature: temp.temperature,
      features27,
      preferredRoles: survey.preferredRoles,
      hardConstraints: { weeklyHours: survey.weeklyHours, offlineAvailable: survey.offlineAvailable, nightWorkAvailable: survey.nightWorkAvailable },
      collabType: deriveCollabType(features27),
      strengths: survey.strengths,
      weaknesses: survey.weaknesses,
      dealBreakers: survey.dealBreakers,
      weeklyDropEnabled: true,
      cv: {
        realName: '',
        university: '연세대학교',
        major: '',
        grade: '',
        headline: '',
        experiences: [],
        skills: [],
        languages: [],
        aiTools: [],
        aiUsageNote: '',
        collaborationNote: '',
        source: 'manual',
      },
    };
    setSurveyAnswers(pieceAnswers);
    if (existingUser) {
      // 다시 답하기: CV·닉네임·이메일·참여 온도·알림 설정은 그대로 두고 설문에서 나온 값만 바꿈
      const { temperatureMode, temperature } = existingUser;
      setCurrentUser({
        ...existingUser,
        features27: { ...user.features27, ...goalFeaturesFor(temperatureMode) },
        preferredRoles: user.preferredRoles,
        hardConstraints: { ...existingUser.hardConstraints, offlineAvailable: user.hardConstraints.offlineAvailable, nightWorkAvailable: user.hardConstraints.nightWorkAvailable },
        strengths: user.strengths,
        weaknesses: user.weaknesses,
        dealBreakers: user.dealBreakers,
        temperatureMode,
        temperature,
      });
      router.push('/profile');
      return;
    }
    setCurrentUser(user);
    setJustOnboarded(true);
    router.push('/cv');
  };

  if (phase === 'piece') {
    return (
      <SectionScreen
        step={pieceStep}
        answers={pieceAnswers}
        onAnswer={(id, v) => setPieceAnswers((a) => ({ ...a, [id]: typeof v === 'function' ? v(a[id]) : v }))}
        onNext={() => {
          if (pieceStep < SURVEY_SECTIONS.length - 1) setPieceStep(pieceStep + 1);
          else if (pieceCode) {
            setMyPiece(pieceCode);
            setPhase('result');
          }
        }}
        onBack={() => (pieceStep === 0 ? router.push(retake ? '/profile' : '/') : setPieceStep(pieceStep - 1))}
      />
    );
  }

  if (phase === 'result' && pieceCode) {
    return (
      <PieceResultScreen
        code={pieceCode}
        onContinue={finish}
        continueLabel={retake ? '이 조각으로 저장' : undefined}
        onRetry={() => {
          setPieceAnswers(emptyPieceAnswers());
          setPieceStep(0);
          setPhase('piece');
        }}
      />
    );
  }

  return null;
}
