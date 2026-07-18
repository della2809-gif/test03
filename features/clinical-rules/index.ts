import { getScoreStatus, weightedAverage } from "../../lib/scoring.ts";
import type {
  DomainAssessmentResult,
  HealthAssessmentResult,
} from "../health-assessment/types.ts";

export type ClinicalBand = "reference" | "attention" | "medical-review";

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
        : "의료진 확인",
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

export function assessCheckupData(
  values: Record<string, string>,
): ObjectiveDataAssessment {
  const metrics: MetricAssessment[] = [];
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
    ["ldl", assessLdl],
    ["hdl", assessHdl],
    ["triglycerides", assessTriglycerides],
  ] as const;
  for (const [id, rule] of rules) {
    const value = numberValue(values, id);
    if (value !== null) metrics.push(rule(value));
  }
  return summarizeObjective("checkup", metrics, [
    "ALT는 검사실·성별별 정상 상한이 달라 현재 점수에 반영하지 않습니다.",
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
    scoreVersion: "wellset-score-v2-guideline-informed",
    domains,
    priorities: [...domains].sort((a, b) => a.score - b.score).slice(0, 3),
  };
}
