import {
  STACK_DAILY_MAX,
  STACK_RULES,
  type StackEventType,
} from "../config/stack-rules.ts";

export type DailyStackInput = Partial<Record<StackEventType, boolean>>;

export type StackEvent = {
  eventType: StackEventType;
  points: number;
};

export function calculateDailyStack(input: DailyStackInput) {
  const events = (Object.entries(STACK_RULES) as Array<
    [StackEventType, number]
  >)
    .filter(([eventType]) => input[eventType] === true)
    .map(([eventType, points]) => ({ eventType, points }));

  return {
    total: events.reduce((sum, event) => sum + event.points, 0),
    max: STACK_DAILY_MAX,
    events,
  };
}

export function calculateStreak(
  completedDates: readonly string[],
  referenceDate: string,
) {
  const completed = new Set(completedDates);
  const cursor = new Date(`${referenceDate}T00:00:00Z`);
  let streak = 0;

  while (completed.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
