'use client';

// 소유: 규혁 — 4) `/cv` CV 템플릿 에디터
// 프로필 = 퍼즐 + CV. 온보딩을 마치면 이 화면으로 이어지고(건너뛰기 가능), 다 채우면 프로필로 돌아갑니다.

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { CvExperience, CvTemplate, SkillCardId } from '@/types/ondo';
import { SKILL_CARD_BY_ID } from '@/data/constants';
import { SAMPLE_LINKEDIN_CV_TEXT } from '@/data/seedUsers';
import { Button, Chip, cx, Icon, IconButton, InfoTip, LinearProgress, Snackbar, TextArea, TextField } from '@/components/m3';
import { AppShell, NeedsUser } from '@/components/AppShell';
import { CvPrintSheet } from '@/components/CvPrintSheet';
import { cvSectionFlags } from '@/store/profileProgress';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';

const SECTIONS = [
  { id: 'basic', n: 1, title: '기본 정보' },
  { id: 'exp', n: 2, title: '경험' },
  { id: 'skill', n: 3, title: '기술 · 언어' },
  { id: 'ai', n: 4, title: 'AI 활용' },
  { id: 'collab', n: 5, title: '협업 방식' },
] as const;

function ListField({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState('');
  const add = () => {
    const parts = text.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...values, ...parts])]);
    setText('');
  };
  return (
    <div>
      <TextField
        label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="Enter로 추가"
      />
      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="inline-flex h-8 items-center gap-1 rounded-m3-sm bg-surface-container pl-3 pr-1 label-large text-on-surface-variant">
              {v}
              <button type="button" aria-label={`${v} 삭제`} className="state-layer grid size-6 place-items-center rounded-full" onClick={() => onChange(values.filter((x) => x !== v))}>
                <Icon name="close" size={16} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ n, title, tip, action }: { n: number; title: string; tip?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-1">
      <h2 className="title-large">
        <span className="tabular mr-2 text-primary">{n}</span>
        {title}
      </h2>
      {tip && <InfoTip align="start">{tip}</InfoTip>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

function linkedinSummary(cv: CvTemplate, nickname: string): string {
  const lines = [
    cv.headline || `${cv.university} ${cv.major} ${cv.grade}`.trim(),
    '',
    ...cv.experiences.filter((e) => e.title).map((e) => `• ${e.title}${e.role ? ` — ${e.role}` : ''}${e.period ? ` (${e.period})` : ''}${e.summary ? `\n  ${e.summary}` : ''}`),
    '',
    cv.skills.length ? `기술: ${cv.skills.join(', ')}` : '',
    cv.languages.length ? `언어: ${cv.languages.join(', ')}` : '',
    cv.aiTools.length ? `AI 도구: ${cv.aiTools.join(', ')}${cv.aiUsageNote ? ` — ${cv.aiUsageNote}` : ''}` : '',
    cv.collaborationNote ? `협업: ${cv.collaborationNote}` : '',
    '',
    `On-do에서 함께할 팀원을 찾고 있어요. (${nickname})`,
  ];
  return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n').trim();
}

export default function CvPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const user = useOndoStore((s) => s.currentUser);
  const updateCv = useOndoStore((s) => s.updateCv);
  const setCurrentUser = useOndoStore((s) => s.setCurrentUser);
  const justOnboarded = useOndoStore((s) => s.justOnboarded);
  const setJustOnboarded = useOndoStore((s) => s.setJustOnboarded);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<SkillCardId[]>([]);
  const [welcome, setWelcome] = useState(false);

  // 온보딩 직후 진입이면 ‘다음 단계’ 배너를 띄우고 플래그는 바로 내림
  useEffect(() => {
    if (justOnboarded) {
      setWelcome(true);
      setJustOnboarded(false);
    }
  }, [justOnboarded, setJustOnboarded]);

  if (!hydrated) return <AppShell>{null}</AppShell>;
  if (!user) return <AppShell><NeedsUser /></AppShell>;
  const cv = user.cv;
  const filled = cvSectionFlags(cv);

  const applyParsed = (data: { cv: Partial<CvTemplate>; suggestedStrengths?: SkillCardId[] }) => {
    const clean = Object.fromEntries(
      Object.entries(data.cv).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== '' && v !== undefined && v !== null)),
    ) as Partial<CvTemplate>;
    updateCv({ ...clean, source: 'pdf_parsed' });
    setSuggested((data.suggestedStrengths ?? []).filter((s) => !user.strengths.includes(s)));
    setSnack('채웠어요. 한 번 확인해 주세요');
  };

  const parse = async (body: FormData | { rawText: string }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/parse-cv', body instanceof FormData ? { method: 'POST', body } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? '읽지 못했어요');
      applyParsed(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '읽지 못했어요');
    } finally {
      setBusy(false);
    }
  };

  const setExp = (i: number, patch: Partial<CvExperience>) => updateCv({ experiences: cv.experiences.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  return (
    <AppShell>
      <div className="no-print grid gap-8 py-8 lg:grid-cols-[200px_1fr]">
        <nav className="hidden lg:block" aria-label="CV 섹션">
          <div className="sticky top-24 space-y-1">
            {SECTIONS.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="state-layer flex h-12 items-center gap-3 rounded-full px-4 title-small text-on-surface-variant">
                <span className={cx('grid size-6 place-items-center rounded-full label-medium', filled[i] ? 'bg-primary text-on-primary' : 'bg-surface-container')}>
                  {filled[i] ? <Icon name="check" size={16} /> : s.n}
                </span>
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-8">
          {welcome && (
            <div className="enter flex flex-wrap items-center gap-4 rounded-m3-xl bg-primary-container p-5 text-on-primary-container">
              <Icon name="extension" filled />
              <div className="min-w-0 flex-1">
                <p className="title-medium">퍼즐 완성! 닉네임과 전공부터 채워 볼까요?</p>
                <p className="body-medium">수상 경력이 없어도 괜찮아요. 수업 팀플이나 관심 분야부터 채우면 돼요.</p>
              </div>
              <Button variant="text" onClick={() => router.push('/profile')}>
                나중에
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1">
            <h1 className="headline-medium">CV 템플릿</h1>
            <InfoTip align="start">팀이 확정되고 서로 수락하면 팀원에게 열려요. 그 전에는 닉네임만 보여요.</InfoTip>
          </div>

          <div className="rounded-m3-md bg-surface-container-highest p-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const fd = new FormData();
                  fd.append('file', f);
                  parse(fd);
                  e.target.value = '';
                }}
              />
              <Button variant="outlined" icon="upload" disabled={busy} onClick={() => fileRef.current?.click()}>
                링크드인 · 이력서 PDF
              </Button>
              <Button variant="tonal" icon="auto_fix_high" disabled={busy} onClick={() => parse({ rawText: SAMPLE_LINKEDIN_CV_TEXT })}>
                샘플 링크드인 PDF로 채워보기
              </Button>
              <InfoTip align="end">PDF를 올리면 5개 섹션에 맞춰 자동으로 채워요. 올린 파일은 저장하지 않아요.</InfoTip>
            </div>
            {busy && <LinearProgress className="mt-4" />}
            {error && <p className="mt-3 body-medium text-error">{error}</p>}
            {suggested.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="label-medium text-on-surface-variant">장점 카드로 바꾸기</span>
                {suggested.map((s) => (
                  <Chip
                    key={s}
                    kind="suggestion"
                    icon="swap_horiz"
                    label={SKILL_CARD_BY_ID[s].strength}
                    onClick={() => {
                      const next: [SkillCardId, SkillCardId] = [s, user.strengths[0] === s ? user.strengths[1] : user.strengths[0]];
                      setCurrentUser({ ...user, strengths: next });
                      setSuggested(suggested.filter((x) => x !== s));
                      setSnack(`장점 카드: ${SKILL_CARD_BY_ID[s].strength}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <section id="basic" className="scroll-mt-24">
            <SectionTitle n={1} title="기본 정보" tip="닉네임은 팀이 확정되기 전에 보이는 이름이에요. 실명은 팀 확정 후에만 공개돼요." />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="닉네임" value={user.nickname} onChange={(e) => setCurrentUser({ ...user, nickname: e.target.value.slice(0, 12) })} />
              <TextField label="실명" value={cv.realName} onChange={(e) => updateCv({ realName: e.target.value })} />
              <TextField label="학교" value={cv.university} onChange={(e) => updateCv({ university: e.target.value })} />
              <TextField label="전공" value={cv.major} onChange={(e) => updateCv({ major: e.target.value })} />
              <TextField label="학년" value={cv.grade} onChange={(e) => updateCv({ grade: e.target.value })} />
              <TextField className="sm:col-span-2" label="한 줄 소개" value={cv.headline} onChange={(e) => updateCv({ headline: e.target.value })} placeholder="예: 프론트엔드 개발 · 해커톤 4회" />
            </div>
          </section>

          <section id="exp" className="scroll-mt-24">
            <SectionTitle
              n={2}
              title="경험"
              tip="수상 경력이 없어도 괜찮아요. 수업 팀플, 동아리, 관심 분야부터 채워 보세요."
              action={
                <Button variant="text" icon="add" onClick={() => updateCv({ experiences: [...cv.experiences, { title: '', role: '', period: '', summary: '' }] })}>
                  추가
                </Button>
              }
            />
            <div className="space-y-4">
              {cv.experiences.length === 0 && (
                <button
                  type="button"
                  onClick={() => updateCv({ experiences: [{ title: '', role: '', period: '', summary: '' }] })}
                  className="state-layer w-full rounded-m3-md bg-surface-container-low px-4 py-6 text-center body-medium text-on-surface-variant"
                >
                  + 첫 경험 추가
                </button>
              )}
              {cv.experiences.map((e, i) => (
                <div key={i} className="rounded-m3-md bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label-large text-on-surface-variant">경험 {i + 1}</span>
                    <IconButton icon="delete" label={`경험 ${i + 1} 삭제`} onClick={() => updateCv({ experiences: cv.experiences.filter((_, j) => j !== i) })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField className="sm:col-span-3" label="활동명" value={e.title} onChange={(ev) => setExp(i, { title: ev.target.value })} />
                    <TextField className="sm:col-span-2" label="역할" value={e.role} onChange={(ev) => setExp(i, { role: ev.target.value })} />
                    <TextField label="기간" value={e.period} onChange={(ev) => setExp(i, { period: ev.target.value })} placeholder="2026.03 – 2026.06" />
                    <TextArea className="sm:col-span-3" label="한 일과 결과" value={e.summary} onChange={(ev) => setExp(i, { summary: ev.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="skill" className="scroll-mt-24">
            <SectionTitle n={3} title="기술 · 언어" />
            <div className="grid gap-6 sm:grid-cols-2">
              <ListField label="기술" values={cv.skills} onChange={(v) => updateCv({ skills: v })} />
              <ListField label="언어" values={cv.languages} onChange={(v) => updateCv({ languages: v })} />
            </div>
          </section>

          <section id="ai" className="scroll-mt-24">
            <SectionTitle n={4} title="AI 활용" />
            <div className="space-y-4">
              <ListField label="쓰는 AI 도구" values={cv.aiTools} onChange={(v) => updateCv({ aiTools: v })} />
              <TextArea label="어디에, 어떻게" value={cv.aiUsageNote} onChange={(e) => updateCv({ aiUsageNote: e.target.value })} placeholder="예: 반복 코드 초안에 쓰고, 화면 로직은 직접 검토해요" />
            </div>
          </section>

          <section id="collab" className="scroll-mt-24">
            <SectionTitle n={5} title="협업 방식" />
            <TextArea label="함께 일할 때 나는" value={cv.collaborationNote} onChange={(e) => updateCv({ collaborationNote: e.target.value })} placeholder="예: 결정 사항은 그날 문서로 남겨요" />
          </section>

          <div className="sticky bottom-24 z-20 flex flex-wrap justify-end gap-2 rounded-m3-xl bg-surface-container-high p-3 md:bottom-4">
            <Button
              variant="text"
              icon="content_copy"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(linkedinSummary(cv, user.nickname));
                  setSnack('링크드인 요약 복사됨');
                } catch {
                  setSnack('복사하지 못했어요');
                }
              }}
            >
              링크드인 복붙 요약 복사
            </Button>
            <Button variant="tonal" icon="print" onClick={() => window.print()}>
              PDF 저장 / 인쇄
            </Button>
            <Button icon="check" onClick={() => router.push('/profile')}>
              완료
            </Button>
          </div>
        </div>
      </div>

      {/* 인쇄 전용 — 계약 컴포넌트 CvPrintSheet */}
      <div className="hidden print:block">
        <CvPrintSheet profile={user} />
      </div>

      <Snackbar message={snack} onDone={() => setSnack(null)} />
    </AppShell>
  );
}
