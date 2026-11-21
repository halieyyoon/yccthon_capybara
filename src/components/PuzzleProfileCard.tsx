'use client';

// [임시 구현 · 규혁 브랜치] 소유: 연서 (src/components/)
// 계약: yeonseo-slides-ui.md 3장 ① — Props { profile, showRealIdentity?, onModeChange?, compact? }
// SVG 퍼즐: 좌·우 돌기(凸) = 장점 2장, 상·하 홈(凹) = 약점 2장, 중앙 = 16유형 코드 + 온도 배지 + 27차원 응답 현황 칩

import type { SkillCardId, TemperatureMode, UserProfile } from '@/types/ondo';
import { COLLAB_AXIS_LABEL, FEATURE_META_27, SKILL_CARD_BY_ID, TEMPERATURE_BY_ID, TEMPERATURE_MODES } from '@/data/constants';
import { cx, InfoTip, SegmentedButton } from '@/components/m3';
import { PUZZLE_THEME, PuzzlePiece } from '@/components/PuzzlePiece';

/** 위·오른쪽·아래·왼쪽 = 홈·돌기·홈·돌기 */
const PROFILE_EDGES: [-1, 1, -1, 1] = [-1, 1, -1, 1];

function Tag({ kind, id, mode, align }: { kind: 'strength' | 'weakness'; id: SkillCardId; mode: TemperatureMode; align: 'left' | 'right' | 'center' }) {
  const meta = SKILL_CARD_BY_ID[id];
  const t = PUZZLE_THEME[mode];
  return (
    <div className={cx('flex flex-col gap-1', align === 'right' && 'items-end text-right', align === 'center' && 'items-center text-center', align === 'left' && 'items-start')}>
      <span className="label-small" style={{ color: t.stroke }}>
        {kind === 'strength' ? '장점' : '약점'}
      </span>
      <span className="body-small text-on-surface sm:body-medium">{kind === 'strength' ? meta.strength : meta.weakness}</span>
    </div>
  );
}

export function PuzzleProfileCard({
  profile,
  showRealIdentity,
  onModeChange,
  compact,
}: {
  profile: UserProfile;
  showRealIdentity?: boolean;
  onModeChange?: (mode: TemperatureMode) => void;
  compact?: boolean;
}) {
  const mode = profile.temperatureMode;
  const t = PUZZLE_THEME[mode];
  const temp = TEMPERATURE_BY_ID[mode];
  const answered = FEATURE_META_27.filter((m) => profile.features27[m.key] !== null).length;
  const axes = profile.collabType.split('') as (keyof typeof COLLAB_AXIS_LABEL)[];
  const name = showRealIdentity && profile.cv.realName ? profile.cv.realName : profile.nickname;
  const [s1, s2] = profile.strengths;
  const [w1, w2] = profile.weaknesses;
  const ink = mode === 'serious' ? 'var(--puzzle-serious-ink)' : t.ink;

  const band = { background: `var(--band-${mode})`, color: `var(--band-${mode}-fg)` };
  return (
    <div className="overflow-hidden rounded-m3-md bg-surface-container-low transition-colors duration-300">
      <div className={cx('transition-[background] duration-300', compact ? 'px-5 pb-4 pt-5' : 'px-5 pb-5 pt-6 md:px-6')} style={band}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-medium opacity-85">{temp.label}</p>
            <h3 className={cx('mt-0.5 truncate', compact ? 'title-large' : 'headline-medium')}>{name}</h3>
            <p className="label-medium opacity-85">
              {showRealIdentity && profile.cv.realName ? `${profile.nickname} · ` : ''}
              {profile.cv.major}
              {profile.cv.grade ? ` ${profile.cv.grade}` : ''}
            </p>
          </div>
          <p className="tabular shrink-0 text-right">
            <span className={compact ? 'headline-medium' : 'display-small'}>{temp.temperature}</span>
            <span className="title-large align-top">°</span>
          </p>
        </div>
      </div>

      <div className={compact ? 'px-5 pb-5' : 'px-5 pb-6 md:px-6'}>
      {onModeChange && (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1 label-medium text-on-surface-variant">
            이번엔 몇 도로?
            <InfoTip align="start">이번엔 가볍게 재미 위주? 아니면 제대로 수상 노려볼까요? 바꾸면 퍼즐 모양도 바로 바뀌어요.</InfoTip>
          </p>
          <SegmentedButton<TemperatureMode>
            ariaLabel="참여 온도"
            value={mode}
            onChange={onModeChange}
            options={TEMPERATURE_MODES.map((m) => ({
              value: m.id,
              label: (
                <span className="tabular">
                  {m.temperature}°<span className="hidden sm:inline"> {m.short}</span>
                </span>
              ),
            }))}
          />
        </div>
      )}

      {compact ? (
        <div className="mt-3 grid grid-cols-[112px_1fr] items-center gap-4">
          <PuzzlePiece mode={mode} edges={PROFILE_EDGES} label={profile.collabType} size={112} />
          <div className="space-y-2">
            <Tag kind="strength" id={s1} mode={mode} align="left" />
            <Tag kind="weakness" id={w1} mode={mode} align="left" />
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-6 grid max-w-lg grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto] items-center gap-x-2 gap-y-1 sm:gap-x-4">
          <div className="col-start-2 row-start-1 flex justify-center">
            <Tag kind="weakness" id={w1} mode={mode} align="center" />
          </div>
          <div className="col-start-1 row-start-2">
            <Tag kind="strength" id={s1} mode={mode} align="right" />
          </div>
          <div className="relative col-start-2 row-start-2 flex justify-center">
            <PuzzlePiece mode={mode} edges={PROFILE_EDGES} label={profile.collabType} sublabel={`${answered}/27 응답`} size={176} />
          </div>
          <div className="col-start-3 row-start-2">
            <Tag kind="strength" id={s2} mode={mode} align="left" />
          </div>
          <div className="col-start-2 row-start-3 flex justify-center">
            <Tag kind="weakness" id={w2} mode={mode} align="center" />
          </div>
        </div>
      )}

      {!compact && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {axes.map((a) => (
            <span key={a} className="rounded-m3-sm px-3 py-1.5 label-medium" style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface)' }}>
              <b className="mr-1">{a}</b>
              {COLLAB_AXIS_LABEL[a]}
            </span>
          ))}
          <InfoTip align="end" className="ml-auto">
            볼록한 변은 내가 채워 줄 수 있는 것, 오목한 변은 채워 줄 사람이 필요한 것이에요. 가운데 코드는 응답에서 자동으로 나온 협업 유형이에요(심리검사 아님).
          </InfoTip>
        </div>
      )}
      </div>
    </div>
  );
}
