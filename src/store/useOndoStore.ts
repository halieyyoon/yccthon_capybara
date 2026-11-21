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

interface OndoState {
  currentUser: UserProfile | null;
  selectedContestId: string | null;
  clusteredPoints: ClusteredPoint[];
  recommendedTeams: TeamCandidate[];
  avatarMeetings: Record<string, AvatarMeetingResult>;
  avatarLoading: Record<string, boolean>;
  pilotStates: Record<string, PilotState>;
  unlockedTeamIds: string[];
  weeklyDropPreviewOpen: boolean;
  matchingBusy: boolean;

  initDemoUser: () => void;
  setCurrentUser: (user: UserProfile) => void;
  updateTemperatureMode: (mode: TemperatureMode) => void;
  updateOptionalFeatures: (patch: Partial<Pick<Features27, OptionalKey>>) => void;
  updateCv: (patch: Partial<CvTemplate>) => void;
  setWeeklyDrop: (enabled: boolean) => void;
  setWeeklyDropPreviewOpen: (open: boolean) => void;
  runMatchingForContest: (contestId: string) => Promise<void>;
  requestAvatarMeeting: (teamId: string) => Promise<void>;
  updatePilot: (teamId: string, patch: Partial<PilotState>) => void;
  setTeamStatus: (teamId: string, status: TeamCandidate['status']) => void;
  unlockTeam: (teamId: string) => Promise<void>;
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
  weeklyDropPreviewOpen: false,
  matchingBusy: false,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useOndoStore = create<OndoState>()(
  persist(
    (set, get) => ({
      ...initial,

      initDemoUser: () =>
        set({ ...initial, currentUser: structuredClone(DEMO_USER) }),

      setCurrentUser: (user) =>
        set({ currentUser: { ...user, collabType: deriveCollabType(user.features27) } }),

      updateTemperatureMode: (mode) => {
        const u = get().currentUser;
        if (!u) return;
        set({ currentUser: { ...u, temperatureMode: mode, temperature: TEMPERATURE_BY_ID[mode].temperature } });
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

      runMatchingForContest: async (contestId) => {
        const user = get().currentUser;
        const contest = SEED_CONTESTS.find((c) => c.id === contestId);
        if (!user || !contest) return;
        set({ matchingBusy: true, selectedContestId: contestId });
        // 계산 전에 화면이 먼저 바뀌도록 한 프레임 양보
        await sleep(30);
        const points = runClusterAnalysis(user, SEED_USERS);
        const { teams, annotatedPoints } = recommendTeams(user, SEED_USERS, contest, points);
        set({ clusteredPoints: annotatedPoints, recommendedTeams: teams, matchingBusy: false });
        if (contest.scale === 'large' && teams[0]) await get().requestAvatarMeeting(teams[0].id);
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
            set({ avatarMeetings: { ...get().avatarMeetings, [teamId]: result } });
            get().setTeamStatus(teamId, 'AVATAR_DONE');
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
        get().setTeamStatus(teamId, 'WAITING_CONSENT');
        await sleep(1500);
        get().setTeamStatus(teamId, 'UNLOCKED');
        const ids = get().unlockedTeamIds;
        if (!ids.includes(teamId)) set({ unlockedTeamIds: [...ids, teamId] });
      },

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'ondo_mvp_state_v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUser: s.currentUser,
        selectedContestId: s.selectedContestId,
        clusteredPoints: s.clusteredPoints,
        recommendedTeams: s.recommendedTeams,
        avatarMeetings: s.avatarMeetings,
        pilotStates: s.pilotStates,
        unlockedTeamIds: s.unlockedTeamIds,
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
