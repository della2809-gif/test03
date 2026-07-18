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

function periodLabel(key: string, period: HealthLedgerPeriod) {
  if (period === "month") {
    const [year, month] = key.split("-");
    return `${year}년 ${Number(month)}월`;
  }
  const start = parseDate(key);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${start.getUTCMonth() + 1}/${start.getUTCDate()}–${end.getUTCMonth() + 1}/${end.getUTCDate()}`;
}

export function aggregateHealthLedger(
  entries: readonly HealthLedgerEntry[],
  period: HealthLedgerPeriod,
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
        label: periodLabel(key, period),
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
