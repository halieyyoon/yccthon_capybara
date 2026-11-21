'use client';

// 소유: 규혁 — 3) `/profile` 내 퍼즐 프로필 (+ Weekly Drop)

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Features27, TemperatureMode } from '@/types/ondo';
import {
  DEAL_BREAKER_BY_ID,
  FEATURE_GROUP_LABEL,
  FEATURE_META_27,
  LIKERT_LABELS,
  ROLE_LABEL,
  SURVEY_QUESTIONS,
  TEMPERATURE_BY_ID,
  TEMPERATURE_MODES,
} from '@/data/constants';
import { SEED_USERS } from '@/data/seedUsers';
import { SEED_CONTESTS } from '@/data/seedContests';
import { recommendTeams, runClusterAnalysis } from '@/lib/matching/clusterEngine';
import { Button, Card, cx, Dialog, Icon, IconButton, Monogram, SegmentedButton, Snackbar, Switch } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/ondo/AppShell';
import { PuzzlePiece, PuzzleProfileCard } from '@/components/ondo/Puzzle';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';

type OptionalKey = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'emotional_stability' | 'integrating' | 'obliging' | 'dominating' | 'avoiding' | 'compromising';

function nextFridayDrop(from = new Date()): Date {
  const d = new Date(from);
  const add = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  d.setHours(22, 0, 0, 0);
  if (d <= from) d.setDate(d.getDate() + 7);
  return d;
}

export default function ProfilePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const user = useOndoStore((s) => s.currentUser);
  const updateTemperatureMode = useOndoStore((s) => s.updateTemperatureMode);
  const updateOptionalFeatures = useOndoStore((s) => s.updateOptionalFeatures);
  const setWeeklyDrop = useOndoStore((s) => s.setWeeklyDrop);
  const previewOpen = useOndoStore((s) => s.weeklyDropPreviewOpen);
  const setPreviewOpen = useOndoStore((s) => s.setWeeklyDropPreviewOpen);
  const resetAll = useOndoStore((s) => s.resetAll);

  const [deepOpen, setDeepOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Record<OptionalKey, number | null>>>({});
  const [snack, setSnack] = useState<string | null>(null);

  const answeredCount = user ? FEATURE_META_27.filter((m) => user.features27[m.key] !== null).length : 0;

  const dropPreview = useMemo(() => {
    if (!user || !previewOpen) return null;
    const contest = SEED_CONTESTS.find((c) => c.scale === 'large')!;
    const points = runClusterAnalysis(user, SEED_USERS);
    const { teams } = recommendTeams(user, SEED_USERS, contest, points);
    return { contest, team: teams[0] };
  }, [user, previewOpen]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;

  const temp = TEMPERATURE_BY_ID[user.temperatureMode];
  const x = user.features27;
  const optionalGroups = SURVEY_QUESTIONS.optional;
  const dropAt = nextFridayDrop();

  const openDeep = () => {
    const init: Partial<Record<OptionalKey, number | null>> = {};
    for (const g of optionalGroups) for (const q of g.items) init[q.key as OptionalKey] = x[q.key] as number | null;
    setDraft(init);
    setDeepOpen(true);
  };

  const saveDeep = () => {
    updateOptionalFeatures(draft as Partial<Pick<Features27, OptionalKey>>);
    setDeepOpen(false);
    setSnack('저장했어요. 다음 매칭부터 반영돼요.');
  };

  return (
    <AppShell
      actions={
        <IconButton
          icon="logout"
          label="처음부터 다시"
          onClick={() => {
            resetAll();
            router.push('/');
          }}
        />
      }
    >
      <div className="grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <p className="label-large text-on-surface-variant">지금 내 온도</p>
            <div className="mt-3 max-w-xl">
              <SegmentedButton<TemperatureMode>
                ariaLabel="참여 온도"
                value={user.temperatureMode}
                onChange={(m) => {
                  updateTemperatureMode(m);
                  setSnack(`${TEMPERATURE_BY_ID[m].temperature}°로 바꿨어요. 퍼즐 모양도 바뀌었어요.`);
                }}
                options={TEMPERATURE_MODES.map((t) => ({ value: t.id, label: <span className="tabular">{t.temperature}°<span className="hidden sm:inline"> {t.short}</span></span> }))}
              />
            </div>
          </div>

          <PuzzleProfileCard
            nickname={user.nickname}
            mode={user.temperatureMode}
            collabType={user.collabType}
            strengths={user.strengths}
            weaknesses={user.weaknesses}
            subtitle={`${user.cv.major}${user.cv.grade ? ` ${user.cv.grade}` : ''} · ${user.preferredRoles.map((r) => ROLE_LABEL[r]).join(', ')} 희망`}
          />

          <Card variant="outlined" className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative grid size-14 place-items-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--md-sys-color-secondary-container)" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(answeredCount / 27) * 97.4} 97.4`} />
                </svg>
                <span className="tabular label-large">{answeredCount}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="title-medium">{answeredCount}/27 응답 완료</p>
                <p className="body-medium text-on-surface-variant">
                  {answeredCount < 27 ? '성격·갈등 응답이 비어 있어요. 비어 있는 항목은 0점이 아니라 계산에서 빠져요.' : '모든 항목에 답했어요. 언제든 고칠 수 있어요.'}
                </p>
              </div>
              <Button variant={answeredCount < 27 ? 'tonal' : 'text'} icon={answeredCount < 27 ? 'add' : 'edit'} onClick={openDeep}>
                {answeredCount < 27 ? '성격·갈등 추가하기' : '응답 고치기'}
              </Button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(['goal', 'ai', 'work', 'skill', 'personality', 'conflict'] as const).map((g) => {
                const metas = FEATURE_META_27.filter((m) => m.group === g);
                const done = metas.filter((m) => x[m.key] !== null).length;
                return (
                  <div key={g} className={cx('rounded-m3-sm px-3 py-2', done === metas.length ? 'bg-surface-container' : 'border border-dashed border-outline')}>
                    <p className="label-small text-on-surface-variant">{FEATURE_GROUP_LABEL[g]}</p>
                    <p className="tabular title-small">
                      {done}/{metas.length}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card variant="filled" className="p-5">
            <p className="label-large text-on-surface-variant">{temp.temperature}°를 고른 사람들의 보통 기대치와 내 응답</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['winning_orientation', '수상 우선'],
                  ['learning_priority', '학습 우선'],
                ] as const
              ).map(([k, label]) => {
                const ref = temp.goalReference[k];
                const mine = x[k];
                return (
                  <div key={k}>
                    <div className="flex items-baseline justify-between">
                      <span className="title-small">{label}</span>
                      <span className="tabular body-small text-on-surface-variant">
                        참고 {ref} · 내 응답 <b className="text-on-surface">{mine}</b>
                      </span>
                    </div>
                    <div className="relative mt-2 h-2 rounded-full bg-surface-container-lowest">
                      <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded bg-outline" style={{ left: `${((ref - 1) / 4) * 100}%` }} />
                      <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-[left] duration-500 ease-m3" style={{ left: `${((mine - 1) / 4) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 body-small text-on-surface-variant">온도를 바꿔도 내 응답은 그대로예요. 차이가 크면 온보딩 응답을 다시 확인해 보세요.</p>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card variant="filled" className="p-5">
            <div className="flex items-start gap-4">
              <Icon name="event_upcoming" className="mt-0.5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="title-medium">Weekly Drop</p>
                <p className="mt-1 body-medium text-on-surface-variant">매주 금요일 밤 10시, 이번 주에 맞물리는 팀 후보를 한 번에 알려 드려요. 따로 신청할 필요 없어요.</p>
              </div>
              <Switch checked={user.weeklyDropEnabled} onChange={(v) => { setWeeklyDrop(v); setSnack(v ? '금요일 밤 10시 드롭 알림을 켰어요.' : '드롭 알림을 껐어요.'); }} label="Weekly Drop 알림" />
            </div>
            <div className="mt-4 rounded-m3-md bg-surface px-4 py-3">
              <p className="label-medium text-on-surface-variant">다음 드롭</p>
              <p className="tabular title-medium">
                {dropAt.getMonth() + 1}월 {dropAt.getDate()}일 (금) 밤 10:00
              </p>
            </div>
            <Button variant="text" icon="visibility" className="mt-2 -ml-3" onClick={() => setPreviewOpen(true)}>
              이번 주 드롭 미리보기
            </Button>
          </Card>

          <Link href="/cv" className="state-layer flex items-center gap-4 rounded-m3-md border border-outline-variant p-5">
            <Icon name="description" className="text-primary" />
            <span className="flex-1">
              <span className="block title-medium">내 CV 템플릿</span>
              <span className="block body-small text-on-surface-variant">{user.cv.realName ? `${user.cv.experiences.length}개 경험 작성됨` : '링크드인 PDF로 1분 만에 채우기'}</span>
            </span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </Link>
          <Link href="/match" className="state-layer flex items-center gap-4 rounded-m3-md bg-primary p-5 text-on-primary">
            <Icon name="groups" />
            <span className="flex-1">
              <span className="block title-medium">공모전 팀 찾기</span>
              <span className="block body-small opacity-85">대회를 고르면 바로 4인 조합을 찾아요</span>
            </span>
            <Icon name="arrow_forward" />
          </Link>

          <Card variant="outlined" className="p-5">
            <p className="label-large text-on-surface-variant">협업 지뢰 (상대에게는 보이지 않아요)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.dealBreakers.map((d) => (
                <span key={d} className="rounded-m3-sm bg-error-container px-3 py-1.5 label-large text-on-error-container">
                  {DEAL_BREAKER_BY_ID[d].label}
                </span>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <Dialog
        open={deepOpen}
        onClose={() => setDeepOpen(false)}
        title="성격 · 갈등 응답"
        wide
        actions={
          <>
            <Button variant="text" onClick={() => setDeepOpen(false)}>
              취소
            </Button>
            <Button onClick={saveDeep}>저장</Button>
          </>
        }
      >
        <p className="body-medium">검증 전 임시 문항이에요. 진단이 아니라 팀원과 미리 이야기할 거리를 찾는 데 써요. 답하지 않은 문항은 미응답으로 남아요.</p>
        {optionalGroups.map((g) => (
          <section key={g.group} className="mt-6">
            <h3 className="title-medium text-on-surface">{g.title}</h3>
            <div className="mt-2 divide-y divide-outline-variant">
              {g.items.map((q) => {
                const k = q.key as OptionalKey;
                return (
                  <div key={k} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="body-medium text-on-surface">{q.text}</p>
                      {draft[k] != null && (
                        <button type="button" className="shrink-0 label-medium text-primary" onClick={() => setDraft((d) => ({ ...d, [k]: null }))}>
                          비우기
                        </button>
                      )}
                    </div>
                    <div className="mt-2">
                      <SegmentedButton ariaLabel={q.text} dense value={draft[k] ?? null} onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))} options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))} />
                      <div className="mt-1 flex justify-between px-1 body-small">
                        <span>{LIKERT_LABELS[0]}</span>
                        <span>{LIKERT_LABELS[4]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title="이번 주 금요일 드롭 미리보기" icon="event_upcoming" wide>
        {dropPreview?.team ? (
          <div>
            <p className="body-medium">
              {dropAt.getMonth() + 1}월 {dropAt.getDate()}일 밤 10시에 아래와 같은 알림이 가요. 예시 대회: <b className="text-on-surface">{dropPreview.contest.title}</b>
            </p>
            <div className="mt-4 rounded-m3-lg bg-surface-container p-4">
              <p className="label-medium text-on-surface-variant">On-do · 금요일 드롭</p>
              <p className="mt-1 title-medium text-on-surface">이번 주 맞물리는 후보 3명이 도착했어요</p>
              <ul className="mt-4 space-y-3">
                {dropPreview.team.members.slice(1).map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <PuzzlePiece mode={m.temperatureMode} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="title-small text-on-surface">{m.nickname}</p>
                      <p className="body-small text-on-surface-variant">
                        {m.cv.major} · {TEMPERATURE_BY_ID[m.temperatureMode].temperature}° · {m.collabType}
                      </p>
                    </div>
                    <Monogram name={m.nickname} size={28} tone="secondary" />
                  </li>
                ))}
              </ul>
              <p className="mt-4 body-small text-on-surface-variant">
                응답 근거: {dropPreview.team.evidenceTags.join(' · ')}
              </p>
            </div>
            <p className="mt-4 body-small">누가 먼저 관심을 보냈는지는 서로에게 보이지 않아요. 거절 알림도 가지 않아요.</p>
          </div>
        ) : (
          <p>후보를 계산하는 중이에요.</p>
        )}
      </Dialog>

      <Snackbar message={snack} onDone={() => setSnack(null)} />
    </AppShell>
  );
}
