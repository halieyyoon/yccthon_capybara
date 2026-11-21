// SPEC.md 4장 공통 계약을 그대로 옮긴 파일입니다. (소유: 혜원)
// 규혁 브랜치(gyuhyeok/ux-flow)에서 화면 개발을 위해 SPEC 원문 그대로 먼저 생성했습니다.

export const FEATURE_SCHEMA_VERSION = 'v1.0' as const;

export type TemperatureMode = 'fun' | 'balanced' | 'serious';
export type TemperatureValue = 36.5 | 65 | 90;
export type WeeklyHours = '3-5h' | '6-10h' | '10h+';
export type ContestScale = 'small' | 'large';
export type RoleId = 'planning' | 'frontend' | 'backend' | 'design' | 'data_ai' | 'presentation';

export type SkillCardId =
  | 'frontend' | 'backend' | 'ai_prompt' | 'data_analysis'
  | 'ui_design' | 'slide_story' | 'pitching' | 'ideation'
  | 'pm_schedule' | 'copywriting' | 'user_research' | 'fast_proto';

export type DealBreakerId =
  | 'ghosting' | 'blind_ai_copy' | 'last_minute' | 'no_prep'
  | 'free_riding' | 'harsh_tone' | 'slow_decision' | 'scope_creep';

export type CollabType =
  | 'APDB' | 'APDV' | 'APHB' | 'APHV'
  | 'ASDB' | 'ASDV' | 'ASHB' | 'ASHV'
  | 'MPDB' | 'MPDV' | 'MPHB' | 'MPHV'
  | 'MSDB' | 'MSDV' | 'MSHB' | 'MSHV';

// 고정 27차원 분석 피처 (결측은 0이 아닌 null!)
export interface Features27 {
  // 성격 (5) — 선택 심화, 미응답 시 null
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  emotional_stability: number | null;
  // 목표 (4) — 1~5
  winning_orientation: number;
  learning_priority: number;
  delivery_priority: number;
  continuation_intent: number;
  // 갈등 대응 (5) — 선택 심화, 미응답 시 null
  integrating: number | null;
  obliging: number | null;
  dominating: number | null;
  avoiding: number | null;
  compromising: number | null;
  // AI 규범 (3) — 1~5
  ai_use_permissiveness: number;
  ai_verification_strictness: number;
  ai_disclosure_preference: number;
  // 작업 방식 (4) — 1~5
  prototyping_preference: number;
  risk_appetite: number;
  quality_priority: number;
  decision_structure_preference: number;
  // 역량 숙련도 (6) — 0~4
  planning: number;
  frontend: number;
  backend: number;
  design: number;
  data_ai: number;
  presentation: number;
}

export interface HardConstraints {
  weeklyHours: WeeklyHours;
  offlineAvailable: boolean;
  nightWorkAvailable: boolean;
  // v2 When2Meet 확장 예약 (MVP 미사용, 27차원 불포함)
  availableTimeSlots?: Record<string, number[]>;
}

export interface CvExperience {
  title: string;
  role: string;
  period: string;
  summary: string;
}

export interface CvTemplate {
  realName: string;
  university: string;
  major: string;
  grade: string;
  headline: string;
  experiences: CvExperience[];
  skills: string[];
  languages: string[];
  aiTools: string[];
  aiUsageNote: string;
  collaborationNote: string;
  source?: 'manual' | 'pdf_parsed';
}

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  featureSchemaVersion: typeof FEATURE_SCHEMA_VERSION;
  temperatureMode: TemperatureMode;
  temperature: TemperatureValue;
  features27: Features27;
  preferredRoles: RoleId[];       // 희망 역할 (숙련도와 별도)
  hardConstraints: HardConstraints;
  collabType: CollabType;         // features27에서 자동 도출
  strengths: [SkillCardId, SkillCardId];
  weaknesses: [SkillCardId, SkillCardId];
  dealBreakers: DealBreakerId[];
  weeklyDropEnabled: boolean;     // 매주 금요일 밤 10시 일괄 매칭 알림 토글
  cv: CvTemplate;
}

export interface Contest {
  id: string;
  title: string;
  organizer: string;
  category: 'it_hackathon' | 'business' | 'design' | 'ai_data' | 'free';
  scale: ContestScale;            // 'small' | 'large'
  deadline: string;
  summary: string;
  requiredRoles: RoleId[];
  pilotTopics: string[];          // scale === 'large'일 때 3단계 20분 파일럿 안건 3개
}

export interface ClusteredPoint {
  userId: string;
  nickname: string;
  major: string;
  temperatureMode: TemperatureMode;
  collabType: CollabType;
  clusterId: number;              // Gower + PAM (k=5) 탐색적 군집 ID
  x: number;                      // 2D 탐색 시각화 좌표 (-100 ~ 100)
  y: number;
  missingCount: number;           // 결측 차원 수 (0~10)
  isCurrentUser?: boolean;
  isRecommendedTeammate?: boolean;
}

export interface PuzzleMatchPair {
  weaknessOwnerId: string;
  weaknessOwnerNickname: string;
  weaknessId: SkillCardId;
  coveredById: string;
  coveredByNickname: string;
  strengthId: SkillCardId;
}

export interface TeamCandidate {
  id: string;
  contestId: string;
  rank: 1 | 2 | 3;
  members: UserProfile[];         // [현재 유저, 추천 팀원 3명]
  matchScore: number;             // 0 ~ 1 (UI 표기 시 "임시 가중치 기준 점수"로 명시)
  minMemberFit: number;           // 0 ~ 1 (팀원 중 가장 불리한 적합도)
  biggestGapNote: string;         // 예: "AI 결과물 검증 엄격도에 차이가 있어 초반 합의 권장"
  evidenceTags: string[];         // 응답 근거 태그 (군집 라벨 대신 근거 중심 노출)
  scoreBreakdown: {
    goalAlignment: number;        // 0 ~ 1
    roleCoverage: number;         // 0 ~ 1
    aiPolicyAlignment: number;    // 0 ~ 1
    collaborationCompatibility: number; // 0 ~ 1
    scheduleOverlap: number | null;     // MVP는 null (가용 4지표 가중치 재조정)
  };
  missingInfoNotice?: string;     // 성격/갈등 결측 시 안내 문구
  puzzlePairs: PuzzleMatchPair[];
  status: 'CLUSTERED' | 'AVATAR_DONE' | 'PILOT_ACTIVE' | 'WAITING_CONSENT' | 'UNLOCKED' | 'EXPIRED';
}

// 2단계 AI 아바타 모의회의 출력 (08번 문서 6장 4요소 반영)
export interface AvatarTurn {
  speakerId: string;
  speakerNickname: string;
  roleTag: string;
  message: string;
}

export interface AvatarMeetingResult {
  teamId: string;
  contestTitle: string;
  agenda: string;                 // 부여된 공통 안건 (예: "20분 안에 MVP 핵심 기능 1개 합의하기")
  turns: AvatarTurn[];            // 6턴 가상 회의
  consensus: string;              // 합의안
  unresolvedIssues: string[];     // 미해결 쟁점 1~2개
  expectedRoleSplit: string[];    // 예상 역할 분담
  questionsToAskTeam: string[];   // 실제 팀원에게 확인할 질문 2~3개
  chemistryBadge: string;
}

export interface PilotMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  isUser: boolean;
  text: string;
  timestamp: string;
}

export interface PilotWorkspace {
  problemStatement: string;
  solutionIdea: string;
  roleSplit: string;
}
