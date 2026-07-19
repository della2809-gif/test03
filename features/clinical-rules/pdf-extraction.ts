export type CheckupFieldId =
  | "waist"
  | "systolic"
  | "diastolic"
  | "hemoglobin"
  | "fastingGlucose"
  | "hba1c"
  | "totalCholesterol"
  | "ldl"
  | "hdl"
  | "triglycerides"
  | "ast"
  | "alt"
  | "ggt"
  | "creatinine"
  | "egfr";

export type CheckupPdfExtraction = {
  values: Partial<Record<CheckupFieldId, string>>;
  foundFields: CheckupFieldId[];
  missingFields: CheckupFieldId[];
};

const FIELD_IDS: CheckupFieldId[] = [
  "waist",
  "systolic",
  "diastolic",
  "hemoglobin",
  "fastingGlucose",
  "hba1c",
  "totalCholesterol",
  "ldl",
  "hdl",
  "triglycerides",
  "ast",
  "alt",
  "ggt",
  "creatinine",
  "egfr",
];

const RANGES: Record<CheckupFieldId, [number, number]> = {
  waist: [30, 250],
  systolic: [50, 260],
  diastolic: [30, 180],
  hemoglobin: [3, 25],
  fastingGlucose: [30, 600],
  hba1c: [2, 20],
  totalCholesterol: [30, 800],
  ldl: [10, 500],
  hdl: [5, 200],
  triglycerides: [10, 1500],
  ast: [1, 2000],
  alt: [1, 1000],
  ggt: [1, 2000],
  creatinine: [0.1, 30],
  egfr: [1, 250],
};

const LABELS: Record<
  Exclude<CheckupFieldId, "systolic" | "diastolic">,
  RegExp[]
> = {
  waist: [/허리\s*둘레/i, /waist\s*circumference/i],
  hemoglobin: [
    /(?:^|\n)\s*혈색소/i,
    /헤모글로빈/i,
    /h(?:a)?emoglobin/i,
    /\bhgb\b/i,
  ],
  fastingGlucose: [
    /공복\s*혈당/i,
    /공복\s*혈당\s*검사/i,
    /glucose\s*\(?\s*fasting\s*\)?/i,
    /fasting\s*glucose/i,
  ],
  hba1c: [/당화\s*혈색소/i, /hb\s*a1c/i, /a1c/i],
  totalCholesterol: [
    /총\s*콜레스테롤/i,
    /total\s*cholesterol/i,
    /\btc\b/i,
  ],
  ldl: [/ldl(?:\s*[-·]?\s*콜레스테롤)?/i, /저밀도\s*콜레스테롤/i],
  hdl: [/hdl(?:\s*[-·]?\s*콜레스테롤)?/i, /고밀도\s*콜레스테롤/i],
  triglycerides: [/중성\s*지방/i, /triglycerides?/i, /\btg\b/i],
  ast: [/\bast\b(?:\s*\(\s*sgot\s*\))?/i, /\bsgot\b/i, /아스파르테이트\s*아미노전이효소/i],
  alt: [/\balt\b(?:\s*\(\s*sgpt\s*\))?/i, /\bsgpt\b/i, /알라닌\s*아미노전이효소/i],
  ggt: [
    /감마\s*지티피/i,
    /감마\s*gtp/i,
    /γ\s*[-·]?\s*gtp/i,
    /gamma\s*[-·]?\s*gtp/i,
    /\bggt\b/i,
  ],
  creatinine: [/혈청\s*크레아티닌/i, /크레아티닌/i, /creatinine/i],
  egfr: [/신사구체\s*여과율/i, /e\s*[-·]?\s*gfr/i, /\begfr\b/i],
};

function normalizePdfText(text: string): string {
  const normalized = text
    .normalize("NFKC")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "");
  const ocrLabelFixes: Array<[RegExp, string]> = [
    [/허[ \t]*리[ \t]*둘[ \t]*레/gi, "허리둘레"],
    [/혈[ \t]*색[ \t]*소/gi, "혈색소"],
    [/공[ \t]*복[ \t]*혈[ \t]*당/gi, "공복혈당"],
    [/당[ \t]*화[ \t]*혈[ \t]*색[ \t]*소/gi, "당화혈색소"],
    [/총[ \t]*콜[ \t]*레[ \t]*스[ \t]*테[ \t]*롤/gi, "총콜레스테롤"],
    [/중[ \t]*성[ \t]*지[ \t]*방/gi, "중성지방"],
    [/감[ \t]*마[ \t]*지[ \t]*티[ \t]*피/gi, "감마지티피"],
    [/혈[ \t]*청[ \t]*크[ \t]*레[ \t]*아[ \t]*티[ \t]*닌/gi, "혈청크레아티닌"],
    [
      /신[ \t]*사[ \t]*구[ \t]*체[ \t]*여[ \t]*과[ \t]*율/gi,
      "신사구체여과율",
    ],
    [/수[ \t]*축[ \t]*기[ \t]*혈[ \t]*압/gi, "수축기혈압"],
    [/이[ \t]*완[ \t]*기[ \t]*혈[ \t]*압/gi, "이완기혈압"],
  ];
  return ocrLabelFixes.reduce(
    (result, [pattern, replacement]) =>
      result.replace(pattern, replacement),
    normalized,
  );
}

function validValue(id: CheckupFieldId, raw: string): string | undefined {
  const value = Number(raw);
  const [min, max] = RANGES[id];
  if (!Number.isFinite(value) || value < min || value > max) return undefined;
  return String(value);
}

function numberAfterLabel(
  text: string,
  id: Exclude<CheckupFieldId, "systolic" | "diastolic">,
): string | undefined {
  for (const label of LABELS[id]) {
    const source = label.source;
    const patterns = [
      new RegExp(
        `${source}\\s*(?:\\([^\\n)]*\\))?\\s*(?:결과|측정값)?\\s*[:：]?\\s*([0-9]+(?:\\.[0-9]+)?)`,
        "i",
      ),
      new RegExp(
        `${source}[^\\n]{0,45}?([0-9]+(?:\\.[0-9]+)?)\\s*(?:mg\\s*\\/\\s*dL|g\\s*\\/\\s*dL|%|U\\s*\\/\\s*L|IU\\s*\\/\\s*L|cm|mL\\s*\\/\\s*min(?:\\s*\\/\\s*1\\.73\\s*㎡)?)`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const value = match?.[1] ? validValue(id, match[1]) : undefined;
      if (value !== undefined) return value;
    }
  }
  return undefined;
}

function extractBloodPressure(text: string) {
  const combined = text.match(
    /(?:혈압|blood\s*pressure|BP)[^\n0-9]{0,20}([0-9]{2,3})\s*[/／]\s*([0-9]{2,3})/i,
  );
  const systolic =
    combined?.[1] ??
    text.match(
      /(?:수축기\s*혈압|최고\s*혈압|systolic)[^\n0-9]{0,25}([0-9]{2,3})/i,
    )?.[1];
  const diastolic =
    combined?.[2] ??
    text.match(
      /(?:이완기\s*혈압|최저\s*혈압|diastolic)[^\n0-9]{0,25}([0-9]{2,3})/i,
    )?.[1];

  return {
    systolic: systolic ? validValue("systolic", systolic) : undefined,
    diastolic: diastolic ? validValue("diastolic", diastolic) : undefined,
  };
}

export function extractCheckupValuesFromText(
  rawText: string,
): CheckupPdfExtraction {
  const text = normalizePdfText(rawText);
  const pressure = extractBloodPressure(text);
  const values: Partial<Record<CheckupFieldId, string>> = {
    ...(pressure.systolic ? { systolic: pressure.systolic } : {}),
    ...(pressure.diastolic ? { diastolic: pressure.diastolic } : {}),
  };

  for (const id of [
    "waist",
    "hemoglobin",
    "fastingGlucose",
    "hba1c",
    "totalCholesterol",
    "ldl",
    "hdl",
    "triglycerides",
    "ast",
    "alt",
    "ggt",
    "creatinine",
    "egfr",
  ] as const) {
    const value = numberAfterLabel(text, id);
    if (value !== undefined) values[id] = value;
  }

  const foundFields = FIELD_IDS.filter((id) => values[id] !== undefined);
  return {
    values,
    foundFields,
    missingFields: FIELD_IDS.filter((id) => values[id] === undefined),
  };
}
