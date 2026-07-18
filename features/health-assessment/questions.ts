import type {
  AssessmentOption,
  AssessmentQuestion,
} from "./types.ts";

const frequencyOptions = [
  { label: "거의 없음", value: 0 },
  { label: "가끔 있음", value: 1 },
  { label: "자주 있음", value: 2 },
  { label: "거의 항상 있음", value: 3 },
] as const satisfies readonly AssessmentOption[];

const habitOptions = [
  { label: "잘 유지하고 있음", value: 0 },
  { label: "대체로 유지함", value: 1 },
  { label: "가끔만 실천함", value: 2 },
  { label: "거의 실천하지 못함", value: 3 },
] as const satisfies readonly AssessmentOption[];

const healthQuestion = (
  id: string,
  prompt: string,
  helper: string,
  domain: string,
): AssessmentQuestion => ({
  id,
  section: "health-check",
  prompt,
  helper,
  domains: [domain],
  options: frequencyOptions,
});

const lifestyleQuestion = (
  id: string,
  prompt: string,
  helper: string,
  domain: string,
): AssessmentQuestion => ({
  id,
  section: "lifestyle",
  prompt,
  helper,
  domains: [domain],
  options: habitOptions,
});

// Part 1: one symptom-cluster question for each of the 12 health assets.
export const HEALTH_CHECK_QUESTIONS: readonly AssessmentQuestion[] = [
  healthQuestion(
    "hc-metabolic",
    "식후 졸림, 단 음식 당김 또는 복부 중심의 체중 증가가 있나요?",
    "세 가지 중 하나라도 해당하면 가장 자주 느끼는 정도로 답해주세요.",
    "metabolic",
  ),
  healthQuestion(
    "hc-energy",
    "아침부터 피곤하거나 오후에 무기력하고 활동 후 쉽게 지치나요?",
    "최근 2주 동안 에너지가 떨어지는 날의 빈도를 생각해주세요.",
    "energy",
  ),
  healthQuestion(
    "hc-gut",
    "변비·설사·복부팽만 또는 식후 불편감이 있나요?",
    "배변과 소화 불편을 모두 포함해 답해주세요.",
    "gut",
  ),
  healthQuestion(
    "hc-inflammation",
    "몸이 붓거나 뻐근하고 반복되는 통증 또는 느린 회복을 느끼나요?",
    "운동이나 바쁜 일정 뒤의 붓기와 회복 상태도 포함합니다.",
    "inflammation",
  ),
  healthQuestion(
    "hc-immune",
    "감기·알레르기·구내염이 잦거나 상처 회복이 더딘가요?",
    "외부 자극에 예민해지거나 컨디션 회복이 늦는 경우를 포함합니다.",
    "immune",
  ),
  healthQuestion(
    "hc-hormone",
    "체중·기분·수면·체온·활력이 주기적으로 크게 달라지나요?",
    "성별과 관계없이 몸의 리듬이 흔들리는 정도를 답해주세요.",
    "hormone",
  ),
  healthQuestion(
    "hc-liver",
    "음주 후 피로가 심하거나 냄새에 예민하고 회복이 오래 걸리나요?",
    "처방약은 임의로 중단하지 말고, 복용 부담감은 별도 상담이 필요합니다.",
    "liver",
  ),
  healthQuestion(
    "hc-brain",
    "집중력·기억력이 떨어지거나 긴장과 감정 변화가 잦나요?",
    "업무 중 집중과 휴식 중 긴장 완화 상태를 함께 생각해주세요.",
    "brain-stress",
  ),
  healthQuestion(
    "hc-circulation",
    "손발이 차갑거나 저리고, 붓기·숨참을 자주 느끼나요?",
    "심한 흉통이나 갑작스러운 호흡곤란은 일반 문진보다 즉시 의료기관 확인이 우선입니다.",
    "circulation",
  ),
  healthQuestion(
    "hc-body",
    "관절·목·어깨·허리가 불편하거나 근력 저하와 근육 경련이 있나요?",
    "일상 움직임과 자세를 유지할 때의 불편을 기준으로 답해주세요.",
    "body-composition",
  ),
  healthQuestion(
    "hc-skin",
    "피부 건조·탄력 저하·탈모 또는 손톱 약화를 느끼나요?",
    "최근 평소보다 달라진 피부, 모발, 손톱 상태를 떠올려주세요.",
    "youth-index",
  ),
  healthQuestion(
    "hc-recovery",
    "잠이 불편하고 아침 피로가 남거나 스트레스·운동 후 회복이 늦나요?",
    "수면 시간뿐 아니라 쉬고 난 뒤의 회복감을 기준으로 답해주세요.",
    "lifestyle",
  ),
] as const;

// Part 2: one functional habit question for each asset. This keeps the
// five-minute check balanced without turning it into a long medical intake.
export const LIFESTYLE_QUESTIONS: readonly AssessmentQuestion[] = [
  lifestyleQuestion(
    "ls-metabolic",
    "식사 시간을 일정하게 지키고 과식과 잦은 단 음식을 조절하나요?",
    "완벽함보다 최근 2주 동안 유지한 정도를 답해주세요.",
    "metabolic",
  ),
  lifestyleQuestion(
    "ls-energy",
    "규칙적인 식사와 가벼운 활동으로 하루 에너지를 관리하나요?",
    "무리한 운동이 아니라 활력을 유지하는 일상 활동을 포함합니다.",
    "energy",
  ),
  lifestyleQuestion(
    "ls-gut",
    "천천히 식사하고 물과 식이섬유를 챙겨 편안한 배변 리듬을 유지하나요?",
    "채소, 과일, 통곡물과 충분한 수분 섭취를 포함합니다.",
    "gut",
  ),
  lifestyleQuestion(
    "ls-inflammation",
    "늦은 식사와 수면 부족을 줄이고 활동 뒤 충분히 회복하나요?",
    "몸이 붓거나 뻐근한 날에 휴식과 수면을 확보하는 습관을 봅니다.",
    "inflammation",
  ),
  lifestyleQuestion(
    "ls-immune",
    "수면, 단백질, 채소를 꾸준히 챙겨 회복 습관을 유지하나요?",
    "특정 식품이나 영양제가 질병을 예방한다는 의미는 아닙니다.",
    "immune",
  ),
  lifestyleQuestion(
    "ls-hormone",
    "취침·기상·식사 시간을 일정하게 유지하며 몸의 리듬을 관찰하나요?",
    "일정한 생활 리듬과 변화 기록 여부를 함께 봅니다.",
    "hormone",
  ),
  lifestyleQuestion(
    "ls-liver",
    "음주와 야식을 조절하고 충분한 물과 휴식 시간을 확보하나요?",
    "약물은 처방대로 복용하며 변경이 필요하면 의료진과 상의해야 합니다.",
    "liver",
  ),
  lifestyleQuestion(
    "ls-brain",
    "화면을 끄고 긴장을 낮추는 휴식이나 스트레스 관리 시간을 갖나요?",
    "호흡, 산책, 대화, 취미 등 편안해지는 활동을 포함합니다.",
    "brain-stress",
  ),
  lifestyleQuestion(
    "ls-circulation",
    "매일 걷거나 자주 자세를 바꾸고 혈압·혈중지질을 정기적으로 확인하나요?",
    "오래 앉아 있는 시간을 줄이는 행동도 포함합니다.",
    "circulation",
  ),
  lifestyleQuestion(
    "ls-body",
    "주 2회 이상 근력 활동과 관절 가동성 운동을 실천하나요?",
    "맨몸 운동, 계단 오르기, 스트레칭도 포함할 수 있습니다.",
    "body-composition",
  ),
  lifestyleQuestion(
    "ls-skin",
    "단백질·채소·수분을 챙기고 피부를 자외선과 자극으로부터 보호하나요?",
    "피부와 모발을 위한 기본 생활 습관을 기준으로 답해주세요.",
    "youth-index",
  ),
  lifestyleQuestion(
    "ls-recovery",
    "일정한 수면 시간과 휴식을 확보해 다음 날 회복감을 유지하나요?",
    "대부분의 날에 충분히 쉬고 있다고 느끼는지 답해주세요.",
    "lifestyle",
  ),
] as const;

export const ASSESSMENT_QUESTIONS = [
  ...HEALTH_CHECK_QUESTIONS,
  ...LIFESTYLE_QUESTIONS,
] as const;
