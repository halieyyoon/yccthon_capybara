'use client';

// 소유: 규혁 — 1) `/` 랜딩 & 로그인

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, TextField } from '@/components/m3';
import { PuzzlePiece } from '@/components/ondo/Puzzle';
import { Wordmark } from '@/components/ondo/AppShell';
import { useOndoStore } from '@/store/useOndoStore';

const STEPS = [
  {
    n: '01',
    title: '2분이면 퍼즐 한 조각',
    body: '목표, AI 쓰는 방식, 일하는 방식, 역량을 고르면 내가 채워 줄 수 있는 것(凸)과 채워 줄 사람이 필요한 것(凹)이 퍼즐 모양으로 정리돼요.',
  },
  {
    n: '02',
    title: '비슷한 사람 말고, 맞물리는 사람',
    body: '27가지 응답으로 101명을 펼쳐 놓고, 목표는 비슷하면서 역량은 서로 채워 주는 4인 조합을 찾아요. 왜 추천했는지 응답 근거를 같이 보여 줘요.',
  },
  {
    n: '03',
    title: '만나기 전에 한 번 굴려 보기',
    body: '큰 대회라면 AI 아바타끼리 가상 회의를 먼저 해 보고, 20분 파일럿으로 실제 안건 하나를 같이 풀어 볼 수 있어요. 서로 수락해야만 실명이 열려요.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const initDemoUser = useOndoStore((s) => s.initDemoUser);
  const [local, setLocal] = useState('');
  const [error, setError] = useState<string | undefined>();

  const start = () => {
    const id = local.trim();
    if (!/^[a-zA-Z0-9._-]{2,}$/.test(id)) {
      setError('학교 메일 아이디를 영문·숫자로 입력해 주세요.');
      return;
    }
    try {
      sessionStorage.setItem('ondo_signup_email', `${id}@yonsei.ac.kr`);
    } catch {}
    router.push('/onboarding');
  };

  const demo = () => {
    initDemoUser();
    router.push('/profile');
  };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
        <Wordmark />
        <span className="ml-auto hidden label-medium text-on-surface-variant sm:inline">YCCthon 2026 · 카피바라 팀</span>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-6">
        <section className="grid items-center gap-12 pb-16 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-20">
          <div className="enter">
            <p className="label-large text-primary">연세대학교에서 먼저 시작해요</p>
            <h1 className="mt-4 display-medium text-on-surface md:display-large">
              스펙 말고,
              <br />
              <span className="text-primary">온도</span>로 팀을 짜요.
            </h1>
            <p className="mt-6 max-w-[34rem] body-large text-on-surface-variant">
              공모전 팀플이 틀어지는 건 실력보다 기대치 차이 때문인 경우가 많아요. 얼마나 진지하게 할지, AI를 어디까지 쓸지, 마감 앞에서 무엇을 포기할지부터 맞춰 보세요.
            </p>

            <form
              className="mt-10 max-w-md"
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
                supporting="인증 메일은 시연 버전에서 생략해요."
                autoComplete="username"
                inputMode="email"
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="submit" icon="arrow_forward" size="lg">
                  2분 퍼즐 만들기
                </Button>
                <Button variant="outlined" size="lg" onClick={demo}>
                  데모 계정으로 바로 둘러보기
                </Button>
              </div>
            </form>
          </div>

          <div className="enter relative mx-auto w-full max-w-md" style={{ animationDelay: '80ms' }}>
            <div className="rounded-m3-xl bg-surface-container-low p-6 md:p-8">
              <div className="flex items-end justify-between">
                <p className="label-medium text-on-surface-variant">참여 온도에 따라 조각 모양이 달라져요</p>
              </div>
              <div className="mt-4 grid grid-cols-3 items-end gap-2">
                {(
                  [
                    ['fun', '36.5', '가볍게'],
                    ['balanced', '65', '균형 있게'],
                    ['serious', '90', '진지하게'],
                  ] as const
                ).map(([mode, temp, label]) => (
                  <div key={mode} className="flex flex-col items-center">
                    <PuzzlePiece mode={mode} edges={[1, 1, -1, -1]} size={128} />
                    <p className="tabular mt-1 headline-small text-on-surface">
                      {temp}
                      <span className="title-medium align-top">°</span>
                    </p>
                    <p className="label-medium text-on-surface-variant">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-m3-md bg-surface p-4">
                <p className="body-small text-on-surface-variant">예시 · 응답 근거</p>
                <p className="mt-1 body-medium text-on-surface">
                  둘 다 <b>먼저 만들어 보고 고치는</b> 편이고, 한 사람의 <b>디자인 약점</b>을 다른 사람의 <b>UI 강점</b>이 채워요.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-outline-variant py-14">
          <h2 className="headline-small text-on-surface">이렇게 맞춰 드려요</h2>
          <ol className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s) => (
              <li key={s.n}>
                <p className="tabular title-medium text-primary">{s.n}</p>
                <h3 className="mt-2 title-large text-on-surface">{s.title}</h3>
                <p className="mt-2 body-medium text-on-surface-variant">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-outline-variant py-8 body-small text-on-surface-variant">
          시연 버전입니다. 추천에 쓰이는 100명은 합성 데모 데이터이며, 점수는 검증 전 임시 가중치 기준이에요. 거절 알림은 보내지 않아요.
        </footer>
      </main>
    </div>
  );
}
