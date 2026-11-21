'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ④ — Props { result: AvatarMeetingResult; loading?: boolean; loadingStepText?: string }
// 상단 chemistryBadge + agenda · 중단 6턴 말풍선 · 하단 4블록(합의안·미해결 쟁점·예상 역할 분담·확인 질문) · 하단 고지

import type { AvatarMeetingResult } from '@/types/ondo';
import { Icon, LinearProgress, Monogram } from '@/components/m3';

export function AvatarMeetingCard({ result, loading, loadingStepText }: { result?: AvatarMeetingResult; loading?: boolean; loadingStepText?: string }) {
  if (loading || !result) {
    return (
      <div className="rounded-m3-lg bg-surface-container p-5">
        <p className="title-small text-on-surface">{loadingStepText ?? 'AI 아바타 모의회의 중'}</p>
        <LinearProgress className="mt-4" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-m3-lg bg-surface-container p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="title-medium text-on-surface">{result.agenda}</p>
          <span className="rounded-m3-sm bg-tertiary-container px-2.5 py-1 label-medium text-on-tertiary-container">{result.chemistryBadge}</span>
        </div>
        <ol className="mt-4 space-y-3">
          {result.turns.map((t, i) => (
            <li key={i} className="flex gap-3">
              <Monogram name={t.speakerNickname} size={32} tone="secondary" />
              <div className="min-w-0">
                <p className="label-medium text-on-surface-variant">
                  {t.speakerNickname} · {t.roleTag}
                </p>
                <p className="body-medium text-on-surface">{t.message}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Block icon="handshake" title="합의안">
          <p>{result.consensus}</p>
        </Block>
        <Block icon="error" title="미해결 쟁점">
          <ul className="list-disc space-y-1 pl-4">
            {result.unresolvedIssues.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Block>
        <Block icon="group" title="예상 역할 분담">
          <ul className="space-y-0.5">
            {result.expectedRoleSplit.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Block>
        <Block icon="contact_support" title="만나면 물어볼 것">
          <ol className="list-decimal space-y-1 pl-4">
            {result.questionsToAskTeam.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ol>
        </Block>
      </div>
      <p className="body-small text-on-surface-variant">AI 모의회의는 행동 예측이 아니라 사전 쟁점 확인을 위한 가상 실험입니다.</p>
    </div>
  );
}

function Block({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-m3-lg bg-surface-container-low p-4 body-medium text-on-surface">
      <h4 className="mb-2 flex items-center gap-2 title-small">
        <Icon name={icon} size={20} className="text-primary" />
        {title}
      </h4>
      {children}
    </section>
  );
}
