// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/lib/matching/)
// SPEC.md 5장 · 08번 문서 4~5장 원칙을 따르는 1단계 엔진의 최소 구현입니다.
// - 결측(null)은 0으로 바꾸지 않고, 두 사람 모두 관측된 차원만으로 그룹 균형 Gower 거리를 계산합니다.
// - PAM(k-medoids, k=5)은 결정론적 BUILD 초기화 + SWAP으로 수행합니다.
// - 2D 좌표는 고전적 MDS(거듭제곱법)로 만든 탐색용 시각화이며, 2D 거리를 적합도 근거로 쓰지 않습니다.
// - 최종 추천은 군집이 아니라 팀 수준 점수(임시 가중치 v1.0)로 결정합니다.
// - [v1.1 혜원] 팀 점수는 근거가 있는 4지표만 사용 (docs/proposal/09 3장).
//   목표·AI·작업 = separation(차이가 작을수록), 역량 = variety(역할을 채울수록) — Harrison & Klein(2007)
//   지뢰 충돌·16유형 매트릭스·AI 허용도 큰 차이는 점수에서 빼고 cautions(첫 회의에서 확인할 점)로만 보여 줌.

import type {
  ClusteredPoint,
  Contest,
  Features27,
  MemberOutlier,
  MetricExplanation,
  MetricItemEvidence,
  PuzzleMatchPair,
  RoleId,
  TeamCandidate,
  UserProfile,
} from '@/types/ondo';
import {
  COMPAT_LEVEL_META,
  COMPATIBILITY_MATRIX_16X16,
  FEATURE_META_27,
  type FeatureGroup,
  type FeatureKey,
  ROLE_LABEL,
  SKILL_CARD_BY_ID,
  WEAKNESS_COVERED_BY,
} from '@/data/constants';
import type { RefId } from '@/data/references';

const GROUPS: FeatureGroup[] = ['personality', 'goal', 'conflict', 'ai', 'work', 'skill'];
const KEYS_BY_GROUP = Object.fromEntries(
  GROUPS.map((g) => [g, FEATURE_META_27.filter((m) => m.group === g)]),
) as Record<FeatureGroup, typeof FEATURE_META_27>;

/** 08번 문서 5.3 임시 가중치(0.30/0.25/0.20 일정/0.15/0.10)에서 일정을 빼고 0.80으로 나눠 재조정 — 실증값 아님 */
export const SCORE_WEIGHTS = {
  goalAlignment: 0.375,
  roleCoverage: 0.3125,
  aiPolicyAlignment: 0.1875,
  collaborationCompatibility: 0.125,
} as const;

/** 화면 '일치/채움' 판정 기준 (자체 규칙 v1.1) */
export const MATCH_RULES = {
  /** 1~5 응답에서 팀원 간 최고−최저 차이가 이 값 이하이면 '일치' */
  separationMaxGap: 1,
  /** 0~4 숙련도에서 팀 최고값이 이 값 이상이면 '역할 채움' (3 = 능숙) */
  roleMinLevel: 3,
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
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const GOAL_KEYS: FeatureKey[] = ['winning_orientation', 'learning_priority', 'delivery_priority', 'continuation_intent'];
const AI_KEYS: FeatureKey[] = ['ai_use_permissiveness', 'ai_verification_strictness', 'ai_disclosure_preference'];
const WORK_KEYS: FeatureKey[] = ['prototyping_preference', 'risk_appetite', 'quality_priority', 'decision_structure_preference'];
const ALL_ROLES: RoleId[] = ['planning', 'frontend', 'backend', 'design', 'data_ai', 'presentation'];

const LABEL_BY_KEY = Object.fromEntries(FEATURE_META_27.map((m) => [m.key, m.label])) as Record<FeatureKey, string>;
const num = (u: UserProfile, k: FeatureKey) => u.features27[k] as number;

/** separation 지표: 문항마다 팀 내 최고−최저 차이. 연속값 = 1 − 평균 차이/4 (1~5 척도의 최대 차이 4) */
function separationMetric(
  team: UserProfile[],
  keys: FeatureKey[],
  meta: { metric: MetricExplanation['metric']; label: string; why: string; refs: RefId[] },
): MetricExplanation {
  const items: MetricItemEvidence[] = keys.map((k) => {
    const vals = team.map((u) => num(u, k));
    const gap = range(vals);
    return {
      key: k,
      label: LABEL_BY_KEY[k],
      values: team.map((u) => ({ nickname: u.nickname, value: u.features27[k] })),
      stat: gap,
      ok: gap <= MATCH_RULES.separationMaxGap,
    };
  });
  return {
    ...meta,
    diversityType: 'separation',
    okCount: items.filter((i) => i.ok).length,
    total: items.length,
    value: clamp01(1 - mean(items.map((i) => i.stat)) / 4),
    weight: SCORE_WEIGHTS[meta.metric],
    rule: `${team.length}명의 응답 차이(최고−최저)가 ${MATCH_RULES.separationMaxGap}점 이하인 문항을 '일치'로 세요. 1~5점 문항과 이지선다 문항(2·5점 등으로 환산)이 섞여 있어요.`,
    items,
  };
}

/** variety 지표: 대회 필수 역할마다 팀 최고 숙련도. 연속값 = 평균(min(최고, 3)/3) — '누군가 한 명은 능숙'이면 충분 */
function roleMetric(team: UserProfile[], contest: Contest): MetricExplanation {
  const roles = contest.requiredRoles.length ? contest.requiredRoles : ALL_ROLES;
  const items: MetricItemEvidence[] = roles.map((r) => {
    const best = Math.max(...team.map((u) => u.features27[r]));
    return {
      key: r,
      label: ROLE_LABEL[r],
      values: team.map((u) => ({ nickname: u.nickname, value: u.features27[r] })),
      stat: best,
      ok: best >= MATCH_RULES.roleMinLevel,
    };
  });
  return {
    metric: 'roleCoverage',
    label: '역량 보완',
    diversityType: 'variety',
    okCount: items.filter((i) => i.ok).length,
    total: items.length,
    value: clamp01(mean(items.map((i) => Math.min(i.stat, MATCH_RULES.roleMinLevel) / MATCH_RULES.roleMinLevel))),
    weight: SCORE_WEIGHTS.roleCoverage,
    rule: `이 대회에 필요한 역할마다 역량 ${MATCH_RULES.roleMinLevel}(능숙) 이상인 팀원이 한 명이라도 있으면 '채움'으로 세요. 역량은 온보딩 D2에서 본인이 매긴 값이에요.`,
    why: '역할은 비슷할 필요가 없고 서로 달라서 빈칸이 없을수록 좋아요. 그래서 다른 지표와 반대로 계산해요.',
    refs: ['HARRISON2007', 'LAYTON2010'],
    items,
  };
}

function explainTeam(team: UserProfile[], contest: Contest): MetricExplanation[] {
  return [
    separationMetric(team, GOAL_KEYS, {
      metric: 'goalAlignment',
      label: '목표 일치',
      why: '목표와 기대가 맞는 집단일수록 결과가 좋다는 메타분석이 있어 가장 큰 비중을 둬요.',
      refs: ['KRISTOF2005', 'HARRISON2007'],
    }),
    roleMetric(team, contest),
    separationMetric(team, AI_KEYS, {
      metric: 'aiPolicyAlignment',
      label: 'AI 규범',
      why: 'AI를 어디까지 쓰고 누가 검증할지 기준이 다르면 초반에 부딪히기 쉬워 따로 봐요.',
      refs: ['HARRISON2007'],
    }),
    separationMetric(team, WORK_KEYS, {
      metric: 'collaborationCompatibility',
      label: '협업 방식',
      why: '먼저 만들지 먼저 정할지, 완성도와 속도 중 무엇을 앞세울지의 차이예요.',
      refs: ['HARRISON2007'],
    }),
  ];
}

function puzzlePairsFor(team: UserProfile[]): PuzzleMatchPair[] {
  const pairs: PuzzleMatchPair[] = [];
  for (const owner of team) {
    for (const w of owner.weaknesses) {
      // 매핑표 순서대로(첫 번째 = 같은 카드) 덮어 줄 팀원을 찾음. 매핑에 없는 강점으로는 연결하지 않음
      let found: { member: UserProfile; strengthId: typeof w } | undefined;
      for (const s of WEAKNESS_COVERED_BY[w]) {
        const member = team.find((m) => m.id !== owner.id && m.strengths.includes(s));
        if (member) {
          found = { member, strengthId: s };
          break;
        }
      }
      if (!found) continue;
      pairs.push({
        weaknessOwnerId: owner.id,
        weaknessOwnerNickname: owner.nickname,
        weaknessId: w,
        coveredById: found.member.id,
        coveredByNickname: found.member.nickname,
        strengthId: found.strengthId,
        matchType: found.strengthId === w ? 'exact' : 'mapped',
      });
    }
  }
  return pairs;
}

/** 점수에 넣지 않는 주의 사항 (근거가 약해 감점 대신 '첫 회의에서 확인할 점'으로만 표시) */
function cautionsFor(team: UserProfile[]): string[] {
  const notes: string[] = [];
  for (const u of team) {
    for (const other of team) {
      if (other.id === u.id) continue;
      const x = other.features27;
      for (const d of u.dealBreakers) {
        if (d === 'blind_ai_copy' && x.ai_use_permissiveness >= 5 && x.ai_verification_strictness <= 2)
          notes.push(`${u.nickname}님이 피하고 싶은 'AI 복붙'과 ${other.nickname}님의 AI 사용 방식이 부딪힐 수 있어요.`);
        if (d === 'slow_decision' && x.decision_structure_preference <= 1)
          notes.push(`${u.nickname}님이 피하고 싶은 '결정 지연'과 ${other.nickname}님의 결정 방식이 부딪힐 수 있어요.`);
        if (d === 'scope_creep' && x.risk_appetite >= 5 && x.quality_priority <= 2)
          notes.push(`${u.nickname}님이 피하고 싶은 '기능 욕심'과 ${other.nickname}님의 도전 성향이 부딪힐 수 있어요.`);
      }
    }
  }
  if (range(team.map((u) => num(u, 'ai_use_permissiveness'))) >= 3)
    notes.push('AI로 핵심 코드를 써도 되는지에 대한 생각이 크게 갈려요. 사용 범위를 첫 회의에서 먼저 정해 두세요.');
  for (let i = 1; i < team.length; i++) {
    const lv = COMPATIBILITY_MATRIX_16X16[team[0].collabType][team[i].collabType];
    // 임시 참고표라 가장 낮은 단계만 알림 (정식 매트릭스로 교체 전까지)
    if (lv === 1)
      notes.push(`나와 ${team[i].nickname}님의 협업 유형 조합은 임시 참고표에서 '${COMPAT_LEVEL_META[lv].label}' 단계예요.`);
  }
  return [...new Set(notes)];
}

const SEPARATION_KEYS = [...GOAL_KEYS, ...AI_KEYS, ...WORK_KEYS];

/** 팀원마다 다른 팀원과의 평균 응답 차이 → 가장 큰 사람 (Barrick et al., 1998: 평균과 함께 최솟값) */
function findOutlier(team: UserProfile[]): MemberOutlier & { fit: number } {
  const rows = team.map((member) => {
    const others = team.filter((m) => m.id !== member.id);
    const avgGap = mean(others.map((o) => mean(SEPARATION_KEYS.map((k) => Math.abs(num(member, k) - num(o, k))))));
    return { nickname: member.nickname, avgGap: Math.round(avgGap * 10) / 10, fit: clamp01(1 - avgGap / 4) };
  });
  return rows.reduce((a, b) => (b.avgGap > a.avgGap ? b : a));
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
  let bestKey = SEPARATION_KEYS[0];
  let bestRange = -1;
  for (const k of SEPARATION_KEYS) {
    const r = range(team.map((u) => num(u, k)));
    if (r > bestRange) {
      bestRange = r;
      bestKey = k;
    }
  }
  const vals = team.map((u) => num(u, bestKey)).join(' · ');
  return { key: bestKey, note: `${GAP_COPY[bestKey] ?? '응답 차이가 큰 항목이 있어 첫 회의에서 확인해 보세요.'} (응답 ${vals})` };
}

function evidenceTags(team: UserProfile[], explanations: MetricExplanation[], pairs: PuzzleMatchPair[]): string[] {
  const tags: string[] = [];
  const all = (k: FeatureKey, pred: (v: number) => boolean) => team.every((u) => pred(num(u, k)));
  if (all('prototyping_preference', (v) => v >= 4)) tags.push('모두 빠른 프로토타이핑 선호');
  if (all('quality_priority', (v) => v >= 4)) tags.push('모두 완성도 우선');
  if (all('ai_verification_strictness', (v) => v >= 4)) tags.push('AI 결과는 직접 검증하자는 데 동의');
  if (range(team.map((u) => num(u, 'winning_orientation'))) <= 1) tags.push('수상 기대치가 비슷함');
  const role = explanations.find((e) => e.metric === 'roleCoverage')!;
  if (role.okCount === role.total) tags.push('대회 필수 역할을 모두 채움');
  const exact = pairs.filter((p) => p.matchType === 'exact').length;
  if (exact >= 2) tags.push(`약점 ${exact}장을 같은 카드 강점으로 덮음`);
  return tags.slice(0, 3);
}

/**
 * 순위 = 화면에 보이는 개수(일치/채움 비율)의 가중합. 같으면 연속값(응답 차이 크기)으로 정렬.
 * 화면 개수와 순위가 어긋나지 않게 하려는 것 (예: 15/15 팀이 14/15 팀보다 뒤에 오지 않음).
 */
function scoreTeam(team: UserProfile[], contest: Contest) {
  const explanations = explainTeam(team, contest);
  const score = explanations.reduce((s, e) => s + e.weight * (e.okCount / e.total), 0);
  const tiebreak = explanations.reduce((s, e) => s + e.weight * e.value, 0);
  return { score, tiebreak, explanations };
}

function passesHardConstraints(user: UserProfile, candidate: UserProfile, contest: Contest) {
  if (contest.scale === 'large' && contest.category === 'it_hackathon' && !candidate.hardConstraints.offlineAvailable)
    return false;
  if (user.hardConstraints.nightWorkAvailable && contest.category === 'it_hackathon' && !candidate.hardConstraints.nightWorkAvailable)
    return false;
  return true;
}

/** 1단계 팀 추천: 하드 제약 → 군집 다양화 후보 → 팀 수준 점수 상위 3팀 (Layton et al., 2010의 기준 가중 팀 구성과 같은 구조) */
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
    .map((u) => ({ u, s: scoreTeam([currentUser, u], contest).tiebreak }))
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

  const scored: { members: UserProfile[]; score: number; tiebreak: number; explanations: MetricExplanation[] }[] = [];
  for (let i = 0; i < shortlist.length; i++)
    for (let j = i + 1; j < shortlist.length; j++)
      for (let k = j + 1; k < shortlist.length; k++) {
        const members = [currentUser, shortlist[i], shortlist[j], shortlist[k]];
        const r = scoreTeam(members, contest);
        scored.push({ members, score: r.score, tiebreak: r.tiebreak, explanations: r.explanations });
      }
  scored.sort((a, b) => b.score - a.score || b.tiebreak - a.tiebreak);

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
    const pairs = puzzlePairsFor(t.members);
    const outlier = findOutlier(t.members);
    const by = (k: MetricExplanation['metric']) => t.explanations.find((e) => e.metric === k)!.value;
    return {
      id: `${contest.id}-team-${idx + 1}`,
      contestId: contest.id,
      rank: (idx + 1) as 1 | 2 | 3,
      members: t.members,
      matchScore: Math.round(t.score * 1000) / 1000,
      minMemberFit: Math.round(outlier.fit * 1000) / 1000,
      biggestGapNote: gap.note,
      evidenceTags: evidenceTags(t.members, t.explanations, pairs),
      scoreBreakdown: {
        goalAlignment: by('goalAlignment'),
        roleCoverage: by('roleCoverage'),
        aiPolicyAlignment: by('aiPolicyAlignment'),
        collaborationCompatibility: by('collaborationCompatibility'),
        scheduleOverlap: null,
      },
      missingInfoNotice: missing.length
        ? `${missing.map((m) => m.nickname).join(', ')}님은 성격·갈등 응답이 비어 있어요. 이 문항들은 원래 점수에 쓰지 않아서 추천 결과는 같아요.`
        : undefined,
      puzzlePairs: pairs,
      explanations: t.explanations,
      outlier: { nickname: outlier.nickname, avgGap: outlier.avgGap },
      cautions: cautionsFor(t.members),
      status: 'CLUSTERED',
    };
  });

  const rec = new Set(teams[0]?.members.slice(1).map((m) => m.id) ?? []);
  const annotatedPoints = clusteredPoints.map((p) => ({ ...p, isRecommendedTeammate: rec.has(p.userId) }));
  return { teams, annotatedPoints };
}
