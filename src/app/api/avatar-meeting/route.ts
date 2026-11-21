// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/app/api/)
// POST /api/avatar-meeting — { contest, team } → AvatarMeetingResult
// AI 아바타 모의회의는 행동 예측이 아니라 사전 쟁점을 드러내는 가상 실험입니다.

import { NextResponse } from 'next/server';
import type { AvatarMeetingResult, AvatarTurn, Contest, TeamCandidate } from '@/types/ondo';
import { ROLE_LABEL } from '@/data/constants';
import { callGeminiJson, personaOf, topRole } from '../_lib/gemini';

const AGENDA = '20분 안에 이번 대회의 핵심 MVP 기능 1개와 역할 분담 합의하기';

function fallback(contest: Contest, team: TeamCandidate): AvatarMeetingResult {
  const [a, b, c, d] = team.members;
  const role = (u: typeof a) => ROLE_LABEL[topRole(u)];
  const topic = contest.pilotTopics[0] ?? contest.summary;
  const fastest = [...team.members].sort((x, y) => y.features27.prototyping_preference - x.features27.prototyping_preference)[0];
  const careful = [...team.members].sort((x, y) => y.features27.quality_priority - x.features27.quality_priority)[0];
  const aiStrict = [...team.members].sort((x, y) => y.features27.ai_verification_strictness - x.features27.ai_verification_strictness)[0];
  const turns: AvatarTurn[] = [
    { speakerId: a.id, speakerNickname: a.nickname, roleTag: role(a), message: `안건은 “${topic}”예요. 저는 사용자가 처음 30초 안에 가치를 느끼는 기능 하나만 남기고 싶어요.` },
    { speakerId: fastest.id, speakerNickname: fastest.nickname, roleTag: role(fastest), message: '오늘 밤 안에 클릭되는 화면부터 만들어 보고, 내일 아침에 고치면 어떨까요?' },
    { speakerId: careful.id, speakerNickname: careful.nickname, roleTag: role(careful), message: '빨리 만드는 건 좋은데, 시연 흐름이 끊기면 감점이 커요. 범위를 한 번 더 줄이자는 쪽이에요.' },
    { speakerId: aiStrict.id, speakerNickname: aiStrict.nickname, roleTag: role(aiStrict), message: 'AI로 코드를 써도 되지만, 누가 어떤 부분을 검증할지는 지금 정해 두고 싶어요.' },
    { speakerId: b.id, speakerNickname: b.nickname, roleTag: role(b), message: `그럼 핵심 기능은 하나로 묶고, 저는 ${role(b)} 쪽을 맡을게요.` },
    { speakerId: d?.id ?? c.id, speakerNickname: d?.nickname ?? c.nickname, roleTag: role(d ?? c), message: '좋아요. 발표 자료는 마지막 4시간 전에 동결하는 걸로 해요.' },
  ];
  return {
    teamId: team.id,
    contestTitle: contest.title,
    agenda: AGENDA,
    turns,
    consensus: `핵심 기능 1개만 시연 범위로 정하고, 첫날 밤까지 클릭 가능한 화면을 만든 뒤 둘째 날 다듬는다.`,
    unresolvedIssues: [
      `${fastest.nickname}님은 먼저 만들자는 쪽, ${careful.nickname}님은 범위를 더 줄이자는 쪽이에요. 기능 동결 시점을 정해야 해요.`,
      'AI로 쓴 코드를 누가, 언제 확인할지 아직 정하지 않았어요.',
    ],
    expectedRoleSplit: team.members.map((m) => `${m.nickname} — ${role(m)}`),
    questionsToAskTeam: [
      '기능 추가를 멈추는 시점을 몇 시로 할까요?',
      'AI로 만든 코드는 누가 검토하고 합칠까요?',
      '수상이 목표인지, 완주가 목표인지 한 문장으로 맞춰 볼까요?',
    ],
    chemistryBadge: '속도와 완성도 사이 조율형',
  };
}

export async function POST(req: Request) {
  let body: { contest: Contest; team: TeamCandidate };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { contest, team } = body;
  if (!contest || !team?.members?.length) return NextResponse.json({ error: 'contest and team required' }, { status: 400 });

  const prompt = `너는 대학생 해커톤 팀 매칭 서비스 On-do의 "AI 아바타 사전 모의회의" 진행자다.
아래 4명의 익명 페르소나(설문 응답 근거)를 바탕으로, 공통 안건에 대해 6턴 가상 회의를 한국어 구어체로 만들어라.
- 이건 실제 행동 예측이 아니라, 응답 차이에서 생길 수 있는 쟁점을 미리 드러내는 가상 실험이다.
- 각 발언은 그 사람의 응답(목표·AI 규범·작업 방식·역량·지뢰)에 근거해야 한다. 과장, 점수, 퍼센트, '궁합' 같은 말은 쓰지 마라.
- 6턴, 발언당 1~2문장. 4명이 모두 한 번 이상 말한다.
대회: ${contest.title} — ${contest.summary}
안건: ${AGENDA}
참고 주제: ${contest.pilotTopics.join(' / ')}
페르소나: ${JSON.stringify(team.members.map(personaOf))}

JSON으로만 답하라:
{"turns":[{"speakerId":"","speakerNickname":"","roleTag":"","message":""}],"consensus":"","unresolvedIssues":["",""],"expectedRoleSplit":["닉네임 — 역할"],"questionsToAskTeam":["","",""],"chemistryBadge":"8자 안팎의 짧은 팀 성향 이름"}`;

  const ai = await callGeminiJson<Omit<AvatarMeetingResult, 'teamId' | 'contestTitle' | 'agenda'>>(prompt);
  if (ai && Array.isArray(ai.turns) && ai.turns.length >= 4 && ai.consensus) {
    return NextResponse.json({ ...ai, teamId: team.id, contestTitle: contest.title, agenda: AGENDA, source: 'gemini' });
  }
  return NextResponse.json({ ...fallback(contest, team), source: 'fallback' });
}
