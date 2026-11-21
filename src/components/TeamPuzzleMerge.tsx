'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ② — Props { team: TeamCandidate; unlocked?: boolean }
// 4인 퍼즐 2×2 맞물림 + puzzlePairs 보완 화살표 + evidenceTags 칩 + biggestGapNote 앰버 박스 + minMemberFit
// unlocked=true(팀 확정 화면)에서는 분석 정보 없이 퍼즐이 합쳐지는 연출만 보여 줍니다.

import { useEffect, useState } from 'react';
import type { TeamCandidate } from '@/types/ondo';
import { SKILL_CARD_BY_ID } from '@/data/constants';
import { cx, Icon, InfoTip } from '@/components/m3';
import { type EdgeType, PIECE_PAD_RATIO, PuzzlePiece } from '@/components/PuzzlePiece';

// 2×2에서 맞닿는 변이 돌기/홈으로 맞물리도록 고정 배치 [위, 오른쪽, 아래, 왼쪽]
const LAYOUT: [EdgeType, EdgeType, EdgeType, EdgeType][] = [
  [0, 1, -1, 0],
  [0, 0, 1, -1],
  [1, -1, 0, 0],
  [-1, 0, 0, 1],
];

function Pieces({ team, merged, size }: { team: TeamCandidate; merged: boolean; size: number }) {
  // 조각 SVG = 여백 + 본체 + 여백. 합체 시 본체끼리 정확히 맞닿도록 절대 위치로 배치
  const pad = size * PIECE_PAD_RATIO;
  const body = size - pad * 2;
  const spread = merged ? 0 : 14;
  const box = size + body + spread;
  return (
    <div className="relative mx-auto shrink-0" style={{ width: box, height: box }}>
      {team.members.slice(0, 4).map((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <div
            key={m.id}
            className="absolute left-0 top-0 transition-transform duration-700 ease-m3"
            style={{ transform: `translate(${col * (body + spread)}px, ${row * (body + spread)}px)` }}
          >
            <PuzzlePiece
              mode={m.temperatureMode}
              edges={LAYOUT[i]}
              label={m.nickname.length > 6 ? `${m.nickname.slice(0, 6)}…` : m.nickname}
              sublabel={i === 0 ? '나' : m.collabType}
              labelSize={12}
              size={size}
              highlight={i === 0}
            />
          </div>
        );
      })}
    </div>
  );
}

export function TeamPuzzleMerge({ team, unlocked }: { team: TeamCandidate; unlocked?: boolean }) {
  const [merged, setMerged] = useState(!unlocked);
  useEffect(() => {
    if (!unlocked) return;
    setMerged(false);
    const t = setTimeout(() => setMerged(true), 250);
    return () => clearTimeout(t);
  }, [unlocked, team.id]);

  if (unlocked) return <Pieces team={team} merged={merged} size={190} />;

  return (
    <div className="@container space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {team.evidenceTags.map((t) => (
          <span key={t} className="inline-flex h-8 items-center gap-1.5 rounded-m3-sm bg-secondary-container px-3 label-large text-on-secondary-container">
            <Icon name="check" size={16} />
            {t}
          </span>
        ))}
        <InfoTip align="start">응답 근거 태그예요. 군집 이름 대신, 실제로 비슷하거나 서로 채워 주는 응답을 보여 줘요.</InfoTip>
      </div>

      <div className="flex items-start gap-3 rounded-m3-md bg-tertiary-container p-4 text-on-tertiary-container">
        <Icon name="forum" className="mt-0.5" />
        <div>
          <p className="label-large">가장 큰 차이</p>
          <p className="body-medium">{team.biggestGapNote}</p>
        </div>
      </div>

      <div className="grid gap-6 @xl:grid-cols-[auto_1fr] @xl:items-center">
        <Pieces team={team} merged size={150} />
        <ul className="space-y-1">
          {team.puzzlePairs.slice(0, 5).map((p, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-m3-sm bg-surface px-3 py-2">
              <div className="min-w-0">
                <p className="label-small text-on-surface-variant">{p.weaknessOwnerNickname}</p>
                <p className="body-medium text-on-surface">
                  <span className="mr-1 text-on-surface-variant">凹</span>
                  {SKILL_CARD_BY_ID[p.weaknessId].weakness}
                </p>
              </div>
              <Icon name="arrow_back" size={18} className="text-outline" />
              <div className="min-w-0">
                <p className="label-small text-on-surface-variant">{p.coveredByNickname}</p>
                <p className="body-medium text-primary">
                  <span className="mr-1">凸</span>
                  {SKILL_CARD_BY_ID[p.strengthId].strength}
                </p>
              </div>
            </li>
          ))}
          {team.puzzlePairs.length === 0 && <li className="py-2.5 body-medium text-on-surface-variant">바로 채워 주는 조합이 아직 없어요.</li>}
        </ul>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="flex items-center gap-1 label-medium text-on-surface-variant">
            조합 지수 (임시 가중치 v1.0)
            <InfoTip align="start">검증 전 임시 가중치로 낸 순위 참고용 값이에요. 정확도나 궁합 확률이 아니에요.</InfoTip>
          </p>
          <p className="tabular display-small text-on-surface">{team.matchScore.toFixed(2)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 label-medium text-on-surface-variant">
            가장 덜 맞는 팀원
            <InfoTip align="start">평균만 보면 한 사람이 소외될 수 있어서, 팀에서 가장 불리한 사람의 적합도를 함께 보여 줘요.</InfoTip>
          </p>
          <p className={cx('tabular headline-small text-on-surface')}>{team.minMemberFit.toFixed(2)}</p>
        </div>
        {team.missingInfoNotice && (
          <span className="inline-flex items-center gap-1 rounded-m3-sm bg-surface-container px-2.5 py-1 label-medium text-on-surface-variant">
            일부 미응답
            <InfoTip align="end">{team.missingInfoNotice}</InfoTip>
          </span>
        )}
      </div>
    </div>
  );
}
