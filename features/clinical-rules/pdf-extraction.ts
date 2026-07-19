export type CheckupFieldId =
  | "systolic"
  | "diastolic"
  | "fastingGlucose"
  | "hba1c"
  | "ldl"
  | "hdl"
  | "triglycerides"
  | "alt";

export type CheckupPdfExtraction = {
  values: Partial<Record<CheckupFieldId, string>>;
  foundFields: CheckupFieldId[];
  missingFields: CheckupFieldId[];
};

const FIELD_IDS: CheckupFieldId[] = [
  "systolic",
  "diastolic",
  "fastingGlucose",
  "hba1c",
  "ldl",
  "hdl",
  "triglycerides",
  "alt",
];

const RANGES: Record<CheckupFieldId, [number, number]> = {
  systolic: [50, 260],
  diastolic: [30, 180],
  fastingGlucose: [30, 600],
  hba1c: [2, 20],
  ldl: [10, 500],
  hdl: [5, 200],
  triglycerides: [10, 1500],
  alt: [1, 1000],
};

const LABELS: Record<
  Exclude<CheckupFieldId, "systolic" | "diastolic">,
  RegExp[]
> = {
  fastingGlucose: [
    /공복\s*혈당/i,
    /공복\s*혈당\s*검사/i,
    /glucose\s*\(?\s*fasting\s*\)?/i,
    /fasting\s*glucose/i,
  ],
  hba1c: [/당화\s*혈색소/i, /hb\s*a1c/i, /a1c/i],
  ldl: [/ldl(?:\s*[-·]?\s*콜레스테롤)?/i, /저밀도\s*콜레스테롤/i],
  hdl: [/hdl(?:\s*[-·]?\s*콜레스테롤)?/i, /고밀도\s*콜레스테롤/i],
  triglycerides: [/중성\s*지방/i, /triglycerides?/i, /\btg\b/i],
  alt: [/\balt\b(?:\s*\(\s*sgpt\s*\))?/i, /\bsgpt\b/i, /알라닌\s*아미노전이효소/i],
};

function normalizePdfText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "");
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
        `${source}[^\\n]{0,45}?([0-9]+(?:\\.[0-9]+)?)\\s*(?:mg\\s*\\/\\s*dL|%|U\\s*\\/\\s*L)`,
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
    "fastingGlucose",
    "hba1c",
    "ldl",
    "hdl",
    "triglycerides",
    "alt",
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
