'use client';

// 소유: 규혁 — 2) `/onboarding` 2분 필수 온보딩 (+ 선택 심화)
// Step 1~3은 필수, Step 4(성격 5·갈등 5)는 선택. 건너뛰면 10개 차원은 null로 저장합니다.

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
import { Button, Chip, cx, Icon, IconButton, LinearProgress, SegmentedButton, Switch, TextField } from '@/components/m3';
import { PuzzlePiece } from '@/components/ondo/Puzzle';
import { useOndoStore } from '@/store/useOndoStore';

type Answers = Partial<Record<FeatureKey, number>>;

const STEP_TITLES = ['기본 정보와 참여 온도', '목표 · AI · 일하는 방식', '역량과 퍼즐 카드', '조금 더 알려 주기 (선택)'];
const SKILL_KEYS: RoleId[] = ['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'];
const REQUIRED_LIKERT = SURVEY_QUESTIONS.required.flatMap((g) => g.items);
const OPTIONAL_LIKERT = SURVEY_QUESTIONS.optional.flatMap((g) => g.items);

function LikertRow({ q, value, onChange, index }: { q: SurveyQuestion; value: number | undefined; onChange: (v: number) => void; index: number }) {
  return (
    <div className="py-5">
      <p className="body-large text-on-surface">
        <span className="tabular mr-2 text-on-surface-variant">{String(index).padStart(2, '0')}</span>
        {q.text}
      </p>
      <div className="mt-3">
        <SegmentedButton
          ariaLabel={q.text}
          dense
          value={value ?? null}
          onChange={onChange}
          options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))}
        />
        <div className="mt-1.5 flex justify-between px-1 body-small text-on-surface-variant">
          <span>{LIKERT_LABELS[0]}</span>
          <span>{LIKERT_LABELS[4]}</span>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const setCurrentUser = useOndoStore((s) => s.setCurrentUser);

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
  }, [step, deepOpen]);

  const toggle = <T,>(_list: T[], v: T, max: number, set: React.Dispatch<React.SetStateAction<T[]>>) =>
    set((list) => (list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list));

  const missing: string[] = useMemo(() => {
    if (step === 0) {
      const m: string[] = [];
      if (!nickname.trim()) m.push('닉네임');
      if (!major.trim()) m.push('전공');
      if (!mode) m.push('참여 온도');
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
      if (leftSkills) m.push(`역량 ${leftSkills}개`);
      if (strengths.length < 2) m.push(`장점 ${2 - strengths.length}장`);
      if (weaknesses.length < 2) m.push(`약점 ${2 - weaknesses.length}장`);
      if (deals.length < 1) m.push('협업 지뢰');
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
    router.push('/profile');
  };

  const optionalLeft = OPTIONAL_LIKERT.filter((q) => answers[q.key] === undefined).length;
  const mm = String(Math.floor(elapsed / 60)).padStart(1, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  let qIndex = 0;

  return (
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
          <IconButton
            icon={step === 0 ? 'close' : 'arrow_back'}
            label={step === 0 ? '나가기' : '이전 단계'}
            onClick={() => (step === 0 ? router.push('/') : deepOpen ? setDeepOpen(false) : setStep(step - 1))}
          />
          <div className="min-w-0">
            <p className="label-medium text-on-surface-variant">
              {step + 1} / 4 단계 {step < 3 ? '· 필수' : '· 선택'}
            </p>
            <h1 className="title-medium truncate">{STEP_TITLES[step]}</h1>
          </div>
          <p className="tabular ml-auto rounded-full bg-surface-container px-3 py-1 label-large text-on-surface-variant" aria-label="경과 시간">
            {mm}:{ss}
          </p>
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <LinearProgress value={step === 3 ? 1 : answered} />
        </div>
      </header>

      <main className="enter mx-auto max-w-3xl px-4 pt-8" key={`${step}-${deepOpen}`}>
        {step === 0 && (
          <div className="space-y-10">
            <section className="grid gap-4 sm:grid-cols-2">
              <TextField label="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 12))} supporting="팀이 확정되기 전까지는 닉네임만 보여요." />
              <TextField label="전공" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="예: 컴퓨터과학과" />
              <div className="sm:col-span-2">
                <p className="mb-2 label-large text-on-surface-variant">학년 (선택)</p>
                <SegmentedButton ariaLabel="학년" value={grade || null} onChange={setGrade} options={['1학년', '2학년', '3학년', '4학년', '졸업 예정'].map((g) => ({ value: g, label: g }))} />
              </div>
            </section>

            <section>
              <h2 className="title-large">이번 대회, 몇 도로 할까요?</h2>
              <p className="mt-1 body-medium text-on-surface-variant">언제든 프로필에서 바꿀 수 있어요. 바꾸면 퍼즐 모양도 같이 바뀌어요.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {TEMPERATURE_MODES.map((t) => {
                  const sel = mode === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMode(t.id)}
                      aria-pressed={sel}
                      className={cx(
                        'state-layer flex flex-col items-start rounded-m3-lg p-4 text-left transition-colors',
                        sel ? 'bg-secondary-container text-on-secondary-container ring-2 ring-primary' : 'border border-outline-variant',
                      )}
                    >
                      <div className="flex w-full items-start justify-between">
                        <span className="tabular headline-medium">
                          {t.temperature}
                          <span className="title-medium align-top">°</span>
                        </span>
                        <PuzzlePiece mode={t.id} size={56} />
                      </div>
                      <span className="mt-2 title-small">{t.label}</span>
                      <span className="mt-1 body-small text-on-surface-variant">{t.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-6">
              <div>
                <h2 className="mb-3 title-medium">일주일에 쓸 수 있는 시간</h2>
                <SegmentedButton
                  ariaLabel="주당 시간"
                  value={weeklyHours}
                  onChange={setWeeklyHours}
                  options={[
                    { value: '3-5h', label: '3~5시간' },
                    { value: '6-10h', label: '6~10시간' },
                    { value: '10h+', label: '10시간 이상' },
                  ]}
                />
              </div>
              <div className="divide-y divide-outline-variant rounded-m3-lg border border-outline-variant">
                <label className="flex items-center gap-4 px-4 py-3">
                  <Icon name="apartment" className="text-on-surface-variant" />
                  <span className="flex-1">
                    <span className="block body-large">오프라인 모임 가능</span>
                    <span className="block body-small text-on-surface-variant">현장 해커톤은 오프라인 가능한 사람끼리만 묶어요.</span>
                  </span>
                  <Switch checked={offline} onChange={setOffline} label="오프라인 모임 가능" />
                </label>
                <label className="flex items-center gap-4 px-4 py-3">
                  <Icon name="bedtime" className="text-on-surface-variant" />
                  <span className="flex-1">
                    <span className="block body-large">밤샘 작업 가능</span>
                    <span className="block body-small text-on-surface-variant">켜 두면 밤샘이 가능한 팀원 위주로 찾아요.</span>
                  </span>
                  <Switch checked={night} onChange={setNight} label="밤샘 작업 가능" />
                </label>
              </div>
              <div>
                <h2 className="title-medium">맡고 싶은 역할 (최대 2개)</h2>
                <p className="mt-1 body-small text-on-surface-variant">잘하는 정도는 3단계에서 따로 물어봐요.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <Chip key={r.id} label={r.label} selected={roles.includes(r.id)} onClick={() => toggle(roles, r.id, 2, setRoles)} disabled={!roles.includes(r.id) && roles.length >= 2} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <p className="body-medium text-on-surface-variant">정답은 없어요. 지금 이 대회에 대한 생각에 가장 가까운 숫자를 고르세요.</p>
            {SURVEY_QUESTIONS.required.map((g) => (
              <section key={g.group}>
                <h2 className="title-large">{g.title}</h2>
                <div className="divide-y divide-outline-variant">
                  {g.items.map((q) => {
                    qIndex += 1;
                    return <LikertRow key={q.key} q={q} index={qIndex} value={answers[q.key]} onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))} />;
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <section>
              <h2 className="title-large">지금 할 수 있는 정도</h2>
              <p className="mt-1 body-medium text-on-surface-variant">자기 평가예요. 0은 해 본 적 없음, 4는 팀을 이끌 수 있는 정도.</p>
              <div className="mt-4 divide-y divide-outline-variant">
                {ROLES.map((r) => (
                  <div key={r.id} className="grid items-center gap-2 py-3 sm:grid-cols-[120px_1fr]">
                    <span className="title-small">{r.label}</span>
                    <SegmentedButton
                      ariaLabel={`${r.label} 숙련도`}
                      dense
                      value={skills[r.id] ?? null}
                      onChange={(v) => setSkills((sk) => ({ ...sk, [r.id]: v }))}
                      options={SKILL_LEVEL_LABELS.map((l, i) => ({ value: i, label: <span><span className="tabular">{i}</span><span className="hidden sm:inline"> {l}</span></span> }))}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="title-large">퍼즐 카드 고르기</h2>
              <p className="mt-1 body-medium text-on-surface-variant">장점은 퍼즐의 돌기(凸), 약점은 홈(凹)이 돼요. 내 홈을 채워 줄 사람을 찾을 때 써요.</p>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-3 title-small">
                    내가 채워 줄 수 있는 것 <span className="tabular text-on-surface-variant">{strengths.length}/2</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_CARDS.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.strength}
                        selected={strengths.includes(c.id)}
                        disabled={weaknesses.includes(c.id) || (!strengths.includes(c.id) && strengths.length >= 2)}
                        onClick={() => toggle(strengths, c.id, 2, setStrengths)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 title-small">
                    채워 줄 사람이 필요한 것 <span className="tabular text-on-surface-variant">{weaknesses.length}/2</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_CARDS.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.weakness}
                        selected={weaknesses.includes(c.id)}
                        disabled={strengths.includes(c.id) || (!weaknesses.includes(c.id) && weaknesses.length >= 2)}
                        onClick={() => toggle(weaknesses, c.id, 2, setWeaknesses)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="title-large">이것만은 힘들어요 (1~2개)</h2>
              <p className="mt-1 body-medium text-on-surface-variant">협업 지뢰는 상대에게 그대로 보이지 않고, 충돌 가능성을 확인하는 데만 써요.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {DEAL_BREAKERS.map((d) => {
                  const sel = deals.includes(d.id);
                  const disabled = !sel && deals.length >= 2;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      disabled={disabled}
                      aria-pressed={sel}
                      onClick={() => toggle(deals, d.id, 2, setDeals)}
                      className={cx(
                        'state-layer flex items-center gap-3 rounded-m3-md px-4 py-3 text-left transition-colors disabled:opacity-38',
                        sel ? 'bg-error-container text-on-error-container' : 'border border-outline-variant',
                      )}
                    >
                      <Icon name={sel ? 'check_circle' : 'radio_button_unchecked'} filled={sel} size={20} />
                      <span>
                        <span className="block title-small">{d.label}</span>
                        <span className="block body-small opacity-80">{d.detail}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {step === 3 && !deepOpen && (
          <div className="mx-auto max-w-xl py-6 text-center">
            <p className="tabular display-small text-primary">
              {mm}:{ss}
            </p>
            <h2 className="mt-3 headline-small">필수 단계는 끝났어요</h2>
            <p className="mt-3 body-large text-on-surface-variant">
              성격 5문항과 갈등 대응 5문항을 더 답하면 팀원과의 차이를 조금 더 정확히 짚을 수 있어요. 지금 건너뛰어도 매칭은 되고, 프로필에서 언제든 추가할 수 있어요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" variant="tonal" onClick={() => finish(false)}>
                건너뛰고 바로 퍼즐 보기
              </Button>
              <Button size="lg" icon="add" onClick={() => setDeepOpen(true)}>
                1분 더 답하고 정밀도 높이기
              </Button>
            </div>
            <p className="mt-6 body-small text-on-surface-variant">건너뛴 10개 항목은 0점이 아니라 ‘미응답’으로 남고, 점수 계산에서 빠져요.</p>
          </div>
        )}

        {step === 3 && deepOpen && (
          <div className="space-y-8">
            <p className="body-medium text-on-surface-variant">아래 문항은 검증 전 임시 문항이에요. 진단이 아니라 대화 주제를 찾는 데 써요.</p>
            {SURVEY_QUESTIONS.optional.map((g, gi) => (
              <section key={g.group}>
                <h2 className="title-large">{g.title}</h2>
                <div className="divide-y divide-outline-variant">
                  {g.items.map((q, i) => (
                    <LikertRow key={q.key} q={q} index={gi * 5 + i + 1} value={answers[q.key]} onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {(step < 3 || deepOpen) && (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface-container-low">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
            <p className="min-w-0 flex-1 truncate body-medium text-on-surface-variant">
              {step === 3
                ? optionalLeft
                  ? `${optionalLeft}문항 남음 · 답하지 않은 문항은 미응답으로 저장돼요`
                  : '모두 답했어요'
                : missing.length
                  ? `남은 항목: ${missing.join(', ')}`
                  : '다음으로 넘어갈 수 있어요'}
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
