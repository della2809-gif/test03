export const STACK_RULES = {
  sleepGoal: 2,
  hydrationGoal: 2,
  activityGoal: 2,
  nutritionLogged: 1,
  supplementLogged: 1,
  medicationLogged: 1,
  conditionLogged: 1,
  challengeCompleted: 2,
  dailyComplete: 1,
} as const;

export type StackEventType = keyof typeof STACK_RULES;

export const STACK_DAILY_MAX = Object.values(STACK_RULES).reduce(
  (total, points) => total + points,
  0,
);
