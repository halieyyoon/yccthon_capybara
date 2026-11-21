'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 4인 퍼즐 합체: 2×2로 맞물리는 조각 + 약점 凹 ← 강점 凸 연결 목록

import type { PuzzleMatchPair, UserProfile } from '@/types/ondo';
import { SKILL_CARD_BY_ID } from '@/data/constants';
import { cx } from '@/components/m3';
import { type EdgeType, PIECE_PAD_RATIO, PuzzlePiece } from './Puzzle';

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
  // 조각 SVG = 여백(pad) + 본체(body) + 여백(pad). 합체 시 본체끼리 정확히 맞닿도록 절대 위치로 배치
  const pad = size * PIECE_PAD_RATIO;
  const body = size - pad * 2;
  const spread = merged ? 0 : 14;
  const box = size + body + spread;
  return (
    <div className={cx('grid gap-6', showPairs && 'md:grid-cols-[auto_1fr] md:items-center')}>
      <div className="relative mx-auto shrink-0" style={{ width: box, height: box }}>
        {members.slice(0, 4).map((m, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          return (
            <div
              key={m.id}
              className="absolute left-0 top-0 transition-transform duration-700 ease-m3"
              style={{ transform: `translate(${col * (body + spread)}px, ${row * (body + spread)}px)` }}
            >
              <PuzzlePiece mode={m.temperatureMode} edges={LAYOUT[i]} label={m.nickname.length > 6 ? `${m.nickname.slice(0, 6)}…` : m.nickname} sublabel={i === 0 ? '나' : m.collabType} labelSize={12} size={size} highlight={i === 0} />
            </div>
          );
        })}
      </div>
      {showPairs && (
        <ul className="divide-y divide-outline-variant">
          {pairs.slice(0, 5).map((p, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5">
              <div className="min-w-0">
                <p className="label-small text-on-surface-variant">{p.weaknessOwnerNickname}의 홈</p>
                <p className="body-medium text-on-surface">
                  <span className="mr-1 text-on-surface-variant">凹</span>
                  {SKILL_CARD_BY_ID[p.weaknessId].weakness}
                </p>
              </div>
              <span aria-label="을(를) 채워 줌" className="material-symbols-rounded text-[18px] text-outline">arrow_back</span>
              <div className="min-w-0">
                <p className="label-small text-on-surface-variant">{p.coveredByNickname}의 돌기</p>
                <p className="body-medium text-primary">
                  <span className="mr-1">凸</span>
                  {SKILL_CARD_BY_ID[p.strengthId].strength}
                </p>
              </div>
            </li>
          ))}
          {pairs.length === 0 && <li className="py-2.5 body-medium text-on-surface-variant">서로의 약점을 바로 채워 주는 조합은 아직 없어요.</li>}
        </ul>
      )}
    </div>
  );
}
