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
import { PIECE_TYPES, dropLayout, edgesFromCode, nameI, perfectMatch, pieceOf, quadrantOf } from '@/store/pieceTypes';
import type { Contest, TeamCandidate } from '@/types/ondo';

/** 퍼즐 궁합 매트릭스 시안 4쪽 구조 — 금요일 팀 드롭: 2+2 퍼즐 · 점수 · 역할 나누기 · 만나볼래요 */
function TeamDropView({
  team,
  dropAt,
  meId,
  myPiece,
  onMeet,
}: {
  team: TeamCandidate;
  dropAt: Date;
  meId: string;
  myPiece: Parameters<typeof pieceOf>[2];
  onMeet: () => void;
}) {
  const codes = team.members.map((m) => pieceOf(m, meId, myPiece));
  const names = team.members.map((m) => PIECE_TYPES[codes[team.members.indexOf(m)]].name);
  const layout = dropLayout(codes, names);
  const cell = (slot: number) => {
    const i = layout.order[slot];
    const m = team.members[i];
    return (
      <div className="flex flex-col items-center">
        <PuzzlePiece mode={m.temperatureMode} edges={edgesFromCode(codes[i])} size={96} />
        <p className="title-small">
          {names[i]}
          {i === 0 && ' (나)'}
        </p>
        <p className="label-small text-on-surface-variant">{m.nickname}</p>
      </div>
    );
  };
  const link = (kind: 'across' | 'down', n: number) => (
    <span
      className={cx('grid size-9 place-items-center rounded-full label-large', kind === 'across' ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container')}
      aria-label={kind === 'across' ? `${n}변 맞물림` : `${n}변 포개짐`}
      title={kind === 'across' ? `${n}변 맞물림` : `${n}변 포개짐`}
    >
      {kind === 'across' ? '◆' : '○'}
    </span>
  );
  return (
    <div>
      <p className="inline-flex rounded-full bg-surface-container-highest px-3 py-1 label-medium text-on-surface-variant">
        금요일 밤 10시 · 이번 주 팀 드롭 ({dropAt.getMonth() + 1}/{dropAt.getDate()})
      </p>
      <h3 className="mt-2 headline-small text-on-surface">퍼즐이 완성됐어요!</h3>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-y-1 rounded-m3-xl bg-surface-container-low px-3 py-4">
        {cell(0)}
        {link('across', layout.across[0])}
        {cell(1)}
        <div className="flex justify-center">{link('down', layout.down[0])}</div>
        <span />
        <div className="flex justify-center">{link('down', layout.down[1])}</div>
        {cell(2)}
        {link('across', layout.across[1])}
        {cell(3)}
      </div>

      <p className="mt-4 flex items-baseline gap-2">
        <span className="tabular display-small text-primary">{Math.round(team.matchScore * 100)}</span>
        <span className="body-medium text-on-surface-variant">점 퍼즐 완성도 · 가장 잘 맞는 2 + 2 모양</span>
        <InfoTip align="end">임시 가중치로 낸 조합 지수를 100점으로 바꾼 값이에요. 정확도나 궁합 확률이 아니에요. ◆는 맞물리는 변, ○는 포개지는 변이에요.</InfoTip>
      </p>
      <p className="mt-3 rounded-m3-md bg-surface-container-low p-4 body-medium text-on-surface">{layout.note}</p>

      <Button size="lg" className="mt-5 w-full" onClick={onMeet}>
        만나볼래요
      </Button>
      <p className="mt-2 text-center body-small text-on-surface-variant">
        누가 먼저 눌렀는지는 보이지 않아요. 네 명 모두 수락하면 이름과 프로필이 열려요.
      </p>
    </div>
  );
}

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
  const myPiece = useOndoStore((s) => s.myPiece);
  const runMatching = useOndoStore((s) => s.runMatchingForContest);
  const unlockTeam = useOndoStore((s) => s.unlockTeam);

  const [deepOpen, setDeepOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Record<OptionalKey, number | null>>>({});
  const [snack, setSnack] = useState<string | null>(null);

  const dropPreview = useMemo(() => {
    if (!user || !previewOpen) return null;
    const contest: Contest = SEED_CONTESTS[0];
    const { teams } = recommendTeams(user, SEED_USERS, contest, runClusterAnalysis(user, SEED_USERS));
    return teams[0] ? { contest, team: teams[0] } : null;
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
          {myPiece && (
            <Card className="flex items-center gap-4 p-4">
              <PuzzlePiece mode={user.temperatureMode} edges={edgesFromCode(myPiece)} size={64} />
              <div className="min-w-0 flex-1">
                <p className="label-small text-on-surface-variant">내 조각</p>
                <p className="title-large">{PIECE_TYPES[myPiece].name}</p>
                <p className="truncate body-small text-on-surface-variant">
                  {quadrantOf(myPiece)} · {myPiece} {PIECE_TYPES[myPiece].title}
                </p>
              </div>
              <InfoTip align="end">딱 맞물리는 짝은 {PIECE_TYPES[perfectMatch(myPiece)].name}이에요. 4문항 답으로 정한 협업 성향 조각이에요(심리검사 아님).</InfoTip>
            </Card>
          )}
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

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title="이번 주 드롭 미리보기" wide>
        {dropPreview ? (
          <TeamDropView
            team={dropPreview.team}
            dropAt={dropAt}
            meId={user.id}
            myPiece={myPiece}
            onMeet={async () => {
              setPreviewOpen(false);
              await runMatching(dropPreview.contest.id);
              const t = useOndoStore.getState().recommendedTeams[0];
              if (!t) return;
              void unlockTeam(t.id);
              router.push(`/team/${t.id}`);
            }}
          />
        ) : (
          <p>계산 중…</p>
        )}
      </Dialog>

      <Snackbar message={snack} onDone={() => setSnack(null)} />
    </AppShell>
  );
}
