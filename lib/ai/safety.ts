const URGENT_PATTERNS = [
  /심한\s*흉통/u,
  /갑작스러운\s*호흡곤란/u,
  /의식\s*(저하|없)/u,
  /(마비|언어\s*이상)/u,
  /심한\s*출혈/u,
  /(자해|자살)/u,
];

export function requiresUrgentGuidance(input: string) {
  return URGENT_PATTERNS.some((pattern) => pattern.test(input));
}
