// 소유: 규혁 (src/store/) — 프로필 = 퍼즐 + CV 완성도 계산 헬퍼

import type { CvTemplate } from '@/types/ondo';

/** CV 5섹션(기본 정보·경험·기술/언어·AI 활용·협업 방식) 중 채워진 섹션 수 */
export function cvSectionFlags(cv: CvTemplate): [boolean, boolean, boolean, boolean, boolean] {
  return [
    !!(cv.realName && cv.major),
    cv.experiences.some((e) => e.title),
    cv.skills.length > 0 || cv.languages.length > 0,
    cv.aiTools.length > 0 || !!cv.aiUsageNote,
    !!cv.collaborationNote,
  ];
}

export function cvFilledSections(cv: CvTemplate): number {
  return cvSectionFlags(cv).filter(Boolean).length;
}
