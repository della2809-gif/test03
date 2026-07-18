export type HealthLedgerEntry = {
  date: string;
  points: number;
  completedMissions: number;
  exerciseMinutes: number;
  assetScore?: number;
};

export type HealthLedgerPeriod = "week" | "month";

export type HealthLedgerSummary = {
  key: string;
  label: string;
  points: number;
  completedMissions: number;
  exerciseMinutes: number;
  averageAssetScore: number | null;
};

export type HealthMeasurementEntry = {
  date: string;
  weight?: number;
  skeletalMuscle?: number;
  systolic?: number;
  diastolic?: number;
};

export type HealthMeasurementSummary = {
  key: string;
  label: string;
  measuredAt: string;
  weight: number | null;
  skeletalMuscle: number | null;
  systolic: number | null;
  diastolic: number | null;
};

const parseDate = (date: string) => new Date(`${date}T00:00:00Z`);
const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function periodKey(date: Date, period: HealthLedgerPeriod) {
  if (period === "month") return toDateKey(date).slice(0, 7);
  return toDateKey(startOfWeek(date));
}

function periodLabel(key: string, period: HealthLedgerPeriod, locale: "ko" | "en") {
  if (period === "month") {
    const [year, month] = key.split("-");
    return locale === "en" ? `${year}-${month}` : `${year}년 ${Number(month)}월`;
  }
  const start = parseDate(key);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${start.getUTCMonth() + 1}/${start.getUTCDate()}–${end.getUTCMonth() + 1}/${end.getUTCDate()}`;
}

export function aggregateHealthLedger(
  entries: readonly HealthLedgerEntry[],
  period: HealthLedgerPeriod,
  locale: "ko" | "en" = "ko",
): HealthLedgerSummary[] {
  const grouped = new Map<string, HealthLedgerEntry[]>();

  for (const entry of entries) {
    const key = periodKey(parseDate(entry.date), period);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, rows]) => {
      const scores = rows
        .map((row) => row.assetScore)
        .filter((score): score is number => score !== undefined);
      return {
        key,
        label: periodLabel(key, period, locale),
        points: rows.reduce((sum, row) => sum + row.points, 0),
        completedMissions: rows.reduce(
          (sum, row) => sum + row.completedMissions,
          0,
        ),
        exerciseMinutes: rows.reduce(
          (sum, row) => sum + row.exerciseMinutes,
          0,
        ),
        averageAssetScore: scores.length
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : null,
      };
    });
}

export function aggregateHealthMeasurements(
  entries: readonly HealthMeasurementEntry[],
  period: HealthLedgerPeriod,
  locale: "ko" | "en" = "ko",
): HealthMeasurementSummary[] {
  const grouped = new Map<string, HealthMeasurementEntry[]>();

  for (const entry of entries) {
    const key = periodKey(parseDate(entry.date), period);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, rows]) => {
      const latest = [...rows].sort((a, b) => b.date.localeCompare(a.date))[0];
      return {
        key,
        label: periodLabel(key, period, locale),
        measuredAt: latest.date,
        weight: latest.weight ?? null,
        skeletalMuscle: latest.skeletalMuscle ?? null,
        systolic: latest.systolic ?? null,
        diastolic: latest.diastolic ?? null,
      };
    });
}
