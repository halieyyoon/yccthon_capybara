'use client';

// 소유: 규혁 — 7) `/team/[teamId]` 팀 확정 & 실명·CV 언락

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types/ondo';
import { SKILL_CARD_BY_ID, TEMPERATURE_BY_ID } from '@/data/constants';
import { SEED_CONTESTS } from '@/data/seedContests';
import { Button, cx, Dialog, Icon, InfoTip, LinearProgress, Monogram, Snackbar } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/AppShell';
import { TeamPuzzleMerge } from '@/components/TeamPuzzleMerge';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';
import { pieceOf } from '@/store/pieceTypes';

function CvView({ m }: { m: UserProfile }) {
  const cv = m.cv;
  const rows: [string, React.ReactNode][] = [
    ['기본 정보', [cv.university, cv.major, cv.grade].filter(Boolean).join(' · ') + (cv.headline ? ` — ${cv.headline}` : '')],
    [
      '경험',
      cv.experiences.length ? (
        <ul className="space-y-2">
          {cv.experiences.map((e, i) => (
            <li key={i}>
              <p className="title-small text-on-surface">
                {e.title} <span className="body-small text-on-surface-variant">· {e.role} · {e.period}</span>
              </p>
              <p>{e.summary}</p>
            </li>
          ))}
        </ul>
      ) : (
        '—'
      ),
    ],
    ['기술 · 언어', [...cv.skills, ...cv.languages].join(', ') || '—'],
    ['AI 활용', [cv.aiTools.join(', '), cv.aiUsageNote].filter(Boolean).join(' — ') || '—'],
    ['협업 방식', cv.collaborationNote || '—'],
  ];
  return (
    <dl className="space-y-4">
      {rows.map(([k, v], i) => (
        <div key={k} className="grid gap-1 sm:grid-cols-[96px_1fr]">
          <dt className="label-large text-on-surface">
            <span className="tabular mr-1 text-primary">{i + 1}</span>
            {k}
          </dt>
          <dd className="body-medium text-on-surface-variant">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const hydrated = useHydrated();
  const user = useOndoStore((s) => s.currentUser);
  const team = useOndoStore((s) => s.savedTeams[teamId] ?? s.recommendedTeams.find((t) => t.id === teamId));
  const unlocked = useOndoStore((s) => s.unlockedTeamIds.includes(teamId));
  const meeting = useOndoStore((s) => s.avatarMeetings[teamId]);
  const accepted = useOndoStore((s) => s.consentCount[teamId] ?? 1);
  const unlockTeam = useOndoStore((s) => s.unlockTeam);
  const myPiece = useOndoStore((s) => s.myPiece);

  const [revealed, setRevealed] = useState(false);
  const [cvOf, setCvOf] = useState<UserProfile | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocked) return;
    const t = setTimeout(() => setRevealed(true), 1100);
    return () => clearTimeout(t);
  }, [unlocked]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;
  if (!team) {
    return (
      <AppShell back="/match" title="팀">
        <div className="mx-auto max-w-md py-24 text-center">
          <p className="title-large">팀 정보를 찾을 수 없어요</p>
          <Button className="mt-6" href="/match">
            팀 찾기
          </Button>
        </div>
      </AppShell>
    );
  }

  if (team.status === 'EXPIRED') {
    return (
      <AppShell back="/match" title="팀">
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

  if (!unlocked) {
    const waiting = team.status === 'WAITING_CONSENT';
    return (
      <AppShell back="/match" title="팀">
        <div className="mx-auto max-w-sm py-20 text-center">
          <Icon name="lock" size={36} className="text-outline" />
          {waiting ? (
            <>
              <p className="tabular mt-4 display-small">
                {accepted}
                <span className="headline-small text-on-surface-variant">/4</span>
              </p>
              <p className="flex items-center justify-center gap-1 label-large">
                수락
                <InfoTip>누가 먼저 눌렀는지는 보이지 않고, 수락 인원 수만 보여요.</InfoTip>
              </p>
              <LinearProgress className="mt-5" value={accepted / 4} />
            </>
          ) : (
            <>
              <p className="mt-4 flex items-center justify-center gap-1 title-large">
                아직 확정 전
                <InfoTip>네 명 모두 수락해야 실명과 CV가 열려요.</InfoTip>
              </p>
              <Button className="mt-6" icon="waving_hand" onClick={() => unlockTeam(team.id)}>
                바로 만나볼래요
              </Button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const contest = SEED_CONTESTS.find((c) => c.id === team.contestId)!;
  // 현재 유저는 저장소의 최신 프로필(CV 수정 반영)을 사용
  const members = team.members.map((m, i) => (i === 0 ? user : m));
  const questions = meeting?.questionsToAskTeam ?? ['기능 추가를 멈추는 시점을 언제로 할까요?', 'AI로 만든 결과물은 누가 확인할까요?', '수상과 완주 중 무엇이 목표인가요?'];
  const chatLink = `https://ondo.example/chat/${team.id}`;

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnack(done);
    } catch {
      setSnack('복사하지 못했어요');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-10">
        <div className="text-center">
          <p className="label-large text-primary">{contest.title}</p>
          <h1 className="mt-2 headline-large">팀이 맞춰졌어요</h1>
        </div>

        <div className="mt-8 flex justify-center">
          <TeamPuzzleMerge team={{ ...team, members }} unlocked pieceCodes={members.map((m) => pieceOf(m, user.id, myPiece))} />
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {members.map((m, i) => {
            const name = m.cv.realName || m.nickname;
            return (
              <li key={m.id} className="flex items-center gap-4 rounded-m3-lg bg-surface-container-low p-4">
                <Monogram name={revealed ? name : m.nickname} tone={i === 0 ? 'primary' : 'secondary'} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="relative h-7 overflow-hidden">
                    <p className={cx('absolute inset-0 title-large transition-all duration-500 ease-m3', revealed ? '-translate-y-full opacity-0' : 'opacity-100')}>{m.nickname}</p>
                    <p className={cx('absolute inset-0 title-large transition-all duration-500 ease-m3', revealed ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0')}>
                      {name}
                      {i === 0 && <span className="ml-1 body-medium text-primary">나</span>}
                    </p>
                  </div>
                  <p className="body-small text-on-surface-variant">
                    {revealed ? `${m.nickname} · ` : ''}
                    {m.cv.major} {m.cv.grade} · <span className="tabular">{TEMPERATURE_BY_ID[m.temperatureMode].temperature}°</span>
                  </p>
                  <p className="mt-1 body-small text-on-surface">잘하는 것 · {m.strengths.map((s) => SKILL_CARD_BY_ID[s].strength).join(', ')}</p>
                </div>
                <Button variant="text" onClick={() => setCvOf(m)} disabled={!revealed}>
                  CV
                </Button>
              </li>
            );
          })}
        </ul>

        <section className="mt-8 rounded-m3-xl bg-surface-container p-6">
          <h2 className="flex items-center gap-1 title-large">
            첫 회의에서 확인할 것
            <InfoTip align="start">{meeting ? 'AI 모의회의에서 남은 쟁점으로 뽑은 질문이에요.' : '추천 근거에서 뽑은 질문이에요.'} 가장 큰 차이: {team.biggestGapNote}</InfoTip>
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 body-large">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="tonal" icon="link" onClick={() => copy(chatLink, '오픈채팅 링크 복사됨 (시연용 주소)')}>
              오픈채팅 링크 복사
            </Button>
            <Button icon="content_copy" onClick={() => copy(questions.map((q, i) => `${i + 1}. ${q}`).join('\n'), '질문 복사됨')}>
              첫 회의 질문 복사
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={!!cvOf} onClose={() => setCvOf(null)} title={cvOf ? `${cvOf.cv.realName || cvOf.nickname}의 CV` : ''} wide>
        {cvOf && <CvView m={cvOf} />}
      </Dialog>
      <Snackbar message={snack} onDone={() => setSnack(null)} />
    </AppShell>
  );
}
