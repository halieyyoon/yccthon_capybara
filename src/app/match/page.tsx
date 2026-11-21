'use client';

// 소유: 규혁 — 5) `/match` 공모전 선택 & 1·2단계 매칭
// 상태 흐름(05 workflow): CLUSTERED → AVATAR_DONE → (PILOT_ACTIVE) → WAITING_CONSENT → UNLOCKED, 넘기기·미성사 → EXPIRED
// 대회 규모 구분 없음 — 모든 대회가 추천 → AI 아바타 → (선택) 20분 파일럿 → 팀 확정
// 추천 팀원 타일을 누르면 ‘우리 둘 궁합’(퍼즐 궁합 매트릭스 시안 3쪽 구조)

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Contest, TeamCandidate } from '@/types/ondo';
import { COMPATIBILITY_MATRIX_16X16, COMPAT_LEVEL_META, TEMPERATURE_MODES, ROLE_LABEL, SKILL_CARD_BY_ID, TEMPERATURE_BY_ID } from '@/data/constants';
import { SEED_CONTESTS } from '@/data/seedContests';
import { SCORE_WEIGHTS } from '@/lib/matching/clusterEngine';
import { refsText, WEIGHT_SOURCE } from '@/data/references';
import { Button, cx, Dialog, Icon, InfoTip, LinearProgress, Monogram, Tabs } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/AppShell';
import { AvatarMeetingCard } from '@/components/AvatarMeetingCard';
import { ClusterScatterPlot } from '@/components/ClusterScatterPlot';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { TeamPuzzleMerge } from '@/components/TeamPuzzleMerge';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';
import { PIECE_TYPES, type PieceCode, edgesFromCode, pairReport, pieceOf } from '@/store/pieceTypes';
import type { UserProfile } from '@/types/ondo';

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

function ContestRow({ c, selected, onClick }: { c: Contest; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx('state-layer flex w-full items-start gap-3 rounded-m3-md px-3 py-2.5 text-left transition-colors', selected ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low')}
    >
      <div className="min-w-0 flex-1">
        <p className="title-small">{c.title}</p>
        <p className="mt-0.5 body-small text-on-surface-variant">{CATEGORY_LABEL[c.category]}</p>
      </div>
      <span className={cx('tabular shrink-0 label-medium', !selected && 'text-on-surface-variant')}>{dday(c.deadline)}</span>
    </button>
  );
}

/** 지표마다 '개수 + 규칙 + 근거 논문 + 이 팀의 실제 응답'을 보여 줌 (docs/proposal/09) */
function MetricEvidence({ team }: { team: TeamCandidate }) {
  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1 label-medium text-on-surface-variant">
        왜 이 조합인가요?
        <InfoTip align="start">{`순위는 4개 지표를 가중합해 정해요 (목표 ${SCORE_WEIGHTS.goalAlignment} · 역량 ${SCORE_WEIGHTS.roleCoverage} · AI ${SCORE_WEIGHTS.aiPolicyAlignment} · 협업 ${SCORE_WEIGHTS.collaborationCompatibility}). ${WEIGHT_SOURCE.note}`}</InfoTip>
      </p>
      {team.explanations.map((e) => (
        <details key={e.metric} className="group rounded-m3-sm bg-surface px-3 py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 body-small">
            <span className="text-on-surface">{e.label}</span>
            <span className="flex items-center gap-1">
              <span className="tabular title-small text-on-surface">
                {e.okCount}/{e.total}
              </span>
              <span className="label-small text-on-surface-variant">{e.diversityType === 'variety' ? '역할 채움' : '문항 일치'}</span>
              <Icon name="expand_more" size={18} className="text-outline transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="mt-2 space-y-2 border-t border-outline-variant pt-2">
            <p className="body-small text-on-surface">{e.why}</p>
            <p className="body-small text-on-surface-variant">{e.rule}</p>
            <ul className="space-y-1">
              {e.items.map((it) => (
                <li key={it.key} className="flex items-center justify-between gap-2 label-small">
                  <span className={cx('flex items-center gap-1', it.ok ? 'text-on-surface' : 'text-on-surface-variant')}>
                    <Icon name={it.ok ? 'check' : 'remove'} size={14} className={it.ok ? 'text-primary' : 'text-outline'} />
                    {it.label}
                  </span>
                  <span className="tabular text-on-surface-variant" title={it.values.map((v) => `${v.nickname} ${v.value ?? '-'}`).join(', ')}>
                    {it.values.map((v) => v.value ?? '–').join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
            <p className="label-small text-outline">근거: {refsText(e.refs)}</p>
          </div>
        </details>
      ))}
      <p className="label-small text-on-surface-variant">응답은 나 · 팀원 순서예요. 자기보고 응답이라 실제 행동과 다를 수 있어요.</p>
    </div>
  );
}

function MatchDetails({ label, children }: { label: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details onToggle={(event) => setIsOpen(event.currentTarget.open)} className="group rounded-m3-md bg-surface-container-low">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-m3-md px-4 py-2.5 title-small text-on-surface hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        {label}
        <span aria-hidden className="flex shrink-0 text-on-surface-variant group-open:rotate-180">
          <Icon name="expand_more" size={20} />
        </span>
      </summary>
      {isOpen && <div className="p-4 pt-2">{children}</div>}
    </details>
  );
}

/** 우리 둘 궁합 — 두 조각 · 맞물리는 변 수 · 축별 한 줄 · 첫 만남에 정할 것 */
function PairCompatView({ me, them, myCode, theirCode, onContinue }: { me: UserProfile; them: UserProfile; myCode: PieceCode; theirCode: PieceCode; onContinue: () => void }) {
  const myName = PIECE_TYPES[myCode].name;
  const theirName = PIECE_TYPES[theirCode].name;
  const r = pairReport(myCode, theirCode, theirName);
  return (
    <div>
      <div className="rounded-m3-xl bg-surface-container-low px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <PuzzlePiece mode={me.temperatureMode} edges={edgesFromCode(myCode)} size={104} />
            <p className="title-small text-on-surface">{myName} (나)</p>
          </div>
          <span
            className={cx('grid size-10 shrink-0 place-items-center rounded-full title-medium', r.count >= 2 ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container')}
            aria-label={r.count >= 2 ? `${r.count}변 맞물림` : `${4 - r.count}변 포개짐`}
          >
            {r.count >= 2 ? '◆' : '○'}
          </span>
          <div className="flex flex-col items-center">
            <PuzzlePiece mode={them.temperatureMode} edges={edgesFromCode(theirCode)} size={104} />
            <p className="title-small text-on-surface">{theirName}</p>
          </div>
        </div>
        <p className="mt-3 headline-small text-on-surface">{r.headline}</p>
        <p className="body-medium text-on-surface-variant">{r.sub}</p>
      </div>

      <ul className="mt-3 space-y-2">
        {r.axes.map((a) => (
          <li key={a.axis} className="rounded-m3-md bg-surface-container-low px-4 py-3">
            <p className="label-medium text-on-surface-variant">{a.label}</p>
            <p className="title-small text-on-surface">{a.line}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-m3-md bg-secondary-container px-4 py-3 text-on-secondary-container">
        <p className="title-small">첫 만남에 이것만 정해요</p>
        <p className="body-medium">{r.firstMeeting}</p>
      </div>

      <Button size="lg" className="mt-4 w-full" onClick={onContinue}>
        추천 팀으로 돌아가기
      </Button>
      <p className="mt-2 flex items-center justify-center gap-1 body-small text-on-surface-variant">
        {them.nickname}님의 조각
        <InfoTip>설문에 답하지 않은 사람의 조각은 매칭 응답으로 추정해요. 협업 성향 조각이에요(심리검사 아님).</InfoTip>
      </p>
    </div>
  );
}

function TeamOverview({ team, userId, codes, onOpenPair }: { team: TeamCandidate; userId: string; codes: PieceCode[]; onOpenPair: (memberId: string) => void }) {
  const reasons = team.evidenceTags.slice(0, 2);
  const example = team.puzzlePairs.find((pair) => pair.weaknessOwnerId === userId) ?? team.puzzlePairs[0];
  const ok = team.explanations.reduce((n, e) => n + e.okCount, 0);
  const total = team.explanations.reduce((n, e) => n + e.total, 0);

  return (
    <div className="space-y-5">
      {/* 혜원 v1.1 수치 — 상세(왜 이 조합인가요?)를 열지 않아도 바로 보이게 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-m3-md bg-surface px-4 py-3">
        <p className="flex items-baseline gap-1.5">
          <span className="tabular headline-small text-on-surface">
            {ok}
            <span className="title-medium text-on-surface-variant">/{total}</span>
          </span>
          <span className="label-medium text-on-surface-variant">응답이 맞는 항목</span>
          <InfoTip align="start">목표·AI·협업은 4명의 응답 차이가 1점 이하인 문항 수, 역량은 필요한 역할을 능숙한 팀원이 채운 수예요. 정확도나 궁합 확률이 아니에요. 자세한 근거는 아래 ‘팀원과 추천 근거 자세히 보기’에서 볼 수 있어요.</InfoTip>
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="지표별 개수">
          {team.explanations.map((e) => (
            <li key={e.metric} className={cx('rounded-full px-2.5 py-1 label-medium', e.okCount === e.total ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant')}>
              {e.label} <span className="tabular">{e.okCount}/{e.total}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mb-2! flex items-center gap-1 label-medium text-on-surface-variant">
        추천 팀원
        <InfoTip align="start">팀원을 누르면 우리 둘이 어떻게 맞물리는지 볼 수 있어요.</InfoTip>
      </p>
      <ul aria-label="추천 팀원" className="grid grid-cols-2 gap-2 @xl:grid-cols-4">
        {team.members.map((member) => {
          const isMe = member.id === userId;
          const idx = team.members.indexOf(member);
          const body = (
            <>
              <div className="shrink-0">
                <Monogram name={member.nickname} size={32} tone={isMe ? 'primary' : 'secondary'} />
              </div>
              <div className="min-w-0">
                <p className="title-small [overflow-wrap:anywhere]">{isMe ? '나' : member.nickname}</p>
                <p className="mt-0.5 body-small text-on-surface-variant">
                  {PIECE_TYPES[codes[idx]].name} · {TEMPERATURE_BY_ID[member.temperatureMode].temperature}°
                </p>
              </div>
            </>
          );
          const tile = 'flex h-full min-w-0 items-center gap-2 rounded-m3-md px-2.5 py-2.5 @xl:flex-col @xl:py-3 @xl:text-center';
          return (
            <li key={member.id}>
              {isMe ? (
                <div className={cx(tile, 'bg-secondary-container')}>{body}</div>
              ) : (
                <button type="button" onClick={() => onOpenPair(member.id)} aria-label={`${member.nickname}와 우리 둘 궁합 보기`} className={cx(tile, 'state-layer w-full bg-surface text-left hover:bg-surface-container')}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-3 @xl:grid-cols-2">
        <section className="min-w-0 rounded-m3-md bg-surface p-4">
          <h3 className="title-small">추천 이유</h3>
          {reasons.length > 0 && (
            <p className="mt-1 body-medium text-on-surface-variant">{reasons.join(' · ')}</p>
          )}
          {example && (
            <p className="mt-2 body-small text-on-surface">
              <span className="font-semibold">{example.coveredByNickname}</span>의 {SKILL_CARD_BY_ID[example.strengthId].strength} 역량이{' '}
              <span className="font-semibold">{example.weaknessOwnerId === userId ? '내' : `${example.weaknessOwnerNickname}의`}</span> 약점을 보완해요.
            </p>
          )}
          {reasons.length === 0 && !example && (
            <p className="mt-1 body-medium text-on-surface-variant">응답을 바탕으로 추천한 팀이에요.</p>
          )}
        </section>
        <section className="min-w-0 rounded-m3-md bg-surface p-4 text-on-surface">
          <h3 className="flex items-center gap-2 title-small"><Icon name="forum" size={17} className="text-tertiary" />먼저 이야기할 점</h3>
          <p className="mt-1 body-medium text-on-surface-variant">{team.biggestGapNote}</p>
        </section>
      </div>
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
  const contestModes = useOndoStore(s => s.contestModes);
  const runMatching = useOndoStore((s) => s.runMatchingForContest);
  const requestAvatarMeeting = useOndoStore((s) => s.requestAvatarMeeting);
  const unlockTeam = useOndoStore((s) => s.unlockTeam);
  const passTeam = useOndoStore((s) => s.passTeam);
  const myPiece = useOndoStore((s) => s.myPiece);
  const [pairId, setPairId] = useState<string | null>(null);

  const [tab, setTab] = useState<'1' | '2' | '3'>('1');
  const [showContestList, setShowContestList] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const contest = SEED_CONTESTS.find((c) => c.id === selectedContestId);
  const team = teams.find((t) => t.rank === Number(tab));
  const requesting = teams.find((t) => t.id === requestingId);
  const selectedTeamPoints = useMemo(() => {
    if (!team) return points;
    const memberIds = new Set(team.members.map((member) => member.id));
    return points.map((point) => ({
      ...point,
      isRecommendedTeammate: !point.isCurrentUser && memberIds.has(point.userId),
    }));
  }, [points, team]);

  useEffect(() => setTab('1'), [selectedContestId]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;

  const showResults = contest && teams.length > 0 && teams[0].contestId === contest.id && !busy;
  const codes = team ? team.members.map((m) => pieceOf(m, user.id, myPiece)) : [];
  const pairMember = team?.members.find((m) => m.id === pairId);

  return (
    <AppShell>
      <div className="grid gap-5 py-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          {contest && (
            <button
              type="button"
              aria-expanded={showContestList}
              aria-controls="match-contest-list"
              onClick={() => setShowContestList((open) => !open)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-m3-md bg-surface-container-low px-4 text-left label-large text-primary lg:hidden"
            >
              대회 바꾸기
              <Icon name={showContestList ? 'expand_less' : 'expand_more'} size={20} />
            </button>
          )}
          <div id="match-contest-list" className={cx('space-y-4', contest && (showContestList ? 'mt-3 lg:mt-0' : 'hidden lg:block'))}>
            {showResults ? <h2 className="headline-small">어떤 대회에 나가요?</h2> : <h1 className="headline-small">어떤 대회에 나가요?</h1>}
            <div className="space-y-1">
              {SEED_CONTESTS.map((c) => (
                <ContestRow key={c.id} c={c} selected={c.id === selectedContestId} onClick={() => {
                  setShowContestList(false);
                  void runMatching(c.id);
                }} />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          {!contest && !busy && (
            <div className="grid place-items-center lg:min-h-[50vh] rounded-m3-xl bg-surface-container-low p-8 text-center">
              <div>
                <PuzzlePiece mode={user.temperatureMode} edges={myPiece ? edgesFromCode(myPiece) : [-1, 1, -1, 1]} size={140} />
                <p className="mt-4 title-large">대회를 골라 주세요</p>
              </div>
            </div>
          )}

          {busy && (
            <div role="status" className="rounded-m3-lg bg-surface-container p-6">
              <p className="title-medium">팀을 찾는 중이에요</p>
              <LinearProgress className="mt-4" />
            </div>
          )}

          {showResults && contest && (
            <section aria-labelledby="match-results-title" className="space-y-4">
              <header className="space-y-1">
                <p className="label-large text-primary">{contest.title}</p>
                <h1 id="match-results-title" className="headline-small">추천 팀</h1>
                <p className="body-small text-on-surface-variant">모집 역할 · {contest.requiredRoles.map((role) => ROLE_LABEL[role]).join(' · ')}</p>
                <label className="inline-flex items-center gap-2 body-small">
                  이번 대회 참여 온도
                  <select className="min-h-10 rounded-m3-sm bg-surface-container px-2" value={contestModes[contest.id] ?? user.temperatureMode}
                    onChange={event => {
                      const mode = TEMPERATURE_MODES.find(m => m.id === event.target.value);
                      if (mode) void runMatching(contest.id, mode.id);
                    }}>
                    {TEMPERATURE_MODES.map(m => <option key={m.id} value={m.id}>{m.temperature}° · {m.short}</option>)}
                  </select>
                </label>
              </header>
              <div className="overflow-hidden rounded-m3-md bg-surface-container-low">
                <div className="px-4 pt-4 sm:px-5">
                  <Tabs
                    value={tab}
                    onChange={setTab}
                    tabs={teams.map((t) => ({
                      value: String(t.rank) as '1' | '2' | '3',
                      label: (
                        <span className={cx('tabular', t.status === 'EXPIRED' && 'line-through opacity-60')}>
                          {t.rank}순위
                          <span className="ml-1 label-small text-on-surface-variant">
                            {t.explanations.reduce((n, e) => n + e.okCount, 0)}/{t.explanations.reduce((n, e) => n + e.total, 0)}
                          </span>
                          {t.status === 'EXPIRED' && <span className="sr-only"> (넘긴 팀)</span>}
                        </span>
                      ),
                    }))}
                  />
                </div>
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
                  <div key={team.id} className="@container space-y-5 px-4 pb-5 pt-4 sm:px-5">
                    <TeamOverview team={team} userId={user.id} codes={codes} onOpenPair={setPairId} />

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
                      <div className="flex flex-1 flex-col gap-2 sm:order-2 sm:flex-row-reverse">
                        <Button
                          variant="prominent"
                          icon="waving_hand"
                          onClick={() => {
                            setRequestingId(team.id);
                            unlockTeam(team.id);
                          }}
                        >
                          바로 만나볼래요
                        </Button>
                        <Button variant="outlined" icon="timer" onClick={() => router.push(`/pilot/${team.id}`)}>
                          20분 파일럿
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="text" icon="skip_next" onClick={() => passTeam(team.id)}>
                          넘기기
                        </Button>
                        <InfoTip align="start">누가 먼저 요청했는지는 서로 보이지 않고, 넘겨도 알림은 가지 않아요. 모두 수락해야 실명과 CV가 열려요.</InfoTip>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {team && team.status !== 'EXPIRED' && (
                <MatchDetails label="팀원과 추천 근거 자세히 보기">
                  <div className="@container space-y-5">
                    <TeamPuzzleMerge team={team} pieceCodes={codes} />
                    <MetricEvidence team={team} />
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
                              <p className="mt-1 body-small text-on-surface">잘하는 것 · {m.strengths.map((s) => SKILL_CARD_BY_ID[s].strength).join(', ')}</p>
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
                  </div>
                </MatchDetails>
              )}
              {team && team.status !== 'EXPIRED' && (
                <MatchDetails label="AI 모의회의 보기">
                  {(meetings[team.id] || avatarLoading[team.id]) ? (
                    <AvatarMeetingCard result={meetings[team.id]} loading={avatarLoading[team.id]} loadingStepText="팀 응답으로 가상 회의를 만드는 중" />
                  ) : (
                    <Button variant="tonal" icon="play_arrow" onClick={() => requestAvatarMeeting(team.id)}>
                      모의회의 돌려 보기
                    </Button>
                  )}
                </MatchDetails>
              )}
              <MatchDetails label="전체 후보 분포 보기">
                <p className="mb-3 body-small text-on-surface-variant">파란 테두리는 지금 보고 있는 추천 팀원이에요.</p>
                <ClusterScatterPlot points={selectedTeamPoints} />
              </MatchDetails>
            </section>
          )}
        </div>
      </div>

      <Dialog open={!!pairMember && !!team} onClose={() => setPairId(null)} title="우리 둘 궁합" wide>
        {pairMember && team && (
          <PairCompatView
            me={user}
            them={pairMember}
            myCode={codes[0]}
            theirCode={codes[team.members.indexOf(pairMember)]}
            onContinue={() => setPairId(null)}
          />
        )}
      </Dialog>

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
