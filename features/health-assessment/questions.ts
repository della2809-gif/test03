import type {
  AssessmentOption,
  AssessmentQuestion,
} from "./types.ts";

const frequencyOptions = [
  { label: "거의 없음", value: 0 },
  { label: "가끔", value: 1 },
  { label: "자주", value: 2 },
  { label: "매우 자주", value: 3 },
] as const satisfies readonly AssessmentOption[];

const habitOptions = [
  { label: "잘 실천하고 있음", value: 0 },
  { label: "대체로 실천함", value: 1 },
  { label: "가끔 실천함", value: 2 },
  { label: "거의 실천하지 못함", value: 3 },
] as const satisfies readonly AssessmentOption[];

const healthQuestion = (
  id: string,
  prompt: string,
  helper: string,
  domains: string[],
): AssessmentQuestion => ({
  id,
  section: "health-check",
  prompt,
  helper,
  domains,
  options: frequencyOptions,
});

const lifestyleQuestion = (
  id: string,
  prompt: string,
  helper: string,
  domains: string[],
): AssessmentQuestion => ({
  id,
  section: "lifestyle",
  prompt,
  helper,
  domains,
  options: habitOptions,
});

export const HEALTH_CHECK_QUESTIONS: readonly AssessmentQuestion[] = [
  healthQuestion("hc-metabolic", "식사 후 심하게 졸리거나 단 음식이 당기나요?", "최근 2주의 평균적인 상태를 떠올려주세요.", ["metabolic"]),
  healthQuestion("hc-energy", "충분히 쉬어도 오전부터 피로가 남아 있나요?", "일을 시작할 때의 에너지 상태를 기준으로 답해주세요.", ["energy", "youth-index"]),
  healthQuestion("hc-gut", "식후 더부룩함이나 배변 불편이 있나요?", "복부 불편감과 배변 리듬을 함께 생각해주세요.", ["gut"]),
  healthQuestion("hc-inflammation", "몸이 자주 붓거나 회복이 더디다고 느끼나요?", "운동이나 바쁜 일정 뒤 회복 상태를 포함합니다.", ["inflammation"]),
  healthQuestion("hc-immune", "컨디션이 떨어지면 쉽게 아프거나 회복이 오래 걸리나요?", "계절 변화 때의 상태도 함께 생각해주세요.", ["immune"]),
  healthQuestion("hc-hormone", "수면·기분·식욕의 리듬이 불규칙하게 흔들리나요?", "특정 질환이 아닌 일상 리듬에 관한 질문입니다.", ["hormone"]),
  healthQuestion("hc-liver", "음주나 과식 다음 날 피로가 오래 지속되나요?", "평소보다 회복에 오래 걸리는지 답해주세요.", ["liver"]),
  healthQuestion("hc-brain", "집중이 어렵거나 긴장이 쉽게 풀리지 않나요?", "업무와 휴식 시간 모두를 떠올려주세요.", ["brain-stress"]),
  healthQuestion("hc-circulation", "계단을 오를 때 숨이 차거나 손발이 자주 차갑나요?", "심한 흉통이나 갑작스러운 호흡곤란은 즉시 의료기관 확인이 필요합니다.", ["circulation"]),
  healthQuestion("hc-body", "근육은 줄고 체지방은 늘었다고 느끼나요?", "정확한 상태는 인바디 같은 체성분 자료로 보완할 수 있어요.", ["body-composition"]),
  healthQuestion("hc-youth", "예전보다 활력과 회복 속도가 눈에 띄게 줄었나요?", "나이 자체가 아니라 최근 변화에 답해주세요.", ["youth-index", "energy"]),
  healthQuestion("hc-lifestyle", "생활 리듬이 흐트러져 건강관리가 어렵다고 느끼나요?", "수면·식사·활동의 전체적인 규칙성을 생각해주세요.", ["lifestyle"]),
] as const;

export const LIFESTYLE_QUESTIONS: readonly AssessmentQuestion[] = [
  lifestyleQuestion("ls-meals", "하루 식사 시간과 횟수를 규칙적으로 유지하나요?", "주중과 주말을 모두 포함해 답해주세요.", ["metabolic", "lifestyle"]),
  lifestyleQuestion("ls-protein", "매 끼니 단백질 식품을 챙겨 먹나요?", "달걀, 두부, 생선, 살코기, 콩류 등을 포함합니다.", ["body-composition", "energy"]),
  lifestyleQuestion("ls-vegetable", "채소와 과일을 다양한 색으로 섭취하나요?", "하루 2회 이상 섭취하는지를 기준으로 생각해주세요.", ["gut", "immune", "inflammation"]),
  lifestyleQuestion("ls-water", "갈증이 심해지기 전에 물을 나누어 마시나요?", "커피와 음료를 제외한 물 섭취를 기준으로 합니다.", ["circulation", "lifestyle"]),
  lifestyleQuestion("ls-activity", "일주일에 3회 이상 걷기나 운동을 하나요?", "한 번에 20분 이상 움직이는 활동을 포함합니다.", ["circulation", "body-composition", "youth-index"]),
  lifestyleQuestion("ls-strength", "주 2회 이상 근력 운동이나 근육 자극 활동을 하나요?", "맨몸 운동과 계단 오르기도 포함할 수 있어요.", ["body-composition", "youth-index"]),
  lifestyleQuestion("ls-sleep", "일정한 시간에 7시간 안팎의 수면을 확보하나요?", "수면 시간과 규칙성을 함께 평가합니다.", ["energy", "hormone", "brain-stress"]),
  lifestyleQuestion("ls-stress", "긴장을 낮추는 나만의 휴식 시간을 갖고 있나요?", "호흡, 산책, 대화, 취미 등 편안해지는 활동을 포함합니다.", ["brain-stress", "immune"]),
  lifestyleQuestion("ls-alcohol", "음주와 늦은 야식을 스스로 조절하고 있나요?", "횟수와 양 모두를 고려해주세요.", ["liver", "metabolic"]),
  lifestyleQuestion("ls-check", "체중·혈압·검진 등 건강 변화를 정기적으로 확인하나요?", "기록하거나 이전 결과와 비교하는 습관을 포함합니다.", ["lifestyle", "inflammation"]),
] as const;

export const ASSESSMENT_QUESTIONS = [
  ...HEALTH_CHECK_QUESTIONS,
  ...LIFESTYLE_QUESTIONS,
] as const;
