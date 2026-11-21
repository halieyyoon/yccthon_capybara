'use client';

// 소유: 규혁 — 5) `/match` 공모전 선택 & 1·2단계 매칭

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Contest, TeamCandidate } from '@/types/ondo';
import { COMPATIBILITY_MATRIX_16X16, COMPAT_LEVEL_META, ROLE_LABEL, SKILL_CARD_BY_ID, TEMPERATURE_BY_ID } from '@/data/constants';
import { SEED_CONTESTS } from '@/data/seedContests';
import { SCORE_WEIGHTS } from '@/lib/matching/clusterEngine';
import { Button, Card, cx, Dialog, Icon, LinearProgress, Monogram, Tabs } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/ondo/AppShell';
import { AvatarMeetingCard } from '@/components/ondo/AvatarMeetingCard';
import { ClusterScatterPlot } from '@/components/ondo/ClusterScatterPlot';
import { PuzzlePiece } from '@/components/ondo/Puzzle';
import { TeamPuzzleMerge } from '@/components/ondo/TeamPuzzleMerge';
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

const METRICS: { key: keyof typeof SCORE_WEIGHTS; label: string; help: string }[] = [
  { key: 'goalAlignment', label: '목표 일치', help: '목표 4문항 응답이 얼마나 비슷한지' },
  { key: 'roleCoverage', label: '역량 보완', help: '대회 필수 역할 커버 + 약점을 채워 주는 장점' },
  { key: 'aiPolicyAlignment', label: 'AI 규범', help: 'AI 사용·검증·공개 기준이 얼마나 비슷한지' },
  { key: 'collaborationCompatibility', label: '협업 방식', help: '작업 방식·갈등 대응·지뢰 충돌 여부' },
];

function ContestRow({ c, selected, onClick }: { c: Contest; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'state-layer flex w-full items-start gap-3 rounded-m3-lg p-4 text-left transition-colors',
        selected ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="title-small">{c.title}</p>
        <p className="mt-0.5 body-small text-on-surface-variant">
          {c.organizer} · {CATEGORY_LABEL[c.category]}
        </p>
        <p className="mt-2 flex flex-wrap gap-1">
          {c.requiredRoles.map((r) => (
            <span key={r} className="rounded-m3-xs bg-surface-container-highest px-1.5 py-0.5 label-small text-on-surface-variant">
              {ROLE_LABEL[r]}
            </span>
          ))}
        </p>
      </div>
      <span className={cx('tabular shrink-0 label-medium', selected ? '' : 'text-primary')}>{dday(c.deadline)}</span>
    </button>
  );
}

function MetricBars({ team }: { team: TeamCandidate }) {
  return (
    <div className="space-y-3">
      {METRICS.map((m) => {
        const v = team.scoreBreakdown[m.key];
        return (
          <div key={m.key} title={m.help}>
            <div className="flex items-baseline justify-between body-small">
              <span className="text-on-surface">
                {m.label} <span className="text-on-surface-variant">× {SCORE_WEIGHTS[m.key].toFixed(3).replace(/0+$/, '')}</span>
              </span>
              <span className="tabular text-on-surface-variant">{v.toFixed(2)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary-container">
              <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-m3" style={{ width: `${v * 100}%` }} />
            </div>
          </div>
        );
      })}
      <p className="body-small text-on-surface-variant">일정 겹침은 이번 버전에서 빠져 있어서, 나머지 4개 지표의 가중치를 다시 맞춰 계산했어요.</p>
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
  const busy = useOndoStore((s) => s.matchingBusy);
  const runMatching = useOndoStore((s) => s.runMatchingForContest);
  const requestAvatarMeeting = useOndoStore((s) => s.requestAvatarMeeting);
  const unlockTeam = useOndoStore((s) => s.unlockTeam);

  const [tab, setTab] = useState<'1' | '2' | '3'>('1');
  const [requesting, setRequesting] = useState<TeamCandidate | null>(null);

  const contest = SEED_CONTESTS.find((c) => c.id === selectedContestId);
  const team = teams.find((t) => t.rank === Number(tab));
  const requestingStatus = teams.find((t) => t.id === requesting?.id)?.status;

  useEffect(() => setTab('1'), [selectedContestId]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;

  const large = SEED_CONTESTS.filter((c) => c.scale === 'large');
  const small = SEED_CONTESTS.filter((c) => c.scale === 'small');
  const showResults = contest && teams.length > 0 && teams[0].contestId === contest.id && !busy;

  const meet = async (t: TeamCandidate) => {
    setRequesting(t);
    await unlockTeam(t.id);
  };

  return (
    <AppShell>
      <div className="grid gap-8 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          <div>
            <h1 className="headline-small">어떤 대회에 나가요?</h1>
            <p className="mt-1 body-medium text-on-surface-variant">대회를 고르면 바로 4인 조합을 찾아요.</p>
          </div>
          <section>
            <p className="mb-2 px-1 label-large text-on-surface-variant">대규모 · AI 아바타 + 파일럿 지원</p>
            <div className="space-y-1">
              {large.map((c) => (
                <ContestRow key={c.id} c={c} selected={c.id === selectedContestId} onClick={() => runMatching(c.id)} />
              ))}
            </div>
          </section>
          <section>
            <p className="mb-2 px-1 label-large text-on-surface-variant">소규모 · 바로 매칭</p>
            <div className="space-y-1">
              {small.map((c) => (
                <ContestRow key={c.id} c={c} selected={c.id === selectedContestId} onClick={() => runMatching(c.id)} />
              ))}
            </div>
          </section>
        </aside>

        <div className="min-w-0 space-y-8">
          {!contest && !busy && (
            <div className="grid min-h-[60vh] place-items-center rounded-m3-xl border border-dashed border-outline-variant p-8 text-center">
              <div>
                <PuzzlePiece mode={user.temperatureMode} label={user.collabType} size={140} />
                <p className="mt-4 title-large">왼쪽에서 대회를 골라 주세요</p>
                <p className="mx-auto mt-2 max-w-sm body-medium text-on-surface-variant">
                  큰 대회는 AI 아바타 모의회의까지, 작은 대회는 추천 팀을 보고 바로 만날 수 있어요.
                </p>
              </div>
            </div>
          )}

          {busy && (
            <Card variant="filled" className="p-6">
              <p className="title-medium">101명의 응답을 펼쳐 보는 중이에요</p>
              <p className="mt-1 body-medium text-on-surface-variant">27가지 응답으로 거리를 재고, 비슷한 사람끼리 5개 그룹으로 나눈 뒤 4인 조합을 비교해요.</p>
              <LinearProgress className="mt-4" />
            </Card>
          )}

          {showResults && contest && (
            <>
              <section className="enter">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="label-large text-primary">1단계 · 27차원 탐색</p>
                    <h2 className="mt-1 headline-small">{contest.title}</h2>
                    <p className="mt-1 body-medium text-on-surface-variant">{contest.summary}</p>
                  </div>
                  <span className="rounded-m3-sm bg-surface-container px-3 py-1.5 label-large text-on-surface-variant">
                    {contest.scale === 'large' ? '대규모 · 1 → 2 → 3단계' : '소규모 · 1단계 후 바로 소집'}
                  </span>
                </div>
                <div className="mt-5">
                  <ClusterScatterPlot points={points} />
                  <p className="mt-2 body-small text-on-surface-variant">
                    합성 시드 100명 탐색 데모 · 2D 거리는 참고용이에요. 그룹은 후보를 고르게 뽑기 위한 보조 장치이고, 추천은 아래 팀 단위 지표로 정해요.
                  </p>
                </div>
              </section>

              <section className="enter" style={{ animationDelay: '60ms' }}>
                <h2 className="mb-3 title-large">추천 조합</h2>
                <Card variant="outlined" className="overflow-hidden">
                  <Tabs
                    value={tab}
                    onChange={setTab}
                    tabs={teams.map((t) => ({
                      value: String(t.rank) as '1' | '2' | '3',
                      label: (
                        <span className="tabular">
                          #{t.rank} <span className="body-small text-on-surface-variant">{t.matchScore.toFixed(2)}</span>
                        </span>
                      ),
                    }))}
                  />
                  {team && (
                    <div key={team.id} className="enter space-y-8 p-5 md:p-6">
                      <div className="grid gap-8 xl:grid-cols-[1fr_280px]">
                        <div className="space-y-5">
                          <div className="flex flex-wrap gap-2">
                            {team.evidenceTags.map((t) => (
                              <span key={t} className="inline-flex h-8 items-center gap-1.5 rounded-m3-sm bg-secondary-container px-3 label-large text-on-secondary-container">
                                <Icon name="check" size={16} />
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-start gap-3 rounded-m3-md bg-tertiary-container p-4 text-on-tertiary-container">
                            <Icon name="forum" className="mt-0.5" />
                            <div>
                              <p className="label-large">가장 큰 차이</p>
                              <p className="body-medium">{team.biggestGapNote}</p>
                            </div>
                          </div>
                          {team.missingInfoNotice && (
                            <div className="flex items-start gap-3 rounded-m3-md border border-dashed border-outline p-4">
                              <Icon name="help" className="mt-0.5 text-on-surface-variant" />
                              <p className="body-medium text-on-surface-variant">{team.missingInfoNotice}</p>
                            </div>
                          )}
                          <TeamPuzzleMerge members={team.members} pairs={team.puzzlePairs} size={150} />
                        </div>

                        <div className="space-y-5">
                          <div className="rounded-m3-lg bg-surface-container p-4">
                            <p className="label-medium text-on-surface-variant">임시 가중치 기준 조합 지수</p>
                            <p className="tabular display-small text-on-surface">{team.matchScore.toFixed(2)}</p>
                            <p className="mt-1 body-small text-on-surface-variant">
                              가장 덜 맞는 팀원 기준 <b className="tabular text-on-surface">{team.minMemberFit.toFixed(2)}</b> · 검증 전 임시값이라 순위 참고용이에요.
                            </p>
                          </div>
                          <MetricBars team={team} />
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 label-large text-on-surface-variant">팀원 (확정 전까지 닉네임만 보여요)</p>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {team.members.map((m, i) => (
                            <li key={m.id} className="flex gap-3 rounded-m3-md border border-outline-variant p-3">
                              <Monogram name={m.nickname} tone={i === 0 ? 'primary' : 'secondary'} />
                              <div className="min-w-0">
                                <p className="title-small">
                                  {m.nickname}
                                  {i === 0 && <span className="ml-1 text-primary">· 나</span>}
                                </p>
                                <p className="body-small text-on-surface-variant">
                                  {m.cv.major} · <span className="tabular">{TEMPERATURE_BY_ID[m.temperatureMode].temperature}°</span> · {m.collabType}
                                </p>
                                <p className="mt-1 body-small text-on-surface">凸 {m.strengths.map((s) => SKILL_CARD_BY_ID[s].strength).join(', ')}</p>
                                {i > 0 && (() => {
                                  const lv = COMPATIBILITY_MATRIX_16X16[user.collabType][m.collabType];
                                  const meta = COMPAT_LEVEL_META[lv];
                                  return (
                                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-m3-xs bg-surface-container px-2 py-0.5 label-small text-on-surface-variant" title="협업 유형 16×16 참고표 기준 시각화 배지 (심리검사 진단 아님)">
                                      <span className="size-2 rounded-full" style={{ background: meta.color }} />
                                      나와의 유형 조합 · {meta.label}
                                    </p>
                                  );
                                })()}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {contest.scale === 'large' && (
                        <div>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="label-large text-primary">2단계 · AI 아바타 사전 모의회의</p>
                              <p className="body-small text-on-surface-variant">네 사람의 응답으로 만든 아바타가 같은 안건을 먼저 논의해 봤어요.</p>
                            </div>
                            {!meetings[team.id] && !avatarLoading[team.id] && (
                              <Button variant="tonal" icon="play_arrow" onClick={() => requestAvatarMeeting(team.id)}>
                                이 조합도 모의회의 해 보기
                              </Button>
                            )}
                          </div>
                          {(meetings[team.id] || avatarLoading[team.id]) && (
                            <AvatarMeetingCard result={meetings[team.id]} loading={avatarLoading[team.id]} currentUserId={user.id} />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-3 border-t border-outline-variant pt-6 sm:flex-row sm:items-center">
                        <p className="flex-1 body-small text-on-surface-variant">누가 먼저 요청했는지는 서로에게 보이지 않아요. 모두 수락해야 실명과 CV가 열려요.</p>
                        {contest.scale === 'large' && (
                          <Button variant="outlined" icon="timer" onClick={() => router.push(`/pilot/${team.id}`)}>
                            20분 파일럿 해커톤 먼저 해보기
                          </Button>
                        )}
                        <Button icon="waving_hand" onClick={() => meet(team)}>
                          바로 만나볼래요
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </section>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!requesting}
        onClose={() => setRequesting(null)}
        icon={requestingStatus === 'UNLOCKED' ? 'celebration' : 'hourglass_top'}
        title={requestingStatus === 'UNLOCKED' ? '네 명 모두 수락했어요' : '조용히 관심을 보냈어요'}
        actions={
          requestingStatus === 'UNLOCKED' ? (
            <>
              <Button variant="text" onClick={() => setRequesting(null)}>
                나중에
              </Button>
              <Button icon="arrow_forward" onClick={() => requesting && router.push(`/team/${requesting.id}`)}>
                팀 보러 가기
              </Button>
            </>
          ) : (
            <Button variant="text" onClick={() => setRequesting(null)}>
              닫기
            </Button>
          )
        }
      >
        {requestingStatus === 'UNLOCKED' ? (
          <p className="text-center">이제 서로의 실명과 CV를 볼 수 있어요. 첫 회의에서 확인할 질문도 준비해 뒀어요.</p>
        ) : (
          <div className="text-center">
            <p>세 사람이 수락하면 바로 알려 드릴게요. 누가 먼저 보냈는지는 보이지 않고, 수락하지 않아도 알림은 가지 않아요.</p>
            <LinearProgress className="mt-5" />
            <p className="mt-2 body-small">시연 버전: 1.5초 뒤 모두 수락한 것으로 처리돼요.</p>
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
