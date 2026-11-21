'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 퍼즐 조각 SVG 기본 요소. 온도 상태(fun/balanced/serious)에 따라 돌기 모양과 색이 바뀝니다.
// 계약 컴포넌트(PuzzleProfileCard, TeamPuzzleMerge 등)가 공통으로 쓰는 하위 부품입니다.

import { useEffect, useRef } from 'react';
import type { TemperatureMode } from '@/types/ondo';
export type EdgeType = 1 | 0 | -1;
type Pt = [number, number];
type Seg = { kind: 'L'; p: Pt } | { kind: 'C'; c1: Pt; c2: Pt; p: Pt };

const EDGE_SHAPES: Record<TemperatureMode, Seg[]> = {
  // 둥글고 큰 유기적 돌기
  fun: [
    { kind: 'L', p: [0.33, 0] },
    { kind: 'C', c1: [0.43, 0.05], c2: [0.22, -0.3], p: [0.5, -0.3] },
    { kind: 'C', c1: [0.78, -0.3], c2: [0.57, 0.05], p: [0.67, 0] },
    { kind: 'L', p: [1, 0] },
  ],
  // 정돈된 라운드 돌기
  balanced: [
    { kind: 'L', p: [0.36, 0] },
    { kind: 'C', c1: [0.4, 0], c2: [0.31, -0.22], p: [0.5, -0.22] },
    { kind: 'C', c1: [0.69, -0.22], c2: [0.6, 0], p: [0.64, 0] },
    { kind: 'L', p: [1, 0] },
  ],
  // 각진 지오메트릭 돌기
  serious: [
    { kind: 'L', p: [0.36, 0] },
    { kind: 'L', p: [0.31, -0.2] },
    { kind: 'L', p: [0.69, -0.2] },
    { kind: 'L', p: [0.64, 0] },
    { kind: 'L', p: [1, 0] },
  ],
};

/** 4변(위·오른쪽·아래·왼쪽) 타입으로 조각 path 생성. 좌표계는 0..size, 돌기는 바깥으로 최대 0.3*size */
export function piecePath(edges: [EdgeType, EdgeType, EdgeType, EdgeType], mode: TemperatureMode, size = 100): string {
  const S = size;
  const map = [
    (t: number, h: number): Pt => [t * S, h * S],
    (t: number, h: number): Pt => [S - h * S, t * S],
    (t: number, h: number): Pt => [S - t * S, S - h * S],
    (t: number, h: number): Pt => [h * S, S - t * S],
  ];
  const f = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  let d = `M ${f(map[0](0, 0))}`;
  edges.forEach((type, side) => {
    const tr = map[side];
    if (type === 0) {
      d += ` L ${f(tr(1, 0))}`;
      return;
    }
    for (const s of EDGE_SHAPES[mode]) {
      const P = (q: Pt) => tr(q[0], q[1] * type);
      d += s.kind === 'L' ? ` L ${f(P(s.p))}` : ` C ${f(P(s.c1))} ${f(P(s.c2))} ${f(P(s.p))}`;
    }
  });
  return `${d} Z`;
}

export const PUZZLE_THEME: Record<TemperatureMode, { fill: string; stroke: string; ink: string; surface: string; accent: string }> = {
  fun: { fill: 'var(--puzzle-fun-90)', stroke: 'var(--puzzle-fun-40)', ink: 'var(--puzzle-fun-30)', surface: 'var(--puzzle-fun-95)', accent: 'var(--puzzle-fun-accent)' },
  balanced: { fill: 'var(--puzzle-balanced-90)', stroke: 'var(--puzzle-balanced-40)', ink: 'var(--puzzle-balanced-30)', surface: 'var(--puzzle-balanced-95)', accent: 'var(--puzzle-balanced-80)' },
  serious: { fill: 'var(--puzzle-serious-30)', stroke: 'var(--puzzle-serious-ink)', ink: '#ffffff', surface: 'var(--puzzle-serious-95)', accent: 'var(--puzzle-serious-80)' },
};

const PUZZLE_ASSET: Record<string, string> = {
  '-1,1,-1,1': 'profile',
  '1,1,-1,-1': 'default',
  '0,1,-1,0': 'top-left',
  '0,0,1,-1': 'top-right',
  '1,-1,0,0': 'bottom-left',
  '-1,0,0,1': 'bottom-right',
};

const GLASS_INK: Record<TemperatureMode, string> = {
  fun: '#542938',
  balanced: '#1c425d',
  serious: '#302959',
};

/** 조각 SVG의 viewBox 여백 비율 (조각 본체 100 + 양쪽 32) */
export const PIECE_PAD_RATIO = 32 / 164;

export function PuzzlePiece({
  mode,
  edges = [1, 1, -1, -1],
  label,
  sublabel,
  size = 160,
  className,
  highlight,
  labelSize = 15,
}: {
  mode: TemperatureMode;
  edges?: [EdgeType, EdgeType, EdgeType, EdgeType];
  label?: string;
  sublabel?: string;
  size?: number;
  className?: string;
  highlight?: boolean;
  labelSize?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const artwork = useRef<HTMLSpanElement>(null);
  const fallback = useRef<SVGSVGElement>(null);
  const hasRendered = useRef(false);
  const assembled = edges.includes(0);
  const shape = piecePath(edges, assembled ? 'balanced' : mode);
  const asset = PUZZLE_ASSET[edges.join(',')];
  const ink = GLASS_INK[mode];
  const viewBox = '-32 -32 164 164';

  useEffect(() => {
    const canvasElement = canvas.current;
    const artworkElement = artwork.current;
    const fallbackElement = fallback.current;
    if (!canvasElement || !artworkElement || !fallbackElement) return;

    let canceled = false;
    let unmount: (() => void) | undefined;

    void import('./PuzzleGlassRenderer').then(({ mountGlassPuzzle }) => {
      if (canceled) return;
      unmount = mountGlassPuzzle({
        canvas: canvasElement,
        artwork: artworkElement,
        fallback: fallbackElement,
        path: shape,
        mode,
        assembled,
        animate: !hasRendered.current,
        onRender: () => { hasRendered.current = true; },
      });
    }).catch(() => {
      if (!canceled) fallbackElement.style.visibility = 'visible';
    });

    return () => {
      canceled = true;
      unmount?.();
    };
  }, [assembled, mode, shape, size]);

  const labels = (
    <>
      {highlight && (
        <path d={shape} fill="none" stroke="var(--md-sys-color-primary)" strokeWidth={1.8} strokeOpacity={0.85} />
      )}
      {label && (
        <text x={50} y={sublabel ? 47 : 55} textAnchor="middle" fill={ink} style={{ font: `650 ${labelSize}px var(--font-sans)`, letterSpacing: labelSize < 14 ? '0' : '0.04em' }}>
          {label}
        </text>
      )}
      {sublabel && (
        <text x={50} y={66} textAnchor="middle" fill={ink} opacity={0.85} style={{ font: '500 9.5px var(--font-sans)' }}>
          {sublabel}
        </text>
      )}
    </>
  );

  return (
    <span className={`relative inline-block shrink-0 ${className ?? ''}`} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg ref={fallback} viewBox={viewBox} className="absolute inset-0 size-full" aria-hidden="true">
        {asset ? (
          <image href={`/puzzles/${mode}-${asset}.webp`} x={-32} y={-32} width={164} height={164} opacity={0.87} />
        ) : (
          <path d={shape} fill={PUZZLE_THEME[mode].fill} stroke={PUZZLE_THEME[mode].stroke} strokeWidth={1.5} />
        )}
        {labels}
      </svg>
      <span ref={artwork} className="pointer-events-none absolute inset-0" style={{ opacity: 0 }} aria-hidden="true">
        <canvas ref={canvas} className="block size-full" />
        {(label || sublabel || highlight) && (
          <svg viewBox={viewBox} className="absolute inset-0 size-full" style={{ opacity: 'var(--puzzle-label-opacity, 0)' }}>{labels}</svg>
        )}
      </span>
    </span>
  );
}
