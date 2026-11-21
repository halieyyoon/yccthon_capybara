'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ② — Props { team: TeamCandidate; unlocked?: boolean }
// + 선택 Props: pieceCodes(멤버별 16유형 조각 — 없으면 응답에서 추정)
// 4인 퍼즐 2×2 맞물림 + puzzlePairs 보완 화살표 + evidenceTags 칩 + biggestGapNote 앰버 박스
// [v1.1 혜원] 소수 점수 대신 '맞는 항목 수' + 응답이 가장 다른 팀원 + 첫 회의에서 확인할 점 (docs/proposal/09)
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
/** 좁은 자리: 이름 + 별명(title)은 항상, 누르면 한 줄 설명(line) */
function PieceLabel({ code, me }: { code: PieceCode; me: boolean }) {
  const [open, setOpen] = useState(false);
  const t = PIECE_TYPES[code];
  return (
    <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="max-w-[10rem] rounded-m3-sm px-1 text-center hover:bg-surface-container">
      <span className="block title-small text-on-surface">
        {t.name}
        {me && <span className="ml-1 text-primary">나</span>}
      </span>
      <span className="block label-medium text-on-surface">{t.title}</span>
      {open && <span className="block body-small text-on-surface-variant">{t.line}</span>}
    </button>
  );
}

function Pieces({ team, codes, merged, size }: { team: TeamCandidate; codes: PieceCode[]; merged: boolean; size: number }) {
  return (
    <div className="mx-auto grid w-max grid-cols-2 transition-[gap] duration-700 ease-m3" style={{ gap: merged ? 4 : 28 }}>
      {team.members.slice(0, 4).map((m, i) => (
        <div key={m.id} className="flex flex-col items-center">
          <PuzzlePiece mode={m.temperatureMode} edges={edgesFromCode(codes[i])} size={size} highlight={i === 0} />
          <PieceLabel code={codes[i]} me={i === 0} />
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
        <InfoTip align="start">응답 근거 태그예요. 무리 이름 대신, 실제로 비슷하거나 서로 채워 주는 응답을 보여 줘요.</InfoTip>
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
                  {SKILL_CARD_BY_ID[p.weaknessId].weakness}
                </p>
              </div>
              <Icon name="arrow_back" size={18} className="text-outline" />
              <div className="min-w-0">
                <p className="label-small text-on-surface-variant">
                  {p.coveredByNickname}
                  {p.matchType === 'mapped' && <span className="ml-1 text-outline">· 비슷한 강점</span>}
                </p>
                <p className="body-medium text-primary">
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
            응답이 맞는 항목
            <InfoTip align="start">목표·AI·협업은 4명의 응답 차이가 1점 이하인 문항 수, 역량은 필요한 역할을 능숙한 팀원이 채운 수예요. 잘 맞을 가능성을 점수로 매긴 게 아니에요. 지표별 근거는 ‘왜 이 조합인가요?’에서 펼쳐 볼 수 있어요.</InfoTip>
          </p>
          <p className="tabular display-small text-on-surface">
            {team.explanations.reduce((n, e) => n + e.okCount, 0)}
            <span className="headline-small text-on-surface-variant">/{team.explanations.reduce((n, e) => n + e.total, 0)}</span>
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 label-medium text-on-surface-variant">
            응답이 가장 다른 팀원
            <InfoTip align="start">팀 평균이 좋아도 한 사람이 동떨어지면 문제가 생길 수 있어서, 평균과 함께 가장 먼 사람을 보여 줘요 (Barrick et al., 1998). 목표·AI·협업 11문항에서 다른 팀원과의 평균 점수 차이예요.</InfoTip>
          </p>
          <p className="title-medium text-on-surface">
            {team.outlier.nickname} <span className="tabular body-medium text-on-surface-variant">평균 {team.outlier.avgGap}점 차이</span>
          </p>
        </div>
        {team.missingInfoNotice && (
          <span className="inline-flex items-center gap-1 rounded-m3-sm bg-surface-container px-2.5 py-1 label-medium text-on-surface-variant">
            일부 미응답
            <InfoTip align="end">{team.missingInfoNotice}</InfoTip>
          </span>
        )}
      </div>

      {team.cautions.length > 0 && (
        <div className="rounded-m3-md bg-surface-container p-4">
          <p className="flex items-center gap-1 label-large text-on-surface">
            <Icon name="flag" size={18} />
            첫 회의에서 확인할 점
            <InfoTip align="start">근거가 약한 규칙이라 점수에는 넣지 않고 확인할 점으로만 보여 줘요.</InfoTip>
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 body-small text-on-surface-variant">
            {team.cautions.slice(0, 3).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
