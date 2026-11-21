'use client';

// 소유: 규혁 — 6) `/pilot/[teamId]` 3단계 20분 파일럿 해커톤

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { PilotMessage, PilotWorkspace } from '@/types/ondo';
import { ROLE_LABEL } from '@/data/constants';
import { SEED_CONTESTS } from '@/data/seedContests';
import { Button, cx, Dialog, Icon, IconButton, Monogram, TextArea } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/ondo/AppShell';
import { emptyPilot, useHydrated, useOndoStore } from '@/store/useOndoStore';

const DURATION_MS = 20 * 60 * 1000;
const MEMO_FIELDS: { key: keyof PilotWorkspace; label: string; hint: string }[] = [
  { key: 'problemStatement', label: '문제', hint: '누구의 어떤 불편을 풀까요?' },
  { key: 'solutionIdea', label: '아이디어', hint: '20분 안에 합의할 핵심 기능 하나' },
  { key: 'roleSplit', label: '역할', hint: '누가 무엇을 맡을까요?' },
];

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export default function PilotPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useOndoStore((s) => s.currentUser);
  const team = useOndoStore((s) => s.recommendedTeams.find((t) => t.id === teamId));
  const pilot = useOndoStore((s) => s.pilotStates[teamId]) ?? emptyPilot();
  const updatePilot = useOndoStore((s) => s.updatePilot);
  const setTeamStatus = useOndoStore((s) => s.setTeamStatus);
  const unlockTeam = useOndoStore((s) => s.unlockTeam);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [voteOpen, setVoteOpen] = useState(false);
  const [passed, setPassed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const running = !!pilot.endsAt && !pilot.ended;
  const now = useNow(running);
  const left = pilot.endsAt ? Math.max(0, pilot.endsAt - now) : DURATION_MS;

  useEffect(() => {
    if (running && left === 0) {
      updatePilot(teamId, { ended: true });
      setVoteOpen(true);
    }
  }, [running, left, teamId, updatePilot]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [pilot.messages.length, sending]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;
  if (!team) {
    return (
      <AppShell back="/match" title="파일럿 해커톤">
        <div className="mx-auto max-w-md py-24 text-center">
          <h2 className="headline-small">이 팀 정보를 찾을 수 없어요</h2>
          <p className="mt-2 body-medium text-on-surface-variant">매칭 화면에서 대회를 다시 골라 주세요.</p>
          <Button className="mt-6" href="/match">
            팀 찾기로 가기
          </Button>
        </div>
      </AppShell>
    );
  }

  const contest = SEED_CONTESTS.find((c) => c.id === team.contestId)!;
  const mates = team.members.slice(1);
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');

  const start = (topic: string) => {
    const first = mates[0];
    const greet: PilotMessage = {
      id: 'greet',
      senderId: first.id,
      senderNickname: first.nickname,
      isUser: false,
      text: `안녕하세요! “${topic}” 이걸로 20분 해 봐요. 먼저 누구의 문제인지부터 한 줄로 정해 볼까요?`,
      timestamp: new Date().toISOString(),
    };
    updatePilot(teamId, { ...emptyPilot(), topic, endsAt: Date.now() + DURATION_MS, messages: [greet] });
    setTeamStatus(teamId, 'PILOT_ACTIVE');
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending || !pilot.topic) return;
    const mine: PilotMessage = { id: `u-${Date.now()}`, senderId: user.id, senderNickname: user.nickname, isUser: true, text, timestamp: new Date().toISOString() };
    const messages = [...pilot.messages, mine];
    updatePilot(teamId, { messages });
    setDraft('');
    setSending(true);
    try {
      const res = await fetch('/api/pilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestTitle: contest.title, topic: pilot.topic, teamMembers: mates, messages, workspace: pilot.workspace, userMessage: text }),
      });
      if (res.ok) {
        const data: { replies: PilotMessage[]; suggestedWorkspacePatch?: Partial<PilotWorkspace> } = await res.json();
        const latest = useOndoStore.getState().pilotStates[teamId] ?? pilot;
        updatePilot(teamId, { messages: [...latest.messages, ...data.replies], pendingPatch: data.suggestedWorkspacePatch ?? latest.pendingPatch });
      }
    } finally {
      setSending(false);
    }
  };

  const vote = async (choice: 'join' | 'pass') => {
    updatePilot(teamId, { vote: choice, ended: true });
    if (choice === 'join') {
      await unlockTeam(teamId);
      router.push(`/team/${teamId}`);
    } else {
      setPassed(true);
    }
  };

  // ── 안건 선택 ──
  if (!pilot.topic) {
    return (
      <AppShell back="/match" title="20분 파일럿 해커톤" hideNav>
        <div className="mx-auto max-w-3xl py-10">
          <p className="label-large text-primary">3단계 · {contest.title}</p>
          <h1 className="mt-2 headline-medium">안건 하나를 골라 20분 안에 같이 풀어 봐요</h1>
          <p className="mt-2 body-large text-on-surface-variant">
            AI 팀원 3명({mates.map((m) => m.nickname).join(', ')})이 각자의 응답 성향대로 반응해요. 끝나면 비공개로 투표하고, 모두 원할 때만 팀이 확정돼요.
          </p>
          <div className="mt-8 space-y-3">
            {contest.pilotTopics.map((t, i) => (
              <button key={t} type="button" onClick={() => start(t)} className="state-layer flex w-full items-center gap-4 rounded-m3-lg border border-outline-variant p-5 text-left">
                <span className="tabular grid size-10 shrink-0 place-items-center rounded-full bg-secondary-container title-medium text-on-secondary-container">{i + 1}</span>
                <span className="flex-1 title-medium">{t}</span>
                <Icon name="play_arrow" className="text-primary" />
              </button>
            ))}
          </div>
          <p className="mt-6 body-small text-on-surface-variant">채팅 상대는 실제 사람이 아니라 응답 기반 AI 페르소나예요. 실제 행동을 예측하지 않아요.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      back="/match"
      title="파일럿 해커톤"
      hideNav
      actions={
        <div className="flex items-center gap-2">
          <span
            className={cx(
              'tabular rounded-full px-3 py-1.5 title-medium',
              left < 60000 && !pilot.ended ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface',
            )}
            aria-live="polite"
            aria-label={`남은 시간 ${mm}분 ${ss}초`}
          >
            {pilot.ended ? '종료' : `${mm}:${ss}`}
          </span>
        </div>
      }
    >
      <div className="grid gap-6 py-6 lg:grid-cols-[1fr_360px]">
        <section className="flex min-h-[70dvh] flex-col overflow-hidden rounded-m3-xl border border-outline-variant">
          <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="label-medium text-on-surface-variant">안건</p>
              <p className="title-small">{pilot.topic}</p>
            </div>
            {!pilot.ended && (
              <div className="flex gap-2">
                <Button variant="text" icon="fast_forward" onClick={() => updatePilot(teamId, { endsAt: Date.now() + 30000 })}>
                  시연용 30초 단축
                </Button>
                <Button
                  variant="tonal"
                  icon="how_to_vote"
                  onClick={() => {
                    updatePilot(teamId, { ended: true });
                    setVoteOpen(true);
                  }}
                >
                  종료 & 투표
                </Button>
              </div>
            )}
          </div>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: '62dvh' }}>
            {pilot.messages.map((m) => (
              <div key={m.id} className={cx('enter flex gap-2', m.isUser && 'flex-row-reverse')}>
                {!m.isUser && <Monogram name={m.senderNickname} size={32} tone="secondary" />}
                <div className={cx('max-w-[80%]', m.isUser && 'text-right')}>
                  {!m.isUser && <p className="mb-1 label-medium text-on-surface-variant">{m.senderNickname}</p>}
                  <p
                    className={cx(
                      'inline-block rounded-[20px] px-4 py-2.5 text-left body-medium',
                      m.isUser ? 'rounded-br-[6px] bg-primary text-on-primary' : 'rounded-tl-[6px] bg-surface-container-high text-on-surface',
                    )}
                  >
                    {m.text}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <p className="flex items-center gap-2 body-small text-on-surface-variant">
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1.5 animate-bounce rounded-full bg-outline" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
                팀원이 답하는 중
              </p>
            )}
          </div>

          <form
            className="flex items-end gap-2 border-t border-outline-variant p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={pilot.ended}
              rows={1}
              placeholder={pilot.ended ? '파일럿이 끝났어요' : '메시지 입력 (Enter 전송, Shift+Enter 줄바꿈)'}
              className="max-h-32 min-h-12 flex-1 resize-none rounded-[24px] bg-surface-container-highest px-5 py-3 body-large text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary"
            />
            <IconButton icon="send" label="보내기" variant="filled" type="submit" disabled={!draft.trim() || sending || pilot.ended} className="size-12" />
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-m3-xl border border-outline-variant bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="title-medium">1페이지 공유 메모</h2>
              <span className="label-small text-on-surface-variant">모두가 같이 봐요</span>
            </div>
            {pilot.pendingPatch && (
              <div className="enter mt-4 rounded-m3-md bg-tertiary-container p-3 text-on-tertiary-container">
                <p className="label-medium">팀원이 메모를 이렇게 채우자고 했어요</p>
                {Object.entries(pilot.pendingPatch).map(([k, v]) => (
                  <p key={k} className="mt-1 body-small">
                    <b>{MEMO_FIELDS.find((f) => f.key === k)?.label}</b> {v}
                  </p>
                ))}
                <div className="mt-2 flex justify-end gap-1">
                  <Button variant="text" className="h-8" onClick={() => updatePilot(teamId, { pendingPatch: null })}>
                    무시
                  </Button>
                  <Button
                    variant="filled"
                    icon="check"
                    className="h-8"
                    onClick={() => updatePilot(teamId, { workspace: { ...pilot.workspace, ...pilot.pendingPatch }, pendingPatch: null })}
                  >
                    반영
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-4 space-y-4">
              {MEMO_FIELDS.map((f) => (
                <TextArea
                  key={f.key}
                  label={f.label}
                  value={pilot.workspace[f.key]}
                  onChange={(e) => updatePilot(teamId, { workspace: { ...pilot.workspace, [f.key]: e.target.value } })}
                  supporting={f.hint}
                  disabled={pilot.ended}
                />
              ))}
            </div>
          </div>

          <div className="rounded-m3-xl border border-outline-variant p-5">
            <h2 className="mb-3 title-small text-on-surface-variant">AI 팀원</h2>
            <ul className="space-y-3">
              {mates.map((m) => {
                const top = (['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'] as const).reduce((a, b) => (m.features27[b] > m.features27[a] ? b : a));
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <Monogram name={m.nickname} size={32} tone="secondary" />
                    <div>
                      <p className="title-small">{m.nickname}</p>
                      <p className="body-small text-on-surface-variant">
                        {ROLE_LABEL[top]} · {m.collabType}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {pilot.ended && !voteOpen && (
            <div className="rounded-m3-xl bg-secondary-container p-5 text-on-secondary-container">
              {pilot.vote === 'pass' || passed ? (
                <>
                  <p className="title-medium">이번에는 넘기기로 했어요</p>
                  <p className="mt-1 body-medium">상대에게 알림은 가지 않아요. 다른 조합도 둘러보세요.</p>
                  <Button className="mt-4" href="/match" variant="filled">
                    다른 조합 보기
                  </Button>
                </>
              ) : (
                <>
                  <p className="title-medium">파일럿이 끝났어요</p>
                  <Button className="mt-4" icon="how_to_vote" onClick={() => setVoteOpen(true)}>
                    투표하기
                  </Button>
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      <Dialog
        open={voteOpen}
        onClose={() => setVoteOpen(false)}
        icon="how_to_vote"
        title="이 팀과 함께할까요?"
        actions={
          <>
            <Button variant="text" onClick={() => { setVoteOpen(false); vote('pass'); }}>
              이번엔 넘길게요
            </Button>
            <Button icon="favorite" onClick={() => { setVoteOpen(false); vote('join'); }}>
              함께할래요
            </Button>
          </>
        }
      >
        <p className="text-center">투표는 비공개예요. 네 명 모두 ‘함께할래요’를 고른 경우에만 팀이 확정되고 실명과 CV가 열려요. 넘겨도 상대에게 알림은 가지 않아요.</p>
        <div className="mt-4 rounded-m3-md bg-surface-container-highest p-3 text-left body-small">
          <p><b>문제</b> {pilot.workspace.problemStatement || '—'}</p>
          <p className="mt-1"><b>아이디어</b> {pilot.workspace.solutionIdea || '—'}</p>
          <p className="mt-1"><b>역할</b> {pilot.workspace.roleSplit || '—'}</p>
        </div>
      </Dialog>

      <Link href="/match" className="sr-only">
        매칭으로 돌아가기
      </Link>
    </AppShell>
  );
}
