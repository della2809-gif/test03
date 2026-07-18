import { HEALTH_ASSET_DOMAINS, SCORE_VERSION } from "../../config/health-assets.ts";
import { clamp, getScoreStatus, weightedAverage } from "../../lib/scoring.ts";
import {
  ASSESSMENT_QUESTIONS,
  HEALTH_CHECK_QUESTIONS,
  LIFESTYLE_QUESTIONS,
} from "./questions.ts";
import type {
  AssessmentAnswers,
  AssessmentQuestion,
  DomainAssessmentResult,
  HealthAssessmentResult,
} from "./types.ts";

const DOMAIN_ACTIONS: Record<string, string> = {
  metabolic: "식사 후 10분 걷기를 7일 동안 기록해보세요.",
  energy: "기상 시간을 일정하게 맞추고 오전 컨디션을 기록해보세요.",
  gut: "식사 속도를 늦추고 식후 불편감을 기록해보세요.",
  inflammation: "늦은 식사와 수면 부족이 겹치는 날을 줄여보세요.",
  immune: "수면과 단백질 섭취를 먼저 안정적으로 챙겨보세요.",
  hormone: "취침과 식사 시간을 일정하게 맞춰보세요.",
  liver: "음주와 야식 없는 날을 주 3일 이상 만들어보세요.",
  "brain-stress": "하루 10분 화면 없이 쉬는 시간을 정해보세요.",
  circulation: "매일 가볍게 숨이 찰 정도로 20분 걸어보세요.",
  "body-composition": "주 2회 근력 활동과 단백질 섭취를 함께 기록해보세요.",
  "youth-index": "수면·활동 미션을 한 가지씩 꾸준히 실천해보세요.",
  lifestyle: "오늘 기록할 항목 3개를 정해 같은 시간에 체크해보세요.",
};

const answerToScore = (answer: number) =>
  Math.round(100 - (clamp(answer * (100 / 3))));

function sectionScore(
  questions: readonly AssessmentQuestion[],
  answers: AssessmentAnswers,
) {
  const scores = questions
    .filter((question) => answers[question.id] !== undefined)
    .map((question) => answerToScore(answers[question.id]));
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function calculateAssessmentResult(
  answers: AssessmentAnswers,
  answeredAt = new Date().toISOString(),
): HealthAssessmentResult {
  const symptomAnswered = HEALTH_CHECK_QUESTIONS.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const lifestyleAnswered = LIFESTYLE_QUESTIONS.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const symptomScore = sectionScore(HEALTH_CHECK_QUESTIONS, answers);
  const lifestyleScore = sectionScore(LIFESTYLE_QUESTIONS, answers);

  const sourceScores = [
    symptomAnswered > 0
      ? {
          score: symptomScore,
          weight: 35 * (symptomAnswered / HEALTH_CHECK_QUESTIONS.length),
        }
      : null,
    lifestyleAnswered > 0
      ? {
          score: lifestyleScore,
          weight: 30 * (lifestyleAnswered / LIFESTYLE_QUESTIONS.length),
        }
      : null,
  ].filter((item): item is { score: number; weight: number } => item !== null);

  const domains: DomainAssessmentResult[] = HEALTH_ASSET_DOMAINS.map((domain) => {
    const relatedScores = ASSESSMENT_QUESTIONS.filter(
      (question) =>
        question.domains.includes(domain.code) &&
        answers[question.id] !== undefined,
    ).map((question) => ({
      score: answerToScore(answers[question.id]),
      weight: question.section === "health-check" ? 35 : 30,
    }));
    const score = relatedScores.length
      ? weightedAverage(relatedScores)
      : weightedAverage(sourceScores);
    return {
      code: domain.code,
      name: domain.name,
      description: domain.shortDescription,
      score,
      status: getScoreStatus(score),
      recommendation:
        DOMAIN_ACTIONS[domain.code] ??
        "작은 행동 한 가지를 정해 7일 동안 기록해보세요.",
    };
  });

  const answeredCount = symptomAnswered + lifestyleAnswered;
  const completionRate = Math.round(
    (answeredCount / ASSESSMENT_QUESTIONS.length) * 100,
  );
  const dataConfidence = Math.round(
    35 * (symptomAnswered / HEALTH_CHECK_QUESTIONS.length) +
      30 * (lifestyleAnswered / LIFESTYLE_QUESTIONS.length),
  );

  return {
    totalScore: weightedAverage(sourceScores),
    dataConfidence,
    completionRate,
    symptomScore,
    lifestyleScore,
    scoreVersion: SCORE_VERSION,
    domains,
    priorities: [...domains]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
    answeredAt,
  };
}

export function isAssessmentComplete(answers: AssessmentAnswers) {
  return ASSESSMENT_QUESTIONS.every(
    (question) => answers[question.id] !== undefined,
  );
}
