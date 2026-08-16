import type { TrackerEntry } from '../types/api';

export interface WalkingInsight {
  title: string;
  message: string;
}

type Params = {
  sum: number;
  goal: number;
  streak: number;
  entries: TrackerEntry[];
  /** Local hour 0-23, injected for testability — defaults to the real current hour. */
  hour?: number;
  /** Injected for testability — defaults to Date.now(). */
  now?: number;
};

type Candidate = WalkingInsight & { priority: number };

/** Roughly how much of the daily goal should be walked by a given hour, assuming an active window of ~6am-10pm. */
function expectedPacePercent(hour: number) {
  if (hour < 6) return 0;
  if (hour >= 22) return 100;
  return Math.round(((hour - 6) / 16) * 100);
}

const DEFAULT_GOAL = 8000;

export function buildWalkingInsights({ sum, goal, streak, entries, hour = new Date().getHours(), now = Date.now() }: Params): WalkingInsight[] {
  const percent = goal > 0 ? Math.min(100, Math.round((sum / goal) * 100)) : 0;
  const expected = expectedPacePercent(hour);
  const candidates: Candidate[] = [];

  const lastActivityTs = entries.reduce((latest, e) => Math.max(latest, e.ts), 0);
  const hoursSinceActivity = lastActivityTs > 0 ? (now - lastActivityTs) / (60 * 60 * 1000) : null;

  if (percent >= 100) {
    candidates.push({
      title: 'Daily goal reached',
      message: `You hit your ${goal.toLocaleString()}-step goal today — celebrate it, and keep the habit going tomorrow.`,
      priority: 10,
    });
  } else if (hour >= 12 && percent < Math.max(0, expected - 15)) {
    candidates.push({
      title: 'Time for a walk',
      message: `You're only at ${percent}% of your ${goal.toLocaleString()}-step goal and it's already past noon — a short walk now can make a big difference.`,
      priority: 9,
    });
  } else if (percent > 0 && Math.abs(percent - expected) <= 15) {
    candidates.push({
      title: 'On track to reach today’s goal',
      message: `You're right on pace at ${percent}% of your ${goal.toLocaleString()}-step goal — keep going.`,
      priority: 6,
    });
  }

  if (hoursSinceActivity !== null && hoursSinceActivity >= 3 && percent < 100) {
    candidates.push({
      title: 'Time to get moving',
      message: `It's been over ${Math.floor(hoursSinceActivity)} hours since your last step update — a quick walk can help you reset.`,
      priority: 8,
    });
  }

  if (goal === DEFAULT_GOAL) {
    candidates.push({
      title: 'Set a personal step goal',
      message: "You're using the default 8,000-step goal — set one that fits your lifestyle for more relevant coaching.",
      priority: 3,
    });
  }

  if (streak >= 5) {
    candidates.push({
      title: 'Excellent consistency this week',
      message: `You're on a ${streak}-day step streak — that consistency compounds into real results.`,
      priority: 4,
    });
  }

  candidates.push({
    title: sum === 0 ? 'Start your day moving' : 'Steady progress',
    message:
      sum === 0
        ? "You haven't logged any steps yet today — a short walk is a great way to start."
        : `You're at ${percent}% of your ${goal.toLocaleString()}-step goal — keep the momentum going through the day.`,
    priority: sum === 0 ? 7 : 1,
  });

  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(({ title, message }) => ({ title, message }));
}
