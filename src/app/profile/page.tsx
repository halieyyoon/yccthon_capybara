'use client';

// 소유: 규혁 — 3) `/profile` 내 퍼즐 프로필 (+ Weekly Drop)
// 프로필 = 퍼즐(27차원) + CV(5섹션). 두 축의 완성도를 함께 보여 줍니다.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Features27 } from '@/types/ondo';
import { DEAL_BREAKER_BY_ID, FEATURE_META_27, LIKERT_LABELS, SURVEY_QUESTIONS, TEMPERATURE_BY_ID } from '@/data/constants';
import { SEED_USERS } from '@/data/seedUsers';
import { SEED_CONTESTS } from '@/data/seedContests';
import { recommendTeams, runClusterAnalysis } from '@/lib/matching/clusterEngine';
import { Button, Card, cx, Dialog, Icon, IconButton, InfoTip, SegmentedButton, Snackbar, Switch } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/AppShell';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { PuzzleProfileCard } from '@/components/PuzzleProfileCard';
import { cvFilledSections } from '@/store/profileProgress';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';

type OptionalKey = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'emotional_stability' | 'integrating' | 'obliging' | 'dominating' | 'avoiding' | 'compromising';

function nextFridayDrop(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
  d.setHours(22, 0, 0, 0);
  if (d <= from) d.setDate(d.getDate() + 7);
  return d;
}

function Ring({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="relative grid size-14 shrink-0 place-items-center" aria-label={`${label} ${value}/${max}`}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--md-sys-color-secondary-container)" strokeWidth="4" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(value / max) * 97.4} 97.4`} />
      </svg>
      <span className="tabular label-large">{value}</span>
    </div>
  );
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

  const dropPreview = useMemo(() => {
    if (!user || !previewOpen) return null;
    const contest = SEED_CONTESTS.find((c) => c.scale === 'large')!;
    const { teams } = recommendTeams(user, SEED_USERS, contest, runClusterAnalysis(user, SEED_USERS));
    return teams[0] ?? null;
  }, [user, previewOpen]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;

  const answered = FEATURE_META_27.filter((m) => user.features27[m.key] !== null).length;
  const cvDone = cvFilledSections(user.cv);
  const dropAt = nextFridayDrop();

  const openDeep = () => {
    const init: Partial<Record<OptionalKey, number | null>> = {};
    for (const g of SURVEY_QUESTIONS.optional) for (const q of g.items) init[q.key as OptionalKey] = user.features27[q.key] as number | null;
    setDraft(init);
    setDeepOpen(true);
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
      <div className="grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <PuzzleProfileCard
          profile={user}
          onModeChange={(m) => {
            updateTemperatureMode(m);
            setSnack(`${TEMPERATURE_BY_ID[m].temperature}°로 바꿨어요`);
          }}
        />

        <aside className="space-y-4">
          <Card className="space-y-1 p-1">
            <div className="flex items-center gap-4 p-4">
              <Ring value={answered} max={27} label="퍼즐 응답" />
              <p className="flex min-w-0 flex-1 items-center gap-1 title-medium">
                퍼즐 {answered}/27
                <InfoTip align="start">비어 있는 성격·갈등 항목은 0점이 아니라 점수 계산에서 빠져요.</InfoTip>
              </p>
              <Button variant={answered < 27 ? 'tonal' : 'text'} onClick={openDeep}>
                {answered < 27 ? '채우기' : '고치기'}
              </Button>
            </div>
            <Link href="/cv" className="state-layer flex items-center gap-4 p-4">
              <Ring value={cvDone} max={5} label="CV 섹션" />
              <p className="flex min-w-0 flex-1 items-center gap-1 title-medium">
                CV {cvDone}/5
                <InfoTip align="start">팀이 확정되고 서로 수락하면 팀원에게 열려요.</InfoTip>
              </p>
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </Link>
          </Card>

          <Link href="/match" className="state-layer flex items-center gap-4 rounded-m3-md bg-primary-container p-5 text-on-primary-container">
            <Icon name="groups" />
            <span className="flex-1 title-medium">공모전 팀 찾기</span>
            <Icon name="arrow_forward" />
          </Link>

          <Card variant="filled" className="p-4">
            <div className="flex items-center gap-3">
              <Icon name="event_upcoming" className="text-primary" />
              <p className="flex flex-1 items-center gap-1 title-medium">
                Weekly Drop
                <InfoTip align="start">매주 금요일 밤 10시, 이번 주에 맞물리는 팀 후보를 한 번에 알려 드려요.</InfoTip>
              </p>
              <Switch
                checked={user.weeklyDropEnabled}
                onChange={(v) => {
                  setWeeklyDrop(v);
                  setSnack(v ? '드롭 알림 켬' : '드롭 알림 끔');
                }}
                label="Weekly Drop 알림"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="tabular body-medium text-on-surface-variant">
                다음 {dropAt.getMonth() + 1}/{dropAt.getDate()}(금) 22:00
              </p>
              <Button variant="text" icon="visibility" onClick={() => setPreviewOpen(true)}>
                이번 주 드롭 미리보기
              </Button>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="flex items-center gap-1 label-medium text-on-surface-variant">
              협업 지뢰
              <InfoTip align="start">상대에게는 보이지 않아요.</InfoTip>
            </span>
            {user.dealBreakers.map((d) => (
              <span key={d} className="rounded-m3-sm bg-error-container px-2.5 py-1 label-medium text-on-error-container">
                {DEAL_BREAKER_BY_ID[d].label}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <Dialog
        open={deepOpen}
        onClose={() => setDeepOpen(false)}
        title="성격 · 갈등"
        wide
        actions={
          <>
            <Button variant="text" onClick={() => setDeepOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                updateOptionalFeatures(draft as Partial<Pick<Features27, OptionalKey>>);
                setDeepOpen(false);
                setSnack('저장했어요');
              }}
            >
              저장
            </Button>
          </>
        }
      >
        <p className="flex items-center justify-between label-medium">
          <span>1 {LIKERT_LABELS[0]}</span>
          <InfoTip>검증 전 임시 문항이에요. 진단이 아니라 대화 주제를 찾는 데 써요. 답하지 않은 문항은 미응답으로 남아요.</InfoTip>
          <span>5 {LIKERT_LABELS[4]}</span>
        </p>
        {SURVEY_QUESTIONS.optional.map((g) => (
          <section key={g.group} className="mt-5">
            <h3 className="title-medium text-on-surface">{g.title}</h3>
            <div className="space-y-1">
              {g.items.map((q) => {
                const k = q.key as OptionalKey;
                return (
                  <div key={k} className="py-3">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title="딱 맞는 퍼즐 조각 4개가 모였어요" icon="event_upcoming" wide>
        {dropPreview ? (
          <div>
            <p className="tabular label-medium">
              On-do · {dropAt.getMonth() + 1}/{dropAt.getDate()}(금) 22:00
            </p>
            <ul className="mt-3 space-y-2">
              {dropPreview.members.slice(1).map((m) => (
                <li key={m.id} className={cx('flex items-center gap-3 rounded-m3-md bg-surface-container p-2.5')}>
                  <PuzzlePiece mode={m.temperatureMode} edges={[-1, 1, -1, 1]} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="title-small text-on-surface">{m.nickname}</p>
                    <p className="body-small">
                      {m.cv.major} · {TEMPERATURE_BY_ID[m.temperatureMode].temperature}° · {m.collabType}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {dropPreview.evidenceTags.map((t) => (
                <span key={t} className="rounded-m3-xs bg-secondary-container px-2 py-0.5 label-small text-on-secondary-container">
                  {t}
                </span>
              ))}
            </p>
            <p className="mt-3 flex items-center gap-1 body-small">
              AI 아바타 모의회의를 확인해 보세요
              <InfoTip align="start">누가 먼저 관심을 보냈는지는 서로 보이지 않고, 거절 알림도 가지 않아요.</InfoTip>
            </p>
          </div>
        ) : (
          <p>계산 중…</p>
        )}
      </Dialog>

      <Snackbar message={snack} onDone={() => setSnack(null)} />
    </AppShell>
  );
}
