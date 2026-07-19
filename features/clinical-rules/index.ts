import { getScoreStatus, weightedAverage } from "../../lib/scoring.ts";
import type {
  DomainAssessmentResult,
  HealthAssessmentResult,
} from "../health-assessment/types.ts";

export type ClinicalBand =
  | "reference"
  | "attention"
  | "medical-review"
  | "context";

export type MetricAssessment = {
  id: string;
  label: string;
  value: string;
  band: ClinicalBand;
  bandLabel: string;
  interpretation: string;
  wellnessScore: number | null;
  domains: string[];
  evidence: string;
};

export type ObjectiveDataAssessment = {
  kind: "checkup" | "body-composition";
  sourceScore: number | null;
  metrics: MetricAssessment[];
  domainScores: Record<string, number>;
  excludedMetrics: string[];
};

export type BloodPressureContext = "office" | "home";

const KDA_EVIDENCE =
  "2023 대한당뇨병학회 진료지침: 공복혈당 100–125 또는 HbA1c 5.7–6.4%는 당뇨병전단계 범위, 공복혈당 ≥126 또는 HbA1c ≥6.5%는 진단 기준에 해당합니다.";
const KSH_EVIDENCE =
  "대한고혈압학회 지침: 정상 혈압은 <120/80 mmHg이며, 고혈압 기준은 진료실 ≥140/90, 가정 평균 ≥135/85 mmHg입니다.";
const KSLA_EVIDENCE =
  "한국지질·동맥경화학회 기준: LDL <100 적정, 130–159 경계, ≥160 높음; 중성지방 <150 적정, ≥500 매우 높음; HDL <40 낮음입니다.";
const KSSO_EVIDENCE =
  "대한비만학회 2022 지침: 한국 성인은 BMI 23–24.9를 비만 전단계, 25–29.9를 1단계, 30–34.9를 2단계, ≥35를 3단계 비만으로 분류합니다.";
const NATIONAL_CHECKUP_EVIDENCE =
  "보건복지부 2026 일반건강검진 결과통보서 참고치: 허리둘레 남 90/여 85 cm 이상, 혈색소 남 13–16.5/여 12–15.5 g/dL, 총콜레스테롤 <200 mg/dL, AST ≤40, ALT ≤35 U/L, γ-GTP 남 ≤63/여 ≤35 U/L입니다. 검진기관별 참고치는 다를 수 있습니다.";
const KDIGO_EVIDENCE =
  "KDIGO 2024 CKD 지침: eGFR 60 mL/min/1.73㎡ 미만이 3개월 이상 지속되면 만성콩팥병 기준에 해당할 수 있으며, 한 번의 결과만으로 확정하지 않습니다.";
const WHO_HEMOGLOBIN_EVIDENCE =
  "WHO 2024 빈혈 지침과 국가건강검진 참고치는 혈색소 해석에 성별·임신·고도·흡연 등 개인 조건을 함께 고려하도록 안내합니다.";

type BiologicalSex = "male" | "female";

const biologicalSex = (
  values: Record<string, string>,
): BiologicalSex | null =>
  values.sex === "male" || values.sex === "female" ? values.sex : null;

const numberValue = (values: Record<string, string>, id: string) => {
  const raw = values[id];
  if (raw === undefined || raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const metric = (
  input: Omit<MetricAssessment, "bandLabel">,
): MetricAssessment => ({
  ...input,
  bandLabel:
    input.band === "reference"
      ? "기준 범위"
      : input.band === "attention"
        ? "생활관리 주의"
        : input.band === "medical-review"
          ? "의료진 확인"
          : "참고 수치",
});

export function assessBloodPressure(
  systolic: number,
  diastolic: number,
  context: BloodPressureContext = "office",
): MetricAssessment {
  const highThreshold = context === "home" ? [135, 85] : [140, 90];
  const value = `${systolic}/${diastolic} mmHg`;

  if (systolic >= highThreshold[0] || diastolic >= highThreshold[1]) {
    return metric({
      id: "bloodPressure",
      label: context === "home" ? "가정 평균 혈압" : "진료실 혈압",
      value,
      band: "medical-review",
      interpretation: `고혈압 확인 기준(${highThreshold[0]}/${highThreshold[1]} mmHg 이상)에 해당합니다. 반복 측정과 의료진 확인이 필요합니다.`,
      wellnessScore: 35,
      domains: ["circulation"],
      evidence: KSH_EVIDENCE,
    });
  }
  if (systolic >= 120 || diastolic >= 80) {
    return metric({
      id: "bloodPressure",
      label: context === "home" ? "가정 평균 혈압" : "진료실 혈압",
      value,
      band: "attention",
      interpretation: "정상 혈압 범위보다 높습니다. 표준 방법으로 반복 측정해 추세를 확인하세요.",
      wellnessScore: 70,
      domains: ["circulation"],
      evidence: KSH_EVIDENCE,
    });
  }
  return metric({
    id: "bloodPressure",
    label: context === "home" ? "가정 평균 혈압" : "진료실 혈압",
    value,
    band: "reference",
    interpretation: "정상 혈압 범위에 해당합니다.",
    wellnessScore: 100,
    domains: ["circulation"],
    evidence: KSH_EVIDENCE,
  });
}

export function assessFastingGlucose(value: number): MetricAssessment {
  if (value >= 126) {
    return metric({
      id: "fastingGlucose",
      label: "공복혈당",
      value: `${value} mg/dL`,
      band: "medical-review",
      interpretation: "당뇨병 진단 기준 범위에 해당합니다. 한 번의 결과만으로 확정하지 말고 의료진 확인이 필요합니다.",
      wellnessScore: 30,
      domains: ["metabolic"],
      evidence: KDA_EVIDENCE,
    });
  }
  if (value >= 100) {
    return metric({
      id: "fastingGlucose",
      label: "공복혈당",
      value: `${value} mg/dL`,
      band: "attention",
      interpretation: "당뇨병전단계 범위에 해당합니다.",
      wellnessScore: 65,
      domains: ["metabolic"],
      evidence: KDA_EVIDENCE,
    });
  }
  return metric({
    id: "fastingGlucose",
    label: "공복혈당",
    value: `${value} mg/dL`,
    band: "reference",
    interpretation: "일반적인 정상 공복혈당 범위에 해당합니다.",
    wellnessScore: 100,
    domains: ["metabolic"],
    evidence: KDA_EVIDENCE,
  });
}

export function assessHba1c(value: number): MetricAssessment {
  if (value >= 6.5) {
    return metric({
      id: "hba1c",
      label: "당화혈색소",
      value: `${value}%`,
      band: "medical-review",
      interpretation: "당뇨병 진단 기준 범위에 해당합니다. 의료진의 확인 검사가 필요합니다.",
      wellnessScore: 30,
      domains: ["metabolic"],
      evidence: KDA_EVIDENCE,
    });
  }
  if (value >= 5.7) {
    return metric({
      id: "hba1c",
      label: "당화혈색소",
      value: `${value}%`,
      band: "attention",
      interpretation: "당뇨병전단계 범위에 해당합니다.",
      wellnessScore: 65,
      domains: ["metabolic"],
      evidence: KDA_EVIDENCE,
    });
  }
  return metric({
    id: "hba1c",
    label: "당화혈색소",
    value: `${value}%`,
    band: "reference",
    interpretation: "일반적인 정상 범위에 해당합니다.",
    wellnessScore: 100,
    domains: ["metabolic"],
    evidence: KDA_EVIDENCE,
  });
}

export function assessLdl(value: number): MetricAssessment {
  const shared = {
    id: "ldl",
    label: "LDL 콜레스테롤",
    value: `${value} mg/dL`,
    domains: ["circulation"],
    evidence: KSLA_EVIDENCE,
  };
  if (value >= 160) {
    return metric({
      ...shared,
      band: "medical-review",
      interpretation: value >= 190 ? "매우 높은 범위입니다." : "높은 범위입니다.",
      wellnessScore: value >= 190 ? 20 : 40,
    });
  }
  if (value >= 130) {
    return metric({
      ...shared,
      band: "attention",
      interpretation: "경계 범위입니다. 개인 치료 목표는 심혈관 위험도에 따라 달라집니다.",
      wellnessScore: 65,
    });
  }
  return metric({
    ...shared,
    band: "reference",
    interpretation:
      value < 100
        ? "적정 범위입니다."
        : "정상 또는 적정에 가까운 범위입니다. 개인 목표는 위험도에 따라 달라질 수 있습니다.",
    wellnessScore: value < 100 ? 100 : 85,
  });
}

export function assessHdl(value: number): MetricAssessment {
  if (value < 40) {
    return metric({
      id: "hdl",
      label: "HDL 콜레스테롤",
      value: `${value} mg/dL`,
      band: "medical-review",
      interpretation: "낮은 HDL 범위입니다.",
      wellnessScore: 40,
      domains: ["circulation"],
      evidence: KSLA_EVIDENCE,
    });
  }
  return metric({
    id: "hdl",
    label: "HDL 콜레스테롤",
    value: `${value} mg/dL`,
    band: value >= 60 ? "reference" : "attention",
    interpretation: value >= 60 ? "적정 범위입니다." : "낮은 범위는 아니지만 생활습관과 함께 추세를 살펴보세요.",
    wellnessScore: value >= 60 ? 100 : 75,
    domains: ["circulation"],
    evidence: KSLA_EVIDENCE,
  });
}

export function assessTriglycerides(value: number): MetricAssessment {
  const shared = {
    id: "triglycerides",
    label: "중성지방",
    value: `${value} mg/dL`,
    domains: ["circulation"],
    evidence: KSLA_EVIDENCE,
  };
  if (value >= 200) {
    return metric({
      ...shared,
      band: "medical-review",
      interpretation: value >= 500 ? "매우 높은 범위입니다." : "높은 범위입니다.",
      wellnessScore: value >= 500 ? 15 : 40,
    });
  }
  if (value >= 150) {
    return metric({
      ...shared,
      band: "attention",
      interpretation: "경계 범위입니다.",
      wellnessScore: 70,
    });
  }
  return metric({
    ...shared,
    band: "reference",
    interpretation: "적정 범위입니다.",
    wellnessScore: 100,
  });
}

export function assessWaist(
  value: number,
  sex: BiologicalSex | null,
): MetricAssessment {
  const shared = {
    id: "waist",
    label: "허리둘레",
    value: `${value} cm`,
    domains: ["metabolic", "body-composition"],
    evidence: NATIONAL_CHECKUP_EVIDENCE,
  };
  if (!sex) {
    return metric({
      ...shared,
      band: "context",
      interpretation:
        "성별을 선택하면 국가건강검진의 복부비만 참고치와 비교해 관련 건강자산 점수에 반영합니다.",
      wellnessScore: null,
    });
  }
  const threshold = sex === "male" ? 90 : 85;
  if (value >= threshold) {
    return metric({
      ...shared,
      band: "attention",
      interpretation: `국가건강검진의 복부비만 참고치(${threshold} cm 이상)에 해당합니다.`,
      wellnessScore: 60,
    });
  }
  return metric({
    ...shared,
    band: "reference",
    interpretation: "국가건강검진의 복부비만 참고치 미만입니다.",
    wellnessScore: 100,
  });
}

export function assessHemoglobin(
  value: number,
  sex: BiologicalSex | null,
): MetricAssessment {
  const shared = {
    id: "hemoglobin",
    label: "혈색소",
    value: `${value} g/dL`,
    domains: ["energy", "circulation"],
    evidence: `${NATIONAL_CHECKUP_EVIDENCE} ${WHO_HEMOGLOBIN_EVIDENCE}`,
  };
  if (!sex) {
    return metric({
      ...shared,
      band: "context",
      interpretation:
        "성별을 선택하면 국가건강검진 혈색소 참고치와 비교해 에너지·순환 항목에 반영합니다.",
      wellnessScore: null,
    });
  }
  const [lower, upper] = sex === "male" ? [13, 16.5] : [12, 15.5];
  if (value < lower) {
    return metric({
      ...shared,
      band: "medical-review",
      interpretation:
        "빈혈 의심 참고치보다 낮습니다. 원인은 다양하므로 의료진 확인이 필요합니다.",
      wellnessScore: 45,
    });
  }
  if (value > upper) {
    return metric({
      ...shared,
      band: "attention",
      interpretation:
        "국가건강검진 참고치보다 높습니다. 탈수·흡연·고도 등 개인 조건과 함께 확인하세요.",
      wellnessScore: 70,
    });
  }
  return metric({
    ...shared,
    band: "reference",
    interpretation: "국가건강검진 혈색소 참고치 범위입니다.",
    wellnessScore: 100,
  });
}

export function assessTotalCholesterol(value: number): MetricAssessment {
  return metric({
    id: "totalCholesterol",
    label: "총콜레스테롤",
    value: `${value} mg/dL`,
    band: value < 200 ? "reference" : "attention",
    interpretation:
      value < 200
        ? "국가건강검진 참고치 미만입니다."
        : "국가건강검진의 고콜레스테롤혈증 의심 참고치에 해당합니다.",
    wellnessScore: value < 200 ? 100 : value < 240 ? 70 : 45,
    domains: ["circulation"],
    evidence: NATIONAL_CHECKUP_EVIDENCE,
  });
}

export function assessAst(value: number): MetricAssessment {
  return metric({
    id: "ast",
    label: "AST",
    value: `${value} U/L`,
    band: value <= 40 ? "reference" : "medical-review",
    interpretation:
      value <= 40
        ? "국가건강검진 참고치 범위입니다."
        : "간기능 이상 의심 참고치를 넘습니다. 근육 손상 등 다른 원인도 있어 의료진 확인이 필요합니다.",
    wellnessScore: value <= 40 ? 100 : value <= 80 ? 60 : 30,
    domains: ["liver"],
    evidence: NATIONAL_CHECKUP_EVIDENCE,
  });
}

export function assessAlt(value: number): MetricAssessment {
  return metric({
    id: "alt",
    label: "ALT",
    value: `${value} U/L`,
    band: value <= 35 ? "reference" : "medical-review",
    interpretation:
      value <= 35
        ? "국가건강검진 참고치 범위입니다."
        : "간기능 이상 의심 참고치를 넘습니다. 검사실 기준과 함께 의료진 확인이 필요합니다.",
    wellnessScore: value <= 35 ? 100 : value <= 70 ? 60 : 30,
    domains: ["liver"],
    evidence: NATIONAL_CHECKUP_EVIDENCE,
  });
}

export function assessGgt(
  value: number,
  sex: BiologicalSex | null,
): MetricAssessment {
  const shared = {
    id: "ggt",
    label: "감마지티피(γ-GTP)",
    value: `${value} U/L`,
    domains: ["liver"],
    evidence: NATIONAL_CHECKUP_EVIDENCE,
  };
  if (!sex) {
    return metric({
      ...shared,
      band: "context",
      interpretation:
        "성별을 선택하면 국가건강검진 참고치와 비교해 해독 항목에 반영합니다.",
      wellnessScore: null,
    });
  }
  const threshold = sex === "male" ? 63 : 35;
  return metric({
    ...shared,
    band: value <= threshold ? "reference" : "medical-review",
    interpretation:
      value <= threshold
        ? "국가건강검진 참고치 범위입니다."
        : `성별 참고치(${threshold} U/L 이하)를 넘습니다. 음주·약물 등과 함께 의료진 확인이 필요합니다.`,
    wellnessScore: value <= threshold ? 100 : value <= threshold * 2 ? 60 : 30,
  });
}

export function assessCreatinine(value: number): MetricAssessment {
  return metric({
    id: "creatinine",
    label: "혈청 크레아티닌",
    value: `${value} mg/dL`,
    band: value <= 1.5 ? "context" : "medical-review",
    interpretation:
      value <= 1.5
        ? "국가건강검진 참고치 이내입니다. 연령·성별·근육량 영향을 받아 eGFR과 함께 봅니다."
        : "국가건강검진 신장기능 이상 의심 참고치를 넘습니다. eGFR과 함께 의료진 확인이 필요합니다.",
    wellnessScore: null,
    domains: ["circulation"],
    evidence: `${NATIONAL_CHECKUP_EVIDENCE} ${KDIGO_EVIDENCE}`,
  });
}

export function assessEgfr(value: number): MetricAssessment {
  if (value < 60) {
    return metric({
      id: "egfr",
      label: "신사구체여과율(eGFR)",
      value: `${value} mL/min/1.73㎡`,
      band: "medical-review",
      interpretation:
        "60 미만입니다. 한 번의 결과로 만성콩팥병을 확정하지 않으며 반복 검사와 의료진 확인이 필요합니다.",
      wellnessScore: 40,
      domains: ["circulation"],
      evidence: KDIGO_EVIDENCE,
    });
  }
  return metric({
    id: "egfr",
    label: "신사구체여과율(eGFR)",
    value: `${value} mL/min/1.73㎡`,
    band: "reference",
    interpretation:
      value < 90
        ? "60 이상입니다. 60–89만으로 만성콩팥병을 의미하지 않으며 다른 이상 소견과 함께 봅니다."
        : "일반적인 G1 범위입니다.",
    wellnessScore: value < 90 ? 85 : 100,
    domains: ["circulation"],
    evidence: KDIGO_EVIDENCE,
  });
}

export function assessBmi(value: number): MetricAssessment {
  const shared = {
    id: "bmi",
    label: "BMI",
    value: `${value} kg/㎡`,
    domains: ["body-composition"],
    evidence: KSSO_EVIDENCE,
  };
  if (value < 18.5) {
    return metric({
      ...shared,
      band: "attention",
      interpretation: "저체중 범위입니다.",
      wellnessScore: 60,
    });
  }
  if (value < 23) {
    return metric({
      ...shared,
      band: "reference",
      interpretation: "정상 체중 범위입니다.",
      wellnessScore: 100,
    });
  }
  if (value < 25) {
    return metric({
      ...shared,
      band: "attention",
      interpretation: "비만 전단계 범위입니다.",
      wellnessScore: 75,
    });
  }
  return metric({
    ...shared,
    band: "medical-review",
    interpretation:
      value >= 35
        ? "3단계 비만 범위입니다."
        : value >= 30
          ? "2단계 비만 범위입니다."
          : "1단계 비만 범위입니다.",
    wellnessScore: value >= 35 ? 20 : value >= 30 ? 35 : 55,
  });
}

function summarizeObjective(
  kind: ObjectiveDataAssessment["kind"],
  metrics: MetricAssessment[],
  excludedMetrics: string[],
): ObjectiveDataAssessment {
  const scored = metrics.filter(
    (item): item is MetricAssessment & { wellnessScore: number } =>
      item.wellnessScore !== null,
  );
  const domainScores: Record<string, number> = {};
  for (const domain of new Set(scored.flatMap((item) => item.domains))) {
    domainScores[domain] = weightedAverage(
      scored
        .filter((item) => item.domains.includes(domain))
        .map((item) => ({ score: item.wellnessScore, weight: 1 })),
    );
  }
  return {
    kind,
    sourceScore: scored.length
      ? weightedAverage(scored.map((item) => ({ score: item.wellnessScore, weight: 1 })))
      : null,
    metrics,
    domainScores,
    excludedMetrics,
  };
}

const CONTEXT_CHECKUP_METRICS = [
  { id: "wbc", label: "백혈구(WBC)", unit: "10³/µL", domains: ["immune", "inflammation"], note: "감염·염증·면역 상태를 함께 보는 혈구 수치입니다." },
  { id: "platelets", label: "혈소판", unit: "10³/µL", domains: ["circulation", "inflammation"], note: "응고와 염증 맥락을 함께 확인하는 혈구 수치입니다." },
  { id: "ferritin", label: "페리틴", unit: "ng/mL", domains: ["energy", "recovery", "skin-aging"], note: "저장 철 상태와 피로·회복의 간접 근거입니다." },
  { id: "crp", label: "CRP", unit: "mg/L", domains: ["inflammation", "immune", "recovery"], note: "몸의 염증 정도를 보여주지만 원인이나 위치를 단독으로 진단하지는 못합니다." },
  { id: "hsCrp", label: "고감도 CRP", unit: "mg/L", domains: ["inflammation", "circulation"], note: "낮은 수준의 염증과 심혈관 위험 평가에 참고하는 수치입니다." },
  { id: "esr", label: "적혈구침강속도(ESR)", unit: "mm/hr", domains: ["inflammation", "immune"], note: "염증 여부를 다른 검사와 함께 해석하는 비특이적 지표입니다." },
  { id: "tsh", label: "갑상선자극호르몬(TSH)", unit: "mIU/L", domains: ["hormone", "energy", "brain-stress", "skin-aging"], note: "갑상선 조절 상태의 핵심 선별 수치이며 연령·약물·검사법의 영향을 받습니다." },
  { id: "freeT4", label: "유리 T4", unit: "ng/dL", domains: ["hormone", "energy"], note: "TSH와 함께 갑상선 호르몬 상태를 해석하는 수치입니다." },
  { id: "vitaminD", label: "25-OH 비타민 D", unit: "ng/mL", domains: ["body-composition", "immune"], note: "비타민 D 상태의 주된 지표로 뼈·근육 건강에 참고합니다." },
  { id: "vitaminB12", label: "비타민 B12", unit: "pg/mL", domains: ["energy", "brain-stress"], note: "혈액세포 생성과 신경 기능의 간접 근거입니다." },
  { id: "albumin", label: "알부민", unit: "g/dL", domains: ["liver", "gut", "recovery", "skin-aging"], note: "간 기능·영양·흡수 상태를 다른 검사와 함께 보는 수치입니다." },
  { id: "totalBilirubin", label: "총 빌리루빈", unit: "mg/dL", domains: ["liver"], note: "적혈구 분해 산물의 간 처리와 배출을 확인하는 참고 수치입니다." },
  { id: "alp", label: "알칼리성 인산분해효소(ALP)", unit: "U/L", domains: ["liver", "body-composition"], note: "간·담도와 뼈 대사의 맥락을 다른 검사와 함께 확인합니다." },
  { id: "bun", label: "혈액요소질소(BUN)", unit: "mg/dL", domains: ["circulation"], note: "신장 기능과 수분·단백질 섭취의 영향을 함께 받는 참고 수치입니다." },
  { id: "calcium", label: "칼슘", unit: "mg/dL", domains: ["body-composition"], note: "뼈·근육·신경 기능과 관련되며 알부민 등과 함께 해석합니다." },
  { id: "ck", label: "크레아틴키나아제(CK)", unit: "U/L", domains: ["body-composition", "recovery"], note: "근육 손상과 운동 후 회복을 보는 참고 수치로 최근 운동의 영향을 받습니다." },
] as const;

function assessContextCheckupMetric(
  definition: (typeof CONTEXT_CHECKUP_METRICS)[number],
  value: number,
): MetricAssessment {
  return metric({
    id: definition.id,
    label: definition.label,
    value: `${value} ${definition.unit}`,
    band: "context",
    interpretation: `${definition.note} 결과지의 검사실 참고범위를 우선 확인하세요.`,
    wellnessScore: null,
    domains: [...definition.domains],
    evidence: "검사법·연령·성별·약물·급성 상태에 따라 참고범위가 달라질 수 있어 단독 점수화하지 않습니다.",
  });
}

export function assessCheckupData(
  values: Record<string, string>,
): ObjectiveDataAssessment {
  const metrics: MetricAssessment[] = [];
  const sex = biologicalSex(values);
  const systolic = numberValue(values, "systolic");
  const diastolic = numberValue(values, "diastolic");
  if (systolic !== null && diastolic !== null) {
    metrics.push(
      assessBloodPressure(
        systolic,
        diastolic,
        values.bpContext === "home" ? "home" : "office",
      ),
    );
  }
  const rules = [
    ["fastingGlucose", assessFastingGlucose],
    ["hba1c", assessHba1c],
    ["totalCholesterol", assessTotalCholesterol],
    ["ldl", assessLdl],
    ["hdl", assessHdl],
    ["triglycerides", assessTriglycerides],
    ["ast", assessAst],
    ["alt", assessAlt],
    ["creatinine", assessCreatinine],
    ["egfr", assessEgfr],
  ] as const;
  for (const [id, rule] of rules) {
    const value = numberValue(values, id);
    if (value !== null) metrics.push(rule(value));
  }
  const waist = numberValue(values, "waist");
  if (waist !== null) metrics.push(assessWaist(waist, sex));
  const hemoglobin = numberValue(values, "hemoglobin");
  if (hemoglobin !== null) {
    metrics.push(assessHemoglobin(hemoglobin, sex));
  }
  const ggt = numberValue(values, "ggt");
  if (ggt !== null) metrics.push(assessGgt(ggt, sex));
  for (const definition of CONTEXT_CHECKUP_METRICS) {
    const value = numberValue(values, definition.id);
    if (value !== null) metrics.push(assessContextCheckupMetric(definition, value));
  }
  return summarizeObjective("checkup", metrics, [
    "혈청 크레아티닌은 연령·성별·근육량 영향을 받아 단독 점수화하지 않고 eGFR과 함께 참고합니다.",
    "검진기관의 자체 참고치가 결과지에 표시된 경우 해당 기준을 우선 확인하세요.",
  ]);
}

export function assessBodyCompositionData(
  values: Record<string, string>,
): ObjectiveDataAssessment {
  const metrics: MetricAssessment[] = [];
  const bmi = numberValue(values, "bmi");
  if (bmi !== null) metrics.push(assessBmi(bmi));
  return summarizeObjective("body-composition", metrics, [
    "체지방률·골격근량·내장지방 레벨은 성별·연령·측정 장비 기준이 필요해 현재 점수에 반영하지 않습니다.",
  ]);
}

const objectiveDomainScore = (
  domain: DomainAssessmentResult,
  checkup?: ObjectiveDataAssessment,
  body?: ObjectiveDataAssessment,
) => {
  const values = [{ score: domain.score, weight: 65 }];
  const checkupScore = checkup?.domainScores[domain.code];
  const bodyScore = body?.domainScores[domain.code];
  if (checkupScore !== undefined) values.push({ score: checkupScore, weight: 20 });
  if (bodyScore !== undefined) values.push({ score: bodyScore, weight: 15 });
  return weightedAverage(values);
};

export function applyObjectiveData(
  base: HealthAssessmentResult,
  input: {
    checkup?: ObjectiveDataAssessment;
    bodyComposition?: ObjectiveDataAssessment;
  },
): HealthAssessmentResult {
  const sourceValues = [
    { score: base.symptomScore, weight: 35 },
    { score: base.lifestyleScore, weight: 30 },
  ];
  if (input.checkup?.sourceScore !== null && input.checkup?.sourceScore !== undefined) {
    sourceValues.push({ score: input.checkup.sourceScore, weight: 20 });
  }
  if (
    input.bodyComposition?.sourceScore !== null &&
    input.bodyComposition?.sourceScore !== undefined
  ) {
    sourceValues.push({ score: input.bodyComposition.sourceScore, weight: 15 });
  }
  const domains = base.domains.map((domain) => {
    const score = objectiveDomainScore(
      domain,
      input.checkup,
      input.bodyComposition,
    );
    return { ...domain, score, status: getScoreStatus(score) };
  });
  return {
    ...base,
    totalScore: weightedAverage(sourceValues),
    dataConfidence:
      base.dataConfidence +
      (input.checkup?.sourceScore !== null && input.checkup?.sourceScore !== undefined
        ? 20
        : 0) +
      (input.bodyComposition?.sourceScore !== null &&
      input.bodyComposition?.sourceScore !== undefined
        ? 15
        : 0),
    scoreVersion: "wellset-score-v3-checkup-domain-linked",
    domains,
    priorities: [...domains].sort((a, b) => a.score - b.score).slice(0, 3),
  };
}
