'use client';

// 소유: 규혁 — 2) `/onboarding` 2분 필수 온보딩 (+ 선택 심화)
// 구조(퍼즐 궁합 매트릭스 시안): ① ‘내 조각’ 4문항 — 한 화면 한 문항 · 2지선다 · 답할 때마다 조각 한 변 완성
//   → ② 결과 ‘내 조각이 나왔어요!’(16유형 · 딱 맞물리는 짝 · 포개지는 쌍둥이) → ③ 매칭 정보(아래 Step 1~4)
// Step 1~3 필수, Step 4(성격 5·갈등 5) 선택. 건너뛰면 10개 차원은 null.
// 끝나면 CV 작성으로 이어짐(프로필 = 퍼즐 + CV, 05 workflow) — CV는 건너뛸 수 있음.

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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
import { Button, Chip, cx, Icon, IconButton, InfoTip, LinearProgress, SegmentedButton, Switch, TextField } from '@/components/m3';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { useOndoStore } from '@/store/useOndoStore';
import {
  PIECE_QUESTIONS,
  PIECE_TYPES,
  type PieceAnswers,
  type PieceCode,
  codeFromAnswers,
  edgesFromAnswers,
  edgesFromCode,
  emptyPieceAnswers,
  optionHint,
  perfectMatch,
  quadrantOf,
  tagsOf,
} from '@/store/pieceTypes';

type Answers = Partial<Record<FeatureKey, number>>;

const STEP_TITLES = ['기본 정보', '목표 · AI · 일하는 방식', '역량과 퍼즐 카드', '조금 더 (선택)'];
const SKILL_KEYS: RoleId[] = ['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'];
const REQUIRED_LIKERT = SURVEY_QUESTIONS.required.flatMap((g) => g.items);
const OPTIONAL_LIKERT = SURVEY_QUESTIONS.optional.flatMap((g) => g.items);

function LikertRow({ q, value, onChange, index }: { q: SurveyQuestion; value: number | undefined; onChange: (v: number) => void; index: number }) {
  return (
    <div className="py-4">
      <p className="body-large text-on-surface">
        <span className="tabular mr-2 text-on-surface-variant">{index}</span>
        {q.text}
      </p>
      <div className="mt-3">
        <SegmentedButton ariaLabel={q.text} dense value={value ?? null} onChange={onChange} options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))} />
        <div className="mt-1 flex justify-between px-2 label-small text-on-surface-variant">
          <span>{LIKERT_LABELS[0]}</span>
          <span>{LIKERT_LABELS[4]}</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, tip, children }: { title: string; tip?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-m3-md bg-surface p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-1 title-large">
        {title}
        {tip && <InfoTip align="start">{tip}</InfoTip>}
      </h2>
      {children}
    </section>
  );
}

function PieceQuestionScreen({
  index,
  answers,
  onPick,
  onNext,
  onBack,
}: {
  index: number;
  answers: PieceAnswers;
  onPick: (letter: PieceAnswers[number]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const q = PIECE_QUESTIONS[index];
  const picked = answers[index];
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="mx-auto flex h-16 w-full max-w-xl items-center gap-3 px-4">
        <IconButton icon="arrow_back" label={index === 0 ? '나가기' : '이전 질문'} onClick={onBack} />
        <LinearProgress value={(index + (picked ? 1 : 0)) / PIECE_QUESTIONS.length} className="flex-1" />
        <span className="tabular label-large text-on-surface-variant">
          {index + 1}/{PIECE_QUESTIONS.length}
        </span>
      </header>
      <main key={index} className="page-enter mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6">
        <p className="mt-2 label-large text-primary">{q.ordinal}</p>
        <h1 className="mt-1 headline-medium">{q.question}</h1>

        <div className="mt-6 grid place-items-center rounded-m3-xl bg-surface py-6">
          <PuzzlePiece mode="fun" edges={edgesFromAnswers(answers)} size={176} />
          <p className="mt-1 body-small text-on-surface-variant">답할 때마다 조각이 한 변씩 완성돼요</p>
        </div>

        <div className="mt-4 space-y-3" role="radiogroup" aria-label={q.question}>
          {q.options.map((o) => {
            const sel = picked === o.letter;
            return (
              <button
                key={o.letter}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => onPick(o.letter)}
                className={cx(
                  'w-full rounded-m3-lg px-5 py-4 text-left transition-[background-color,box-shadow] duration-200',
                  sel ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_0_2px_var(--md-sys-color-secondary)]' : 'bg-surface hover:bg-surface-container',
                )}
              >
                <span className="block title-medium">{o.answer}</span>
                <span className="block body-small opacity-80">{optionHint(q, o)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8">
          <p className="mb-3 text-center body-small text-on-surface-variant">정답은 없어요. 반대여도, 똑같아도 다 맞물려요.</p>
          <Button size="lg" className="w-full" disabled={!picked} onClick={onNext}>
            {index === PIECE_QUESTIONS.length - 1 ? '내 조각 보기' : '다음 질문'}
          </Button>
        </div>
      </main>
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
    </div>
  );
}

function PieceResultScreen({ code, onContinue, onRetry }: { code: PieceCode; onContinue: () => void; onRetry: () => void }) {
  const t = PIECE_TYPES[code];
  const match = perfectMatch(code);
  const [shared, setShared] = useState<string | null>(null);
  const share = async () => {
    const text = `On-do에서 내 조각이 나왔어요: ${t.name} (${quadrantOf(code)} · ${code} ${t.title}) — ${t.line}`;
    try {
      if (navigator.share) await navigator.share({ title: 'On-do 내 조각', text });
      else {
        await navigator.clipboard.writeText(text);
        setShared('복사했어요');
      }
    } catch {}
  };
  return (
    <div className="min-h-dvh bg-page">
      <main className="page-enter mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8">
        <p className="text-center title-medium text-primary">내 조각이 나왔어요!</p>
        <section className="mt-4 grid place-items-center rounded-m3-xl bg-surface px-5 py-8 text-center">
          <PuzzlePiece mode="fun" edges={edgesFromCode(code)} size={200} />
          <h1 className="mt-2 display-small">{t.name}</h1>
          <p className="mt-2 rounded-full bg-surface-container px-4 py-1.5 label-large text-on-surface">
            {quadrantOf(code)} · {code} {t.title}
          </p>
          <p className="mt-3 body-large text-on-surface-variant">{t.line}</p>
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
          {PIECE_TYPES[match].name}과는 네 변이 전부 반대라 딱 맞물려요
          <InfoTip>4문항 답으로 정한 협업 성향 조각이에요(심리검사 아님). 실제 팀 추천은 다음 단계의 응답까지 함께 보고 정해요.</InfoTip>
        </p>

        <div className="mt-auto space-y-2 pt-8">
          <Button size="lg" className="w-full" icon="arrow_forward" onClick={onContinue}>
            이 조각으로 팀 맞추기
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

  // ① 내 조각 4문항 → ② 결과 → ③ 매칭 정보(Step 1~4)
  const [phase, setPhase] = useState<'piece' | 'result' | 'profile'>('piece');
  const [pieceStep, setPieceStep] = useState(0);
  const [pieceAnswers, setPieceAnswers] = useState<PieceAnswers>(emptyPieceAnswers);
  const pieceCode = codeFromAnswers(pieceAnswers);

  const [step, setStep] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  const [nickname, setNickname] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState<string>('');
  const [mode, setMode] = useState<TemperatureMode | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours | null>(null);
  const [offline, setOffline] = useState(true);
  const [night, setNight] = useState(false);
  const [roles, setRoles] = useState<RoleId[]>([]);

  const [answers, setAnswers] = useState<Answers>({});
  const [skills, setSkills] = useState<Partial<Record<RoleId, number>>>({});
  const [strengths, setStrengths] = useState<SkillCardId[]>([]);
  const [weaknesses, setWeaknesses] = useState<SkillCardId[]>([]);
  const [deals, setDeals] = useState<DealBreakerId[]>([]);
  const [deepOpen, setDeepOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, deepOpen, phase, pieceStep]);

  const toggle = <T,>(v: T, max: number, set: React.Dispatch<React.SetStateAction<T[]>>) =>
    set((list) => (list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list));

  const missing: string[] = useMemo(() => {
    if (step === 0) {
      const m: string[] = [];
      if (!nickname.trim()) m.push('닉네임');
      if (!major.trim()) m.push('전공');
      if (!mode) m.push('온도');
      if (!weeklyHours) m.push('주당 시간');
      if (roles.length === 0) m.push('희망 역할');
      return m;
    }
    if (step === 1) {
      const left = REQUIRED_LIKERT.filter((q) => answers[q.key] === undefined).length;
      return left ? [`${left}문항`] : [];
    }
    if (step === 2) {
      const m: string[] = [];
      const leftSkills = SKILL_KEYS.filter((k) => skills[k] === undefined).length;
      if (leftSkills) m.push(`역량 ${leftSkills}`);
      if (strengths.length < 2) m.push(`장점 ${2 - strengths.length}`);
      if (weaknesses.length < 2) m.push(`약점 ${2 - weaknesses.length}`);
      if (deals.length < 1) m.push('지뢰');
      return m;
    }
    return [];
  }, [step, nickname, major, mode, weeklyHours, roles, answers, skills, strengths, weaknesses, deals]);

  const answered = useMemo(() => {
    const req =
      [nickname.trim(), major.trim(), mode, weeklyHours, roles.length ? 1 : null].filter(Boolean).length +
      REQUIRED_LIKERT.filter((q) => answers[q.key] !== undefined).length +
      SKILL_KEYS.filter((k) => skills[k] !== undefined).length +
      (strengths.length === 2 ? 1 : 0) +
      (weaknesses.length === 2 ? 1 : 0) +
      (deals.length ? 1 : 0);
    return req / (5 + REQUIRED_LIKERT.length + 6 + 3);
  }, [nickname, major, mode, weeklyHours, roles, answers, skills, strengths, weaknesses, deals]);

  const finish = (withOptional: boolean) => {
    if (!mode || !weeklyHours) return;
    const val = (q: SurveyQuestion) => {
      const raw = answers[q.key];
      if (raw === undefined) return null;
      return q.reverse ? 6 - raw : raw;
    };
    const base = Object.fromEntries(REQUIRED_LIKERT.map((q) => [q.key, val(q)]));
    const optional = Object.fromEntries(
      OPTIONAL_FEATURE_KEYS.map((k) => {
        const q = OPTIONAL_LIKERT.find((x) => x.key === k)!;
        return [k, withOptional ? val(q) : null];
      }),
    );
    const features27 = { ...optional, ...base, ...skills } as unknown as Features27;
    let email = 'me@yonsei.ac.kr';
    try {
      email = sessionStorage.getItem('ondo_signup_email') ?? email;
    } catch {}
    const temp = TEMPERATURE_MODES.find((m) => m.id === mode)!;
    const user: UserProfile = {
      id: `me-${Math.random().toString(36).slice(2, 8)}`,
      nickname: nickname.trim(),
      email,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION,
      temperatureMode: mode,
      temperature: temp.temperature,
      features27,
      preferredRoles: roles,
      hardConstraints: { weeklyHours, offlineAvailable: offline, nightWorkAvailable: night },
      collabType: deriveCollabType(features27),
      strengths: [strengths[0], strengths[1]],
      weaknesses: [weaknesses[0], weaknesses[1]],
      dealBreakers: deals,
      weeklyDropEnabled: true,
      cv: {
        realName: '',
        university: '연세대학교',
        major: major.trim(),
        grade,
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
    setCurrentUser(user);
    setJustOnboarded(true);
    router.push('/cv');
  };

  if (phase === 'piece') {
    return (
      <PieceQuestionScreen
        index={pieceStep}
        answers={pieceAnswers}
        onPick={(letter) =>
          setPieceAnswers((a) => {
            const next = [...a] as PieceAnswers;
            next[pieceStep] = letter;
            return next;
          })
        }
        onNext={() => {
          if (pieceStep < PIECE_QUESTIONS.length - 1) setPieceStep(pieceStep + 1);
          else if (pieceCode) {
            setMyPiece(pieceCode);
            setPhase('result');
          }
        }}
        onBack={() => (pieceStep === 0 ? router.push('/') : setPieceStep(pieceStep - 1))}
      />
    );
  }

  if (phase === 'result' && pieceCode) {
    return (
      <PieceResultScreen
        code={pieceCode}
        onContinue={() => setPhase('profile')}
        onRetry={() => {
          setPieceAnswers(emptyPieceAnswers());
          setPieceStep(0);
          setPhase('piece');
        }}
      />
    );
  }

  const optionalLeft = OPTIONAL_LIKERT.filter((q) => answers[q.key] === undefined).length;
  const mm = String(Math.floor(elapsed / 60));
  const ss = String(elapsed % 60).padStart(2, '0');
  let qIndex = 0;

  return (
    <div className="min-h-dvh bg-page pb-32">
      <header className="sticky top-0 z-30 bg-page/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
          <IconButton
            icon="arrow_back"
            label={step === 0 ? '내 조각으로' : '이전'}
            onClick={() => (step === 0 ? setPhase('result') : deepOpen ? setDeepOpen(false) : setStep(step - 1))}
          />
          <div className="min-w-0">
            <p className="label-small text-on-surface-variant">매칭 정보 · {step + 1}/4</p>
            <h1 className="truncate title-large">{STEP_TITLES[step]}</h1>
          </div>
          <p className="tabular ml-auto rounded-full bg-surface px-3 py-1 label-large text-on-surface-variant shadow-[0_0_0_1px_var(--md-sys-color-outline-variant)]" aria-label="경과 시간">
            {mm}:{ss}
          </p>
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <LinearProgress value={step === 3 ? 1 : answered} />
        </div>
      </header>

      <main className="page-enter mx-auto max-w-3xl space-y-4 px-4 pt-6" key={`${step}-${deepOpen}`}>
        {step === 0 && (
          <>
            <Section title="나">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 12))} />
                <TextField label="전공" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="컴퓨터과학과" />
                <div className="grid gap-1.5 sm:col-span-2">
                  <span className="label-medium text-on-surface-variant">학년 (선택)</span>
                  <SegmentedButton ariaLabel="학년" value={grade || null} onChange={setGrade} options={['1', '2', '3', '4'].map((g) => ({ value: `${g}학년`, label: `${g}학년` }))} />
                </div>
              </div>
            </Section>

            <Section title="이번 대회, 몇 도로?" tip="언제든 프로필에서 바꿀 수 있어요. 바꾸면 퍼즐 모양도 바뀌어요.">
              <div className="grid gap-3 sm:grid-cols-3">
                {TEMPERATURE_MODES.map((t) => {
                  const sel = mode === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMode(t.id)}
                      aria-pressed={sel}
                      className="overflow-hidden rounded-m3-md bg-surface-container-low text-left transition-shadow duration-200"
                      style={sel ? { boxShadow: `0 0 0 2px var(--band-${t.id}-fg)` } : undefined}
                    >
                      <div className="flex items-start justify-between px-4 pb-3 pt-4" style={{ background: `var(--band-${t.id})`, color: `var(--band-${t.id}-fg)` }}>
                        <span className="tabular headline-medium">
                          {t.temperature}
                          <span className="text-[14px] align-top">°</span>
                        </span>
                        {sel ? <Icon name="check_circle" filled /> : <PuzzlePiece mode={t.id} edges={[-1, 1, -1, 1]} size={44} />}
                      </div>
                      <p className="px-4 py-3 title-small">{t.label}</p>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="여건">
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <span className="label-medium text-on-surface-variant">주당 시간</span>
                  <SegmentedButton
                    ariaLabel="주당 시간"
                    value={weeklyHours}
                    onChange={setWeeklyHours}
                    options={[
                      { value: '3-5h', label: '3~5시간' },
                      { value: '6-10h', label: '6~10시간' },
                      { value: '10h+', label: '10시간+' },
                    ]}
                  />
                </div>
                <div className="space-y-1 rounded-m3-md bg-surface-container-low p-1">
                  <label className="flex items-center gap-3 px-4 py-3">
                    <Icon name="apartment" className="text-on-surface-variant" />
                    <span className="flex-1 body-large">오프라인 가능</span>
                    <Switch checked={offline} onChange={setOffline} label="오프라인 가능" />
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3">
                    <Icon name="bedtime" className="text-on-surface-variant" />
                    <span className="flex-1 body-large">밤샘 가능</span>
                    <Switch checked={night} onChange={setNight} label="밤샘 가능" />
                  </label>
                </div>
                <div className="grid gap-2">
                  <span className="flex items-center gap-1 label-medium text-on-surface-variant">
                    맡고 싶은 역할 · 최대 2
                    <InfoTip align="start">잘하는 정도는 3단계에서 따로 물어봐요.</InfoTip>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <Chip key={r.id} label={r.label} selected={roles.includes(r.id)} onClick={() => toggle(r.id, 2, setRoles)} disabled={!roles.includes(r.id) && roles.length >= 2} />
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {step === 1 &&
          SURVEY_QUESTIONS.required.map((g, gi) => (
            <Section key={g.group} title={g.title} tip={gi === 0 ? '정답은 없어요. 지금 이 대회에 대한 생각에 가장 가까운 숫자를 고르세요.' : undefined}>
              <div className="-my-2 space-y-1">
                {g.items.map((q) => {
                  qIndex += 1;
                  return <LikertRow key={q.key} q={q} index={qIndex} value={answers[q.key]} onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))} />;
                })}
              </div>
            </Section>
          ))}

        {step === 2 && (
          <>
            <Section title="지금 할 수 있는 정도" tip="자기 평가예요. 0은 해 본 적 없음, 4는 팀을 이끌 수 있는 정도.">
              <div className="-my-1 space-y-1">
                {ROLES.map((r) => (
                  <div key={r.id} className="grid items-center gap-2 py-3 sm:grid-cols-[96px_1fr]">
                    <span className="title-small">{r.label}</span>
                    <SegmentedButton
                      ariaLabel={`${r.label} 숙련도`}
                      dense
                      value={skills[r.id] ?? null}
                      onChange={(v) => setSkills((sk) => ({ ...sk, [r.id]: v }))}
                      options={SKILL_LEVEL_LABELS.map((l, i) => ({
                        value: i,
                        label: (
                          <span>
                            <span className="tabular">{i}</span>
                            <span className="hidden md:inline"> {l}</span>
                          </span>
                        ),
                      }))}
                    />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="퍼즐 카드" tip="장점은 퍼즐의 돌기(凸), 약점은 홈(凹)이 돼요. 내 홈을 채워 줄 사람을 찾을 때 써요.">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 label-medium text-on-surface-variant">
                    凸 장점 <span className="tabular">{strengths.length}/2</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_CARDS.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.strength}
                        selected={strengths.includes(c.id)}
                        disabled={weaknesses.includes(c.id) || (!strengths.includes(c.id) && strengths.length >= 2)}
                        onClick={() => toggle(c.id, 2, setStrengths)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 label-medium text-on-surface-variant">
                    凹 약점 <span className="tabular">{weaknesses.length}/2</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_CARDS.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.weakness}
                        selected={weaknesses.includes(c.id)}
                        disabled={strengths.includes(c.id) || (!weaknesses.includes(c.id) && weaknesses.length >= 2)}
                        onClick={() => toggle(c.id, 2, setWeaknesses)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="이것만은 힘들어요 · 1~2" tip="협업 지뢰는 상대에게 그대로 보이지 않고, 충돌 가능성을 확인하는 데만 써요.">
              <div className="grid gap-2 sm:grid-cols-2">
                {DEAL_BREAKERS.map((d) => {
                  const sel = deals.includes(d.id);
                  const disabled = !sel && deals.length >= 2;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      disabled={disabled}
                      aria-pressed={sel}
                      title={d.detail}
                      onClick={() => toggle(d.id, 2, setDeals)}
                      className={cx(
                        'flex min-h-12 items-center gap-3 rounded-m3-md px-4 text-left transition-colors duration-200 disabled:opacity-40',
                        sel ? 'bg-error-container text-on-error-container' : 'bg-surface-container-low hover:bg-surface-container',
                      )}
                    >
                      <Icon name={sel ? 'check_circle' : 'radio_button_unchecked'} filled={sel} size={20} />
                      <span className="title-small">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          </>
        )}

        {step === 3 && !deepOpen && (
          <div className="rounded-m3-md bg-surface px-6 py-10 text-center">
            <p className="tabular display-small text-primary">
              {mm}:{ss}
            </p>
            <h2 className="mt-2 headline-small">필수는 끝났어요</h2>
            <p className="mt-2 flex items-center justify-center gap-1 body-medium text-on-surface-variant">
              성격·갈등 10문항을 더 답할까요?
              <InfoTip>더 답하면 팀원과의 차이를 조금 더 정확히 짚어요. 건너뛴 항목은 0점이 아니라 ‘미응답’으로 남고 점수에서 빠져요. 프로필에서 언제든 추가할 수 있어요.</InfoTip>
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button size="lg" variant="outlined" onClick={() => finish(false)}>
                건너뛰고 바로 퍼즐 보기
              </Button>
              <Button size="lg" icon="add" onClick={() => setDeepOpen(true)}>
                1분 더 답하고 정밀도 높이기
              </Button>
            </div>
          </div>
        )}

        {step === 3 &&
          deepOpen &&
          SURVEY_QUESTIONS.optional.map((g, gi) => (
            <Section key={g.group} title={g.title} tip={gi === 0 ? '검증 전 임시 문항이에요. 진단이 아니라 대화 주제를 찾는 데 써요.' : undefined}>
              <div className="-my-2 space-y-1">
                {g.items.map((q, i) => (
                  <LikertRow key={q.key} q={q} index={gi * 5 + i + 1} value={answers[q.key]} onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))} />
                ))}
              </div>
            </Section>
          ))}
      </main>

      {(step < 3 || deepOpen) && (
        <footer className="fixed inset-x-0 bottom-0 z-30 bg-surface shadow-[0_-1px_3px_rgba(32,33,36,.08)]">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
            <p className="min-w-0 flex-1 truncate body-medium text-on-surface-variant">
              {step === 3 ? (optionalLeft ? `${optionalLeft}문항 남음` : '모두 답했어요') : missing.length ? `남음 · ${missing.join(', ')}` : ''}
            </p>
            {step < 3 ? (
              <Button icon="arrow_forward" disabled={missing.length > 0} onClick={() => setStep(step + 1)}>
                다음
              </Button>
            ) : (
              <Button icon="extension" onClick={() => finish(true)}>
                퍼즐 완성하기
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
