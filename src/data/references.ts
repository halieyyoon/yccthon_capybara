// 소유: 혜원 — 매칭 점수·설문 문항의 근거 레퍼런스 (docs/proposal/09-매칭근거-레퍼런스.md 와 같은 내용)
// 화면 (i) 설명과 발표 슬라이드가 이 데이터를 함께 씁니다. 여기 없는 논문을 화면에 쓰지 않습니다.

export type RefId =
  | 'LAYTON2010'
  | 'HARRISON2007'
  | 'KRISTOF2005'
  | 'BARRICK1998'
  | 'BELL2007'
  | 'GOWER1971'
  | 'KAUFMAN1990'
  | 'VANDEWALLE1997'
  | 'RAHIM1983'
  | 'DONNELLAN2006'
  | 'SCHEPMAN2020';

export interface Reference {
  /** 화면에 짧게 쓰는 표기 */
  short: string;
  /** APA 서지 */
  full: string;
  /** 이 논문을 어디에, 왜 쓰는지 (한 줄) */
  usedFor: string;
}

export const REFERENCES: Record<RefId, Reference> = {
  LAYTON2010: {
    short: 'Layton et al., 2010',
    full: 'Layton, R. A., Loughry, M. L., Ohland, M. W., & Ricco, G. D. (2010). Design and validation of a web-based system for assigning members to teams using instructor-specified criteria. Advances in Engineering Education, 2(1), 1–28.',
    usedFor: '설문 → 기준별 가중치 → 팀 자동 구성 구조의 선례 (CATME Team-Maker)',
  },
  HARRISON2007: {
    short: 'Harrison & Klein, 2007',
    full: "Harrison, D. A., & Klein, K. J. (2007). What's the difference? Diversity constructs as separation, variety, or disparity in organizations. Academy of Management Review, 32(4), 1199–1228.",
    usedFor: '비슷해야 하는 차이(separation)와 다양해야 하는 차이(variety)를 나눠 계산',
  },
  KRISTOF2005: {
    short: 'Kristof-Brown et al., 2005',
    full: "Kristof-Brown, A. L., Zimmerman, R. D., & Johnson, E. C. (2005). Consequences of individuals' fit at work: A meta-analysis of person–job, person–organization, person–group, and person–supervisor fit. Personnel Psychology, 58(2), 281–342.",
    usedFor: '목표·가치가 맞는 집단(person–group fit)을 가장 크게 반영',
  },
  BARRICK1998: {
    short: 'Barrick et al., 1998',
    full: 'Barrick, M. R., Stewart, G. L., Neubert, M. J., & Mount, M. K. (1998). Relating member ability and personality to work-team processes and team effectiveness. Journal of Applied Psychology, 83(3), 377–391.',
    usedFor: '팀 평균과 함께 최솟값(가장 동떨어진 팀원)을 보여 줌',
  },
  BELL2007: {
    short: 'Bell, 2007',
    full: 'Bell, S. T. (2007). Deep-level composition variables as predictors of team performance: A meta-analysis. Journal of Applied Psychology, 92(3), 595–615.',
    usedFor: '짧은 실험실형 팀에서는 성격 효과가 미미 → 성격을 점수에서 제외',
  },
  GOWER1971: {
    short: 'Gower, 1971',
    full: 'Gower, J. C. (1971). A general coefficient of similarity and some of its properties. Biometrics, 27(4), 857–871.',
    usedFor: '빈 응답을 0으로 채우지 않고 계산하는 1단계 군집 거리',
  },
  KAUFMAN1990: {
    short: 'Kaufman & Rousseeuw, 1990',
    full: 'Kaufman, L., & Rousseeuw, P. J. (1990). Finding groups in data: An introduction to cluster analysis. Wiley.',
    usedFor: 'PAM(k-medoids) 군집',
  },
  VANDEWALLE1997: {
    short: 'VandeWalle, 1997',
    full: 'VandeWalle, D. (1997). Development and validation of a work domain goal orientation instrument. Educational and Psychological Measurement, 57(6), 995–1015.',
    usedFor: '목표 문항의 학습 지향 · 성과 지향 개념',
  },
  RAHIM1983: {
    short: 'Rahim, 1983 (ROCI-II)',
    full: 'Rahim, M. A. (1983). A measure of styles of handling interpersonal conflict. Academy of Management Journal, 26(2), 368–376.',
    usedFor: '갈등 대응 5가지(통합·양보·지배·회피·타협) 개념',
  },
  DONNELLAN2006: {
    short: 'Donnellan et al., 2006 (Mini-IPIP)',
    full: 'Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). The Mini-IPIP scales: Tiny-yet-effective measures of the Big Five factors of personality. Psychological Assessment, 18(2), 192–203.',
    usedFor: '성격 5요인 개념 (정식 문항 교체 후보)',
  },
  SCHEPMAN2020: {
    short: 'Schepman & Rodway, 2020 (GAAIS)',
    full: 'Schepman, A., & Rodway, P. (2020). Initial validation of the general attitudes towards Artificial Intelligence Scale. Computers in Human Behavior Reports, 1, 100014.',
    usedFor: 'AI 태도 개념 (팀 내 AI 사용 규범 문항은 자체 개발)',
  },
};

/** 문항이 근거를 얼마나 빌려 왔는지 */
export type Adaptation = 'concept' | 'adapted' | 'original';

export const ADAPTATION_LABEL: Record<Adaptation, string> = {
  concept: '개념 참고 · 문항은 자체 작성',
  adapted: '원문 문항 각색',
  original: '자체 개발',
};

export interface ItemBasis {
  /** 빈 배열 = 선행 척도 없이 자체 개발 */
  refs: RefId[];
  adaptation: Adaptation;
  note?: string;
}

/** (i) 안에 넣을 한두 문장 */
export function basisText(b: ItemBasis): string {
  const src = b.refs.length ? `${b.refs.map((r) => REFERENCES[r].short).join(', ')} — ${ADAPTATION_LABEL[b.adaptation]}` : ADAPTATION_LABEL.original;
  return `${src}. 검증된 검사 문항이 아니에요.${b.note ? ` ${b.note}` : ''}`;
}

export function refsText(ids: RefId[]): string {
  return ids.map((r) => REFERENCES[r].short).join(' · ');
}

/** 조합 지수 가중치의 출처 (08번 문서 5.3 초안을, MVP에서 뺀 일정 0.20만큼 재조정) */
export const WEIGHT_SOURCE = {
  original: { goal: 0.3, role: 0.25, schedule: 0.2, ai: 0.15, collab: 0.1 },
  note: '08번 문서 5.3의 임시 가중치에서 일정(0.20)을 빼고 남은 0.80으로 나눠 다시 맞춘 값이에요. 실증된 값이 아니라 파일럿 후 조정할 임시값이에요.',
} as const;
