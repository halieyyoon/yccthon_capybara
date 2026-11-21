// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/lib/matching/)
// SPEC.md 5장 · 08번 문서 4~5장 원칙을 따르는 1단계 엔진의 최소 구현입니다.
// - 결측(null)은 0으로 바꾸지 않고, 두 사람 모두 관측된 차원만으로 그룹 균형 Gower 거리를 계산합니다.
// - PAM(k-medoids, k=5)은 결정론적 BUILD 초기화 + SWAP으로 수행합니다.
// - 2D 좌표는 고전적 MDS(거듭제곱법)로 만든 탐색용 시각화이며, 2D 거리를 적합도 근거로 쓰지 않습니다.
// - 최종 추천은 군집이 아니라 팀 수준 점수(임시 가중치 v1.0)로 결정합니다.

import type {
  ClusteredPoint,
  Contest,
  Features27,
  PuzzleMatchPair,
  TeamCandidate,
  UserProfile,
} from '@/types/ondo';
import {
  COMPATIBILITY_MATRIX_16X16,
  FEATURE_META_27,
  type FeatureGroup,
  type FeatureKey,
  ROLE_LABEL,
  SKILL_CARD_BY_ID,
} from '@/data/constants';

const GROUPS: FeatureGroup[] = ['personality', 'goal', 'conflict', 'ai', 'work', 'skill'];
const KEYS_BY_GROUP = Object.fromEntries(
  GROUPS.map((g) => [g, FEATURE_META_27.filter((m) => m.group === g)]),
) as Record<FeatureGroup, typeof FEATURE_META_27>;

export const SCORE_WEIGHTS = {
  goalAlignment: 0.375,
  roleCoverage: 0.3125,
  aiPolicyAlignment: 0.1875,
  collaborationCompatibility: 0.125,
} as const;

const OPTIONAL_KEYS: FeatureKey[] = FEATURE_META_27.filter((m) => m.optional).map((m) => m.key);

export function countMissing(x: Features27): number {
  return OPTIONAL_KEYS.filter((k) => x[k] === null).length;
}

/** 그룹 균형 Gower 거리 (0~1). 공통 관측 차원이 없는 그룹은 제외하고 나머지 그룹으로 평균 */
export function gowerDistance(a: Features27, b: Features27): number {
  let sum = 0;
  let groups = 0;
  for (const g of GROUPS) {
    let gs = 0;
    let n = 0;
    for (const m of KEYS_BY_GROUP[g]) {
      const va = a[m.key];
      const vb = b[m.key];
      if (va === null || vb === null) continue;
      gs += Math.abs(va - vb) / (m.max - m.min);
      n++;
    }
    if (n > 0) {
      sum += gs / n;
      groups++;
    }
  }
  return groups > 0 ? sum / groups : 1;
}

function distanceMatrix(users: UserProfile[]): number[][] {
  const n = users.length;
  const d = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v = gowerDistance(users[i].features27, users[j].features27);
      d[i][j] = v;
      d[j][i] = v;
    }
  }
  return d;
}

function pam(d: number[][], k: number, maxIter = 30): number[] {
  const n = d.length;
  const medoids: number[] = [];
  // BUILD: 첫 medoid는 전체 거리 합이 가장 작은 점
  let best = 0;
  let bestSum = Infinity;
  for (let i = 0; i < n; i++) {
    const s = d[i].reduce((a, b) => a + b, 0);
    if (s < bestSum) {
      bestSum = s;
      best = i;
    }
  }
  medoids.push(best);
  while (medoids.length < k) {
    let cand = -1;
    let gain = -Infinity;
    for (let c = 0; c < n; c++) {
      if (medoids.includes(c)) continue;
      let g = 0;
      for (let i = 0; i < n; i++) {
        const cur = Math.min(...medoids.map((m) => d[i][m]));
        g += Math.max(0, cur - d[i][c]);
      }
      if (g > gain) {
        gain = g;
        cand = c;
      }
    }
    medoids.push(cand);
  }
  const cost = (ms: number[]) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.min(...ms.map((m) => d[i][m]));
    return s;
  };
  let current = cost(medoids);
  for (let iter = 0; iter < maxIter; iter++) {
    let improved = false;
    for (let mi = 0; mi < k; mi++) {
      for (let c = 0; c < n; c++) {
        if (medoids.includes(c)) continue;
        const trial = [...medoids];
        trial[mi] = c;
        const tc = cost(trial);
        if (tc + 1e-9 < current) {
          medoids[mi] = c;
          current = tc;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return Array.from({ length: n }, (_, i) => {
    let bi = 0;
    for (let m = 1; m < k; m++) if (d[i][medoids[m]] < d[i][medoids[bi]]) bi = m;
    return bi;
  });
}

/** 고전적 MDS: 이중 중심화 후 상위 고유벡터 2개를 거듭제곱법으로 구함 */
function classicalMds(d: number[][]): [number, number][] {
  const n = d.length;
  const sq = d.map((row) => row.map((v) => v * v));
  const rowMean = sq.map((r) => r.reduce((a, b) => a + b, 0) / n);
  const all = rowMean.reduce((a, b) => a + b, 0) / n;
  const b = sq.map((r, i) => r.map((v, j) => -0.5 * (v - rowMean[i] - rowMean[j] + all)));

  const eig = (mat: number[][], deflate?: { vec: number[]; val: number }) => {
    let v = Array.from({ length: n }, (_, i) => Math.sin(i * 12.9898 + (deflate ? 3 : 1)));
    let lambda = 0;
    for (let it = 0; it < 200; it++) {
      const w = mat.map((row, i) => {
        let s = 0;
        for (let j = 0; j < n; j++) s += row[j] * v[j];
        if (deflate) s -= deflate.val * deflate.vec[i] * deflate.vec.reduce((acc, x, j) => acc + x * v[j], 0);
        return s;
      });
      const norm = Math.hypot(...w) || 1;
      lambda = norm;
      v = w.map((x) => x / norm);
    }
    return { vec: v, val: lambda };
  };
  const e1 = eig(b);
  const e2 = eig(b, e1);
  const xs = e1.vec.map((x) => x * Math.sqrt(e1.val));
  const ys = e2.vec.map((y) => y * Math.sqrt(e2.val));
  const scale = (arr: number[]) => {
    const max = Math.max(...arr.map(Math.abs)) || 1;
    return arr.map((v) => Math.round((v / max) * 95 * 10) / 10);
  };
  const sx = scale(xs);
  const sy = scale(ys);
  return sx.map((x, i) => [x, sy[i]]);
}

/** 1단계: 101명 27차원 군집 탐색 (Gower + PAM k=5 + 2D MDS) */
export function runClusterAnalysis(currentUser: UserProfile, pool: UserProfile[]): ClusteredPoint[] {
  const users = [currentUser, ...pool.filter((u) => u.id !== currentUser.id)];
  const d = distanceMatrix(users);
  const labels = pam(d, 5);
  const coords = classicalMds(d);
  return users.map((u, i) => ({
    userId: u.id,
    nickname: u.nickname,
    major: u.cv.major,
    temperatureMode: u.temperatureMode,
    collabType: u.collabType,
    clusterId: labels[i],
    x: coords[i][0],
    y: coords[i][1],
    missingCount: countMissing(u.features27),
    isCurrentUser: i === 0,
  }));
}

// ───────────────────────── 팀 수준 지표 ─────────────────────────

const range = (vals: number[]) => Math.max(...vals) - Math.min(...vals);
const mean = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
const std = (vals: number[]) => {
  const m = mean(vals);
  return Math.sqrt(mean(vals.map((v) => (v - m) ** 2)));
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const GOAL_KEYS: FeatureKey[] = ['winning_orientation', 'learning_priority', 'delivery_priority', 'continuation_intent'];
const AI_KEYS: FeatureKey[] = ['ai_use_permissiveness', 'ai_verification_strictness', 'ai_disclosure_preference'];
const WORK_KEYS: FeatureKey[] = ['prototyping_preference', 'risk_appetite', 'quality_priority', 'decision_structure_preference'];
const CONFLICT_KEYS: FeatureKey[] = ['integrating', 'obliging', 'dominating', 'avoiding', 'compromising'];

const num = (u: UserProfile, k: FeatureKey) => u.features27[k] as number;

function goalAlignment(team: UserProfile[]) {
  return clamp01(1 - mean(GOAL_KEYS.map((k) => std(team.map((u) => num(u, k))))) / 2);
}

function puzzlePairsFor(team: UserProfile[]): PuzzleMatchPair[] {
  const pairs: PuzzleMatchPair[] = [];
  for (const owner of team) {
    for (const w of owner.weaknesses) {
      const axis = SKILL_CARD_BY_ID[w].axis;
      const exact = team.find((m) => m.id !== owner.id && m.strengths.includes(w));
      const byAxis =
        exact ??
        team.find((m) => m.id !== owner.id && m.strengths.some((s) => SKILL_CARD_BY_ID[s].axis === axis));
      if (!byAxis) continue;
      const strengthId = exact ? w : byAxis.strengths.find((s) => SKILL_CARD_BY_ID[s].axis === axis)!;
      pairs.push({
        weaknessOwnerId: owner.id,
        weaknessOwnerNickname: owner.nickname,
        weaknessId: w,
        coveredById: byAxis.id,
        coveredByNickname: byAxis.nickname,
        strengthId,
      });
    }
  }
  return pairs;
}

function roleCoverage(team: UserProfile[], contest: Contest, pairs: PuzzleMatchPair[]) {
  const roles = contest.requiredRoles.length ? contest.requiredRoles : (['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'] as const);
  const coverage = mean(roles.map((r) => Math.max(...team.map((u) => u.features27[r])) / 4));
  const puzzleRate = pairs.length / (team.length * 2);
  return clamp01(0.7 * coverage + 0.3 * puzzleRate);
}

function aiPolicyAlignment(team: UserProfile[]) {
  const base = 1 - mean(AI_KEYS.map((k) => range(team.map((u) => num(u, k))))) / 4;
  const severe = range(team.map((u) => num(u, 'ai_use_permissiveness'))) >= 3 ? 0.15 : 0;
  return clamp01(base - severe);
}

function dealBreakerConflicts(team: UserProfile[]): string[] {
  const notes: string[] = [];
  for (const u of team) {
    for (const other of team) {
      if (other.id === u.id) continue;
      const x = other.features27;
      for (const d of u.dealBreakers) {
        if (d === 'blind_ai_copy' && x.ai_use_permissiveness >= 5 && x.ai_verification_strictness <= 2)
          notes.push(`${u.nickname}님의 지뢰(AI 복붙)와 ${other.nickname}님의 AI 사용 방식`);
        if (d === 'slow_decision' && x.decision_structure_preference <= 1)
          notes.push(`${u.nickname}님의 지뢰(결정 지연)와 ${other.nickname}님의 결정 방식`);
        if (d === 'scope_creep' && x.risk_appetite >= 5 && x.quality_priority <= 2)
          notes.push(`${u.nickname}님의 지뢰(기능 욕심)와 ${other.nickname}님의 도전 성향`);
      }
    }
  }
  return [...new Set(notes)];
}

function collaborationCompatibility(team: UserProfile[]) {
  const work = 1 - mean(WORK_KEYS.map((k) => range(team.map((u) => num(u, k))))) / 4;
  const levels: number[] = [];
  for (let i = 0; i < team.length; i++)
    for (let j = i + 1; j < team.length; j++)
      levels.push(COMPATIBILITY_MATRIX_16X16[team[i].collabType][team[j].collabType]);
  const matrix = (mean(levels) - 1) / 4;
  const observed = team.filter((u) => CONFLICT_KEYS.every((k) => u.features27[k] !== null));
  const parts: [number, number][] = [
    [work, 0.45],
    [matrix, 0.35],
  ];
  if (observed.length >= 2) {
    const conflict = 1 - mean(CONFLICT_KEYS.map((k) => range(observed.map((u) => num(u, k))))) / 4;
    parts.push([conflict, 0.2]);
  }
  const wsum = parts.reduce((s, [, w]) => s + w, 0);
  const base = parts.reduce((s, [v, w]) => s + v * w, 0) / wsum;
  return clamp01(base - dealBreakerConflicts(team).length * 0.08);
}

function memberFit(member: UserProfile, team: UserProfile[]) {
  const others = team.filter((m) => m.id !== member.id);
  const keys = [...GOAL_KEYS, ...AI_KEYS, ...WORK_KEYS];
  const diffs = others.map((o) => mean(keys.map((k) => Math.abs(num(member, k) - num(o, k)) / 4)));
  return clamp01(1 - mean(diffs));
}

const GAP_COPY: Partial<Record<FeatureKey, string>> = {
  winning_orientation: '수상을 얼마나 중요하게 보는지에 차이가 있어요. 첫 회의에서 목표 수준을 먼저 맞춰 보세요.',
  learning_priority: '배우는 경험과 결과물 중 무엇을 앞에 둘지 생각이 갈려요.',
  delivery_priority: '마감이 다가오면 기능을 줄일지에 대한 생각이 달라요.',
  continuation_intent: '대회 이후에도 이어갈지에 대한 기대가 달라요.',
  ai_use_permissiveness: 'AI로 핵심 코드를 써도 되는지에 대한 생각이 달라요. 사용 범위를 먼저 정해 두세요.',
  ai_verification_strictness: 'AI 결과물 검증 엄격도에 차이가 있어 초반 합의를 권장해요.',
  ai_disclosure_preference: 'AI를 어디에 썼는지 공유할지에 대한 기대가 달라요.',
  prototyping_preference: '먼저 만들지, 먼저 기획할지 순서에 대한 선호가 달라요.',
  risk_appetite: '새로운 기능에 도전할지, 확실한 것부터 할지 성향이 달라요.',
  quality_priority: '기능 수와 완성도 중 무엇을 우선할지 생각이 달라요.',
  decision_structure_preference: '결정 규칙을 미리 정할지에 대한 선호가 달라요. 담당자를 먼저 정해 두면 좋아요.',
};

function biggestGap(team: UserProfile[]): { key: FeatureKey; note: string } {
  const keys = [...GOAL_KEYS, ...AI_KEYS, ...WORK_KEYS];
  let bestKey = keys[0];
  let bestRange = -1;
  for (const k of keys) {
    const r = range(team.map((u) => num(u, k)));
    if (r > bestRange) {
      bestRange = r;
      bestKey = k;
    }
  }
  return { key: bestKey, note: GAP_COPY[bestKey] ?? '응답 차이가 큰 항목이 있어 첫 회의에서 확인해 보세요.' };
}

function evidenceTags(team: UserProfile[], contest: Contest, pairs: PuzzleMatchPair[]): string[] {
  const tags: string[] = [];
  const all = (k: FeatureKey, pred: (v: number) => boolean) => team.every((u) => pred(num(u, k)));
  if (all('prototyping_preference', (v) => v >= 4)) tags.push('모두 빠른 프로토타이핑 선호');
  if (all('quality_priority', (v) => v >= 4)) tags.push('모두 완성도 우선');
  if (all('ai_verification_strictness', (v) => v >= 4)) tags.push('AI 결과는 직접 검증하자는 데 동의');
  if (range(team.map((u) => num(u, 'winning_orientation'))) <= 1) tags.push('수상 기대치가 비슷함');
  if (range(team.map((u) => num(u, 'delivery_priority'))) <= 1) tags.push('완성 제출에 대한 생각이 비슷함');
  const coveredAxes = [...new Set(pairs.map((p) => SKILL_CARD_BY_ID[p.strengthId].axis))];
  for (const axis of coveredAxes.slice(0, 2)) tags.push(`${ROLE_LABEL[axis]} 역량 보완`);
  const roleMax = contest.requiredRoles.filter((r) => Math.max(...team.map((u) => u.features27[r])) >= 3);
  if (roleMax.length === contest.requiredRoles.length && contest.requiredRoles.length > 0)
    tags.push('대회 필수 역할을 모두 채움');
  return tags.slice(0, 3);
}

function scoreTeam(team: UserProfile[], contest: Contest) {
  const pairs = puzzlePairsFor(team);
  const breakdown = {
    goalAlignment: goalAlignment(team),
    roleCoverage: roleCoverage(team, contest, pairs),
    aiPolicyAlignment: aiPolicyAlignment(team),
    collaborationCompatibility: collaborationCompatibility(team),
    scheduleOverlap: null,
  };
  const score =
    SCORE_WEIGHTS.goalAlignment * breakdown.goalAlignment +
    SCORE_WEIGHTS.roleCoverage * breakdown.roleCoverage +
    SCORE_WEIGHTS.aiPolicyAlignment * breakdown.aiPolicyAlignment +
    SCORE_WEIGHTS.collaborationCompatibility * breakdown.collaborationCompatibility;
  return { score, breakdown, pairs };
}

function passesHardConstraints(user: UserProfile, candidate: UserProfile, contest: Contest) {
  if (contest.scale === 'large' && contest.category === 'it_hackathon' && !candidate.hardConstraints.offlineAvailable)
    return false;
  if (user.hardConstraints.nightWorkAvailable && contest.category === 'it_hackathon' && !candidate.hardConstraints.nightWorkAvailable)
    return false;
  return true;
}

/** 1단계 팀 추천: 하드 제약 → 군집 다양화 후보 → 팀 수준 점수 상위 3팀 */
export function recommendTeams(
  currentUser: UserProfile,
  pool: UserProfile[],
  contest: Contest,
  clusteredPoints: ClusteredPoint[],
): { teams: TeamCandidate[]; annotatedPoints: ClusteredPoint[] } {
  const clusterOf = new Map(clusteredPoints.map((p) => [p.userId, p.clusterId]));
  const eligible = pool.filter((u) => u.id !== currentUser.id && passesHardConstraints(currentUser, u, contest));

  // 1:1 사전 점수로 후보를 줄이되, 군집마다 상위 6명씩 뽑아 한 군집에 쏠리지 않게 함
  const pre = eligible
    .map((u) => ({ u, s: scoreTeam([currentUser, u], contest).score }))
    .sort((a, b) => b.s - a.s);
  const perCluster = new Map<number, number>();
  const shortlist: UserProfile[] = [];
  for (const { u } of pre) {
    const c = clusterOf.get(u.id) ?? 0;
    const cnt = perCluster.get(c) ?? 0;
    if (cnt >= 6) continue;
    perCluster.set(c, cnt + 1);
    shortlist.push(u);
    if (shortlist.length >= 26) break;
  }

  const scored: { members: UserProfile[]; score: number; breakdown: TeamCandidate['scoreBreakdown']; pairs: PuzzleMatchPair[] }[] = [];
  for (let i = 0; i < shortlist.length; i++)
    for (let j = i + 1; j < shortlist.length; j++)
      for (let k = j + 1; k < shortlist.length; k++) {
        const members = [currentUser, shortlist[i], shortlist[j], shortlist[k]];
        const r = scoreTeam(members, contest);
        scored.push({ members, score: r.score, breakdown: r.breakdown, pairs: r.pairs });
      }
  scored.sort((a, b) => b.score - a.score);

  // 서로 2명 이상 겹치지 않는 상위 3팀
  const picked: typeof scored = [];
  for (const t of scored) {
    const ids = new Set(t.members.slice(1).map((m) => m.id));
    const overlaps = picked.some((p) => p.members.slice(1).filter((m) => ids.has(m.id)).length >= 2);
    if (!overlaps) picked.push(t);
    if (picked.length === 3) break;
  }

  const teams: TeamCandidate[] = picked.map((t, idx) => {
    const missing = t.members.filter((m) => countMissing(m.features27) > 0);
    const gap = biggestGap(t.members);
    return {
      id: `${contest.id}-team-${idx + 1}`,
      contestId: contest.id,
      rank: (idx + 1) as 1 | 2 | 3,
      members: t.members,
      matchScore: Math.round(t.score * 1000) / 1000,
      minMemberFit: Math.round(Math.min(...t.members.map((m) => memberFit(m, t.members))) * 1000) / 1000,
      biggestGapNote: gap.note,
      evidenceTags: evidenceTags(t.members, contest, t.pairs),
      scoreBreakdown: t.breakdown,
      missingInfoNotice: missing.length
        ? `${missing.map((m) => m.nickname).join(', ')}님은 성격·갈등 응답이 비어 있어요. 이 부분은 점수에서 빼고 계산했어요.`
        : undefined,
      puzzlePairs: t.pairs,
      status: 'CLUSTERED',
    };
  });

  const rec = new Set(teams[0]?.members.slice(1).map((m) => m.id) ?? []);
  const annotatedPoints = clusteredPoints.map((p) => ({ ...p, isRecommendedTeammate: rec.has(p.userId) }));
  return { teams, annotatedPoints };
}
