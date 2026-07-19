import assert from "node:assert/strict";
import test from "node:test";
import {
  applyObjectiveData,
  assessBmi,
  assessBloodPressure,
  assessBodyCompositionData,
  assessCheckupData,
  assessFastingGlucose,
  assessHba1c,
  assessLdl,
  assessTriglycerides,
} from "../features/clinical-rules/index.ts";
import { ASSESSMENT_QUESTIONS } from "../features/health-assessment/questions.ts";
import { calculateAssessmentResult } from "../features/health-assessment/scoring.ts";

test("공복혈당과 HbA1c 경계값은 대한당뇨병학회 범위를 따른다", () => {
  assert.equal(assessFastingGlucose(99).band, "reference");
  assert.equal(assessFastingGlucose(100).band, "attention");
  assert.equal(assessFastingGlucose(126).band, "medical-review");
  assert.equal(assessHba1c(5.6).band, "reference");
  assert.equal(assessHba1c(5.7).band, "attention");
  assert.equal(assessHba1c(6.5).band, "medical-review");
});

test("혈압은 진료실과 가정 평균의 서로 다른 확인 기준을 적용한다", () => {
  assert.equal(assessBloodPressure(139, 89, "office").band, "attention");
  assert.equal(assessBloodPressure(140, 80, "office").band, "medical-review");
  assert.equal(assessBloodPressure(134, 84, "home").band, "attention");
  assert.equal(assessBloodPressure(135, 80, "home").band, "medical-review");
});

test("LDL과 중성지방은 학회 분류 경계값을 보존한다", () => {
  assert.equal(assessLdl(99).wellnessScore, 100);
  assert.equal(assessLdl(130).band, "attention");
  assert.equal(assessLdl(160).band, "medical-review");
  assert.equal(assessTriglycerides(149).band, "reference");
  assert.equal(assessTriglycerides(150).band, "attention");
  assert.equal(assessTriglycerides(500).band, "medical-review");
});

test("한국 성인 BMI 분류 경계값을 적용한다", () => {
  assert.equal(assessBmi(18.4).interpretation, "저체중 범위입니다.");
  assert.equal(assessBmi(18.5).band, "reference");
  assert.equal(assessBmi(23).interpretation, "비만 전단계 범위입니다.");
  assert.equal(assessBmi(25).interpretation, "1단계 비만 범위입니다.");
  assert.equal(assessBmi(30).interpretation, "2단계 비만 범위입니다.");
  assert.equal(assessBmi(35).interpretation, "3단계 비만 범위입니다.");
});

test("국가건강검진 수치를 관련 건강축에 연결하고 크레아티닌은 참고값으로 둔다", () => {
  const checkup = assessCheckupData({
    sex: "female",
    waist: "86",
    hemoglobin: "11.5",
    fastingGlucose: "95",
    totalCholesterol: "220",
    ast: "52",
    alt: "46",
    ggt: "40",
    creatinine: "1.0",
    egfr: "95",
  });
  const body = assessBodyCompositionData({
    bmi: "22",
    bodyFat: "35",
    skeletalMuscle: "20",
    visceralFat: "12",
  });
  assert.equal(checkup.metrics.some((item) => item.id === "alt"), true);
  assert.ok(checkup.domainScores.liver < 100);
  assert.ok(checkup.domainScores.energy < 100);
  assert.ok(checkup.domainScores["body-composition"] < 100);
  assert.ok(checkup.domainScores.circulation < 100);
  assert.equal(
    checkup.metrics.find((item) => item.id === "creatinine")?.wellnessScore,
    null,
  );
  assert.equal(body.metrics.length, 1);
  assert.match(body.excludedMetrics[0], /측정 장비/);
});

test("성별 참고치가 필요한 수치는 성별 미선택 시 점수에 반영하지 않는다", () => {
  const checkup = assessCheckupData({
    waist: "91",
    hemoglobin: "11",
    ggt: "70",
  });
  assert.equal(checkup.sourceScore, null);
  assert.equal(checkup.metrics.length, 3);
  assert.ok(checkup.metrics.every((item) => item.band === "context"));
  assert.ok(checkup.metrics.every((item) => item.wellnessScore === null));
});

test("객관적 수치는 신뢰도뿐 아니라 총점과 관련 건강축 점수도 갱신한다", () => {
  const answers = Object.fromEntries(
    ASSESSMENT_QUESTIONS.map((question) => [question.id, 1]),
  );
  const base = calculateAssessmentResult(
    answers,
    "2026-07-18T00:00:00.000Z",
  );
  const checkup = assessCheckupData({
    bpContext: "office",
    systolic: "150",
    diastolic: "95",
    fastingGlucose: "130",
    hba1c: "6.7",
    ldl: "170",
    hdl: "35",
    triglycerides: "220",
    alt: "30",
  });
  const body = assessBodyCompositionData({ bmi: "31" });
  const enhanced = applyObjectiveData(base, {
    checkup,
    bodyComposition: body,
  });
  assert.equal(enhanced.dataConfidence, 100);
  assert.notEqual(enhanced.totalScore, base.totalScore);
  assert.ok(
    enhanced.domains.find((item) => item.code === "metabolic")!.score <
      base.domains.find((item) => item.code === "metabolic")!.score,
  );
  assert.equal(enhanced.scoreVersion, "wellset-score-v3-checkup-domain-linked");
});

test("확장 건강검진 수치는 12건강축 근거로 연결하되 단독 점수화하지 않는다", () => {
  const checkup = assessCheckupData({
    wbc: "5.8",
    crp: "0.7",
    tsh: "2.1",
    vitaminD: "28",
    albumin: "4.3",
    ck: "82",
  });
  assert.equal(checkup.metrics.length, 6);
  assert.equal(checkup.sourceScore, null);
  assert.ok(checkup.metrics.every((item) => item.band === "context"));
  assert.ok(checkup.metrics.find((item) => item.id === "tsh")?.domains.includes("hormone"));
  assert.ok(checkup.metrics.find((item) => item.id === "crp")?.domains.includes("inflammation"));
  assert.ok(checkup.metrics.find((item) => item.id === "albumin")?.domains.includes("gut"));
});
