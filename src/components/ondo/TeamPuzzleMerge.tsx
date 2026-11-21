'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 4인 퍼즐 합체: 2×2로 맞물리는 조각 + 약점 凹 ← 강점 凸 연결 목록

import type { PuzzleMatchPair, UserProfile } from '@/types/ondo';
import { SKILL_CARD_BY_ID } from '@/data/constants';
import { cx } from '@/components/m3';
import { type EdgeType, PuzzlePiece } from './Puzzle';

// 2×2에서 서로 맞닿는 변이 돌기/홈으로 맞물리도록 고정 배치 [위, 오른쪽, 아래, 왼쪽]
const LAYOUT: [EdgeType, EdgeType, EdgeType, EdgeType][] = [
  [0, 1, -1, 0],
  [0, 0, 1, -1],
  [1, -1, 0, 0],
  [-1, 0, 0, 1],
];

export function TeamPuzzleMerge({
  members,
  pairs,
  merged = true,
  showPairs = true,
  size = 120,
}: {
  members: UserProfile[];
  pairs: PuzzleMatchPair[];
  merged?: boolean;
  showPairs?: boolean;
  size?: number;
}) {
  const gap = merged ? -size * 0.36 : 4;
  return (
    <div className={cx('grid gap-6', showPairs && 'md:grid-cols-[auto_1fr] md:items-center')}>
      <div className="mx-auto grid grid-cols-2 transition-[gap] duration-700 ease-m3" style={{ gap, width: size * 2 + gap }}>
        {members.slice(0, 4).map((m, i) => (
          <div key={m.id} className="transition-transform duration-700 ease-m3">
            <PuzzlePiece mode={m.temperatureMode} edges={LAYOUT[i]} label={m.nickname.length > 5 ? m.nickname.slice(0, 5) : m.nickname} sublabel={i === 0 ? '나' : m.collabType} size={size} highlight={i === 0} />
          </div>
        ))}
      </div>
      {showPairs && (
        <ul className="space-y-2">
          {pairs.slice(0, 5).map((p, i) => (
            <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 body-medium">
              <span className="text-on-surface-variant">{p.weaknessOwnerNickname}</span>
              <span className="rounded-m3-xs border border-dashed border-outline px-1.5 label-medium text-on-surface-variant">凹 {SKILL_CARD_BY_ID[p.weaknessId].weakness}</span>
              <span aria-hidden className="material-symbols-rounded text-[18px] text-outline">arrow_back</span>
              <span className="rounded-m3-xs bg-secondary-container px-1.5 label-medium text-on-secondary-container">凸 {SKILL_CARD_BY_ID[p.strengthId].strength}</span>
              <span className="text-on-surface">{p.coveredByNickname}</span>
            </li>
          ))}
          {pairs.length === 0 && <li className="body-medium text-on-surface-variant">서로의 약점을 바로 채워 주는 조합은 아직 없어요.</li>}
        </ul>
      )}
    </div>
  );
}
