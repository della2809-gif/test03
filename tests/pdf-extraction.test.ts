import assert from "node:assert/strict";
import test from "node:test";
import { extractCheckupValuesFromText } from "../features/clinical-rules/pdf-extraction.ts";
import { getPdfPasswordErrorKind } from "../features/clinical-rules/pdf-password.ts";

test("암호 필요와 잘못된 PDF 암호 오류를 구분한다", () => {
  assert.equal(
    getPdfPasswordErrorKind({
      name: "PasswordException",
      code: 1,
      message: "No password given",
    }),
    "required",
  );
  assert.equal(
    getPdfPasswordErrorKind({
      name: "PasswordException",
      code: 2,
      message: "Incorrect Password",
    }),
    "incorrect",
  );
  assert.equal(
    getPdfPasswordErrorKind(new Error("Invalid PDF structure")),
    null,
  );
});

test("건강검진 PDF 텍스트에서 주요 수치를 추출한다", () => {
  const result = extractCheckupValuesFromText(`
    종합 건강검진 결과
    허리둘레 81.5 cm
    혈압 128 / 82 mmHg
    혈색소 13.4 g/dL
    공복혈당 96 mg/dL
    당화혈색소(HbA1c) 5.6 %
    총콜레스테롤 188 mg/dL
    LDL 콜레스테롤 112 mg/dL
    HDL 콜레스테롤 54 mg/dL
    중성지방 145 mg/dL
    AST(SGOT) 28 U/L
    ALT(SGPT) 31 U/L
    감마지티피 24 U/L
    혈청 크레아티닌 0.8 mg/dL
    신사구체여과율(eGFR) 102 mL/min/1.73㎡
  `);

  assert.deepEqual(result.values, {
    waist: "81.5",
    systolic: "128",
    diastolic: "82",
    hemoglobin: "13.4",
    fastingGlucose: "96",
    hba1c: "5.6",
    totalCholesterol: "188",
    ldl: "112",
    hdl: "54",
    triglycerides: "145",
    ast: "28",
    alt: "31",
    ggt: "24",
    creatinine: "0.8",
    egfr: "102",
  });
  assert.equal(result.missingFields.length, 0);
});

test("분리 표기된 혈압과 영문 검사명을 인식한다", () => {
  const result = extractCheckupValuesFromText(`
    Systolic: 121
    Diastolic: 77
    Fasting Glucose: 88
    Hb A1c: 5.2
    Triglyceride: 90
  `);

  assert.equal(result.values.systolic, "121");
  assert.equal(result.values.diastolic, "77");
  assert.equal(result.values.fastingGlucose, "88");
  assert.equal(result.values.hba1c, "5.2");
  assert.equal(result.values.triglycerides, "90");
});

test("임상 입력 범위를 벗어난 오인식 값은 제외한다", () => {
  const result = extractCheckupValuesFromText(`
    공복혈당 20260719 mg/dL
    당화혈색소 98 %
    ALT 25 U/L
  `);

  assert.equal(result.values.fastingGlucose, undefined);
  assert.equal(result.values.hba1c, undefined);
  assert.equal(result.values.alt, "25");
});
