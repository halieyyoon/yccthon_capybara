'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 2단계 AI 아바타 사전 모의회의 결과 카드

import type { AvatarMeetingResult } from '@/types/ondo';
import { Icon, LinearProgress, Monogram } from '@/components/m3';

export function AvatarMeetingCard({ result, loading, currentUserId }: { result?: AvatarMeetingResult; loading?: boolean; currentUserId?: string }) {
  if (loading || !result) {
    return (
      <div className="rounded-m3-lg bg-surface-container p-5">
        <p className="title-small text-on-surface">AI 아바타가 모의회의를 하는 중이에요</p>
        <p className="mt-1 body-small text-on-surface-variant">네 사람의 설문 응답만으로 가상 회의를 만들고 있어요. 실명·이메일은 보내지 않아요.</p>
        <LinearProgress className="mt-4" />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="rounded-m3-lg bg-surface-container p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label-medium text-on-surface-variant">안건</p>
          <span className="rounded-m3-sm bg-tertiary-container px-2.5 py-1 label-medium text-on-tertiary-container">{result.chemistryBadge}</span>
        </div>
        <p className="mt-1 title-medium text-on-surface">{result.agenda}</p>
        <ol className="mt-5 space-y-4">
          {result.turns.map((t, i) => {
            const me = t.speakerId === currentUserId;
            return (
              <li key={i} className="flex gap-3">
                <Monogram name={t.speakerNickname} size={32} tone={me ? 'primary' : 'secondary'} />
                <div className="min-w-0">
                  <p className="label-medium text-on-surface-variant">
                    {t.speakerNickname}
                    {me && ' (내 아바타)'} · {t.roleTag}
                  </p>
                  <p className="body-medium text-on-surface">{t.message}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon="handshake" title="합의안">
          <p className="body-medium text-on-surface">{result.consensus}</p>
        </Section>
        <Section icon="error" title="아직 안 정해진 것">
          <ul className="list-disc space-y-1 pl-4 body-medium text-on-surface">
            {result.unresolvedIssues.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Section>
        <Section icon="group" title="예상 역할 분담">
          <ul className="space-y-1 body-medium text-on-surface">
            {result.expectedRoleSplit.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Section>
        <Section icon="contact_support" title="실제로 만나면 물어볼 것">
          <ul className="list-decimal space-y-1 pl-4 body-medium text-on-surface">
            {result.questionsToAskTeam.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Section>
      </div>
      <p className="flex items-start gap-2 body-small text-on-surface-variant">
        <Icon name="info" size={16} className="mt-px" />
        AI 모의회의는 행동 예측이 아닌, 응답 차이에서 생길 수 있는 쟁점을 미리 확인하는 가상 실험입니다.
      </p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-m3-lg border border-outline-variant p-4">
      <h4 className="mb-2 flex items-center gap-2 title-small text-on-surface">
        <Icon name={icon} size={20} className="text-primary" />
        {title}
      </h4>
      {children}
    </section>
  );
}
