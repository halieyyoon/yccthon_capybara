'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 퍼즐 조각 SVG 생성기 + 퍼즐 프로필 카드.
// 장점 2장 = 돌기(凸, 위·오른쪽), 약점 2장 = 홈(凹, 아래·왼쪽). 온도 상태에 따라 돌기 모양과 색이 바뀝니다.

import type { CollabType, SkillCardId, TemperatureMode } from '@/types/ondo';
import { COLLAB_AXIS_LABEL, SKILL_CARD_BY_ID, TEMPERATURE_BY_ID } from '@/data/constants';
import { cx } from '@/components/m3';

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
  const t = PUZZLE_THEME[mode];
  const pad = 32;
  return (
    <svg viewBox={`${-pad} ${-pad} ${100 + pad * 2} ${100 + pad * 2}`} width={size} height={size} className={className} role="img" aria-label={label}>
      <path
        d={piecePath(edges, mode)}
        fill={t.fill}
        stroke={highlight ? 'var(--md-sys-color-primary)' : t.stroke}
        strokeWidth={highlight ? 3 : mode === 'serious' ? 1.5 : 2}
        strokeLinejoin={mode === 'serious' ? 'miter' : 'round'}
        style={{ transition: 'd 420ms var(--md-sys-motion-emphasized), fill 300ms' }}
      />
      {label && (
        <text x={50} y={sublabel ? 47 : 55} textAnchor="middle" fill={t.ink} style={{ font: `600 ${labelSize}px var(--font-sans)`, letterSpacing: labelSize < 14 ? '0' : '0.04em' }}>
          {label}
        </text>
      )}
      {sublabel && (
        <text x={50} y={66} textAnchor="middle" fill={t.ink} opacity={0.75} style={{ font: '500 9.5px var(--font-sans)' }}>
          {sublabel}
        </text>
      )}
    </svg>
  );
}

function CardTag({ kind, id, mode }: { kind: 'strength' | 'weakness'; id: SkillCardId; mode: TemperatureMode }) {
  const meta = SKILL_CARD_BY_ID[id];
  const t = PUZZLE_THEME[mode];
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[5px] label-small"
        style={
          kind === 'strength'
            ? { background: t.stroke, color: mode === 'serious' ? '#fff' : t.surface }
            : { border: `1.5px dashed ${t.stroke}`, color: t.stroke }
        }
      >
        {kind === 'strength' ? '凸' : '凹'}
      </span>
      <span className="body-medium text-on-surface">{kind === 'strength' ? meta.strength : meta.weakness}</span>
    </div>
  );
}

export function PuzzleProfileCard({
  nickname,
  mode,
  collabType,
  strengths,
  weaknesses,
  subtitle,
  compact,
}: {
  nickname: string;
  mode: TemperatureMode;
  collabType: CollabType;
  strengths: [SkillCardId, SkillCardId];
  weaknesses: [SkillCardId, SkillCardId];
  subtitle?: string;
  compact?: boolean;
}) {
  const t = PUZZLE_THEME[mode];
  const temp = TEMPERATURE_BY_ID[mode];
  const axes = collabType.split('') as (keyof typeof COLLAB_AXIS_LABEL)[];
  return (
    <div
      className={cx('overflow-hidden rounded-m3-xl transition-colors duration-500', compact ? 'p-5' : 'p-6 md:p-8')}
      style={{ background: t.surface, color: 'var(--md-sys-color-on-surface)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label-medium uppercase" style={{ color: t.stroke }}>
            {temp.label}
          </p>
          <h3 className={cx('mt-1 truncate', compact ? 'title-large' : 'headline-small')} style={{ color: mode === 'serious' ? 'var(--puzzle-serious-ink)' : t.ink }}>
            {nickname}
          </h3>
          {subtitle && <p className="body-medium text-on-surface-variant">{subtitle}</p>}
        </div>
        <p className="tabular shrink-0 text-right" style={{ color: t.stroke }}>
          <span className={compact ? 'headline-medium' : 'display-small'}>{temp.temperature}</span>
          <span className="title-large align-top">°</span>
        </p>
      </div>

      <div className={cx('grid items-center gap-6', compact ? 'mt-3 grid-cols-[120px_1fr]' : 'mt-6 grid-cols-1 sm:grid-cols-[200px_1fr]')}>
        <div className="flex justify-center">
          <PuzzlePiece mode={mode} label={collabType} size={compact ? 120 : 200} />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="label-medium text-on-surface-variant">내가 채워 줄 수 있는 것</p>
            <CardTag kind="strength" id={strengths[0]} mode={mode} />
            <CardTag kind="strength" id={strengths[1]} mode={mode} />
          </div>
          <div className="space-y-2">
            <p className="label-medium text-on-surface-variant">채워 줄 사람이 필요한 것</p>
            <CardTag kind="weakness" id={weaknesses[0]} mode={mode} />
            <CardTag kind="weakness" id={weaknesses[1]} mode={mode} />
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-6 flex flex-wrap gap-2">
          {axes.map((a) => (
            <span key={a} className="rounded-m3-sm px-3 py-1.5 label-medium" style={{ background: 'color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent)', color: mode === 'serious' ? 'var(--puzzle-serious-30)' : t.ink }}>
              <b className="mr-1">{a}</b>
              {COLLAB_AXIS_LABEL[a]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
