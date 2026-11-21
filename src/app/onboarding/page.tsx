'use client';

// 소유: 규혁 — 2) `/onboarding` 온보딩
// 구조(퍼즐 궁합 매트릭스 시안): ① ‘내 조각’ 설문(섹션 A~F) — 한 화면 한 문항 · 문항마다 맞는 형식 · 답할수록 조각 완성
//   (목표·AI 규범·작업 방식·역량·장단점 카드·협업 지뢰도 이 답으로 채움 → 리커트·역량 화면 없음)
//   → ② 결과 ‘내 조각이 나왔어요!’(16유형 · 딱 맞물리는 짝 · 포개지는 쌍둥이) → ③ 기본 정보 → CV
// 성격·갈등도 설문(D·E 섹션)에서 받아 27차원 전부 채움. 공모전마다 달라지는 온도·시간은 프로필에서.
// 끝나면 CV 작성으로 이어짐(프로필 = 퍼즐 + CV, 05 workflow) — CV는 건너뛸 수 있음.

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  FEATURE_SCHEMA_VERSION,
  type DealBreakerId,
  type Features27,
  type RoleId,
  type SkillCardId,
  type TemperatureMode,
  type UserProfile,
  type WeeklyHours,
} from '@/types/ondo';
import {
  DEAL_BREAKERS,
  type FeatureKey,
  LIKERT_LABELS,
  OPTIONAL_FEATURE_KEYS,
  ROLES,
  SKILL_CARDS,
  SKILL_LEVEL_LABELS,
  SURVEY_QUESTIONS,
  type SurveyQuestion,
  TEMPERATURE_MODES,
  deriveCollabType,
} from '@/data/constants';
import { basisText } from '@/data/references';
import { basisOf, feedsOf } from '@/data/surveyBasis';
import { Button, Chip, cx, Icon, IconButton, InfoTip, LinearProgress, SegmentedButton, Switch, TextField } from '@/components/m3';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { useHydrated, useOndoStore } from '@/store/useOndoStore';
import {
  PIECE_SURVEY,
  PIECE_TYPES,
  SKILL_LEVELS,
  SKILL_ROLES,
  SURVEY_SECTIONS,
  type SurveyAnswer,
  type SurveyQ,
  isAnswered,
  type PieceAnswers,
  type PieceCode,
  codeFromAnswers,
  edgesFromAnswers,
  edgesFromCode,
  emptyPieceAnswers,
  featuresFromSurvey,
  goalFeaturesFor,
  perfectMatch,
  quadrantOf,
  tagsOf,
} from '@/store/pieceTypes';





const optionCls = (sel: boolean) =>
  cx(
    'w-full rounded-m3-lg px-5 py-4 text-left transition-[background-color,box-shadow] duration-200',
    sel ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_0_2px_var(--md-sys-color-secondary)]' : 'bg-surface hover:bg-surface-container',
  );

/** 문항 형식별 입력 — 2지선다 · 5점 척도 · 하나 고르기 · 여러 개 고르기 · 역량 0~4 표 */
type AnswerUpdate = SurveyAnswer | ((prev: SurveyAnswer | undefined) => SurveyAnswer);

function QuestionInput({ q, value, answers, onChange }: { q: SurveyQ; value: SurveyAnswer | undefined; answers: PieceAnswers; onChange: (v: AnswerUpdate) => void }) {
  if (q.type === 'binary' || q.type === 'single') {
    const opts = q.type === 'binary' ? q.options.map((o) => ({ label: o.answer, detail: undefined as string | undefined })) : q.options;
    return (
      <div className="space-y-3" role="radiogroup" aria-label={q.question}>
        {opts.map((o, oi) => (
          <button key={oi} type="button" role="radio" aria-checked={value === oi} onClick={() => onChange(oi)} className={optionCls(value === oi)}>
            <span className="block title-medium">{o.label}</span>
            {o.detail && <span className="block body-small opacity-80">{o.detail}</span>}
          </button>
        ))}
      </div>
    );
  }
  if (q.type === 'scale') {
    return (
      <div>
        <SegmentedButton ariaLabel={q.question} value={(value as number) ?? null} onChange={(v) => onChange(v)} options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))} />
        <div className="mt-2 flex justify-between px-2 label-medium text-on-surface-variant">
          <span>{q.low}</span>
          <span>{q.high}</span>
        </div>
      </div>
    );
  }
  if (q.type === 'multi') {
    const picked = (value as string[]) ?? [];
    const blocked = q.excludeFrom ? ((answers[q.excludeFrom] as string[]) ?? []) : [];
    const toggle = (v: string) =>
      onChange((prev) => {
        const cur = (prev as string[] | undefined) ?? [];
        return cur.includes(v) ? cur.filter((x) => x !== v) : cur.length < q.max ? [...cur, v] : cur;
      });
    return (
      <div>
        <p className="mb-3 tabular label-large text-on-surface-variant">
          {picked.length}/{q.max}
        </p>
        <div className="flex flex-wrap gap-2">
          {q.options.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={picked.includes(o.value)}
              disabled={blocked.includes(o.value) || (!picked.includes(o.value) && picked.length >= q.max)}
              onClick={() => toggle(o.value)}
            />
          ))}
        </div>
      </div>
    );
  }
  // skills
  const grid = (value as Partial<Record<RoleId, number>>) ?? {};
  return (
    <div className="space-y-3">
      {SKILL_ROLES.map((r) => (
        <div key={r.value} className="grid items-center gap-2 sm:grid-cols-[88px_1fr]">
          <span className="title-small">{r.label}</span>
          <SegmentedButton
            ariaLabel={`${r.label} 숙련도`}
            dense
            value={grid[r.value] ?? null}
            onChange={(v) => onChange((prev) => ({ ...((prev as Partial<Record<RoleId, number>>) ?? {}), [r.value]: v }))}
            options={SKILL_LEVELS.map((l, i) => ({ value: i, label: <span><span className="tabular">{i}</span><span className="hidden md:inline"> {l}</span></span> }))}
          />
        </div>
      ))}
      <p className="flex justify-end gap-1 label-small text-on-surface-variant">0 해 본 적 없음 · 4 팀을 이끌 수 있음</p>
    </div>
  );
}

function PieceQuestionScreen({
  index,
  answers,
  onAnswer,
  onNext,
  onBack,
}: {
  index: number;
  answers: PieceAnswers;
  onAnswer: (v: AnswerUpdate) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const q = PIECE_SURVEY[index];
  const value = answers[q.id];
  const done = isAnswered(q, value);
  const section = SURVEY_SECTIONS.find((x) => x.id === q.section)!;
  const showPiece = q.type === 'binary' || (q.type === 'scale' && !!q.vote);
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="mx-auto flex h-16 w-full max-w-xl items-center gap-3 px-4">
        <IconButton icon="arrow_back" label={index === 0 ? '나가기' : '이전 질문'} onClick={onBack} />
        <LinearProgress value={(index + (done ? 1 : 0)) / PIECE_SURVEY.length} className="flex-1" />
        <span className="tabular label-large text-on-surface-variant">
          {index + 1}/{PIECE_SURVEY.length}
        </span>
      </header>
      <main key={index} className="page-enter mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-6">
        <p className="mt-2 flex items-center gap-1 label-large text-primary">
          <span className="tabular">{q.id}</span> · {section.title}
          {/* 혜원 v1.1 근거: ‘반영되는 곳’과 문항 근거는 (i) 안에 */}
          <InfoTip label="이 질문의 근거" align="start">
            반영되는 곳: {feedsOf(q).join(' · ')}. {basisText(basisOf(q))}
          </InfoTip>
        </p>
        <h1 className="mt-1 headline-medium">{q.question}</h1>

        {showPiece && (
          <div className="mt-6 grid place-items-center rounded-m3-xl bg-surface py-5">
            <PuzzlePiece mode="fun" edges={edgesFromAnswers(answers)} size={150} />
            <p className="mt-1 body-small text-on-surface-variant">답할수록 조각이 완성돼요</p>
          </div>
        )}

        <div className="mt-5">
          <QuestionInput q={q} value={value} answers={answers} onChange={onAnswer} />
        </div>

        <div className="mt-auto pt-8">
          {showPiece && <p className="mb-3 text-center body-small text-on-surface-variant">정답은 없어요. 반대여도, 똑같아도 다 맞물려요.</p>}
          <Button size="lg" className="w-full" disabled={!done} onClick={onNext}>
            {index === PIECE_SURVEY.length - 1 ? '내 조각 보기' : '다음 질문'}
          </Button>
        </div>
      </main>
    </div>
  );
}

function MiniPiece({ code, caption, tone }: { code: PieceCode; caption: string; tone: 'match' | 'twin' }) {
  const t = PIECE_TYPES[code];
  return (
    <div className="grid place-items-center rounded-m3-lg bg-surface px-3 py-4 text-center">
      <PuzzlePiece mode={tone === 'match' ? 'serious' : 'fun'} edges={edgesFromCode(code)} size={88} />
      <p className={cx('mt-1 flex items-center gap-1 label-medium', tone === 'match' ? 'text-primary' : 'text-secondary')}>
        <Icon name={tone === 'match' ? 'extension' : 'join'} size={14} />
        {caption}
      </p>
      <p className="title-medium">{t.name}</p>
    </div>
  );
}

function PieceResultScreen({ code, onContinue, onRetry, continueLabel = '이 조각으로 팀 맞추기' }: { code: PieceCode; onContinue: () => void; onRetry: () => void; continueLabel?: string }) {
  const t = PIECE_TYPES[code];
  const match = perfectMatch(code);
  const [shared, setShared] = useState<string | null>(null);
  const share = async () => {
    const text = `On-do에서 내 조각이 나왔어요: ${t.name} (${quadrantOf(code)} · ${code} ${t.title}) — ${t.line}`;
    try {
      if (navigator.share) await navigator.share({ title: 'On-do 내 조각', text });
      else {
        await navigator.clipboard.writeText(text);
        setShared('복사했어요');
      }
    } catch {}
  };
  return (
    <div className="min-h-dvh bg-page">
      <main className="page-enter mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8">
        <p className="text-center title-medium text-primary">내 조각이 나왔어요!</p>
        <section className="mt-4 grid place-items-center rounded-m3-xl bg-surface px-5 py-8 text-center">
          <PuzzlePiece mode="fun" edges={edgesFromCode(code)} size={200} />
          <h1 className="mt-2 display-small">{t.name}</h1>
          <p className="mt-2 rounded-full bg-surface-container px-4 py-1.5 label-large text-on-surface">
            {quadrantOf(code)} · {code} {t.title}
          </p>
          <p className="mt-3 body-large text-on-surface-variant">{t.line}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tagsOf(code).map((tag) => (
              <span key={tag} className="rounded-full bg-surface-container px-3 py-1 label-large text-on-surface">
                {tag}
              </span>
            ))}
          </div>
        </section>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MiniPiece code={match} caption="딱 맞물리는 짝" tone="match" />
          <MiniPiece code={code} caption="포개지는 쌍둥이" tone="twin" />
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 body-small text-on-surface-variant">
          {PIECE_TYPES[match].name}과는 네 변이 전부 반대라 딱 맞물려요
          <InfoTip>설문 답으로 정한 협업 성향 조각이에요(심리검사 아님). 팀 추천도 같은 답을 바탕으로 해요.</InfoTip>
        </p>

        <div className="mt-auto space-y-2 pt-8">
          <Button size="lg" className="w-full" icon="arrow_forward" onClick={onContinue}>
            {continueLabel}
          </Button>
          <div className="flex gap-2">
            <Button variant="outlined" className="flex-1" icon="ios_share" onClick={share}>
              {shared ?? '자랑하기'}
            </Button>
            <Button variant="text" className="flex-1" icon="refresh" onClick={onRetry}>
              다시 답하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const setCurrentUser = useOndoStore((s) => s.setCurrentUser);
  const setJustOnboarded = useOndoStore((s) => s.setJustOnboarded);
  const setMyPiece = useOndoStore((s) => s.setMyPiece);

  // ① 내 조각 설문 → ② 결과 → CV(닉네임·전공·학년은 CV ‘기본 정보’에서)
  const [phase, setPhase] = useState<'piece' | 'result'>('piece');
  const [pieceStep, setPieceStep] = useState(0);
  // 프로필 ‘고치기’로 다시 들어오면(이미 프로필이 있음) 지난 답을 채워서 시작
  const existingUser = useOndoStore((s) => s.currentUser);
  const savedAnswers = useOndoStore((s) => s.surveyAnswers);
  const setSurveyAnswers = useOndoStore((s) => s.setSurveyAnswers);
  const hydrated = useHydrated();
  const retake = hydrated && !!existingUser;
  const [pieceAnswers, setPieceAnswers] = useState<PieceAnswers>(emptyPieceAnswers);
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (!hydrated || prefilled) return;
    if (existingUser && savedAnswers) setPieceAnswers(savedAnswers);
    setPrefilled(true);
  }, [hydrated, prefilled, existingUser, savedAnswers]);
  const pieceCode = codeFromAnswers(pieceAnswers);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase, pieceStep]);

  const finish = () => {
    // 27차원 전부 설문 답에서 (성격·갈등 포함). 참여 온도·주당 시간은 기본값 — 프로필에서 대회마다 바꿈
    const survey = featuresFromSurvey(pieceAnswers);
    const mode = survey.temperatureMode;
    const features27: Features27 = survey.features;
    let email = 'me@yonsei.ac.kr';
    try {
      email = sessionStorage.getItem('ondo_signup_email') ?? email;
    } catch {}
    const temp = TEMPERATURE_MODES.find((m) => m.id === mode)!;
    const user: UserProfile = {
      id: `me-${Math.random().toString(36).slice(2, 8)}`,
      // 닉네임·전공·학년은 CV ‘기본 정보’에서 입력 — 우선 조각 이름으로 시작
      nickname: PIECE_TYPES[pieceCode ?? 'IMGA'].name,
      email,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION,
      temperatureMode: mode,
      temperature: temp.temperature,
      features27,
      preferredRoles: survey.preferredRoles,
      hardConstraints: { weeklyHours: survey.weeklyHours, offlineAvailable: survey.offlineAvailable, nightWorkAvailable: survey.nightWorkAvailable },
      collabType: deriveCollabType(features27),
      strengths: survey.strengths,
      weaknesses: survey.weaknesses,
      dealBreakers: survey.dealBreakers,
      weeklyDropEnabled: true,
      cv: {
        realName: '',
        university: '연세대학교',
        major: '',
        grade: '',
        headline: '',
        experiences: [],
        skills: [],
        languages: [],
        aiTools: [],
        aiUsageNote: '',
        collaborationNote: '',
        source: 'manual',
      },
    };
    setSurveyAnswers(pieceAnswers);
    if (existingUser) {
      // 다시 답하기: CV·닉네임·이메일·참여 온도·알림 설정은 그대로 두고 설문에서 나온 값만 바꿈
      const { temperatureMode, temperature } = existingUser;
      setCurrentUser({
        ...existingUser,
        features27: { ...user.features27, ...goalFeaturesFor(temperatureMode) },
        preferredRoles: user.preferredRoles,
        hardConstraints: { ...existingUser.hardConstraints, offlineAvailable: user.hardConstraints.offlineAvailable, nightWorkAvailable: user.hardConstraints.nightWorkAvailable },
        strengths: user.strengths,
        weaknesses: user.weaknesses,
        dealBreakers: user.dealBreakers,
        temperatureMode,
        temperature,
      });
      router.push('/profile');
      return;
    }
    setCurrentUser(user);
    setJustOnboarded(true);
    router.push('/cv');
  };

  if (phase === 'piece') {
    return (
      <PieceQuestionScreen
        index={pieceStep}
        answers={pieceAnswers}
        onAnswer={(v) =>
          setPieceAnswers((a) => {
            const id = PIECE_SURVEY[pieceStep].id;
            return { ...a, [id]: typeof v === 'function' ? v(a[id]) : v };
          })
        }
        onNext={() => {
          if (pieceStep < PIECE_SURVEY.length - 1) setPieceStep(pieceStep + 1);
          else if (pieceCode) {
            setMyPiece(pieceCode);
            setPhase('result');
          }
        }}
        onBack={() => (pieceStep === 0 ? router.push(retake ? '/profile' : '/') : setPieceStep(pieceStep - 1))}
      />
    );
  }

  if (phase === 'result' && pieceCode) {
    return (
      <PieceResultScreen
        code={pieceCode}
        onContinue={finish}
        continueLabel={retake ? '이 조각으로 저장' : undefined}
        onRetry={() => {
          setPieceAnswers(emptyPieceAnswers());
          setPieceStep(0);
          setPhase('piece');
        }}
      />
    );
  }

  return null;
}
