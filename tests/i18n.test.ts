import assert from "node:assert/strict";
import test from "node:test";
import { isLocale, translate } from "../lib/i18n.ts";
import { HEALTH_CHECK_QUESTIONS } from "../features/health-assessment/questions.ts";
import { localizeQuestion } from "../features/health-assessment/i18n.ts";

test("지원 로케일은 한국어와 영어로 제한한다", () => {
  assert.equal(isLocale("ko"), true);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("ja"), false);
});

test("공통 번역 키가 한국어와 영어를 반환한다", () => {
  assert.equal(translate("ko", "healthAccount"), "건강통장");
  assert.equal(translate("en", "healthAccount"), "Health Account");
  assert.equal(translate("ko", "heroTitle2"), "자산입니다.");
});

test("건강체크 질문과 선택지가 영어로 변환된다", () => {
  const localized = localizeQuestion(HEALTH_CHECK_QUESTIONS[0], "en");
  assert.match(localized.prompt, /meals/i);
  assert.equal(localized.options[0].label, "Rarely");
});
