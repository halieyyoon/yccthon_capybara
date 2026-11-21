'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 틀(stt.gyuhyeok.com · Classroom): 720px 이상 = 회색 페이지 위 왼쪽 알약 메뉴 + 흰 본문 면(왼쪽 위 26px)
//                                   720px 미만 = 위 브랜드 바 + 하단 내비게이션 바

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx, Icon } from '@/components/m3';
import { DEMO_USER } from '@/store/demoUser';
import { useOndoStore } from '@/store/useOndoStore';

const NAV = [
  { href: '/profile', label: '내 퍼즐', icon: 'extension' },
  { href: '/cv', label: 'CV', icon: 'description' },
  { href: '/match', label: '팀 찾기', icon: 'groups' },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cx('inline-flex items-baseline gap-1.5 text-on-surface', className)} aria-label="On-do 처음으로">
      <span className="text-[20px] font-bold tracking-tight">
        On<span className="text-primary">-</span>do
      </span>
      <span className="label-medium text-on-surface-variant">온도</span>
    </Link>
  );
}

export function AppShell({
  children,
  title,
  back,
  actions,
  hideNav,
}: {
  children: ReactNode;
  title?: string;
  back?: string;
  actions?: ReactNode;
  hideNav?: boolean;
}) {
  const path = usePathname();
  const isDemo = useOndoStore((s) => s.currentUser?.id === DEMO_USER.id);
  const header = (
    <div className={cx('flex h-14 items-center gap-2', !title && !back && 'min-[720px]:h-12 min-[720px]:pt-2')}>
      {back && (
        <Link href={back} aria-label="뒤로" className="-ml-2 grid size-10 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container">
          <Icon name="arrow_back" />
        </Link>
      )}
      {title ? <h1 className="truncate headline-small">{title}</h1> : <span className="min-[720px]:hidden"><Wordmark /></span>}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {isDemo && (
          <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-container-low px-3 label-large text-primary transition-colors hover:bg-secondary-container">
            <Icon name="home" size={18} />
            초기 화면으로
          </Link>
        )}
        {actions}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-page min-[720px]:flex">
      {!hideNav && (
        <aside className="no-print sticky top-0 hidden h-dvh w-max min-w-[176px] shrink-0 flex-col px-3 pb-5 pt-6 min-[720px]:flex">
          <Wordmark className="mb-8 px-3" />
          <nav className="grid gap-1" aria-label="주요 메뉴">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex min-h-12 items-center gap-3 rounded-full pl-4 pr-6 text-[14px] transition-colors duration-200',
                    active ? 'bg-primary-container font-semibold text-on-primary-container' : 'font-medium text-on-surface hover:bg-surface-container',
                  )}
                >
                  <Icon name={n.icon} filled={active} size={20} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      <div
        className={cx(
          'flex min-h-dvh min-w-0 flex-1 flex-col bg-surface pb-24 min-[720px]:min-h-0 min-[720px]:pb-0',
          !hideNav && 'min-[720px]:mt-3 min-[720px]:min-h-[calc(100dvh-12px)] min-[720px]:rounded-tl-[26px] min-[720px]:bg-surface',
          hideNav && 'bg-surface',
        )}
      >
        <header className="no-print sticky top-0 z-30 bg-surface/95 backdrop-blur-sm min-[720px]:static min-[720px]:bg-transparent min-[720px]:backdrop-blur-none">
          <div className="mx-auto w-full max-w-[1080px] px-4 min-[720px]:px-10">{header}</div>
        </header>
        <main className="page-enter mx-auto w-full max-w-[1080px] flex-1 px-4 pb-14 min-[720px]:px-10">{children}</main>
      </div>

      {!hideNav && (
        <nav
          className="no-print fixed inset-x-0 bottom-0 z-30 flex h-20 bg-surface-container-low pb-[env(safe-area-inset-bottom)] min-[720px]:hidden"
          aria-label="주요 메뉴"
        >
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className="flex flex-1 flex-col items-center justify-center gap-1">
                <span className={cx('grid h-8 w-14 place-items-center rounded-full transition-colors duration-200', active ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant')}>
                  <Icon name={n.icon} filled={active} size={22} />
                </span>
                <span className={cx('text-[12px] font-semibold', active ? 'text-on-primary-container' : 'text-on-surface-variant')}>{n.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

/** 로그인(데모) 전 접근 시 안내 */
export function NeedsUser() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <Icon name="extension" size={40} className="text-outline" />
      <h2 className="mt-4 headline-small">먼저 퍼즐을 만들어 주세요</h2>
      <Link href="/" className="mt-6 inline-flex min-h-10 items-center rounded-full bg-primary-container px-5 label-large text-on-primary-container">
        처음으로
      </Link>
    </div>
  );
}
