import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSESSMENT_QUESTIONS,
  HEALTH_CHECK_QUESTIONS,
  LIFESTYLE_QUESTIONS,
} from "../features/health-assessment/questions.ts";
import {
  calculateAssessmentResult,
  calculateEnhancedConfidence,
  isAssessmentComplete,
} from "../features/health-assessment/scoring.ts";
import type { AssessmentAnswers } from "../features/health-assessment/types.ts";
import { HEALTH_ASSET_DOMAINS } from "../config/health-assets.ts";
import {
  ASSESSMENT_MODES,
  getAssessmentMode,
  getQuestionsForMode,
} from "../features/health-assessment/modes.ts";
import { recommendJournalContent } from "../lib/journal-content.ts";

const answerAll = (value: number): AssessmentAnswers =>
  Object.fromEntries(
    ASSESSMENT_QUESTIONS.map((question) => [question.id, value]),
  );

test("모든 문항을 답하면 완료 상태가 된다", () => {
  const answers = answerAll(1);
  assert.equal(isAssessmentComplete(answers), true);
  assert.equal(isAssessmentComplete({}), false);
});

test("5분 진단은 12개 축마다 증상과 생활습관 문항을 하나씩 둔다", () => {
  assert.equal(HEALTH_CHECK_QUESTIONS.length, 12);
  assert.equal(LIFESTYLE_QUESTIONS.length, 12);
  assert.equal(ASSESSMENT_QUESTIONS.length, 24);

  for (const domain of HEALTH_ASSET_DOMAINS) {
    assert.equal(
      HEALTH_CHECK_QUESTIONS.filter((question) =>
        question.domains.includes(domain.code),
      ).length,
      1,
    );
    assert.equal(
      LIFESTYLE_QUESTIONS.filter((question) =>
        question.domains.includes(domain.code),
      ).length,
      1,
    );
  }
});

test("건강체크와 생활습관 완료 시 데이터 신뢰도는 65%다", () => {
  const result = calculateAssessmentResult(
    answerAll(1),
    "2026-07-18T00:00:00.000Z",
  );
  assert.equal(result.dataConfidence, 65);
  assert.equal(result.completionRate, 100);
  assert.equal(result.scoreVersion, "wellset-score-v1");
});

test("건강검진과 인바디 입력은 데이터 신뢰도를 각각 보완한다", () => {
  assert.equal(calculateEnhancedConfidence(65, false, false), 65);
  assert.equal(calculateEnhancedConfidence(65, true, false), 85);
  assert.equal(calculateEnhancedConfidence(65, false, true), 80);
  assert.equal(calculateEnhancedConfidence(65, true, true), 100);
});

test("검진과 인바디가 없어도 문진 자료끼리 재정규화한다", () => {
  const answers: AssessmentAnswers = {
    ...Object.fromEntries(
      HEALTH_CHECK_QUESTIONS.map((question) => [question.id, 0]),
    ),
    ...Object.fromEntries(
      LIFESTYLE_QUESTIONS.map((question) => [question.id, 3]),
    ),
  };
  const result = calculateAssessmentResult(answers);
  assert.equal(result.symptomScore, 100);
  assert.equal(result.lifestyleScore, 0);
  assert.equal(result.totalScore, 54);
});

test("12대 건강자산 점수와 우선관리 3개를 산출한다", () => {
  const answers = answerAll(0);
  answers["hc-gut"] = 3;
  answers["ls-gut"] = 3;
  answers["hc-brain"] = 2;
  const result = calculateAssessmentResult(answers);
  assert.equal(result.domains.length, 12);
  assert.equal(result.priorities.length, 3);
  assert.equal(result.priorities[0].code, "gut");
  assert.ok(result.domains.every((domain) => domain.score >= 0 && domain.score <= 100));
});

test("부분 응답의 데이터 신뢰도는 응답 비율만 반영한다", () => {
  const halfHealthQuestions = HEALTH_CHECK_QUESTIONS.slice(
    0,
    HEALTH_CHECK_QUESTIONS.length / 2,
  );
  const result = calculateAssessmentResult(
    Object.fromEntries(halfHealthQuestions.map((question) => [question.id, 1])),
  );
  assert.equal(result.dataConfidence, 18);
  assert.equal(result.completionRate, 25);
});

test("같은 응답은 항상 같은 점수 결과를 만든다", () => {
  const answers = answerAll(2);
  const first = calculateAssessmentResult(answers, "2026-07-18T00:00:00.000Z");
  const second = calculateAssessmentResult(answers, "2026-07-18T00:00:00.000Z");
  assert.deepEqual(first, second);
});

test("주제별 간편 체크는 기존 문항만 재사용한다", () => {
  const sleepQuestions = getQuestionsForMode(ASSESSMENT_MODES.sleep);
  assert.equal(sleepQuestions.length, 6);
  assert.equal(new Set(sleepQuestions.map((question) => question.id)).size, 6);
  assert.equal(getAssessmentMode("unknown").id, "full");
});

test("낮은 건강축에 맞는 Journal 콘텐츠를 중복 없이 추천한다", () => {
  const recommendations = recommendJournalContent([
    "lifestyle",
    "energy",
    "body-composition",
  ]);
  assert.equal(recommendations.length, 3);
  assert.equal(new Set(recommendations.map((item) => item.id)).size, 3);
  assert.match(recommendations[0].href, /wellset-journal/);
});
