'use client';

// 소유: 규혁 — 7) `/team/[teamId]` 팀 확정 & 실명·CV 언락

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types/ondo';
import { SKILL_CARD_BY_ID, TEMPERATURE_BY_ID } from '@/data/constants';
import { SEED_CONTESTS } from '@/data/seedContests';
import { Button, cx, Dialog, Icon, LinearProgress, Monogram, Snackbar } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/ondo/AppShell';
import { TeamPuzzleMerge } from '@/components/ondo/TeamPuzzleMerge';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';

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
        '아직 적지 않았어요'
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
  const team = useOndoStore((s) => s.recommendedTeams.find((t) => t.id === teamId));
  const unlocked = useOndoStore((s) => s.unlockedTeamIds.includes(teamId));
  const meeting = useOndoStore((s) => s.avatarMeetings[teamId]);
  const unlockTeam = useOndoStore((s) => s.unlockTeam);

  const [merged, setMerged] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [cvOf, setCvOf] = useState<UserProfile | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocked) return;
    const a = setTimeout(() => setMerged(true), 250);
    const b = setTimeout(() => setRevealed(true), 1100);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [unlocked]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;
  if (!team) {
    return (
      <AppShell back="/match" title="팀">
        <div className="mx-auto max-w-md py-24 text-center">
          <h2 className="headline-small">이 팀 정보를 찾을 수 없어요</h2>
          <Button className="mt-6" href="/match">
            팀 찾기로 가기
          </Button>
        </div>
      </AppShell>
    );
  }

  const contest = SEED_CONTESTS.find((c) => c.id === team.contestId)!;
  // 현재 유저는 저장소의 최신 프로필(CV 수정 반영)을 사용
  const members = team.members.map((m, i) => (i === 0 ? user : m));
  const questions = meeting?.questionsToAskTeam ?? [
    '기능 추가를 멈추는 시점을 언제로 할까요?',
    'AI로 만든 결과물은 누가, 언제 확인할까요?',
    '수상이 목표인지, 완주가 목표인지 한 문장으로 맞춰 볼까요?',
  ];
  const chatLink = `https://ondo.example/chat/${team.id}`;

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnack(done);
    } catch {
      setSnack('복사하지 못했어요. 브라우저 권한을 확인해 주세요.');
    }
  };

  if (!unlocked) {
    const waiting = team.status === 'WAITING_CONSENT';
    return (
      <AppShell back="/match" title="팀">
        <div className="mx-auto max-w-md py-20 text-center">
          <Icon name="lock" size={40} className="text-outline" />
          <h2 className="mt-4 headline-small">{waiting ? '수락을 기다리는 중이에요' : '아직 확정되지 않은 팀이에요'}</h2>
          <p className="mt-2 body-medium text-on-surface-variant">네 명 모두 수락해야 실명과 CV가 열려요. 누가 먼저 요청했는지는 보이지 않아요.</p>
          {waiting ? (
            <LinearProgress className="mt-6" />
          ) : (
            <Button className="mt-6" icon="waving_hand" onClick={() => unlockTeam(team.id)}>
              바로 만나볼래요
            </Button>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl py-10">
        <div className="text-center">
          <p className="label-large text-primary">{contest.title}</p>
          <h1 className="mt-2 headline-large">팀이 맞춰졌어요</h1>
          <p className="mt-2 body-large text-on-surface-variant">네 명 모두 수락했어요. 이제 서로의 이름과 CV를 볼 수 있어요.</p>
        </div>

        <div className="mt-10 flex justify-center">
          <TeamPuzzleMerge members={members} pairs={team.puzzlePairs} merged={merged} showPairs={false} size={190} />
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2">
          {members.map((m, i) => {
            const name = m.cv.realName || m.nickname;
            return (
              <li key={m.id} className="flex items-center gap-4 rounded-m3-lg border border-outline-variant p-4">
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
                  <p className="mt-1 body-small text-on-surface">凸 {m.strengths.map((s) => SKILL_CARD_BY_ID[s].strength).join(', ')}</p>
                </div>
                <Button variant="text" onClick={() => setCvOf(m)} disabled={!revealed}>
                  CV
                </Button>
              </li>
            );
          })}
        </ul>

        <section className="mt-10 rounded-m3-xl bg-surface-container p-6">
          <h2 className="title-large">첫 회의에서 확인할 것</h2>
          <p className="mt-1 body-medium text-on-surface-variant">{meeting ? 'AI 모의회의에서 남은 쟁점으로 뽑은 질문이에요.' : '추천 근거에서 뽑은 질문이에요.'}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 body-large">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
          <p className="mt-4 body-medium text-on-surface-variant">
            <b className="text-on-surface">가장 큰 차이</b> {team.biggestGapNote}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="tonal" icon="link" onClick={() => copy(chatLink, '오픈채팅 링크를 복사했어요. (시연용 예시 주소)')}>
              오픈채팅 링크 복사
            </Button>
            <Button icon="content_copy" onClick={() => copy(questions.map((q, i) => `${i + 1}. ${q}`).join('\n'), '첫 회의 질문을 복사했어요.')}>
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
