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
  assert.equal(result.foundFields.length, 15);
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

test("OCR이 한글 검사명 사이에 넣은 공백을 정규화한다", () => {
  const result = extractCheckupValuesFromText(`
    허 리 둘 레 84.2 cm
    혈 색 소 12.8 g/dL
    공 복 혈 당 91 mg/dL
    총 콜 레 스 테 롤 176 mg/dL
    감 마 지 티 피 22 U/L
    혈 청 크 레 아 티 닌 0.9 mg/dL
    신 사 구 체 여 과 율 98 mL/min/1.73㎡
  `);

  assert.equal(result.values.waist, "84.2");
  assert.equal(result.values.hemoglobin, "12.8");
  assert.equal(result.values.fastingGlucose, "91");
  assert.equal(result.values.totalCholesterol, "176");
  assert.equal(result.values.ggt, "22");
  assert.equal(result.values.creatinine, "0.9");
  assert.equal(result.values.egfr, "98");
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

test("12건강축 참고 검사명과 단위를 찾아 정규화한다", () => {
  const result = extractCheckupValuesFromText(`
    백혈구 WBC 5.7 10^3/uL
    혈소판 245000 /uL
    Ferritin 42 ng/mL
    hs-CRP 0.08 mg/dL
    ESR 12 mm/hr
    TSH 2.14 mIU/L
    Free T4 1.21 ng/dL
    25-OH Vitamin D 28.5 ng/mL
    Vitamin B12 512 pg/mL
    Albumin 4.3 g/dL
    Total Bilirubin 0.7 mg/dL
    ALP 71 U/L
    BUN 14.2 mg/dL
    Calcium 9.4 mg/dL
    CK 88 U/L
  `);

  assert.equal(result.values.wbc, "5.7");
  assert.equal(result.values.platelets, "245");
  assert.equal(result.values.hsCrp, "0.8");
  assert.equal(result.values.tsh, "2.14");
  assert.equal(result.values.vitaminD, "28.5");
  assert.equal(result.values.albumin, "4.3");
  assert.equal(result.values.ck, "88");
});
