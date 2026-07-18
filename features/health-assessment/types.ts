export type AssessmentSection = "health-check" | "lifestyle";

export type AssessmentOption = {
  label: string;
  value: number;
};

export type AssessmentQuestion = {
  id: string;
  section: AssessmentSection;
  prompt: string;
  helper: string;
  domains: string[];
  options: readonly AssessmentOption[];
};

export type AssessmentAnswers = Record<string, number>;

export type DomainAssessmentResult = {
  code: string;
  name: string;
  description: string;
  score: number;
  status: string;
  recommendation: string;
};

export type HealthAssessmentResult = {
  totalScore: number;
  dataConfidence: number;
  completionRate: number;
  symptomScore: number;
  lifestyleScore: number;
  scoreVersion: string;
  domains: DomainAssessmentResult[];
  priorities: DomainAssessmentResult[];
  answeredAt: string;
};
