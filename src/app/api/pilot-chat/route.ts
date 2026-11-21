// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/app/api/)
// POST /api/pilot-chat — { contestTitle, topic, teamMembers, messages, workspace, userMessage }
//   → { replies: PilotMessage[], suggestedWorkspacePatch?: Partial<PilotWorkspace> }

import { NextResponse } from 'next/server';
import type { PilotMessage, PilotWorkspace, UserProfile } from '@/types/ondo';
import { ROLE_LABEL } from '@/data/constants';
import { callGeminiJson, personaOf, topRole } from '../_lib/gemini';

interface Body {
  contestTitle: string;
  topic: string;
  teamMembers: UserProfile[];
  messages: PilotMessage[];
  workspace: PilotWorkspace;
  userMessage: string;
}

const now = () => new Date().toISOString();
const mid = () => Math.random().toString(36).slice(2, 10);

function fallback(b: Body): { replies: PilotMessage[]; suggestedWorkspacePatch?: Partial<PilotWorkspace> } {
  const turn = b.messages.filter((m) => m.isUser).length;
  const members = b.teamMembers;
  const first = members[turn % members.length];
  const second = members[(turn + 1) % members.length];
  const role = (u: UserProfile) => ROLE_LABEL[topRole(u)];
  const said = b.userMessage.trim();

  const linesA = [
    `좋아요. “${said.slice(0, 30)}${said.length > 30 ? '…' : ''}” 이걸 문제 정의 칸에 한 줄로 적어 둘게요.`,
    `${role(first)} 입장에서는 첫 화면 하나만 확실하면 될 것 같아요. 버튼 하나로 끝나는 흐름이면 좋겠어요.`,
    '그럼 오늘 할 건 화면 2개로 줄이죠. 나머지는 발표에서 “다음 단계”로 말하면 돼요.',
    '마감 30분 전에는 기능 추가 멈추고 시연 리허설만 하는 걸로 해요.',
  ];
  const linesB = [
    `저는 ${role(second)} 쪽을 맡을게요. 근거 자료가 필요하면 바로 찾아 올게요.`,
    'AI로 초안 뽑는 건 좋은데, 시연 데이터는 우리가 직접 확인해요.',
    `사용자가 누구인지 한 명으로 좁히면 아이디어가 더 선명해질 것 같아요.`,
    '역할은 지금 적어 둔 대로 가요. 막히면 바로 채팅에 말하기로 하고요.',
  ];
  const replies: PilotMessage[] = [
    { id: mid(), senderId: first.id, senderNickname: first.nickname, isUser: false, text: linesA[turn % linesA.length], timestamp: now() },
  ];
  if (turn % 2 === 0)
    replies.push({ id: mid(), senderId: second.id, senderNickname: second.nickname, isUser: false, text: linesB[turn % linesB.length], timestamp: now() });

  let patch: Partial<PilotWorkspace> | undefined;
  if (!b.workspace.problemStatement) patch = { problemStatement: `${b.topic} — ${said.slice(0, 60)}` };
  else if (!b.workspace.solutionIdea) patch = { solutionIdea: `${said.slice(0, 80)} (첫 화면 1개 + 핵심 버튼 1개로 시연)` };
  else if (!b.workspace.roleSplit) patch = { roleSplit: members.map((m) => `${m.nickname}: ${role(m)}`).join(' / ') };
  return { replies, suggestedWorkspacePatch: patch };
}

export async function POST(req: Request) {
  let b: Body;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!b?.teamMembers?.length || !b.userMessage) return NextResponse.json({ error: 'teamMembers and userMessage required' }, { status: 400 });

  const history = b.messages.slice(-12).map((m) => `${m.senderNickname}: ${m.text}`).join('\n');
  const prompt = `너는 20분 파일럿 해커톤 채팅방의 AI 팀원 3명을 연기한다. 각 팀원은 아래 익명 페르소나의 설문 응답 성향과 역량에 맞는 말투로 말한다.
- 사용자의 방금 메시지에 맥락상 가장 어울리는 1~2명만 짧게(1~2문장) 답한다. 한국어 메신저 말투.
- 실제 사람이 아니라 응답 기반 AI 페르소나다. 과장·점수·퍼센트 금지.
- 공유 메모(문제/아이디어/역할) 중 비어 있거나 다듬을 칸이 있으면 suggestedWorkspacePatch로 한 칸만 제안한다.
대회: ${b.contestTitle}
안건: ${b.topic}
팀원 페르소나: ${JSON.stringify(b.teamMembers.map(personaOf))}
현재 공유 메모: ${JSON.stringify(b.workspace)}
최근 대화:
${history}
사용자: ${b.userMessage}

JSON으로만 답하라:
{"replies":[{"senderId":"페르소나 id","text":""}],"suggestedWorkspacePatch":{"problemStatement"?:"","solutionIdea"?:"","roleSplit"?:""}}`;

  const ai = await callGeminiJson<{ replies: { senderId: string; text: string }[]; suggestedWorkspacePatch?: Partial<PilotWorkspace> }>(prompt);
  if (ai?.replies?.length) {
    const byId = new Map(b.teamMembers.map((m) => [m.id, m]));
    const replies: PilotMessage[] = ai.replies
      .filter((r) => byId.has(r.senderId) && r.text)
      .slice(0, 2)
      .map((r) => ({ id: mid(), senderId: r.senderId, senderNickname: byId.get(r.senderId)!.nickname, isUser: false, text: r.text, timestamp: now() }));
    if (replies.length) {
      const patch = ai.suggestedWorkspacePatch && Object.keys(ai.suggestedWorkspacePatch).length ? ai.suggestedWorkspacePatch : undefined;
      return NextResponse.json({ replies, suggestedWorkspacePatch: patch, source: 'gemini' });
    }
  }
  return NextResponse.json({ ...fallback(b), source: 'fallback' });
}
