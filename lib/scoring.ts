import {
  HEALTH_ASSET_DOMAINS,
  SCORE_VERSION,
} from "../config/health-assets.ts";

export type AxisScore = {
  assetScore: number;
  confidenceScore: number;
  baseWeight?: number;
};

export type HealthAssetSources = {
  symptoms?: number;
  lifestyle?: number;
  checkup?: number;
  bodyComposition?: number;
};

export const HEALTH_ASSET_WEIGHTS = {
  symptoms: 35,
  lifestyle: 30,
  checkup: 20,
  bodyComposition: 15,
} as const;

export const AXES = HEALTH_ASSET_DOMAINS.map(({ code, name }) => ({
  code,
  name,
  baseWeight: 1,
}));

export const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function weightedAverage(
  values: Array<{ score: number; weight: number }>,
): number {
  const available = values.filter(
    ({ score, weight }) =>
      Number.isFinite(score) && Number.isFinite(weight) && weight > 0,
  );
  if (!available.length) return 0;
  const weightTotal = available.reduce((sum, item) => sum + item.weight, 0);
  const scoreTotal = available.reduce(
    (sum, item) => sum + clamp(item.score) * item.weight,
    0,
  );
  return Math.round(scoreTotal / weightTotal);
}

export function calculateHealthAssetScore(sources: HealthAssetSources) {
  const entries = Object.entries(sources)
    .filter((entry): entry is [keyof HealthAssetSources, number] =>
      Number.isFinite(entry[1]),
    )
    .map(([key, score]) => ({
      score,
      weight: HEALTH_ASSET_WEIGHTS[key],
    }));

  return {
    score: weightedAverage(entries),
    confidence: Math.round(
      entries.reduce((sum, item) => sum + item.weight, 0),
    ),
    scoreVersion: SCORE_VERSION,
  };
}

export function calculateConfidence(input: {
  questionnaire: boolean;
  lifestyle: boolean;
  bodyComposition: boolean;
  biomarkers: boolean;
  healthHistory: boolean;
}) {
  return clamp(
    (input.questionnaire ? 35 : 0) +
      (input.lifestyle ? 15 : 0) +
      (input.bodyComposition ? 15 : 0) +
      (input.biomarkers ? 25 : 0) +
      (input.healthHistory ? 10 : 0),
  );
}

const confidenceFactor = (value: number) =>
  value >= 80 ? 1 : value >= 60 ? 0.85 : value >= 40 ? 0.65 : 0.4;

export function calculateOverallAsset(axes: AxisScore[]) {
  if (!axes.length) return 0;
  return weightedAverage(
    axes.map((axis) => ({
      score: axis.assetScore,
      weight:
        (axis.baseWeight ?? 1) * confidenceFactor(axis.confidenceScore),
    })),
  );
}

export function calculatePriority(input: {
  concern: number;
  objective?: number;
  impact?: number;
  persistence?: number;
  upstream: number;
  trend?: number;
}) {
  const parts = [
    { value: input.concern, weight: 0.45 },
    { value: input.objective, weight: 0.2 },
    { value: input.impact, weight: 0.1 },
    { value: input.persistence, weight: 0.08 },
    { value: input.upstream, weight: 0.1 },
    { value: input.trend, weight: 0.07 },
  ].filter(
    (part): part is { value: number; weight: number } =>
      part.value !== undefined,
  );
  return weightedAverage(
    parts.map(({ value, weight }) => ({ score: value, weight })),
  );
}

export function getScoreStatus(score: number) {
  const value = clamp(score);
  if (value >= 80) return "안정적으로 관리 중";
  if (value >= 60) return "관심 필요";
  if (value >= 40) return "집중관리 권장";
  return "건강멘토상담필요";
}

export const calculateAxisAsset = (concern: number) =>
  clamp(100 - clamp(concern));
