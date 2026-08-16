import type { TrackerEntry } from '../types/api';

export interface HydrationInsight {
  title: string;
  message: string;
}

type Params = {
  sum: number;
  goal: number;
  streak: number;
  weatherOn: boolean;
  workoutOn: boolean;
  entries: TrackerEntry[];
  /** Local hour 0-23, injected for testability — defaults to the real current hour. */
  hour?: number;
};

type Candidate = HydrationInsight & { priority: number };

/** Roughly how much of the daily goal should be consumed by a given hour, assuming an active window of ~6am-10pm. */
function expectedPacePercent(hour: number) {
  if (hour < 6) return 0;
  if (hour >= 22) return 100;
  return Math.round(((hour - 6) / 16) * 100);
}

function timeOfDayPhrase(hour: number) {
  if (hour < 12) return 'the day just started';
  if (hour < 17) return "it's already past noon";
  if (hour < 21) return "it's already evening";
  return "it's late in the day";
}

function suggestCatchUpMl(remainingMl: number) {
  if (remainingMl >= 1000) return 500;
  if (remainingMl >= 400) return 350;
  return 200;
}

export function buildHydrationInsights({ sum, goal, streak, weatherOn, workoutOn, entries, hour = new Date().getHours() }: Params): HydrationInsight[] {
  const percent = goal > 0 ? Math.min(100, Math.round((sum / goal) * 100)) : 0;
  const expected = expectedPacePercent(hour);
  const remainingMl = Math.max(0, goal - sum);
  const candidates: Candidate[] = [];

  const lastHourMl = entries
    .filter((e) => Date.now() - e.ts <= 60 * 60 * 1000)
    .reduce((total, e) => total + e.value, 0);

  if (lastHourMl > 1000) {
    candidates.push({
      title: 'Drinking too much too quickly',
      message: `You've logged ${lastHourMl.toLocaleString()} ml in the last hour — spread the rest out so your body can actually absorb it.`,
      priority: 9,
    });
  }

  if (percent >= 100) {
    candidates.push({
      title: 'Daily goal reached',
      message: `You hit your ${goal.toLocaleString()} ml goal today — great work staying on top of it.`,
      priority: 10,
    });
  } else if (percent < expected - 15) {
    candidates.push({
      title: 'Behind on hydration',
      message: `You're at ${percent}% of your daily goal, and ${timeOfDayPhrase(hour)}. Try drinking ${suggestCatchUpMl(remainingMl)} ml within the next hour.`,
      priority: 10,
    });
  } else if (hour < 12 && percent >= 40) {
    candidates.push({
      title: 'Great progress this morning',
      message: `You've already reached ${percent}% of your goal before noon — keep the momentum going.`,
      priority: 8,
    });
  } else if (percent > 0 && Math.abs(percent - expected) <= 15) {
    candidates.push({
      title: "On track to reach today's goal",
      message: `You're right on pace at ${percent}% of your ${goal.toLocaleString()} ml goal — keep the sips coming.`,
      priority: 6,
    });
  }

  if (hour >= 19 && percent < 90) {
    candidates.push({
      title: 'Evening reminder to stay hydrated',
      message: `It's evening and you're at ${percent}% — a small glass now helps you finish strong without disrupting sleep.`,
      priority: 7,
    });
  }

  if (workoutOn) {
    candidates.push({
      title: "Increase water intake due to today's activity level",
      message: "Workout day is active, adding 350 ml to today's goal — replace the fluids you lose while training.",
      priority: 5,
    });
  }

  if (weatherOn) {
    candidates.push({
      title: 'Increase hydration because of hot weather',
      message: "Your weather adjustment added 500 ml to today's goal — sip a bit more often to keep up in the heat.",
      priority: 5,
    });
  }

  if (streak >= 5) {
    candidates.push({
      title: 'Excellent consistency this week',
      message: `You're on a ${streak}-day hydration streak — that consistency compounds into real results.`,
      priority: 4,
    });
  }

  candidates.push({
    title: percent === 0 ? 'Start your day with water' : 'Steady hydration',
    message:
      percent === 0
        ? `You haven't logged a drink yet today — a glass of water now sets a good pace toward your ${goal.toLocaleString()} ml goal.`
        : `You're at ${percent}% of your ${goal.toLocaleString()} ml goal — keep sipping steadily through the rest of the day.`,
    priority: percent === 0 ? 7 : 1,
  });

  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(({ title, message }) => ({ title, message }));
}
