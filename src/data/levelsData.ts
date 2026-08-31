export type LevelDefinition = {
  level: number;
  name: string;
  pointsRequired: number;
  activeDaysRequired: number;
  badge: string;
  color: string;
  benefits: string[];
};

export const LEVELS: LevelDefinition[] = [
  { level: 1, name: 'Starter',    pointsRequired: 0,      activeDaysRequired: 0,   badge: '🌱', color: '#8B8D97', benefits: ['Access to all core features'] },
  { level: 2, name: 'Explorer',   pointsRequired: 250,    activeDaysRequired: 7,   badge: '🔍', color: '#3E7BFA', benefits: ['Explorer profile badge', 'Custom avatar frame'] },
  { level: 3, name: 'Builder',    pointsRequired: 750,    activeDaysRequired: 21,  badge: '🏗️', color: '#2ED47A', benefits: ['Builder badge', 'Priority in search results'] },
  { level: 4, name: 'Consistent', pointsRequired: 1500,   activeDaysRequired: 45,  badge: '🎯', color: '#FFC542', benefits: ['Consistent badge', 'Weekly bonus streak multiplier'] },
  { level: 5, name: 'Achiever',   pointsRequired: 3000,   activeDaysRequired: 75,  badge: '🏅', color: '#FF6A2B', benefits: ['Achiever badge', 'Access to exclusive challenges'] },
  { level: 6, name: 'Champion',   pointsRequired: 5000,   activeDaysRequired: 120, badge: '🏆', color: '#E55A20', benefits: ['Champion badge', 'Monthly reward bonus'] },
  { level: 7, name: 'Elite',      pointsRequired: 8000,   activeDaysRequired: 180, badge: '⚡', color: '#9B59B6', benefits: ['Elite badge', 'Featured on leaderboards'] },
  { level: 8, name: 'Master',     pointsRequired: 12000,  activeDaysRequired: 270, badge: '🌟', color: '#E91E8C', benefits: ['Master badge', 'Early access to new features'] },
  { level: 9, name: 'Legend',     pointsRequired: 18000,  activeDaysRequired: 365, badge: '👑', color: '#F39C12', benefits: ['Legend badge', 'Exclusive Legend rewards catalogue'] },
  { level: 10, name: 'Icon',      pointsRequired: 25000,  activeDaysRequired: 540, badge: '💎', color: '#1ABC9C', benefits: ['Icon badge', 'Lifetime Icon status', 'All exclusive rewards'] },
];

export const POINT_ACTIVITIES = [
  { id: 'daily_checkin',       label: 'Daily check-in',              points: 10,  dailyLimit: 1,  icon: 'calendar-outline' as const },
  { id: 'meal_log',            label: 'Log a meal',                  points: 5,   dailyLimit: 4,  icon: 'restaurant-outline' as const },
  { id: 'water_goal',          label: 'Hit daily water goal',        points: 10,  dailyLimit: 1,  icon: 'water-outline' as const },
  { id: 'steps_goal',          label: 'Hit daily step goal',         points: 15,  dailyLimit: 1,  icon: 'walk-outline' as const },
  { id: 'workout_complete',    label: 'Complete a workout',          points: 20,  dailyLimit: 2,  icon: 'barbell-outline' as const },
  { id: 'streak_7',            label: '7-day consistency streak',    points: 50,  dailyLimit: 0,  icon: 'flame-outline' as const },
  { id: 'streak_30',           label: '30-day consistency streak',   points: 200, dailyLimit: 0,  icon: 'flame-outline' as const },
  { id: 'challenge_complete',  label: 'Complete a challenge',        points: 100, dailyLimit: 0,  icon: 'trophy-outline' as const },
  { id: 'goal_complete',       label: 'Complete a weekly goal',      points: 30,  dailyLimit: 0,  icon: 'checkmark-circle-outline' as const },
  { id: 'referral',            label: 'Qualified referral',          points: 150, dailyLimit: 0,  icon: 'person-add-outline' as const },
  { id: 'weight_log',          label: 'Log weight',                  points: 5,   dailyLimit: 1,  icon: 'scale-outline' as const },
  { id: 'fasting_complete',    label: 'Complete a fast',             points: 15,  dailyLimit: 1,  icon: 'timer-outline' as const },
];

export function getLevelForPoints(lifetimePoints: number, activeDays: number): LevelDefinition {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (lifetimePoints >= lvl.pointsRequired && activeDays >= lvl.activeDaysRequired) {
      current = lvl;
    }
  }
  return current;
}

export function getNextLevel(current: LevelDefinition): LevelDefinition | null {
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

export function getLevelProgress(lifetimePoints: number, activeDays: number): {
  current: LevelDefinition;
  next: LevelDefinition | null;
  pointsProgress: number; // 0–100
  pointsNeeded: number;
  daysNeeded: number;
} {
  const current = getLevelForPoints(lifetimePoints, activeDays);
  const next = getNextLevel(current);
  if (!next) return { current, next: null, pointsProgress: 100, pointsNeeded: 0, daysNeeded: 0 };
  const range = next.pointsRequired - current.pointsRequired;
  const earned = lifetimePoints - current.pointsRequired;
  const pointsProgress = Math.min(100, Math.round((earned / range) * 100));
  const pointsNeeded = Math.max(0, next.pointsRequired - lifetimePoints);
  const daysNeeded = Math.max(0, next.activeDaysRequired - activeDays);
  return { current, next, pointsProgress, pointsNeeded, daysNeeded };
}
