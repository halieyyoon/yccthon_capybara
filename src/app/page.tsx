'use client';

// 소유: 규혁 — 1) `/` 랜딩 & 로그인

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TEMPERATURE_MODES } from '@/data/constants';
import { Button, InfoTip, TextField } from '@/components/m3';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { Wordmark } from '@/components/AppShell';
import { useOndoStore } from '@/store/useOndoStore';

const STEPS = [
  { icon: 'extension', title: '2분 퍼즐', tip: '목표·AI 쓰는 방식·일하는 방식·역량을 고르면, 채워 줄 수 있는 것과 채워 줄 사람이 필요한 것이 퍼즐로 정리돼요.' },
  { icon: 'hub', title: '맞물리는 4인 조합', tip: '목표는 비슷하고 역량은 서로 채워 주는 조합을 찾아요. 왜 추천했는지 응답 근거를 함께 보여 줘요.' },
  { icon: 'forum', title: '만나기 전 미리 굴려 보기', tip: '큰 대회는 AI 아바타 모의회의와 20분 파일럿으로 먼저 맞춰 봐요. 서로 수락해야만 실명이 열려요.' },
];

export default function LandingPage() {
  const router = useRouter();
  const initDemoUser = useOndoStore((s) => s.initDemoUser);
  const [local, setLocal] = useState('');
  const [error, setError] = useState<string | undefined>();

  const start = () => {
    const id = local.trim();
    if (!/^[a-zA-Z0-9._-]{2,}$/.test(id)) {
      setError('영문·숫자로 입력해 주세요.');
      return;
    }
    try {
      sessionStorage.setItem('ondo_signup_email', `${id}@yonsei.ac.kr`);
    } catch {}
    router.push('/onboarding');
  };

  return (
    <div className="min-h-dvh bg-page">
      <header className="mx-auto flex h-16 max-w-[1080px] items-center px-4 min-[720px]:px-10">
        <Wordmark />
        <InfoTip align="end" className="ml-auto">
          시연 버전이에요. 추천에 쓰는 100명은 합성 데모 데이터이고, 점수는 검증 전 임시 가중치예요.
        </InfoTip>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 pb-16 min-[720px]:px-10">
        <section className="page-enter grid items-center gap-10 rounded-[26px] bg-surface p-6 md:grid-cols-[1.1fr_1fr] md:p-12">
          <div>
            <h1 className="headline-large md:display-medium">
              스펙 말고,
              <br />
              <span className="text-primary">온도</span>로 팀을 짜요.
            </h1>
            <p className="mt-4 body-large text-on-surface-variant">얼마나 진지하게 할지부터 맞춰 보세요.</p>

            <form
              className="mt-8 max-w-md space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                start();
              }}
            >
              <TextField
                label="학교 메일"
                leadingIcon="mail"
                suffix="@yonsei.ac.kr"
                value={local}
                onChange={(e) => {
                  setLocal(e.target.value);
                  setError(undefined);
                }}
                error={error}
                autoComplete="username"
                inputMode="email"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="lg" icon="arrow_forward">
                  2분 퍼즐 만들기
                </Button>
                <Button
                  variant="outlined"
                  size="lg"
                  onClick={() => {
                    initDemoUser();
                    router.push('/profile');
                  }}
                >
                  데모 계정으로 바로 둘러보기
                </Button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {TEMPERATURE_MODES.map((t) => (
              <div key={t.id} className="overflow-hidden rounded-m3-md bg-surface-container-low">
                <div className="px-3 pb-2 pt-3" style={{ background: `var(--band-${t.id})`, color: `var(--band-${t.id}-fg)` }}>
                  <p className="tabular headline-small">
                    {t.temperature}
                    <span className="text-[13px] align-top">°</span>
                  </p>
                  <p className="label-small opacity-85">{t.short}</p>
                </div>
                <div className="flex justify-center py-2">
                  <PuzzlePiece mode={t.id} edges={[-1, 1, -1, 1]} size={96} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-3 rounded-m3-md bg-surface px-5 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-rounded text-[22px]" aria-hidden>
                  {s.icon}
                </span>
              </span>
              <p className="flex-1 title-medium">
                <span className="tabular mr-1.5 text-on-surface-variant">{i + 1}</span>
                {s.title}
              </p>
              <InfoTip align="end">{s.tip}</InfoTip>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
