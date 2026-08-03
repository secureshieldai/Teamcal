import { colors } from '../theme';
import type { FastLog } from '../types/api';

export type FastingDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface FastingProtocol {
  id: string;
  badge: string;
  label: string;
  description: string;
  targetHours: number;
  difficulty: FastingDifficulty;
}

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  { id: '12:12', badge: '12h', label: '12:12', description: 'Gentle intro. Easy to sustain.', targetHours: 12, difficulty: 'beginner' },
  { id: '14:10', badge: '14h', label: '14:10', description: 'Solid daily rhythm.', targetHours: 14, difficulty: 'beginner' },
  { id: '16:8', badge: '16h', label: '16:8', description: 'The classic — best for fat loss.', targetHours: 16, difficulty: 'intermediate' },
  { id: '18:6', badge: '18h', label: '18:6', description: 'Deeper ketosis window.', targetHours: 18, difficulty: 'intermediate' },
  { id: 'OMAD', badge: 'OMA', label: 'OMAD', description: 'One meal a day.', targetHours: 23, difficulty: 'advanced' },
  { id: '24h', badge: '24h', label: '24h', description: 'Full-day metabolic reset.', targetHours: 24, difficulty: 'advanced' },
  { id: '36h', badge: '36h', label: '36h', description: 'Autophagy focus.', targetHours: 36, difficulty: 'advanced' },
  { id: 'extended', badge: 'Ext', label: 'Extended', description: 'Deep repair. Monitor closely.', targetHours: 48, difficulty: 'advanced' },
];

export const DEFAULT_PROTOCOL_ID = '16:8';

export const DIFFICULTY_STYLE: Record<FastingDifficulty, { label: string; bg: string; color: string }> = {
  beginner: { label: 'BEGINNER', bg: '#E4F8ED', color: colors.success },
  intermediate: { label: 'INTERMEDIATE', bg: '#F1E5D3', color: '#B9773A' },
  advanced: { label: 'ADVANCED', bg: '#FBE0E0', color: '#E0554F' },
};

export interface MetabolicStage {
  id: string;
  label: string;
  description: string;
  hours: number;
}

export const METABOLIC_STAGES: MetabolicStage[] = [
  { id: 'fed', label: 'Fed', description: 'Digesting recent meals. Insulin elevated.', hours: 0 },
  { id: 'fat-burning', label: 'Fat Burning', description: 'Glycogen depleting. Switching to fat for fuel.', hours: 12 },
  { id: 'ketosis', label: 'Ketosis', description: 'Ketones rising. Mental clarity, steady energy.', hours: 16 },
  { id: 'autophagy', label: 'Autophagy', description: 'Cellular cleanup begins. Deep metabolic reset.', hours: 20 },
];

/** Rough estimate of calories not eaten during the fasting window — not a precise metabolic figure. */
export const CALORIES_SAVED_PER_HOUR = 100;

export function stageForHours(hours: number): MetabolicStage {
  let current = METABOLIC_STAGES[0];
  for (const stage of METABOLIC_STAGES) {
    if (hours >= stage.hours) current = stage;
  }
  return current;
}

/** Consecutive days (working backward from today, today exempt if not yet logged) with a fast that met its target. */
export function fastingStreak(history: FastLog[]): number {
  const successDays = new Set<string>();
  for (const fast of history) {
    if (fast.ended_at && fast.achieved_hours >= fast.target_hours) {
      const d = new Date(fast.ended_at);
      successDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (successDays.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
