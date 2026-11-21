'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 상단 앱 바(데스크톱 탭) + 하단 내비게이션 바(모바일). M3 Top app bar / Navigation bar.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx, Icon } from '@/components/m3';

const NAV = [
  { href: '/profile', label: '내 퍼즐', icon: 'extension' },
  { href: '/cv', label: 'CV', icon: 'description' },
  { href: '/match', label: '팀 찾기', icon: 'groups' },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cx('inline-flex items-baseline gap-1.5 text-on-surface', className)} aria-label="On-do 처음으로">
      <span className="title-large tracking-tight">
        On<span className="text-primary">-</span>do
      </span>
      <span className="label-medium text-on-surface-variant">온도</span>
    </Link>
  );
}

export function AppShell({ children, title, back, actions, hideNav }: { children: ReactNode; title?: string; back?: string; actions?: ReactNode; hideNav?: boolean }) {
  const path = usePathname();
  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="no-print sticky top-0 z-30 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 md:px-6">
          {back ? (
            <Link href={back} aria-label="뒤로" className="state-layer -ml-2 grid size-10 place-items-center rounded-full text-on-surface">
              <Icon name="arrow_back" />
            </Link>
          ) : null}
          {title && back ? <h1 className="title-large truncate">{title}</h1> : <Wordmark />}
          {!hideNav && (
            <nav className="ml-8 hidden h-full items-stretch md:flex" aria-label="주요 메뉴">
              {NAV.map((n) => {
                const active = path.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href} className={cx('state-layer relative flex items-center gap-2 px-4 title-small', active ? 'text-primary' : 'text-on-surface-variant')}>
                    {n.label}
                    {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-primary" />}
                  </Link>
                );
              })}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-1">{actions}</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 md:px-6">{children}</main>
      {!hideNav && (
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex h-20 border-t border-outline-variant/60 bg-surface-container md:hidden" aria-label="주요 메뉴">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center justify-center gap-1">
                <span className={cx('grid h-8 w-16 place-items-center rounded-full transition-colors', active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant')}>
                  <Icon name={n.icon} filled={active} />
                </span>
                <span className={cx('label-medium', active ? 'text-on-surface' : 'text-on-surface-variant')}>{n.label}</span>
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
      <p className="mt-2 body-medium text-on-surface-variant">온보딩을 마치거나 데모 계정으로 들어오면 이 화면을 볼 수 있어요.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="state-layer inline-flex h-10 items-center rounded-full bg-primary px-6 label-large text-on-primary">
          처음으로
        </Link>
      </div>
    </div>
  );
}
