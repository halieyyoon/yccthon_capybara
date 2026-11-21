'use client';

// 소유: 규혁 — 5) `/match` 공모전 선택 & 1·2단계 매칭
// 상태 흐름(05 workflow): CLUSTERED → AVATAR_DONE → (PILOT_ACTIVE) → WAITING_CONSENT → UNLOCKED, 넘기기·미성사 → EXPIRED

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Contest, TeamCandidate } from '@/types/ondo';
import { COMPATIBILITY_MATRIX_16X16, COMPAT_LEVEL_META, ROLE_LABEL, SKILL_CARD_BY_ID, TEMPERATURE_BY_ID } from '@/data/constants';
import { SEED_CONTESTS } from '@/data/seedContests';
import { SCORE_WEIGHTS } from '@/lib/matching/clusterEngine';
import { Button, cx, Dialog, Icon, InfoTip, LinearProgress, Monogram, Tabs } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/AppShell';
import { AvatarMeetingCard } from '@/components/AvatarMeetingCard';
import { ClusterScatterPlot } from '@/components/ClusterScatterPlot';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { TeamPuzzleMerge } from '@/components/TeamPuzzleMerge';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';

const CATEGORY_LABEL: Record<Contest['category'], string> = {
  it_hackathon: 'IT 해커톤',
  business: '비즈니스',
  design: '디자인',
  ai_data: 'AI · 데이터',
  free: '자유',
};

function dday(deadline: string) {
  const d = Math.ceil((new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86400000);
  return d > 0 ? `D-${d}` : d === 0 ? 'D-Day' : '마감';
}

const METRICS: { key: keyof typeof SCORE_WEIGHTS; label: string }[] = [
  { key: 'goalAlignment', label: '목표 일치' },
  { key: 'roleCoverage', label: '역량 보완' },
  { key: 'aiPolicyAlignment', label: 'AI 규범' },
  { key: 'collaborationCompatibility', label: '협업 방식' },
];

function ContestRow({ c, selected, onClick }: { c: Contest; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx('state-layer flex w-full items-start gap-3 rounded-m3-lg p-4 text-left transition-colors', selected ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low')}
    >
      <div className="min-w-0 flex-1">
        <p className="title-small">{c.title}</p>
        <p className="mt-0.5 body-small text-on-surface-variant">{CATEGORY_LABEL[c.category]}</p>
        <p className="mt-2 flex flex-wrap gap-1">
          {c.requiredRoles.map((r) => (
            <span key={r} className="rounded-m3-xs bg-surface-container-highest px-1.5 py-0.5 label-small text-on-surface-variant">
              {ROLE_LABEL[r]}
            </span>
          ))}
        </p>
      </div>
      <span className={cx('tabular shrink-0 label-medium', !selected && 'text-primary')}>{dday(c.deadline)}</span>
    </button>
  );
}

function MetricBars({ team }: { team: TeamCandidate }) {
  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1 label-medium text-on-surface-variant">
        지표
        <InfoTip align="start">일정 겹침은 이번 버전에서 빠져 있어서, 나머지 4개 지표의 가중치를 다시 맞춰 계산했어요(목표 0.375 · 역량 0.3125 · AI 0.1875 · 협업 0.125).</InfoTip>
      </p>
      {METRICS.map((m) => {
        const v = team.scoreBreakdown[m.key];
        return (
          <div key={m.key}>
            <div className="flex justify-between body-small">
              <span className="text-on-surface">{m.label}</span>
              <span className="tabular text-on-surface-variant">{v.toFixed(2)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary-container">
              <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-m3" style={{ width: `${v * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MatchPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const user = useOndoStore((s) => s.currentUser);
  const selectedContestId = useOndoStore((s) => s.selectedContestId);
  const points = useOndoStore((s) => s.clusteredPoints);
  const teams = useOndoStore((s) => s.recommendedTeams);
  const meetings = useOndoStore((s) => s.avatarMeetings);
  const avatarLoading = useOndoStore((s) => s.avatarLoading);
  const consentCount = useOndoStore((s) => s.consentCount);
  const busy = useOndoStore((s) => s.matchingBusy);
  const runMatching = useOndoStore((s) => s.runMatchingForContest);
  const requestAvatarMeeting = useOndoStore((s) => s.requestAvatarMeeting);
  const unlockTeam = useOndoStore((s) => s.unlockTeam);
  const passTeam = useOndoStore((s) => s.passTeam);

  const [tab, setTab] = useState<'1' | '2' | '3'>('1');
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const contest = SEED_CONTESTS.find((c) => c.id === selectedContestId);
  const team = teams.find((t) => t.rank === Number(tab));
  const requesting = teams.find((t) => t.id === requestingId);

  useEffect(() => setTab('1'), [selectedContestId]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;

  const showResults = contest && teams.length > 0 && teams[0].contestId === contest.id && !busy;
  const large = contest?.scale === 'large';

  return (
    <AppShell>
      <div className="grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          <h1 className="headline-small">어떤 대회에 나가요?</h1>
          {(['large', 'small'] as const).map((scale) => (
            <section key={scale}>
              <p className="mb-1 flex items-center gap-1 px-1 label-large text-on-surface-variant">
                {scale === 'large' ? '대규모' : '소규모'}
                <InfoTip align="start">
                  {scale === 'large' ? '추천 팀 → AI 아바타 모의회의 → (선택) 20분 파일럿 → 팀 확정' : '추천 팀을 보고 바로 만나요.'}
                </InfoTip>
              </p>
              <div className="space-y-1">
                {SEED_CONTESTS.filter((c) => c.scale === scale).map((c) => (
                  <ContestRow key={c.id} c={c} selected={c.id === selectedContestId} onClick={() => runMatching(c.id)} />
                ))}
              </div>
            </section>
          ))}
        </aside>

        <div className="min-w-0 space-y-8">
          {!contest && !busy && (
            <div className="grid min-h-[60vh] place-items-center rounded-m3-xl bg-surface-container-low p-8 text-center">
              <div>
                <PuzzlePiece mode={user.temperatureMode} edges={[-1, 1, -1, 1]} label={user.collabType} size={140} />
                <p className="mt-4 title-large">대회를 골라 주세요</p>
              </div>
            </div>
          )}

          {busy && (
            <div className="rounded-m3-lg bg-surface-container p-6">
              <p className="title-medium">101명 응답 분석 중</p>
              <LinearProgress className="mt-4" />
            </div>
          )}

          {showResults && contest && (
            <>
              <section className="enter">
                <p className="label-large text-primary">1단계 · 27차원 탐색</p>
                <h2 className="mt-1 headline-small">{contest.title}</h2>
                <div className="mt-4">
                  <ClusterScatterPlot points={points} />
                </div>
              </section>

              <section className="enter" style={{ animationDelay: '60ms' }}>
                <h2 className="mb-3 title-large">추천 조합</h2>
                <div className="overflow-hidden rounded-m3-md bg-surface-container-low">
                  <Tabs
                    value={tab}
                    onChange={setTab}
                    tabs={teams.map((t) => ({
                      value: String(t.rank) as '1' | '2' | '3',
                      label: (
                        <span className={cx('tabular', t.status === 'EXPIRED' && 'line-through opacity-60')}>
                          #{t.rank} <span className="body-small text-on-surface-variant">{t.matchScore.toFixed(2)}</span>
                        </span>
                      ),
                    }))}
                  />
                  {team && team.status === 'EXPIRED' && (
                    <div className="enter grid place-items-center gap-3 p-10 text-center">
                      <Icon name="nights_stay" size={32} className="text-outline" />
                      <p className="title-medium">이번 주 금요일 밤 새 퍼즐 조합이 도착해요</p>
                      <p className="flex items-center gap-1 body-small text-on-surface-variant">
                        이 조합은 조용히 넘겼어요
                        <InfoTip>상대에게 거절 알림은 가지 않아요.</InfoTip>
                      </p>
                    </div>
                  )}
                  {team && team.status !== 'EXPIRED' && (
                    <div key={team.id} className="enter @container space-y-8 p-5 md:p-6">
                      <div className="grid gap-8 @4xl:grid-cols-[1fr_240px]">
                        <TeamPuzzleMerge team={team} />
                        <MetricBars team={team} />
                      </div>

                      <ul className="grid gap-3 @xl:grid-cols-2">
                        {team.members.map((m, i) => {
                          const lv = i > 0 ? COMPATIBILITY_MATRIX_16X16[user.collabType][m.collabType] : null;
                          return (
                            <li key={m.id} className="flex gap-3 rounded-m3-md bg-surface p-3">
                              <Monogram name={m.nickname} tone={i === 0 ? 'primary' : 'secondary'} />
                              <div className="min-w-0 flex-1">
                                <p className="title-small">
                                  {m.nickname}
                                  {i === 0 && <span className="ml-1 text-primary">· 나</span>}
                                </p>
                                <p className="body-small text-on-surface-variant">
                                  {m.cv.major} · <span className="tabular">{TEMPERATURE_BY_ID[m.temperatureMode].temperature}°</span> · {m.collabType}
                                </p>
                                <p className="mt-1 body-small text-on-surface">凸 {m.strengths.map((s) => SKILL_CARD_BY_ID[s].strength).join(', ')}</p>
                              </div>
                              {lv && (
                                <span className="inline-flex h-6 shrink-0 items-center gap-1 self-start rounded-m3-xs bg-surface-container px-1.5 label-small text-on-surface-variant" title="협업 유형 16×16 참고표 (심리검사 진단 아님)">
                                  <span className="size-2 rounded-full" style={{ background: COMPAT_LEVEL_META[lv].color }} />
                                  {COMPAT_LEVEL_META[lv].label}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {large && (
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <p className="label-large text-primary">2단계 · AI 아바타 모의회의</p>
                            {!meetings[team.id] && !avatarLoading[team.id] && (
                              <Button variant="tonal" icon="play_arrow" className="ml-auto" onClick={() => requestAvatarMeeting(team.id)}>
                                모의회의 돌려 보기
                              </Button>
                            )}
                          </div>
                          {(meetings[team.id] || avatarLoading[team.id]) && (
                            <AvatarMeetingCard result={meetings[team.id]} loading={avatarLoading[team.id]} loadingStepText="네 사람의 응답으로 가상 회의를 만드는 중" />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
                        <Button variant="text" icon="skip_next" onClick={() => passTeam(team.id)}>
                          넘기기
                        </Button>
                        <InfoTip align="start">누가 먼저 요청했는지는 서로 보이지 않고, 넘겨도 알림은 가지 않아요. 모두 수락해야 실명과 CV가 열려요.</InfoTip>
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
                          {large && (
                            <Button variant="outlined" icon="timer" onClick={() => router.push(`/pilot/${team.id}`)}>
                              20분 파일럿 해커톤 먼저 해보기
                            </Button>
                          )}
                          <Button
                            icon="waving_hand"
                            onClick={() => {
                              setRequestingId(team.id);
                              unlockTeam(team.id);
                            }}
                          >
                            바로 만나볼래요
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!requesting}
        onClose={() => setRequestingId(null)}
        icon={requesting?.status === 'UNLOCKED' ? 'extension' : 'hourglass_top'}
        title={requesting?.status === 'UNLOCKED' ? '팀이 맞춰졌어요' : '수락 기다리는 중'}
        actions={
          requesting?.status === 'UNLOCKED' ? (
            <Button icon="arrow_forward" onClick={() => requesting && router.push(`/team/${requesting.id}`)}>
              팀 보러 가기
            </Button>
          ) : (
            <Button variant="text" onClick={() => setRequestingId(null)}>
              닫기
            </Button>
          )
        }
      >
        {requesting && (
          <div className="text-center">
            <p className="tabular display-small text-on-surface">
              {consentCount[requesting.id] ?? 1}
              <span className="headline-small text-on-surface-variant">/4</span>
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 label-large">
              수락
              <InfoTip>누가 먼저 눌렀는지는 보이지 않고, 수락 인원 수만 보여요. 시연 버전은 잠시 뒤 모두 수락돼요.</InfoTip>
            </p>
            {requesting.status !== 'UNLOCKED' && <LinearProgress className="mt-4" value={(consentCount[requesting.id] ?? 1) / 4} />}
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
