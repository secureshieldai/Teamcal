/** Approximate, not scientifically sourced — same spirit as the water tracker's hydration factors. */
export const STRIDE_METERS = 0.78;
export const KCAL_PER_STEP = 0.045;
export const STEPS_PER_MINUTE_ESTIMATE = 100;

export const GOAL_PRESETS = [6000, 8000, 10000, 12000, 15000, 20000];

export function stepsToKm(steps: number) {
  return (steps * STRIDE_METERS) / 1000;
}

export function stepsToKcal(steps: number) {
  return Math.round(steps * KCAL_PER_STEP);
}

export function stepsToActiveMinutes(steps: number) {
  return Math.round(steps / STEPS_PER_MINUTE_ESTIMATE);
}

export function longestStreak(days: { day: string; total: number }[], goal: number) {
  let best = 0;
  let current = 0;
  for (const day of days) {
    if (day.total >= goal) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}
