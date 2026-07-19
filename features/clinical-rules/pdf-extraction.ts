export type CheckupFieldId =
  | "waist" | "systolic" | "diastolic" | "hemoglobin"
  | "fastingGlucose" | "hba1c" | "totalCholesterol" | "ldl" | "hdl"
  | "triglycerides" | "ast" | "alt" | "ggt" | "creatinine" | "egfr"
  | "wbc" | "platelets" | "ferritin" | "crp" | "hsCrp" | "esr"
  | "tsh" | "freeT4" | "vitaminD" | "vitaminB12" | "albumin"
  | "totalBilirubin" | "alp" | "bun" | "calcium" | "ck";

export type CheckupPdfExtraction = {
  values: Partial<Record<CheckupFieldId, string>>;
  foundFields: CheckupFieldId[];
  missingFields: CheckupFieldId[];
};

export const CHECKUP_FIELD_IDS: CheckupFieldId[] = [
  "waist", "systolic", "diastolic", "hemoglobin", "fastingGlucose", "hba1c",
  "totalCholesterol", "ldl", "hdl", "triglycerides", "ast", "alt", "ggt",
  "creatinine", "egfr", "wbc", "platelets", "ferritin", "hsCrp", "crp",
  "esr", "tsh", "freeT4", "vitaminD", "vitaminB12", "albumin",
  "totalBilirubin", "alp", "bun", "calcium", "ck",
];

const RANGES: Record<CheckupFieldId, [number, number]> = {
  waist: [30, 250], systolic: [50, 260], diastolic: [30, 180], hemoglobin: [3, 25],
  fastingGlucose: [30, 600], hba1c: [2, 20], totalCholesterol: [30, 800],
  ldl: [10, 500], hdl: [5, 200], triglycerides: [10, 1500], ast: [1, 2000],
  alt: [1, 2000], ggt: [1, 2000], creatinine: [0.1, 30], egfr: [1, 250],
  wbc: [0.1, 100], platelets: [1, 1500], ferritin: [0.1, 5000], crp: [0, 500],
  hsCrp: [0, 100], esr: [0, 200], tsh: [0.001, 200], freeT4: [0.01, 20],
  vitaminD: [1, 300], vitaminB12: [10, 5000], albumin: [0.5, 8],
  totalBilirubin: [0, 50], alp: [1, 3000], bun: [1, 300], calcium: [1, 20],
  ck: [1, 20000],
};

type SingleFieldId = Exclude<CheckupFieldId, "systolic" | "diastolic">;
const LABELS: Record<SingleFieldId, RegExp[]> = {
  waist: [/허리\s*둘레/i, /waist\s*circumference/i],
  hemoglobin: [/혈색소/i, /헤모글로빈/i, /h(?:a)?emoglobin/i, /\bhgb\b/i],
  fastingGlucose: [/공복\s*혈당/i, /fasting\s*(?:blood\s*)?glucose/i, /glucose\s*\(\s*fasting\s*\)/i],
  hba1c: [/당화\s*혈색소/i, /hb\s*a1c/i, /\ba1c\b/i],
  totalCholesterol: [/총\s*콜레스테롤/i, /total\s*cholesterol/i],
  ldl: [/ldl(?:\s*[-·]?\s*콜레스테롤)?/i, /저밀도\s*콜레스테롤/i],
  hdl: [/hdl(?:\s*[-·]?\s*콜레스테롤)?/i, /고밀도\s*콜레스테롤/i],
  triglycerides: [/중성\s*지방/i, /triglycerides?/i, /\btg\b/i],
  ast: [/\bast\b(?:\s*\(\s*sgot\s*\))?/i, /\bsgot\b/i],
  alt: [/\balt\b(?:\s*\(\s*sgpt\s*\))?/i, /\bsgpt\b/i],
  ggt: [/감마\s*(?:지티피|gtp)/i, /γ\s*[-·]?\s*gtp/i, /gamma\s*[-·]?\s*gtp/i, /\bggt\b/i],
  creatinine: [/혈청\s*크레아티닌/i, /크레아티닌/i, /creatinine/i],
  egfr: [/사구체\s*여과율/i, /e\s*[-·]?\s*gfr/i, /\begfr\b/i],
  wbc: [/백혈구(?:\s*수)?/i, /white\s*blood\s*cell/i, /\bwbc\b/i],
  platelets: [/혈소판(?:\s*수)?/i, /platelets?/i, /\bplt\b/i],
  ferritin: [/페리틴/i, /ferritin/i],
  hsCrp: [/고감도\s*(?:c\s*[- ]?반응성\s*단백|crp)/i, /hs\s*[- ]?crp/i],
  crp: [/c\s*[- ]?반응성\s*단백/i, /c\s*reactive\s*protein/i, /(?:^|\n)\s*crp\b/i],
  esr: [/적혈구\s*침강\s*속도/i, /erythrocyte\s*sedimentation\s*rate/i, /\besr\b/i],
  tsh: [/갑상선\s*자극\s*호르몬/i, /thyroid\s*stimulating\s*hormone/i, /\btsh\b/i],
  freeT4: [/유리\s*(?:티록신|t4)/i, /free\s*t4/i, /f\s*t4/i],
  vitaminD: [/25\s*[-–]?\s*\(?\s*oh\s*\)?\s*(?:vitamin\s*)?d/i, /비타민\s*d(?:\s*\(\s*25\s*oh\s*\))?/i],
  vitaminB12: [/비타민\s*b\s*12/i, /vitamin\s*b\s*12/i, /cobalamin/i],
  albumin: [/알부민/i, /albumin/i],
  totalBilirubin: [/총\s*빌리루빈/i, /total\s*bilirubin/i],
  alp: [/알칼리성\s*인산분해효소/i, /alkaline\s*phosphatase/i, /\balp\b/i],
  bun: [/혈액\s*요소\s*질소/i, /blood\s*urea\s*nitrogen/i, /\bbun\b/i],
  calcium: [/칼슘/i, /calcium/i],
  ck: [/크레아틴\s*키나아제/i, /creatine\s*kinase/i, /\b(?:ck|cpk)\b/i],
};

function normalizePdfText(text: string): string {
  return text.normalize("NFKC").replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\r/g, "")
    .replace(/허\s*리\s*둘\s*레/g, "허리둘레").replace(/혈\s*색\s*소/g, "혈색소")
    .replace(/공\s*복\s*혈\s*당/g, "공복혈당").replace(/당\s*화\s*혈\s*색\s*소/g, "당화혈색소")
    .replace(/총\s*콜\s*레\s*스\s*테\s*롤/g, "총콜레스테롤").replace(/중\s*성\s*지\s*방/g, "중성지방")
    .replace(/감\s*마\s*지\s*티\s*피/g, "감마지티피").replace(/혈\s*청\s*크\s*레\s*아\s*티\s*닌/g, "혈청크레아티닌")
    .replace(/신\s*사\s*구\s*체\s*여\s*과\s*율/g, "신사구체여과율").replace(/사\s*구\s*체\s*여\s*과\s*율/g, "사구체여과율")
    .replace(/백\s*혈\s*구/g, "백혈구").replace(/혈\s*소\s*판/g, "혈소판")
    .replace(/알\s*부\s*민/g, "알부민").replace(/빌\s*리\s*루\s*빈/g, "빌리루빈");
}

function validValue(id: CheckupFieldId, raw: string, rawUnit = ""): string | undefined {
  let value = Number(raw.replace(",", "."));
  const unit = rawUnit.replace(/\s/g, "").toLowerCase();
  if ((id === "crp" || id === "hsCrp") && unit.includes("mg/dl")) value *= 10;
  if ((id === "wbc" || id === "platelets") && value > RANGES[id][1]) value /= 1000;
  const [min, max] = RANGES[id];
  return Number.isFinite(value) && value >= min && value <= max ? String(value) : undefined;
}

const UNIT_PATTERN = String.raw`(?:10\s*\^?\s*3\s*\/\s*(?:u|µ|μ)l|k\s*\/\s*(?:u|µ|μ)l|\/\s*(?:u|µ|μ)l|mg\s*\/\s*(?:d)?l|g\s*\/\s*dl|ng\s*\/\s*ml|pg\s*\/\s*ml|m?iu\s*\/\s*(?:l|ml)|u\s*\/\s*l|mm\s*\/\s*(?:h|hr)|%|cm|ml\s*\/\s*min(?:\s*\/\s*1\.73\s*m2)?)`;

function numberAfterLabel(text: string, id: SingleFieldId): string | undefined {
  for (const label of LABELS[id]) {
    const patterns = [
      new RegExp(`${label.source}[^\n0-9]{0,35}([0-9]+(?:[.,][0-9]+)?)\\s*(${UNIT_PATTERN})`, "i"),
      new RegExp(`${label.source}[^\n]{0,28}?([0-9]+(?:[.,][0-9]+)?)`, "i"),
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const value = match?.[1] ? validValue(id, match[1], match[2]) : undefined;
      if (value !== undefined) return value;
    }
  }
}

function extractBloodPressure(text: string) {
  const combined = text.match(/(?:혈압|blood\s*pressure|\bBP\b)[^\n0-9]{0,20}([0-9]{2,3})\s*[\/／]\s*([0-9]{2,3})/i);
  const systolic = combined?.[1] ?? text.match(/(?:수축기\s*혈압|최고\s*혈압|systolic)[^\n0-9]{0,25}([0-9]{2,3})/i)?.[1];
  const diastolic = combined?.[2] ?? text.match(/(?:이완기\s*혈압|최저\s*혈압|diastolic)[^\n0-9]{0,25}([0-9]{2,3})/i)?.[1];
  return { systolic: systolic ? validValue("systolic", systolic) : undefined, diastolic: diastolic ? validValue("diastolic", diastolic) : undefined };
}

export function mergeCheckupExtractions(
  current: CheckupPdfExtraction,
  next: CheckupPdfExtraction,
): CheckupPdfExtraction {
  const values = { ...next.values, ...current.values };
  const foundFields = CHECKUP_FIELD_IDS.filter((id) => values[id] !== undefined);
  return { values, foundFields, missingFields: CHECKUP_FIELD_IDS.filter((id) => values[id] === undefined) };
}

export function extractCheckupValuesFromText(rawText: string): CheckupPdfExtraction {
  const text = normalizePdfText(rawText);
  const pressure = extractBloodPressure(text);
  const values: Partial<Record<CheckupFieldId, string>> = {
    ...(pressure.systolic ? { systolic: pressure.systolic } : {}),
    ...(pressure.diastolic ? { diastolic: pressure.diastolic } : {}),
  };
  for (const id of CHECKUP_FIELD_IDS) {
    if (id === "systolic" || id === "diastolic") continue;
    const value = numberAfterLabel(text, id);
    if (value !== undefined) values[id] = value;
  }
  const foundFields = CHECKUP_FIELD_IDS.filter((id) => values[id] !== undefined);
  return { values, foundFields, missingFields: CHECKUP_FIELD_IDS.filter((id) => values[id] === undefined) };
}
