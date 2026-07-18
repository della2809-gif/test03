import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateHealthLedger,
  aggregateHealthMeasurements,
  type HealthLedgerEntry,
  type HealthMeasurementEntry,
} from "../features/health-account/aggregation.ts";

const entries: HealthLedgerEntry[] = [
  { date: "2026-06-30", points: 20, completedMissions: 1, exerciseMinutes: 20, assetScore: 68 },
  { date: "2026-07-01", points: 30, completedMissions: 2, exerciseMinutes: 30, assetScore: 70 },
  { date: "2026-07-13", points: 40, completedMissions: 2, exerciseMinutes: 45, assetScore: 72 },
  { date: "2026-07-18", points: 60, completedMissions: 3, exerciseMinutes: 55, assetScore: 76 },
];

test("건강통장 기록을 월별로 누적한다", () => {
  const monthly = aggregateHealthLedger(entries, "month");
  assert.equal(monthly[0].label, "2026년 7월");
  assert.equal(monthly[0].points, 130);
  assert.equal(monthly[0].completedMissions, 7);
  assert.equal(monthly[0].exerciseMinutes, 130);
  assert.equal(monthly[0].averageAssetScore, 73);
});

test("건강통장 기록은 월요일 시작 주간으로 구분한다", () => {
  const weekly = aggregateHealthLedger(entries, "week");
  assert.equal(weekly[0].key, "2026-07-13");
  assert.equal(weekly[0].points, 100);
  assert.equal(weekly[0].completedMissions, 5);
  assert.equal(weekly[0].averageAssetScore, 74);
});

test("체중·근육·혈압은 기간별 마지막 측정값을 누적 추이에 사용한다", () => {
  const measurements: HealthMeasurementEntry[] = [
    { date: "2026-07-13", weight: 62.1, skeletalMuscle: 23.1, systolic: 121, diastolic: 78 },
    { date: "2026-07-18", weight: 61.8, skeletalMuscle: 23.4, systolic: 118, diastolic: 76 },
  ];
  const weekly = aggregateHealthMeasurements(measurements, "week");
  assert.equal(weekly[0].measuredAt, "2026-07-18");
  assert.equal(weekly[0].weight, 61.8);
  assert.equal(weekly[0].skeletalMuscle, 23.4);
  assert.equal(weekly[0].systolic, 118);
  assert.equal(weekly[0].diastolic, 76);
});
