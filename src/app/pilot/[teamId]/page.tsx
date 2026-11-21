'use client';

// 소유: 규혁 — 6) `/pilot/[teamId]` 3단계 20분 파일럿 해커톤
// 화면 흐름(안건 선택 → 타이머 → 투표 → 확정/조용히 종료)은 페이지가, 방 UI는 계약 컴포넌트 PilotRoomView가 담당합니다.

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PilotMessage, PilotWorkspace } from '@/types/ondo';
import { SEED_CONTESTS } from '@/data/seedContests';
import { Button, Dialog, Icon, InfoTip } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/AppShell';
import { PilotRoomView } from '@/components/PilotRoomView';
import { emptyPilot, useHydrated, useOndoStore } from '@/store/useOndoStore';

const DURATION_MS = 20 * 60 * 1000;

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
  const passTeam = useOndoStore((s) => s.passTeam);

  const [typing, setTyping] = useState(false);
  const [voteOpen, setVoteOpen] = useState(false);

  const running = !!pilot.endsAt && !pilot.ended;
  const now = useNow(running);
  const leftMs = pilot.endsAt ? Math.max(0, pilot.endsAt - now) : DURATION_MS;

  useEffect(() => {
    if (running && leftMs === 0) {
      updatePilot(teamId, { ended: true });
      setVoteOpen(true);
    }
  }, [running, leftMs, teamId, updatePilot]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;
  if (!team) {
    return (
      <AppShell back="/match" title="파일럿">
        <div className="mx-auto max-w-md py-24 text-center">
          <p className="title-large">팀 정보를 찾을 수 없어요</p>
          <Button className="mt-6" href="/match">
            팀 찾기
          </Button>
        </div>
      </AppShell>
    );
  }

  const contest = SEED_CONTESTS.find((c) => c.id === team.contestId)!;
  const mates = team.members.slice(1);

  // 조용히 종료된 조합 (넘기기·다음 기회에)
  if (team.status === 'EXPIRED') {
    return (
      <AppShell back="/match" title="파일럿">
        <div className="mx-auto grid max-w-md place-items-center gap-3 py-24 text-center">
          <Icon name="nights_stay" size={36} className="text-outline" />
          <p className="title-large">이번 주 금요일 밤 새 퍼즐 조합이 도착해요</p>
          <Button className="mt-4" href="/match" variant="tonal">
            다른 조합 보기
          </Button>
        </div>
      </AppShell>
    );
  }

  const start = (topic: string) => {
    const first = mates[0];
    const greet: PilotMessage = {
      id: 'greet',
      senderId: first.id,
      senderNickname: first.nickname,
      isUser: false,
      text: `“${topic}” 이걸로 20분 해 봐요. 누구의 문제인지부터 한 줄로 정해 볼까요?`,
      timestamp: new Date().toISOString(),
    };
    updatePilot(teamId, { ...emptyPilot(), topic, endsAt: Date.now() + DURATION_MS, messages: [greet] });
    setTeamStatus(teamId, 'PILOT_ACTIVE');
  };

  const send = async (text: string) => {
    if (!pilot.topic) return;
    const mine: PilotMessage = { id: `u-${Date.now()}`, senderId: user.id, senderNickname: user.nickname, isUser: true, text, timestamp: new Date().toISOString() };
    const messages = [...pilot.messages, mine];
    updatePilot(teamId, { messages });
    setTyping(true);
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
      setTyping(false);
    }
  };

  const vote = async (choice: 'join' | 'pass') => {
    setVoteOpen(false);
    if (choice === 'pass') {
      passTeam(teamId); // EXPIRED — 거절 알림 없이 조용히 종료
      return;
    }
    updatePilot(teamId, { vote: 'join', ended: true });
    await unlockTeam(teamId);
    router.push(`/team/${teamId}`);
  };

  // ── 안건 선택 ──
  if (!pilot.topic) {
    return (
      <AppShell back="/match" title="20분 파일럿" hideNav>
        <div className="mx-auto max-w-3xl py-10">
          <p className="label-large text-primary">3단계 · {contest.title}</p>
          <h1 className="mt-2 flex items-center gap-1 headline-medium">
            안건 하나 고르기
            <InfoTip align="start">AI 팀원 3명({mates.map((m) => m.nickname).join(', ')})과 20분 안에 같이 풀어 봐요. 끝나면 비공개로 투표하고, 모두 원할 때만 팀이 확정돼요.</InfoTip>
          </h1>
          <div className="mt-6 space-y-3">
            {contest.pilotTopics.map((t, i) => (
              <button key={t} type="button" onClick={() => start(t)} className="state-layer flex w-full items-center gap-4 rounded-m3-lg bg-surface-container-low p-5 text-left">
                <span className="tabular grid size-10 shrink-0 place-items-center rounded-full bg-secondary-container title-medium text-on-secondary-container">{i + 1}</span>
                <span className="flex-1 title-medium">{t}</span>
                <Icon name="play_arrow" className="text-primary" />
              </button>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell back="/match" title="20분 파일럿" hideNav>
      <div className="py-6">
        <PilotRoomView
          contestTitle={contest.title}
          topic={pilot.topic}
          remainingSec={Math.ceil(leftMs / 1000)}
          members={mates}
          messages={pilot.messages}
          workspace={pilot.workspace}
          isTyping={typing}
          ended={pilot.ended}
          onSendMessage={send}
          onUpdateWorkspace={(patch) => updatePilot(teamId, { workspace: { ...pilot.workspace, ...patch } })}
          onToggleFastDemo={() => updatePilot(teamId, { endsAt: Date.now() + 30000 })}
          onFinish={() => {
            updatePilot(teamId, { ended: true });
            setVoteOpen(true);
          }}
          suggestedPatch={pilot.pendingPatch}
          onApplySuggestedPatch={() => updatePilot(teamId, { workspace: { ...pilot.workspace, ...pilot.pendingPatch }, pendingPatch: null })}
          onDismissSuggestedPatch={() => updatePilot(teamId, { pendingPatch: null })}
        />
        {pilot.ended && !voteOpen && !pilot.vote && (
          <div className="mt-4 flex justify-center">
            <Button icon="how_to_vote" onClick={() => setVoteOpen(true)}>
              투표하기
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={voteOpen}
        onClose={() => setVoteOpen(false)}
        icon="how_to_vote"
        title="이 팀과 본선 갈래요?"
        actions={
          <>
            <Button variant="text" onClick={() => vote('pass')}>
              다음 기회에
            </Button>
            <Button icon="favorite" onClick={() => vote('join')}>
              이 팀으로 본선 갈래요
            </Button>
          </>
        }
      >
        <p className="flex items-center justify-center gap-1">
          비공개 투표
          <InfoTip>네 명 모두 ‘본선 갈래요’를 고른 경우에만 팀이 확정되고 실명·CV가 열려요. ‘다음 기회에’를 골라도 상대에게 알림은 가지 않아요.</InfoTip>
        </p>
        <div className="mt-4 space-y-1 rounded-m3-md bg-surface-container-highest p-3 text-left body-small">
          <p>
            <b>문제</b> {pilot.workspace.problemStatement || '—'}
          </p>
          <p>
            <b>아이디어</b> {pilot.workspace.solutionIdea || '—'}
          </p>
          <p>
            <b>역할</b> {pilot.workspace.roleSplit || '—'}
          </p>
        </div>
      </Dialog>
    </AppShell>
  );
}
