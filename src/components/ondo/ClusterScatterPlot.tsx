'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 101명 27차원 Gower+PAM 탐색 시각화. 2D 거리는 참고용이며 적합도 근거가 아닙니다.

import { useMemo, useState } from 'react';
import type { ClusteredPoint } from '@/types/ondo';
import { TEMPERATURE_BY_ID } from '@/data/constants';

export const CLUSTER_COLORS = ['#8f4c34', '#2f6fa3', '#7a6a1f', '#2e7d68', '#8b4f7a'];

export function ClusterScatterPlot({ points, height = 360 }: { points: ClusteredPoint[]; height?: number }) {
  const [hover, setHover] = useState<ClusteredPoint | null>(null);
  const W = 640;
  const H = 400;
  const pad = 28;
  const sx = (x: number) => pad + ((x + 100) / 200) * (W - pad * 2);
  const sy = (y: number) => pad + ((100 - y) / 200) * (H - pad * 2);
  const sorted = useMemo(
    () => [...points].sort((a, b) => Number(!!a.isCurrentUser || !!a.isRecommendedTeammate) - Number(!!b.isCurrentUser || !!b.isRecommendedTeammate)),
    [points],
  );
  const counts = useMemo(() => [0, 1, 2, 3, 4].map((c) => points.filter((p) => p.clusterId === c).length), [points]);

  return (
    <figure className="w-full">
      <div className="relative w-full overflow-hidden rounded-m3-lg border border-outline-variant bg-surface-container-lowest" style={{ height }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full" role="img" aria-label="101명 탐색적 군집 산점도">
          {[-50, 0, 50].map((v) => (
            <g key={v} stroke="var(--md-sys-color-outline-variant)" strokeWidth={1} strokeDasharray={v === 0 ? undefined : '2 4'}>
              <line x1={sx(v)} x2={sx(v)} y1={pad} y2={H - pad} />
              <line y1={sy(v)} y2={sy(v)} x1={pad} x2={W - pad} />
            </g>
          ))}
          {sorted.map((p) => {
            const big = p.isCurrentUser || p.isRecommendedTeammate;
            const r = p.isCurrentUser ? 9 : p.isRecommendedTeammate ? 7 : 4.5;
            return (
              <g key={p.userId} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                {big && (
                  <circle cx={sx(p.x)} cy={sy(p.y)} r={r + 5} fill="none" stroke={p.isCurrentUser ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-primary)'} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                )}
                <circle
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={r}
                  fill={CLUSTER_COLORS[p.clusterId % 5]}
                  fillOpacity={big ? 1 : p.missingCount > 0 ? 0.35 : 0.7}
                  stroke={p.missingCount > 0 && !big ? CLUSTER_COLORS[p.clusterId % 5] : 'none'}
                  strokeDasharray={p.missingCount > 0 ? '2 2' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-56 rounded-m3-xs bg-inverse-surface px-3 py-2 body-small text-inverse-on-surface shadow"
            style={{
              left: `${(sx(hover.x) / W) * 100}%`,
              top: `${(sy(hover.y) / H) * 100}%`,
              transform: `translate(${hover.x > 40 ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
            }}
          >
            <b className="label-large">{hover.isCurrentUser ? `나 · ${hover.nickname}` : hover.nickname}</b>
            <div>
              {hover.major} · {TEMPERATURE_BY_ID[hover.temperatureMode].temperature}° · {hover.collabType}
            </div>
            <div>
              그룹 {hover.clusterId + 1}
              {hover.missingCount > 0 ? ` · 미응답 ${hover.missingCount}개` : ''}
            </div>
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 body-small text-on-surface-variant">
        {counts.map((n, c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: CLUSTER_COLORS[c] }} />
            그룹 {c + 1} · {n}명
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-on-surface" />나
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-primary" />
          1순위 팀 추천
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-dashed border-outline" />
          성격·갈등 미응답
        </span>
      </figcaption>
    </figure>
  );
}
