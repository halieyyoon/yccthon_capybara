'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ② — Props { team: TeamCandidate; unlocked?: boolean }
// + 선택 Props: pieceCodes(멤버별 16유형 조각 — 없으면 응답에서 추정)
// 4인 퍼즐 2×2 맞물림 + puzzlePairs 보완 화살표 + evidenceTags 칩 + biggestGapNote 앰버 박스 + minMemberFit
// unlocked=true(팀 확정 화면)에서는 분석 정보 없이 퍼즐이 합쳐지는 연출만 보여 줍니다.

import { useEffect, useState } from 'react';
import type { TeamCandidate } from '@/types/ondo';
import { SKILL_CARD_BY_ID } from '@/data/constants';
import { cx, Icon, InfoTip } from '@/components/m3';
import { PuzzlePiece } from '@/components/PuzzlePiece';
import { PIECE_TYPES, type PieceCode, derivePieceCode, edgesFromCode } from '@/store/pieceTypes';

/**
 * 2×2 배치. 다른 화면(내 조각 결과·팀 드롭)과 같은 모양이 되도록 각자의 16유형 조각을 온전한 모양 그대로 그립니다.
 * (예전처럼 바깥 변을 평평하게 깎아 한 장의 사각형으로 만들지 않음)
 */
function Pieces({ team, codes, merged, size }: { team: TeamCandidate; codes: PieceCode[]; merged: boolean; size: number }) {
  return (
    <div className="mx-auto grid w-max grid-cols-2 transition-[gap] duration-700 ease-m3" style={{ gap: merged ? 4 : 28 }}>
      {team.members.slice(0, 4).map((m, i) => (
        <div key={m.id} className="flex flex-col items-center">
          <PuzzlePiece mode={m.temperatureMode} edges={edgesFromCode(codes[i])} size={size} highlight={i === 0} />
          <p className="title-small text-on-surface">
            {PIECE_TYPES[codes[i]].name}
            {i === 0 && <span className="ml-1 text-primary">나</span>}
          </p>
          <p className="max-w-[9rem] truncate label-small text-on-surface-variant">{m.nickname}</p>
        </div>
      ))}
    </div>
  );
}

export function TeamPuzzleMerge({ team, unlocked, pieceCodes }: { team: TeamCandidate; unlocked?: boolean; pieceCodes?: PieceCode[] }) {
  const codes = pieceCodes ?? team.members.map((m) => derivePieceCode(m));
  const [merged, setMerged] = useState(!unlocked);
  useEffect(() => {
    if (!unlocked) return;
    setMerged(false);
    const t = setTimeout(() => setMerged(true), 250);
    return () => clearTimeout(t);
  }, [unlocked, team.id]);

  if (unlocked) return <Pieces team={team} codes={codes} merged={merged} size={150} />;

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

      <div className="flex items-start gap-3 rounded-m3-md bg-surface p-4 text-on-surface">
        <Icon name="forum" className="mt-0.5 text-tertiary" />
        <div>
          <p className="label-large">가장 큰 차이</p>
          <p className="body-medium">{team.biggestGapNote}</p>
        </div>
      </div>

      <div className="grid gap-6 @xl:grid-cols-[auto_1fr] @xl:items-center">
        <Pieces team={team} codes={codes} merged size={104} />
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
