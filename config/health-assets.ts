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
  longDescription: string,
  icon: string,
  sortOrder: number,
): HealthAssetDomain => ({
  id: code,
  code,
  name,
  shortDescription,
  longDescription,
  icon,
  sortOrder,
  isActive: true,
});

export const HEALTH_ASSET_DOMAINS: readonly HealthAssetDomain[] = [
  domain("metabolic", "혈당대사", "혈당 조절과 에너지 사용", "식사 후 혈당이 안정적으로 조절되고 음식으로 얻은 에너지를 몸이 잘 사용하고 있는지 살펴봅니다.", "activity", 1),
  domain("energy", "에너지", "에너지를 만들고 쓰는 능력", "몸이 필요한 에너지를 충분히 만들고 일정 시간 유지하며 활력을 유지하고 있는지 살펴봅니다.", "sun", 2),
  domain("gut", "장 건강", "소화, 영양 흡수와 배변", "음식이 편안하게 소화·흡수되고 배변과 장내 환경이 원활하게 유지되는지 살펴봅니다.", "circle", 3),
  domain("inflammation", "염증", "붓기와 통증을 가라앉히는 회복", "몸이 자극이나 손상을 받은 뒤 생기는 붓기와 통증을 잘 가라앉히고 편안한 상태로 회복하는지 살펴봅니다.", "flame", 4),
  domain("immune", "면역", "외부 자극에 대한 방어와 회복", "몸이 감염과 외부 자극에 잘 대응하고 과도하게 예민해지지 않도록 균형을 유지하는지 살펴봅니다.", "shield", 5),
  domain("hormone", "호르몬", "체중·체온·기분·수면의 리듬", "몸의 여러 신호가 체중, 체온, 기분, 식욕과 수면을 일정한 리듬으로 조절하고 있는지 살펴봅니다.", "waves", 6),
  domain("liver", "해독", "간의 처리와 배출 기능", "간이 몸에 들어온 물질을 처리하고 불필요한 성분을 몸 밖으로 내보내는 과정이 원활한지 살펴봅니다.", "leaf", 7),
  domain("brain-stress", "뇌·신경", "생각, 감정과 긴장 조절", "집중력과 기억력, 감정 상태를 안정적으로 유지하고 스트레스와 긴장에 잘 대응하는지 살펴봅니다.", "brain", 8),
  domain("circulation", "순환", "혈액의 흐름과 혈관 건강", "혈액이 몸 전체에 원활하게 흐르며 산소와 영양분을 잘 전달하고 있는지 살펴봅니다.", "heart-pulse", 9),
  domain("body-composition", "골격·근육", "움직임, 자세와 근력", "뼈와 관절, 근육이 몸을 안정적으로 지지하고 편안한 움직임과 균형을 유지하는지 살펴봅니다.", "person-standing", 10),
  domain("youth-index", "피부·노화", "피부 보호와 손상 회복", "피부와 모발, 손톱의 상태를 통해 외부 자극으로부터 스스로를 보호하고 손상을 회복하는 힘을 살펴봅니다.", "sparkles", 11),
  domain("lifestyle", "회복력", "휴식, 수면과 스트레스 회복", "잠을 통해 충분히 쉬고 스트레스나 활동으로 지친 몸이 원래의 좋은 상태로 잘 돌아오는지 살펴봅니다.", "calendar-check", 12),
] as const;

export const SCORE_VERSION = "wellset-score-v1";
