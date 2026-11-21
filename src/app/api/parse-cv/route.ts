// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/app/api/)
// POST /api/parse-cv — multipart/form-data(file) 또는 { rawText } → { cv: Partial<CvTemplate>, suggestedStrengths?: SkillCardId[] }

import { NextResponse } from 'next/server';
import type { CvExperience, CvTemplate, SkillCardId } from '@/types/ondo';
import { SKILL_CARDS } from '@/data/constants';
import { callGeminiJson } from '../_lib/gemini';

const SCHEMA_HINT = `{"cv":{"realName":"","university":"","major":"","grade":"","headline":"","experiences":[{"title":"","role":"","period":"","summary":""}],"skills":[""],"languages":[""],"aiTools":[""],"aiUsageNote":"","collaborationNote":""},"suggestedStrengths":["아래 id 중 최대 2개"]}`;

const CARD_IDS = SKILL_CARDS.map((c) => `${c.id}(${c.strength})`).join(', ');

/** 키 없이도 동작하는 규칙 기반 추출 (샘플 링크드인 텍스트 형식 기준) */
function parseRule(text: string): { cv: Partial<CvTemplate>; suggestedStrengths: SkillCardId[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);
  const sectionOf = (name: RegExp) => {
    const start = lines.findIndex((l) => name.test(l));
    if (start < 0) return [] as string[];
    const out: string[] = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^(경력|경험|기술|스킬|언어|AI 도구|협업|Experience|Skills|Languages)\s*$/i.test(lines[i])) break;
      if (lines[i]) out.push(lines[i]);
    }
    return out;
  };
  const eduLine = nonEmpty.find((l) => /대학교|University/i.test(l)) ?? '';
  const uni = eduLine.match(/(\S+대학교)/)?.[1] ?? '';
  const grade = eduLine.match(/(\d학년)/)?.[1] ?? '';
  const major = eduLine.replace(uni, '').replace(grade, '').trim();

  const expLines = sectionOf(/^(경력|경험|Experience)\s*$/i);
  const experiences: CvExperience[] = [];
  for (const l of expLines) {
    if (l.startsWith('-')) {
      const [title = '', role = '', period = ''] = l.replace(/^-\s*/, '').split('·').map((s) => s.trim());
      experiences.push({ title, role, period, summary: '' });
    } else if (experiences.length) {
      const last = experiences[experiences.length - 1];
      last.summary = (last.summary ? `${last.summary} ` : '') + l;
    }
  }
  const splitList = (arr: string[]) => arr.join(', ').split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  const aiBlock = sectionOf(/^AI 도구\s*$/);
  const [toolsPart = '', notePart = ''] = (aiBlock[0] ?? '').split('—').map((s) => s.trim());
  const skills = splitList(sectionOf(/^(기술|스킬|Skills)\s*$/i));
  const lower = text.toLowerCase();
  const suggested: SkillCardId[] = [];
  if (/react|next|frontend|프론트/.test(lower)) suggested.push('frontend');
  if (/해커톤|시연|48시간/.test(lower)) suggested.push('fast_proto');
  if (/figma|디자인/.test(lower) && suggested.length < 2) suggested.push('ui_design');
  if (/python|데이터|분석/.test(lower) && suggested.length < 2) suggested.push('data_analysis');

  return {
    cv: {
      realName: nonEmpty[0] ?? '',
      university: uni,
      major,
      grade,
      headline: nonEmpty[2] ?? '',
      experiences,
      skills,
      languages: splitList(sectionOf(/^(언어|Languages)\s*$/i)),
      aiTools: toolsPart.split(',').map((s) => s.trim()).filter(Boolean),
      aiUsageNote: notePart,
      collaborationNote: sectionOf(/^협업\s*$/).join(' '),
      source: 'pdf_parsed',
    },
    suggestedStrengths: suggested.slice(0, 2),
  };
}

export async function POST(req: Request) {
  const type = req.headers.get('content-type') ?? '';
  let rawText = '';
  let file: { mimeType: string; data: string } | undefined;

  try {
    if (type.includes('multipart/form-data')) {
      const form = await req.formData();
      const f = form.get('file');
      if (f instanceof File) {
        if (f.size > 8 * 1024 * 1024) return NextResponse.json({ error: '파일은 8MB 이하만 올릴 수 있어요.' }, { status: 413 });
        const buf = Buffer.from(await f.arrayBuffer());
        if (f.type === 'application/pdf') file = { mimeType: 'application/pdf', data: buf.toString('base64') };
        else rawText = buf.toString('utf8');
      }
    } else {
      const json = await req.json();
      rawText = String(json?.rawText ?? '');
    }
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
  if (!rawText && !file) return NextResponse.json({ error: 'file or rawText required' }, { status: 400 });

  const prompt = `다음 이력서/링크드인 내용에서 정보를 뽑아 CV 5섹션(기본 정보·경험·기술/언어·AI 활용·협업 방식)으로 정리하라.
없는 정보는 빈 문자열 또는 빈 배열로 두고, 지어내지 마라. suggestedStrengths는 다음 id 중 근거가 있는 것만 최대 2개: ${CARD_IDS}
JSON으로만 답하라: ${SCHEMA_HINT}
${rawText ? `\n내용:\n${rawText.slice(0, 12000)}` : ''}`;

  const ai = await callGeminiJson<{ cv: Partial<CvTemplate>; suggestedStrengths?: SkillCardId[] }>(prompt, file);
  if (ai?.cv) {
    const valid = new Set(SKILL_CARDS.map((c) => c.id));
    return NextResponse.json({
      cv: { ...ai.cv, source: 'pdf_parsed' },
      suggestedStrengths: (ai.suggestedStrengths ?? []).filter((s) => valid.has(s)).slice(0, 2),
      source: 'gemini',
    });
  }
  if (!rawText) {
    return NextResponse.json(
      { error: 'PDF를 읽으려면 서버에 GEMINI_API_KEY가 필요해요. 샘플로 채워 보거나 직접 입력해 주세요.' },
      { status: 422 },
    );
  }
  return NextResponse.json({ ...parseRule(rawText), source: 'fallback' });
}
