// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/app/api/)
// Gemini REST 호출 공용 함수. 키가 없거나 실패하면 null을 돌려주고, 각 라우트가 폴백을 씁니다.

import type { UserProfile } from '@/types/ondo';
import { DEAL_BREAKER_BY_ID, ROLE_LABEL, SKILL_CARD_BY_ID, TEMPERATURE_BY_ID } from '@/data/constants';

const MODEL = 'gemini-2.5-flash';

export async function callGeminiJson<T>(
  prompt: string,
  inlineFile?: { mimeType: string; data: string },
): Promise<T | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const parts: unknown[] = [{ text: prompt }];
    if (inlineFile) parts.push({ inline_data: { mime_type: inlineFile.mimeType, data: inlineFile.data } });
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** LLM에 보내는 익명 페르소나 요약. 실명·이메일·CV 원문은 포함하지 않습니다. */
export function personaOf(u: UserProfile) {
  const x = u.features27;
  return {
    id: u.id,
    nickname: u.nickname,
    temperature: `${TEMPERATURE_BY_ID[u.temperatureMode].label} (${u.temperature}°)`,
    preferredRoles: u.preferredRoles.map((r) => ROLE_LABEL[r]),
    goals: {
      수상우선: x.winning_orientation,
      학습우선: x.learning_priority,
      완성제출우선: x.delivery_priority,
      지속의향: x.continuation_intent,
    },
    aiNorms: {
      AI사용허용: x.ai_use_permissiveness,
      AI결과검증: x.ai_verification_strictness,
      AI사용공개: x.ai_disclosure_preference,
    },
    workStyle: {
      빠른프로토타입: x.prototyping_preference,
      도전성향: x.risk_appetite,
      완성도우선: x.quality_priority,
      결정규칙명확화: x.decision_structure_preference,
    },
    skills0to4: {
      기획: x.planning,
      프론트엔드: x.frontend,
      백엔드: x.backend,
      디자인: x.design,
      데이터AI: x.data_ai,
      발표: x.presentation,
    },
    strengths: u.strengths.map((s) => SKILL_CARD_BY_ID[s].strength),
    weaknesses: u.weaknesses.map((s) => SKILL_CARD_BY_ID[s].weakness),
    dealBreakers: u.dealBreakers.map((d) => DEAL_BREAKER_BY_ID[d].label),
  };
}

export function topRole(u: UserProfile) {
  const x = u.features27;
  const roles = ['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'] as const;
  return [...roles].sort((a, b) => x[b] - x[a])[0];
}
