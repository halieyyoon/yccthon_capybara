'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ⑥ — Props { profile: UserProfile }
// 표준 5섹션 A4 1페이지 인쇄 레이아웃 + 우측 상단 내 퍼즐 엠블럼

import type { UserProfile } from '@/types/ondo';
import { PuzzlePiece } from '@/components/PuzzlePiece';

export function CvPrintSheet({ profile }: { profile: UserProfile }) {
  const cv = profile.cv;
  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white p-[14mm] text-[12px] leading-relaxed text-black">
      <header className="flex items-start justify-between gap-6 border-b border-black pb-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight">{cv.realName || profile.nickname}</h1>
          <p className="mt-1">{[cv.university, cv.major, cv.grade].filter(Boolean).join(' · ')}</p>
          {cv.headline && <p className="mt-1 text-neutral-600">{cv.headline}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <PuzzlePiece mode={profile.temperatureMode} edges={[-1, 1, -1, 1]} label={profile.collabType} size={72} />
          <span className="text-[10px] text-neutral-500">On-do · {profile.temperature}°</span>
        </div>
      </header>

      <Section n={1} title="기본 정보">
        <p>{[cv.university, cv.major, cv.grade].filter(Boolean).join(' · ') || '—'}</p>
      </Section>
      <Section n={2} title="경험">
        {cv.experiences.length ? (
          cv.experiences.map((e, i) => (
            <div key={i} className="mt-2 break-inside-avoid first:mt-0">
              <p className="flex justify-between gap-4 font-semibold">
                <span>
                  {e.title} <span className="font-normal text-neutral-600">· {e.role}</span>
                </span>
                <span className="shrink-0 font-normal text-neutral-600">{e.period}</span>
              </p>
              {e.summary && <p className="mt-0.5">{e.summary}</p>}
            </div>
          ))
        ) : (
          <p>—</p>
        )}
      </Section>
      <Section n={3} title="기술 · 언어">
        <p>{[...cv.skills, ...cv.languages].join(', ') || '—'}</p>
      </Section>
      <Section n={4} title="AI 활용">
        <p>{[cv.aiTools.join(', '), cv.aiUsageNote].filter(Boolean).join(' — ') || '—'}</p>
      </Section>
      <Section n={5} title="협업 방식">
        <p>{cv.collaborationNote || '—'}</p>
      </Section>
    </article>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-1.5 text-[14px] font-semibold">
        <span className="mr-1.5 text-neutral-400">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
