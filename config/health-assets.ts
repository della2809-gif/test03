export type HealthAssetDomain = {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

const domain = (
  code: string,
  name: string,
  shortDescription: string,
  icon: string,
  sortOrder: number,
): HealthAssetDomain => ({
  id: code,
  code,
  name,
  shortDescription,
  longDescription: `${shortDescription} 문진과 생활 기록의 변화를 함께 살펴보는 WELLSET 웰니스 관리 영역입니다.`,
  icon,
  sortOrder,
  isActive: true,
});

export const HEALTH_ASSET_DOMAINS: readonly HealthAssetDomain[] = [
  domain("metabolic", "혈당대사", "식사 후 에너지와 대사 리듬", "activity", 1),
  domain("energy", "에너지", "일상의 활력과 피로 회복", "sun", 2),
  domain("gut", "장건강", "소화 편안함과 배변 리듬", "circle", 3),
  domain("inflammation", "염증균형", "회복을 방해하는 생활 신호", "flame", 4),
  domain("immune", "면역균형", "일상 회복력과 방어 습관", "shield", 5),
  domain("hormone", "호르몬균형", "수면·기분·생활 리듬", "waves", 6),
  domain("liver", "간·해독", "음주와 회복 생활 습관", "leaf", 7),
  domain("brain-stress", "뇌신경·스트레스", "집중력과 긴장 회복", "brain", 8),
  domain("circulation", "순환건강", "활동과 순환 생활 습관", "heart-pulse", 9),
  domain("body-composition", "체성분", "근육과 체지방의 균형", "person-standing", 10),
  domain("youth-index", "젊음지수", "활력과 회복의 종합 변화", "sparkles", 11),
  domain("lifestyle", "생활습관", "수면·수분·활동·영양 실천", "calendar-check", 12),
] as const;

export const SCORE_VERSION = "wellset-score-v1";
