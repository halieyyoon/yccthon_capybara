// [임시 구현 · 규혁 브랜치] 소유: 혜원 (src/data/)
// 시연용 가상 공모전 8건. 실제 행사 정보가 아닙니다.
// 대회 규모 구분 없음(2026-11-21 사용자 결정) — 모든 대회가 같은 흐름(추천 → AI 아바타 → 20분 파일럿 → 팀 확정).
// `scale`은 types 계약에 남아 있어 모두 'large'로 둠(혜원: 계약에서 제거 검토).

import type { Contest } from '@/types/ondo';

export const SEED_CONTESTS: Contest[] = [
  {
    id: 'yccthon-2026',
    title: 'YCCthon 2026 연합 해커톤',
    organizer: '연세 컴퓨팅 클럽 연합',
    category: 'it_hackathon',
    scale: 'large',
    deadline: '2026-12-05',
    summary: '24시간 동안 캠퍼스 문제를 푸는 웹·앱 서비스를 만들고 시연합니다.',
    requiredRoles: ['planning', 'frontend', 'backend', 'design'],
    pilotTopics: [
      '신입생이 수강신청 정보를 한 화면에서 비교하게 하려면?',
      '도서관 열람실 빈자리를 실시간으로 알려 주는 가장 작은 기능은?',
      '동아리 모집 공고가 흩어져 있는 문제를 어떻게 모을까?',
    ],
  },
  {
    id: 'seoul-ai-challenge',
    title: '서울 청년 생성형 AI 챌린지',
    organizer: '서울시 청년정책과(가상)',
    category: 'ai_data',
    scale: 'large',
    deadline: '2026-12-20',
    summary: '생성형 AI로 시민 생활 문제를 푸는 서비스 기획과 프로토타입을 겨룹니다.',
    requiredRoles: ['planning', 'data_ai', 'frontend', 'presentation'],
    pilotTopics: [
      '1인 가구의 장보기 낭비를 줄이는 AI 기능 하나를 정한다면?',
      '어르신이 민원 서류를 쉽게 쓰도록 돕는 대화 흐름은?',
      'AI 답변이 틀렸을 때 사용자가 알아채게 하는 화면 장치는?',
    ],
  },
  {
    id: 'fintech-idea-cup',
    title: '대학생 핀테크 아이디어컵',
    organizer: '한국금융연수원(가상)',
    category: 'business',
    scale: 'large',
    deadline: '2027-01-10',
    summary: '20대의 돈 관리 습관을 바꾸는 금융 서비스 아이디어와 사업 계획을 발표합니다.',
    requiredRoles: ['planning', 'data_ai', 'design', 'presentation'],
    pilotTopics: [
      '첫 월급을 받은 사회초년생이 가장 먼저 해야 할 일 하나를 알려 주려면?',
      '더치페이 정산 스트레스를 줄이는 기능의 최소 범위는?',
      '구독료 새는 돈을 보여 주는 가장 직관적인 화면은?',
    ],
  },
  {
    id: 'climate-hack',
    title: '캠퍼스 기후 행동 해커톤',
    organizer: '연세 지속가능발전연구원(가상)',
    category: 'it_hackathon',
    scale: 'large',
    deadline: '2026-12-12',
    summary: '캠퍼스 탄소 배출을 줄이는 서비스를 만들어 실제 데이터로 시연합니다.',
    requiredRoles: ['frontend', 'backend', 'data_ai', 'design'],
    pilotTopics: [
      '일회용 컵 사용을 줄이는 학생 참여 장치를 하나만 만든다면?',
      '강의실 냉난방 낭비를 알리는 가장 작은 기능은?',
      '자전거 공유 이용을 늘리려면 첫 화면에 무엇을 보여 줄까?',
    ],
  },
  {
    id: 'ux-sprint',
    title: '주말 UX 리디자인 스프린트',
    organizer: '연세 디자인 학회',
    category: 'design',
    scale: 'large',
    deadline: '2026-11-29',
    summary: '학교 포털 화면 하나를 골라 이틀 안에 다시 설계합니다.',
    requiredRoles: ['design', 'planning'],
    pilotTopics: [
      '수강신청 화면에서 가장 먼저 고칠 버튼 하나는?',
      '학사 공지를 놓치지 않게 하는 가장 작은 변화는?',
      '처음 쓰는 신입생이 길을 잃는 지점을 어떻게 줄일까?',
    ],
  },
  {
    id: 'mini-data-viz',
    title: '공공데이터 시각화 미니 공모전',
    organizer: '응용통계학과 학생회',
    category: 'ai_data',
    scale: 'large',
    deadline: '2026-12-01',
    summary: '서울시 공공데이터로 한 장짜리 시각화를 만듭니다.',
    requiredRoles: ['data_ai', 'design'],
    pilotTopics: [
      '따릉이 데이터로 한 장에 보여 줄 질문 하나는?',
      '미세먼지와 유동인구, 어떤 그래프가 가장 잘 읽힐까?',
      '한눈에 읽히게 하려면 무엇을 빼야 할까?',
    ],
  },
  {
    id: 'pitch-night',
    title: '신촌 창업 아이디어 피치 나이트',
    organizer: '신촌 창업 동아리 연합',
    category: 'business',
    scale: 'large',
    deadline: '2026-12-03',
    summary: '3분 피치로 아이디어를 발표하고 현장 피드백을 받습니다.',
    requiredRoles: ['planning', 'presentation'],
    pilotTopics: [
      '3분 피치 첫 10초에 무엇을 말할까?',
      '우리 아이디어의 첫 고객 한 명은 누구일까?',
      '심사위원이 가장 먼저 물어볼 질문은?',
    ],
  },
  {
    id: 'free-side-project',
    title: '겨울방학 사이드 프로젝트 모임',
    organizer: '자유 주제',
    category: 'free',
    scale: 'large',
    deadline: '2026-12-15',
    summary: '방학 동안 작은 서비스를 같이 만들어 볼 사람을 찾습니다.',
    requiredRoles: ['frontend', 'backend'],
    pilotTopics: [
      '방학 4주 안에 끝낼 수 있는 기능 하나는?',
      '첫 주에 배포까지 해 보려면 무엇부터 할까?',
      '각자 맡을 부분을 어떻게 나눌까?',
    ],
  },
];
