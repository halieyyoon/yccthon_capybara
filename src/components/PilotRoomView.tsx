'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ⑤ — Props { contestTitle, topic, remainingSec, members, messages, workspace, isTyping,
//   onSendMessage, onUpdateWorkspace, onToggleFastDemo, onFinish }
// + 선택 Props(계약 추가 요청): suggestedPatch / onApplySuggestedPatch / onDismissSuggestedPatch (gyuhyeok-ux.md 6 — 원클릭 반영),
//   ended (종료 후 입력 잠금)
// 상단 20분 타이머 + 안건 고정 바 + 1페이지 공유 메모(3칸) + 실시간 팀 채팅

import { useEffect, useRef, useState } from 'react';
import type { PilotMessage, PilotWorkspace, UserProfile } from '@/types/ondo';
import { ROLE_LABEL } from '@/data/constants';
import { Button, cx, IconButton, InfoTip, Monogram, TextArea } from '@/components/m3';

const MEMO_FIELDS: { key: keyof PilotWorkspace; label: string }[] = [
  { key: 'problemStatement', label: '문제' },
  { key: 'solutionIdea', label: '아이디어' },
  { key: 'roleSplit', label: '역할' },
];

const topRole = (m: UserProfile) =>
  (['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'] as const).reduce((a, b) => (m.features27[b] > m.features27[a] ? b : a));

export function PilotRoomView({
  contestTitle,
  topic,
  remainingSec,
  members,
  messages,
  workspace,
  isTyping,
  onSendMessage,
  onUpdateWorkspace,
  onToggleFastDemo,
  onFinish,
  suggestedPatch,
  onApplySuggestedPatch,
  onDismissSuggestedPatch,
  ended,
}: {
  contestTitle: string;
  topic: string;
  remainingSec: number;
  members: UserProfile[];
  messages: PilotMessage[];
  workspace: PilotWorkspace;
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onUpdateWorkspace: (patch: Partial<PilotWorkspace>) => void;
  onToggleFastDemo: () => void;
  onFinish: () => void;
  suggestedPatch?: Partial<PilotWorkspace> | null;
  onApplySuggestedPatch?: () => void;
  onDismissSuggestedPatch?: () => void;
  ended?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const done = ended || remainingSec <= 0;
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = String(remainingSec % 60).padStart(2, '0');

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const send = () => {
    const text = draft.trim();
    if (!text || isTyping || done) return;
    onSendMessage(text);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-m3-xl bg-surface-container-low px-4 py-3">
        <span
          className={cx(
            'tabular rounded-full px-3 py-1 title-large',
            done ? 'bg-surface-container-highest text-on-surface-variant' : remainingSec < 60 ? 'bg-error-container text-on-error-container' : 'bg-primary text-on-primary',
          )}
          aria-live="polite"
        >
          {done ? '종료' : `${mm}:${ss}`}
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-small text-on-surface-variant">{contestTitle}</p>
          <p className="title-small">{topic}</p>
        </div>
        {!done && (
          <div className="flex gap-1">
            <Button variant="text" icon="fast_forward" onClick={onToggleFastDemo}>
              30초
            </Button>
            <Button variant="tonal" icon="how_to_vote" onClick={onFinish}>
              종료 & 투표
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="flex min-h-[60dvh] flex-col overflow-hidden rounded-m3-xl bg-surface-container-low">
          <div className="flex items-center gap-2 px-4 pb-1 pt-3">
            {members.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 label-medium text-on-surface-variant">
                <Monogram name={m.nickname} size={24} tone="secondary" />
                {m.nickname}
                <span className="hidden text-outline sm:inline">· {ROLE_LABEL[topRole(m)]}</span>
              </span>
            ))}
            <InfoTip align="end">실제 사람이 아니라 응답 기반 AI 팀원이에요. 실제 행동을 예측하지 않아요.</InfoTip>
          </div>
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: '56dvh' }}>
            {messages.map((m) => (
              <div key={m.id} className={cx('enter flex gap-2', m.isUser && 'flex-row-reverse')}>
                {!m.isUser && <Monogram name={m.senderNickname} size={32} tone="secondary" />}
                <div className={cx('max-w-[80%]', m.isUser && 'text-right')}>
                  {!m.isUser && <p className="mb-1 label-medium text-on-surface-variant">{m.senderNickname}</p>}
                  <p
                    className={cx(
                      'inline-block rounded-[20px] px-4 py-2.5 text-left body-medium',
                      m.isUser ? 'rounded-br-[6px] bg-primary text-on-primary' : 'rounded-tl-[6px] bg-surface-container-high text-on-surface',
                    )}
                  >
                    {m.text}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <span className="inline-flex gap-1 pl-10" aria-label="입력 중">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-outline" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
            )}
          </div>
          <form
            className="flex items-end gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={done}
              rows={1}
              placeholder={done ? '끝났어요' : '메시지'}
              aria-label="메시지 입력"
              className="max-h-32 min-h-12 flex-1 resize-none rounded-[24px] bg-surface-container-highest px-5 py-3 body-large text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary"
            />
            <IconButton icon="send" label="보내기" variant="filled" type="submit" disabled={!draft.trim() || isTyping || done} className="size-12" />
          </form>
        </section>

        <aside className="space-y-3 rounded-m3-xl bg-surface-container-low p-4">
          <h2 className="title-medium">공유 메모</h2>
          {suggestedPatch && (
            <div className="enter rounded-m3-md bg-tertiary-container p-3 text-on-tertiary-container">
              {Object.entries(suggestedPatch).map(([k, v]) => (
                <p key={k} className="body-small">
                  <b>{MEMO_FIELDS.find((f) => f.key === k)?.label}</b> {v}
                </p>
              ))}
              <div className="mt-2 flex justify-end gap-1">
                <Button variant="text" className="h-8" onClick={onDismissSuggestedPatch}>
                  무시
                </Button>
                <Button icon="check" className="h-8" onClick={onApplySuggestedPatch}>
                  반영
                </Button>
              </div>
            </div>
          )}
          {MEMO_FIELDS.map((f) => (
            <TextArea key={f.key} label={f.label} value={workspace[f.key]} onChange={(e) => onUpdateWorkspace({ [f.key]: e.target.value })} disabled={done} />
          ))}
        </aside>
      </div>
    </div>
  );
}
