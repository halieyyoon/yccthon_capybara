'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 퍼즐 조각 SVG 기본 요소. 온도 상태(fun/balanced/serious)에 따라 돌기 모양과 색이 바뀝니다.
// 계약 컴포넌트(PuzzleProfileCard, TeamPuzzleMerge 등)가 공통으로 쓰는 하위 부품입니다.

import { useId } from 'react';
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

const GLASS_COLORS: Record<TemperatureMode, { light: string; middle: string; deep: string; ink: string }> = {
  fun: { light: '#fff4e8', middle: '#ffdcd4', deep: '#ecb5c9', ink: '#642f42' },
  balanced: { light: '#effffb', middle: '#c9eeee', deep: '#a8cdf5', ink: '#234c69' },
  serious: { light: '#f5f2ff', middle: '#dce0ff', deep: '#b9bafb', ink: '#343467' },
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
  const id = useId();
  const colors = GLASS_COLORS[mode];
  const outline = highlight ? 'var(--md-sys-color-primary)' : PUZZLE_THEME[mode].stroke;
  const path = piecePath(edges, mode);
  const pad = 32;
  return (
    <svg viewBox={`${-pad} ${-pad} ${100 + pad * 2} ${100 + pad * 2}`} width={size} height={size} className={className} overflow="visible" role="img" aria-label={label}>
      <defs>
        <path id={`${id}-shape`} d={path} className="motion-safe:transition-[d] motion-safe:duration-300" />
        <linearGradient id={`${id}-glass`} x1="10%" y1="0%" x2="88%" y2="100%">
          <stop stopColor={colors.light} />
          <stop offset="52%" stopColor={colors.middle} stopOpacity={0.94} />
          <stop offset="100%" stopColor={colors.deep} stopOpacity={0.96} />
        </linearGradient>
        <linearGradient id={`${id}-thickness`} x1="0%" y1="0%" x2="86%" y2="100%">
          <stop stopColor={colors.middle} />
          <stop offset="58%" stopColor={colors.deep} />
          <stop offset="100%" stopColor={outline} stopOpacity={0.68} />
        </linearGradient>
        <linearGradient id={`${id}-reflection`} x1="14%" y1="5%" x2="80%" y2="87%">
          <stop stopColor="#ffffff" stopOpacity={0.8} />
          <stop offset="32%" stopColor="#ffffff" stopOpacity={0.24} />
          <stop offset="39%" stopColor="#ffffff" stopOpacity={0.49} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.13} />
          <stop offset="61%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="90%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.48} />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="9%" y1="0%" x2="87%" y2="100%">
          <stop stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="37%" stopColor="#ffffff" stopOpacity={0.78} />
          <stop offset="66%" stopColor={colors.deep} stopOpacity={0.32} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.62} />
        </linearGradient>
      </defs>
      <g strokeLinejoin={mode === 'serious' ? 'miter' : 'round'}>
        <use
          href={`#${id}-shape`}
          y={edges.includes(0) ? 2.5 : 5}
          fill={`url(#${id}-thickness)`}
          stroke={outline}
          strokeWidth={1}
          strokeOpacity={0.35}
        />
        <use
          href={`#${id}-shape`}
          fill={`url(#${id}-glass)`}
          stroke={outline}
          strokeWidth={highlight ? 3.2 : 2.4}
          strokeOpacity={highlight ? 1 : 0.64}
        />
        <use
          href={`#${id}-shape`}
          fill={`url(#${id}-reflection)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth={1.25}
        />
      </g>
      {label && (
        <text x={50} y={sublabel ? 47 : 55} textAnchor="middle" fill={colors.ink} style={{ font: `600 ${labelSize}px var(--font-sans)`, letterSpacing: labelSize < 14 ? '0' : '0.04em' }}>
          {label}
        </text>
      )}
      {sublabel && (
        <text x={50} y={66} textAnchor="middle" fill={colors.ink} opacity={0.75} style={{ font: '500 9.5px var(--font-sans)' }}>
          {sublabel}
        </text>
      )}
    </svg>
  );
}

