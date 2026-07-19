import { ASSESSMENT_QUESTIONS } from "./questions.ts";
import type { AssessmentQuestion } from "./types.ts";

export type AssessmentModeId =
  | "full"
  | "sleep"
  | "energy"
  | "metabolic"
  | "muscle"
  | "parent";

export type AssessmentMode = {
  id: AssessmentModeId;
  title: string;
  description: string;
  duration: string;
  domainCodes: string[];
  questionIds: string[];
};

export const ASSESSMENT_MODES: Record<AssessmentModeId, AssessmentMode> = {
  full: {
    id: "full",
    title: "12대 건강자산 진단",
    description:
      "최근 몸의 신호와 생활습관을 함께 살펴 12대 건강자산과 오늘의 우선 행동을 안내합니다.",
    duration: "약 5분",
    domainCodes: [],
    questionIds: ASSESSMENT_QUESTIONS.map((question) => question.id),
  },
  sleep: {
    id: "sleep",
    title: "내 수면자산 확인",
    description:
      "수면의 질, 아침 회복감, 긴장과 생활 리듬을 짧게 점검합니다.",
    duration: "약 1분",
    domainCodes: ["lifestyle", "brain-stress", "energy"],
    questionIds: [
      "hc-recovery",
      "hc-brain",
      "hc-energy",
      "ls-recovery",
      "ls-brain",
      "ls-hormone",
    ],
  },
  energy: {
    id: "energy",
    title: "내 에너지자산 체크",
    description:
      "아침 피로와 오후 무기력, 활동 후 회복과 에너지 관리 습관을 확인합니다.",
    duration: "약 1분",
    domainCodes: ["energy", "lifestyle", "metabolic"],
    questionIds: [
      "hc-energy",
      "hc-recovery",
      "hc-metabolic",
      "ls-energy",
      "ls-recovery",
      "ls-metabolic",
    ],
  },
  metabolic: {
    id: "metabolic",
    title: "혈당자산 간편 체크",
    description:
      "식후 졸림과 단 음식 당김, 식사 리듬과 활동 습관을 확인합니다.",
    duration: "약 1분",
    domainCodes: ["metabolic", "energy", "circulation"],
    questionIds: [
      "hc-metabolic",
      "hc-energy",
      "hc-circulation",
      "ls-metabolic",
      "ls-energy",
      "ls-circulation",
    ],
  },
  muscle: {
    id: "muscle",
    title: "내 근육자산 체크",
    description:
      "근력 저하 신호와 활동량, 회복과 근력 습관을 짧게 점검합니다.",
    duration: "약 1분",
    domainCodes: ["body-composition", "energy", "lifestyle"],
    questionIds: [
      "hc-body",
      "hc-energy",
      "hc-recovery",
      "ls-body",
      "ls-energy",
      "ls-recovery",
    ],
  },
  parent: {
    id: "parent",
    title: "부모님 건강체크",
    description:
      "부모님의 근력, 순환, 에너지와 회복 상태를 함께 살펴봅니다.",
    duration: "약 2분",
    domainCodes: [
      "body-composition",
      "circulation",
      "energy",
      "lifestyle",
    ],
    questionIds: [
      "hc-body",
      "hc-circulation",
      "hc-energy",
      "hc-recovery",
      "ls-body",
      "ls-circulation",
      "ls-energy",
      "ls-recovery",
    ],
  },
};

export function getAssessmentMode(value?: string | null): AssessmentMode {
  if (value && value in ASSESSMENT_MODES) {
    return ASSESSMENT_MODES[value as AssessmentModeId];
  }
  return ASSESSMENT_MODES.full;
}

export function getQuestionsForMode(
  mode: AssessmentMode,
): readonly AssessmentQuestion[] {
  const ids = new Set(mode.questionIds);
  return ASSESSMENT_QUESTIONS.filter((question) => ids.has(question.id));
}
