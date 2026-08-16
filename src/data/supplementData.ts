import type { Ionicons } from '@expo/vector-icons';

export type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night';
type IconName = keyof typeof Ionicons.glyphMap;

export const TIME_OF_DAY_META: { id: TimeOfDay; label: string; icon: IconName }[] = [
  { id: 'morning', label: 'Morning', icon: 'partly-sunny-outline' },
  { id: 'midday', label: 'Midday', icon: 'sunny' },
  { id: 'evening', label: 'Evening', icon: 'cloudy-night-outline' },
  { id: 'night', label: 'Night', icon: 'moon' },
];

export const FASTING_SUGGESTIONS = ['Electrolytes', 'L-carnitine', 'Berberine', 'Creatine', 'Ashwagandha', 'NAC', 'Rhodiola', 'L-theanine'];
