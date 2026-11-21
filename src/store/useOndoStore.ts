'use client';

// 소유: 규혁 (src/store/) — gyuhyeok-ux.md 3장
// localStorage('ondo_mvp_state_v1')에 영속 저장되는 전역 스토어 (Zustand persist)

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  AvatarMeetingResult,
  ClusteredPoint,
  CvTemplate,
  Features27,
  PilotMessage,
  PilotWorkspace,
  TeamCandidate,
  TemperatureMode,
  UserProfile,
} from '@/types/ondo';
import { TEMPERATURE_BY_ID, deriveCollabType } from '@/data/constants';
import { SEED_USERS } from '@/data/seedUsers';
import { SEED_CONTESTS } from '@/data/seedContests';
import { recommendTeams, runClusterAnalysis } from '@/lib/matching/clusterEngine';
import { DEMO_USER } from './demoUser';
import { goalFeaturesFor, type PieceAnswers, type PieceCode } from './pieceTypes';

export type PilotVote = 'join' | 'pass';

export interface PilotState {
  topic: string | null;
  /** 타이머 종료 시각 (epoch ms). 시작 전에는 null */
  endsAt: number | null;
  messages: PilotMessage[];
  workspace: PilotWorkspace;
  pendingPatch: Partial<PilotWorkspace> | null;
  ended: boolean;
  vote: PilotVote | null;
}

export const emptyPilot = (): PilotState => ({
  topic: null,
  endsAt: null,
  messages: [],
  workspace: { problemStatement: '', solutionIdea: '', roleSplit: '' },
  pendingPatch: null,
  ended: false,
  vote: null,
});

type OptionalKey =
  | 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'emotional_stability'
  | 'integrating' | 'obliging' | 'dominating' | 'avoiding' | 'compromising';

export function withTemperature(user: UserProfile, mode: TemperatureMode): UserProfile {
  return {
    ...user,
    temperatureMode: mode,
    temperature: TEMPERATURE_BY_ID[mode].temperature,
    features27: { ...user.features27, ...goalFeaturesFor(mode) },
  };
}

interface OndoState {
  currentUser: UserProfile | null;
  selectedContestId: string | null;
  clusteredPoints: ClusteredPoint[];
  recommendedTeams: TeamCandidate[];
  avatarMeetings: Record<string, AvatarMeetingResult>;
  avatarLoading: Record<string, boolean>;
  pilotStates: Record<string, PilotState>;
  unlockedTeamIds: string[];
  savedTeams: Record<string, TeamCandidate>;
  contestModes: Record<string, TemperatureMode>;
  weeklyDropPreviewOpen: boolean;
  matchingBusy: boolean;
  /** 수락 대기 중 수락한 인원 수 (누가 눌렀는지는 저장하지 않음) */
  consentCount: Record<string, number>;
  /** 온보딩을 막 마친 상태 — CV 작성으로 이어 주는 안내에 사용 (저장 안 함) */
  justOnboarded: boolean;
  /** ‘내 조각’ 설문 결과 (4축 16유형) */
  myPiece: PieceCode | null;
  /** 설문 답 — 프로필에서 ‘고치기’로 다시 열 때 그대로 채움 */
  surveyAnswers: PieceAnswers | null;

  initDemoUser: () => void;
  setCurrentUser: (user: UserProfile) => void;
  updateTemperatureMode: (mode: TemperatureMode) => void;
  updateOptionalFeatures: (patch: Partial<Pick<Features27, OptionalKey>>) => void;
  updateCv: (patch: Partial<CvTemplate>) => void;
  setWeeklyDrop: (enabled: boolean) => void;
  setWeeklyDropPreviewOpen: (open: boolean) => void;
  runMatchingForContest: (contestId: string, mode?: TemperatureMode) => Promise<void>;
  requestAvatarMeeting: (teamId: string) => Promise<void>;
  updatePilot: (teamId: string, patch: Partial<PilotState>) => void;
  setTeamStatus: (teamId: string, status: TeamCandidate['status']) => void;
  unlockTeam: (teamId: string) => Promise<void>;
  /** 넘기기·미성사 — 거절 알림 없이 조용히 종료 (status = 'EXPIRED') */
  passTeam: (teamId: string) => void;
  setJustOnboarded: (v: boolean) => void;
  setMyPiece: (code: PieceCode | null) => void;
  setSurveyAnswers: (a: PieceAnswers | null) => void;
  resetAll: () => void;
}

const initial = {
  currentUser: null,
  selectedContestId: null,
  clusteredPoints: [],
  recommendedTeams: [],
  avatarMeetings: {},
  avatarLoading: {},
  pilotStates: {},
  unlockedTeamIds: [],
  savedTeams: {},
  contestModes: {},
  weeklyDropPreviewOpen: false,
  matchingBusy: false,
  consentCount: {},
  justOnboarded: false,
  myPiece: null as PieceCode | null,
  surveyAnswers: null as PieceAnswers | null,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useOndoStore = create<OndoState>()(
  persist(
    (set, get) => ({
      ...initial,

      initDemoUser: () =>
        set({ ...initial, currentUser: structuredClone(DEMO_USER), myPiece: 'IMGA' }),

      setCurrentUser: (user) =>
        set({ ...(get().currentUser && get().currentUser?.id !== user.id ? { ...initial, myPiece: get().myPiece, surveyAnswers: get().surveyAnswers } : {}), currentUser: { ...user, collabType: deriveCollabType(user.features27) } }),

      updateTemperatureMode: (mode) => {
        const u = get().currentUser;
        if (!u) return;
        set({ currentUser: withTemperature(u, mode) });
      },

      updateOptionalFeatures: (patch) => {
        const u = get().currentUser;
        if (!u) return;
        const features27 = { ...u.features27, ...patch };
        set({ currentUser: { ...u, features27, collabType: deriveCollabType(features27) } });
      },

      updateCv: (patch) => {
        const u = get().currentUser;
        if (!u) return;
        set({ currentUser: { ...u, cv: { ...u.cv, ...patch } } });
      },

      setWeeklyDrop: (enabled) => {
        const u = get().currentUser;
        if (!u) return;
        set({ currentUser: { ...u, weeklyDropEnabled: enabled } });
      },

      setWeeklyDropPreviewOpen: (open) => set({ weeklyDropPreviewOpen: open }),

      runMatchingForContest: async (contestId, mode) => {
        const profile = get().currentUser;
        const contest = SEED_CONTESTS.find((c) => c.id === contestId);
        if (!profile || !contest) return;
        const selectedMode = mode ?? get().contestModes[contestId] ?? profile.temperatureMode;
        const user = withTemperature(profile, selectedMode);
        const contestModes = { ...get().contestModes, [contestId]: selectedMode };
        set({ matchingBusy: true, selectedContestId: contestId, contestModes });
        // 계산 전에 화면이 먼저 바뀌도록 한 프레임 양보
        await sleep(30);
        if (get().contestModes !== contestModes) return;
        const points = runClusterAnalysis(user, SEED_USERS);
        const { teams: candidates, annotatedPoints } = recommendTeams(user, SEED_USERS, contest, points);
        const drawId = crypto.randomUUID();
        const teams = candidates.map(team => ({ ...team, id: team.id + '-' + drawId }));
        const { avatarMeetings, pilotStates, savedTeams } = get();
        const stale = (id: string) => !savedTeams[id];
        const keep = <T,>(rec: Record<string, T>) => Object.fromEntries(Object.entries(rec).filter(([id]) => !stale(id)));
        set({
          clusteredPoints: annotatedPoints,
          recommendedTeams: teams,
          avatarMeetings: keep(avatarMeetings),
          pilotStates: keep(pilotStates),
          matchingBusy: false,
        });
        // 대회 구분 없이 모든 대회에서 1순위 팀의 AI 아바타 모의회의를 바로 실행
        if (teams[0]) await get().requestAvatarMeeting(teams[0].id);
      },

      requestAvatarMeeting: async (teamId) => {
        const { recommendedTeams, avatarMeetings, avatarLoading } = get();
        if (avatarMeetings[teamId] || avatarLoading[teamId]) return;
        const team = recommendedTeams.find((t) => t.id === teamId);
        const contest = SEED_CONTESTS.find((c) => c.id === team?.contestId);
        if (!team || !contest) return;
        set({ avatarLoading: { ...get().avatarLoading, [teamId]: true } });
        try {
          const res = await fetch('/api/avatar-meeting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contest, team }),
          });
          if (res.ok) {
            const result: AvatarMeetingResult = await res.json();
            const active = get().recommendedTeams.find(t => t.id === teamId);
            if (!active && !get().savedTeams[teamId]) return;
            set({ avatarMeetings: { ...get().avatarMeetings, [teamId]: result } });
            if (active?.status === 'CLUSTERED') get().setTeamStatus(teamId, 'AVATAR_DONE');
          }
        } finally {
          set({ avatarLoading: { ...get().avatarLoading, [teamId]: false } });
        }
      },

      updatePilot: (teamId, patch) => {
        const cur = get().pilotStates[teamId] ?? emptyPilot();
        set({ pilotStates: { ...get().pilotStates, [teamId]: { ...cur, ...patch } } });
      },

      setTeamStatus: (teamId, status) =>
        set({ recommendedTeams: get().recommendedTeams.map((t) => (t.id === teamId ? { ...t, status } : t)) }),

      unlockTeam: async (teamId) => {
        // 시연용: 나(1명) → 4명 순서로 수락이 차오르는 연출. 누가 먼저 눌렀는지는 보여 주지 않음
        const team = get().savedTeams[teamId] ?? get().recommendedTeams.find(t => t.id === teamId);
        if (!team || team.status === 'EXPIRED' || team.status === 'UNLOCKED') return;
        set({ savedTeams: { ...get().savedTeams, [teamId]: { ...team, status: 'WAITING_CONSENT' } } });
        get().setTeamStatus(teamId, 'WAITING_CONSENT');
        for (let n = get().consentCount[teamId] || 1; n <= 4; n++) {
          if (get().savedTeams[teamId]?.status !== 'WAITING_CONSENT') return;
          set({ consentCount: { ...get().consentCount, [teamId]: n } });
          if (n < 4) await sleep(500);
        }
        get().setTeamStatus(teamId, 'UNLOCKED');
        const ids = get().unlockedTeamIds;
        set({ savedTeams: { ...get().savedTeams, [teamId]: { ...team, status: 'UNLOCKED' } }, unlockedTeamIds: [...new Set([...ids, teamId])] });
      },

      passTeam: (teamId) => {
        if (get().savedTeams[teamId]) return;
        get().setTeamStatus(teamId, 'EXPIRED');
        const pilot = get().pilotStates[teamId];
        if (pilot) get().updatePilot(teamId, { ended: true, vote: 'pass' });
      },

      setJustOnboarded: (v) => set({ justOnboarded: v }),

      setMyPiece: (code) => set({ myPiece: code }),

      setSurveyAnswers: (a) => set({ surveyAnswers: a }),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'ondo_mvp_state_v1',
      // v2 (혜원): TeamCandidate에 explanations·outlier·cautions 추가 → 이전에 저장된 추천 결과는 비우고 다시 계산
      version: 3,
      migrate: (persisted, version) => {
        const s = persisted as Record<string, unknown>;
        if (version < 2) return { ...s, recommendedTeams: [], clusteredPoints: [], selectedContestId: null };
        const teams = (s.recommendedTeams ?? []) as TeamCandidate[];
        const savedTeams = Object.fromEntries(teams.filter(t => ['UNLOCKED', 'WAITING_CONSENT'].includes(t.status) || (s.unlockedTeamIds as string[] | undefined)?.includes(t.id)).map(t => [t.id, t]));
        return { ...s, savedTeams };

      },
      onRehydrateStorage: () => state => {
        for (const team of Object.values(state?.savedTeams ?? {})) {
          if (team.status === 'WAITING_CONSENT') queueMicrotask(() => void state?.unlockTeam(team.id));
        }
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUser: s.currentUser,
        selectedContestId: s.selectedContestId,
        clusteredPoints: s.clusteredPoints,
        recommendedTeams: s.recommendedTeams,
        avatarMeetings: s.avatarMeetings,
        pilotStates: s.pilotStates,
        unlockedTeamIds: s.unlockedTeamIds,
        savedTeams: s.savedTeams,
        contestModes: s.contestModes,
        consentCount: s.consentCount,
        myPiece: s.myPiece,
        surveyAnswers: s.surveyAnswers,
      }),
    },
  ),
);

/** persist 복원이 끝났는지. 복원 전에는 서버 렌더와 같은 빈 화면을 그려 hydration 불일치를 막습니다. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useOndoStore.persist.onFinishHydration(cb),
    () => useOndoStore.persist.hasHydrated(),
    () => false,
  );
}

export function findSeedOrTeamMember(teamId: string, userId: string): UserProfile | undefined {
  const team = useOndoStore.getState().recommendedTeams.find((t) => t.id === teamId);
  return team?.members.find((m) => m.id === userId) ?? SEED_USERS.find((u) => u.id === userId);
}
