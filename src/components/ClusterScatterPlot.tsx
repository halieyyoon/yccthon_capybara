'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ③ — Props { points: ClusteredPoint[]; onSelectPoint?: (p) => void }
// 101개 점 반응형 SVG 산점도 · 5개 군집 색 · 내 위치 펄스 링 · 추천 팀원 3명 연결선 · 하단 정직한 범례

import { useMemo, useState } from 'react';
import type { ClusteredPoint } from '@/types/ondo';
import { TEMPERATURE_BY_ID } from '@/data/constants';
import { InfoTip } from '@/components/m3';

export const CLUSTER_COLORS = ['#8f4c34', '#2f6fa3', '#7a6a1f', '#2e7d68', '#8b4f7a'];

export function ClusterScatterPlot({ points, onSelectPoint }: { points: ClusteredPoint[]; onSelectPoint?: (p: ClusteredPoint) => void }) {
  const [hover, setHover] = useState<ClusteredPoint | null>(null);
  const W = 640;
  const H = 400;
  const pad = 28;
  const sx = (x: number) => pad + ((x + 100) / 200) * (W - pad * 2);
  const sy = (y: number) => pad + ((100 - y) / 200) * (H - pad * 2);
  const me = points.find((p) => p.isCurrentUser);
  const mates = points.filter((p) => p.isRecommendedTeammate);
  const sorted = useMemo(
    () => [...points].sort((a, b) => Number(!!a.isCurrentUser || !!a.isRecommendedTeammate) - Number(!!b.isCurrentUser || !!b.isRecommendedTeammate)),
    [points],
  );
  const counts = useMemo(() => [0, 1, 2, 3, 4].map((c) => points.filter((p) => p.clusterId === c).length), [points]);

  return (
    <figure className="w-full">
      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-1 gap-y-1.5">
        <div className="relative self-stretch">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap label-medium text-on-surface-variant">
            ↕ 응답 차이
          </span>
        </div>
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-m3-lg bg-surface-container-low">
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" role="img" aria-label="비슷한 사람들끼리 모아 본 그림. 가까울수록 응답이 비슷해요">
            {[-50, 0, 50].map((v) => (
              <g key={v} stroke="var(--md-sys-color-outline-variant)" strokeWidth={1} strokeDasharray={v === 0 ? undefined : '2 4'}>
                <line x1={sx(v)} x2={sx(v)} y1={pad} y2={H - pad} />
                <line y1={sy(v)} y2={sy(v)} x1={pad} x2={W - pad} />
              </g>
            ))}
            {me &&
              mates.map((m) => (
                <line key={m.userId} x1={sx(me.x)} y1={sy(me.y)} x2={sx(m.x)} y2={sy(m.y)} stroke="var(--md-sys-color-primary)" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
              ))}
            {me && (
              <circle cx={sx(me.x)} cy={sy(me.y)} r={12} fill="none" stroke="var(--md-sys-color-on-surface)" strokeWidth={2}>
                <animate attributeName="r" values="12;22;12" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            {sorted.map((p) => {
              const big = p.isCurrentUser || p.isRecommendedTeammate;
              const r = p.isCurrentUser ? 9 : p.isRecommendedTeammate ? 7 : 4.5;
              const color = CLUSTER_COLORS[p.clusterId % 5];
              return (
                <g
                  key={p.userId}
                  onMouseEnter={() => setHover(p)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectPoint?.(p)}
                  style={{ cursor: onSelectPoint ? 'pointer' : 'default' }}
                >
                  {big && <circle cx={sx(p.x)} cy={sy(p.y)} r={r + 4} fill="none" stroke={p.isCurrentUser ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-primary)'} strokeWidth={2} />}
                  <circle
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={r}
                    fill={color}
                    fillOpacity={big ? 1 : p.missingCount > 0 ? 0.3 : 0.7}
                    stroke={p.missingCount > 0 && !big ? color : 'none'}
                    strokeDasharray={p.missingCount > 0 ? '2 2' : undefined}
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
                {hover.major} · {TEMPERATURE_BY_ID[hover.temperatureMode].temperature}°
              </div>
              <div>
                비슷한 무리 {hover.clusterId + 1}
                {hover.missingCount > 0 ? ` · 미응답 ${hover.missingCount}` : ''}
              </div>
            </div>
          )}
        </div>
        <span className="col-start-2 text-center label-medium text-on-surface-variant">↔ 응답 차이</span>
      </div>
      <figcaption className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 label-medium text-on-surface-variant">
          {counts.map((n, c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: CLUSTER_COLORS[c] }} />
              비슷한 무리 {c + 1} · {n}명
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-on-surface" />나
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full border-2 border-primary" />
            추천
          </span>
          <InfoTip align="end">
            응답 27개가 얼마나 다른지 계산해 비슷한 사람끼리 묶고(Gower·PAM), 지도처럼 펼쳤어요(MDS). 흐린 점선 점은 성격·갈등 질문에 답하지 않은 사람이에요.
          </InfoTip>
        </div>
        <p className="body-small text-on-surface-variant">가까이 있을수록 응답이 비슷한 사람이에요. 팀 추천은 이 그림이 아니라 따로 정한 기준으로 해요. 시연용 가상 후보 100명이에요.</p>
      </figcaption>
    </figure>
  );
}
